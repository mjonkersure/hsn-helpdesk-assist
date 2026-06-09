// Leest de drie klantscore-enquête CSVs uit src/data/private/ en aggregeert
// per medewerker (via Salesforce-codes in agent-sf-codes.json) naar
// src/data/klantscores.json.
//
// Run vanaf project-root:
//   node scripts/aggregate-klantscore.mjs
//
// CSVs blijven privé (gitignored). Aggregaat heeft GEEN klant-PII en mag wel
// in git.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const PRIVATE_DIR = path.join(root, 'src', 'data', 'private');
const SF_CODES_FILE = path.join(root, 'src', 'data', 'agent-sf-codes.json');
const OUT_FILE = path.join(root, 'src', 'data', 'klantscores.json');

const SOURCES = [
  { file: 'claims-y2d.csv', category: 'claims' },
  { file: 'request-y2d.csv', category: 'request' },
  { file: 'support-y2d.csv', category: 'support' },
];

const DRIVER_COLUMNS = {
  ease: 'The ease of contacting the Customer Service Department',
  follow_up: 'The follow-up of your complaint / request by the Customer Service Department',
  listen: "The advisor's ability to listen and understand your needs",
  friendliness: "The advisor's friendliness & involvement",
  clarity: 'Clarity and Accuracy',
};

function parseNum(v) {
  if (v === null || v === undefined) return null;
  // Excel-export plakt soms een leidend tab voor negatieve getallen ("\t-100"); strip whitespace.
  const cleaned = String(v).replace(/\s/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function avg(arr) {
  const xs = arr.filter((x) => x !== null);
  if (xs.length === 0) return null;
  return round1(xs.reduce((a, b) => a + b, 0) / xs.length);
}

async function readCsv(file) {
  const raw = await fs.readFile(file, 'utf-8');
  const res = Papa.parse(raw, { header: true, skipEmptyLines: true });
  if (res.errors.length) {
    console.warn(`  CSV-warnings voor ${path.basename(file)}: ${res.errors.length} (eerste: ${res.errors[0].message})`);
  }
  return res.data;
}

async function main() {
  const sfCodesRaw = JSON.parse(await fs.readFile(SF_CODES_FILE, 'utf-8'));
  const sfToName = sfCodesRaw.agents;

  // Init aggregaat per medewerker (alle bekende namen)
  const agents = {};
  for (const [sf, naam] of Object.entries(sfToName)) {
    agents[naam] = {
      sf_code: sf,
      enquetes: { claims: [], request: [], support: [] },
    };
  }

  const unmapped = new Map(); // sf-code → count

  for (const src of SOURCES) {
    const file = path.join(PRIVATE_DIR, src.file);
    console.log(`Lezen ${src.file}…`);
    const rows = await readCsv(file);

    for (const row of rows) {
      const sf = row['Case Resolved By'];
      if (!sf) continue;
      const naam = sfToName[sf];
      if (!naam) {
        unmapped.set(sf, (unmapped.get(sf) ?? 0) + 1);
        continue;
      }

      const drivers = {};
      for (const [k, col] of Object.entries(DRIVER_COLUMNS)) {
        drivers[k] = parseNum(row[col]);
      }

      agents[naam].enquetes[src.category].push({
        voc: parseNum(row['VoC Index']),
        osat: parseNum(row['CC Osat']),
        drivers,
        origin: row['Case Origin'] || null,
      });
    }
  }

  // Bereken aggregaten
  const byAgent = {};
  let teamTotal = 0;
  const teamVoc = [];
  const teamOsat = [];
  const teamDriverPools = { ease: [], follow_up: [], listen: [], friendliness: [], clarity: [] };

  for (const [naam, data] of Object.entries(agents)) {
    const allEnq = [...data.enquetes.claims, ...data.enquetes.request, ...data.enquetes.support];
    if (allEnq.length === 0) {
      // Medewerker zonder enquêtes — skip uit output (komt mogelijk niet voor in dataset)
      continue;
    }

    const categories = {};
    for (const cat of ['claims', 'request', 'support']) {
      const enq = data.enquetes[cat];
      categories[cat] = {
        n: enq.length,
        voc_avg: avg(enq.map((e) => e.voc)),
        osat_avg: avg(enq.map((e) => e.osat)),
      };
    }

    const driverAggs = {};
    for (const k of Object.keys(DRIVER_COLUMNS)) {
      const xs = allEnq.map((e) => e.drivers[k]);
      driverAggs[k] = { n: xs.filter((x) => x !== null).length, avg: avg(xs) };
      teamDriverPools[k].push(...xs);
    }

    byAgent[naam] = {
      sf_code: data.sf_code,
      total_enquetes: allEnq.length,
      voc_index_avg: avg(allEnq.map((e) => e.voc)),
      cc_osat_avg: avg(allEnq.map((e) => e.osat)),
      categories,
      drivers: driverAggs,
    };

    teamTotal += allEnq.length;
    teamVoc.push(...allEnq.map((e) => e.voc));
    teamOsat.push(...allEnq.map((e) => e.osat));
  }

  const teamDrivers = {};
  for (const k of Object.keys(DRIVER_COLUMNS)) {
    teamDrivers[k] = { n: teamDriverPools[k].filter((x) => x !== null).length, avg: avg(teamDriverPools[k]) };
  }

  const output = {
    _meta: {
      generated_at: new Date().toISOString(),
      bron: 'Salesforce Customer Service exports (Claims / Request / Custom Support Y2D)',
      total_enquetes: teamTotal,
      unmapped_sf_codes: Object.fromEntries(unmapped),
    },
    team: {
      total_enquetes: teamTotal,
      voc_index_avg: avg(teamVoc),
      cc_osat_avg: avg(teamOsat),
      drivers: teamDrivers,
    },
    by_agent: byAgent,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✓ Geschreven: ${path.relative(root, OUT_FILE)}`);
  console.log(`  Totaal: ${teamTotal} enquêtes, ${Object.keys(byAgent).length} medewerkers met data`);
  if (unmapped.size) {
    console.log(`  ⚠ ${unmapped.size} onbekende SF-code(s) genegeerd: ${[...unmapped.keys()].join(', ')}`);
  }
}

main().catch((err) => {
  console.error('Aggregatie mislukt:', err);
  process.exit(1);
});
