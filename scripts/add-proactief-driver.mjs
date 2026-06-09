// One-shot migratie: voegt de nieuwe driver 'proactief_ondersteunend' toe aan
// seed-data.json. Plaatst hem tussen 'oplossing' en 'toon' (order 5), schuift
// de overige orders met +1. Markeert hem als detect=false (fase 2 — geen
// pipeline-detectie nog), dus alle counts blijven null.
//
// Run vanaf project-root:
//   node scripts/add-proactief-driver.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.resolve(__dirname, '..', 'src', 'data', 'seed-data.json');

const NEW_DRIVER_KEY = 'proactief_ondersteunend';
const NEW_DRIVER = {
  key: NEW_DRIVER_KEY,
  label: 'Proactief ondersteunend',
  group: 'oplossing',
  detect: false,
  order: 5,
};
const NEW_DRIVER_DEF =
  'Anticipeert op vervolgvragen of biedt ongevraagd maar relevante extra informatie (alternatief, tip, scenario). Geen pipeline-detectie nog — fase 2.';

function ensureDriverInCounts(obj) {
  // Voeg de nieuwe key toe (null = niet gemeten). Order-behoud van keys
  // niet kritisch in JSON-objecten, maar voor leesbaarheid bij review
  // herschrijven we de object-volgorde precies zoals de drivers-array.
  const ORDER = [
    'welkom',
    'vraag_capteren',
    'identificatie',
    'oplossing',
    'proactief_ondersteunend',
    'toon',
    'empathie',
    'afsluiting',
    'enquete',
    'inhoud',
  ];
  const out = {};
  for (const k of ORDER) {
    out[k] = k === NEW_DRIVER_KEY ? null : (obj[k] ?? null);
  }
  return out;
}

const raw = await fs.readFile(SEED_FILE, 'utf-8');
const data = JSON.parse(raw);

if (data.drivers.some((d) => d.key === NEW_DRIVER_KEY)) {
  console.log('Driver bestaat al — niets te doen.');
  process.exit(0);
}

// 1. Drivers-array: insert + reorder
const idx = data.drivers.findIndex((d) => d.key === 'oplossing');
data.drivers.splice(idx + 1, 0, NEW_DRIVER);
for (const d of data.drivers) {
  if (d.key !== NEW_DRIVER_KEY && d.order >= NEW_DRIVER.order) {
    d.order += 1;
  }
}
// Hernoem proactief_ondersteunend order naar exact 5 (al gedaan), corrigeer
// indien overige orders niet als verwacht stonden.

// 2. DriverDefs uitbreiden
data.driverDefs = {
  ...data.driverDefs,
  [NEW_DRIVER_KEY]: NEW_DRIVER_DEF,
};

// 3. Team-niveau counts
data.team.driversTotal = ensureDriverInCounts(data.team.driversTotal);
data.team.driversNieuw = ensureDriverInCounts(data.team.driversNieuw);
data.team.driversHerhaal = ensureDriverInCounts(data.team.driversHerhaal);

// 4. Per-agent counts
for (const agent of data.agents) {
  agent.driversTotal = ensureDriverInCounts(agent.driversTotal);
  agent.driversNieuw = ensureDriverInCounts(agent.driversNieuw);
  agent.driversHerhaal = ensureDriverInCounts(agent.driversHerhaal);
}

await fs.writeFile(SEED_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log(
  `✓ '${NEW_DRIVER_KEY}' toegevoegd aan ${data.drivers.length} drivers, ${data.agents.length} agents.`
);
console.log(`  Counts staan op null (detect=false, fase 2).`);
