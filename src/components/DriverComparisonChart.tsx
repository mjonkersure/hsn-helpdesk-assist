import type { DashboardData, DriverKey, KlantscoreData, KlantscoreDriverKey } from '@/types/data';

interface Props {
  data: DashboardData;
  klantscores: KlantscoreData;
}

interface Pair {
  ai: DriverKey;
  csat: KlantscoreDriverKey;
  label: string;
  toelichting: string;
}

// Welke gesprek-driver hoort bij welke CSAT-sub-driver.
// Mapping volgt Ot's drivers-lijst (CLAUDE.md) en de CSAT-definities.
const PAIRS: Pair[] = [
  {
    ai: 'welkom',
    csat: 'ease',
    label: 'Welkom ↔ Bereikbaarheid',
    toelichting: 'AI ziet warme begroeting / klant ervaart of contact makkelijk verliep',
  },
  {
    ai: 'vraag_capteren',
    csat: 'listen',
    label: 'Vraag capteren ↔ Luisteren',
    toelichting: 'AI ziet vraag herhalen / klant ervaart of zijn behoefte begrepen werd',
  },
  {
    ai: 'oplossing',
    csat: 'clarity',
    label: 'Oplossing bieden ↔ Duidelijkheid',
    toelichting: 'AI ziet wat je gaat doen / klant ervaart helderheid van uitleg',
  },
  {
    ai: 'empathie',
    csat: 'friendliness',
    label: 'Empathie ↔ Vriendelijkheid',
    toelichting: 'AI ziet emotie-erkenning / klant ervaart vriendelijkheid en betrokkenheid',
  },
  {
    ai: 'afsluiting',
    csat: 'follow_up',
    label: 'Afsluiting ↔ Opvolging',
    toelichting: 'AI ziet net afsluiten / klant ervaart of het na de call goed wordt afgehandeld',
  },
];

interface Point {
  naam: string;
  voornaam: string;
  aiPct: number; // 0-100
  csat: number; // 1-10
  n: number;
}

function colorForDelta(aiPct: number, csat: number): string {
  // CSAT 1-10 → 0-100% (× 10 voor visuele vergelijking)
  const csatPct = csat * 10;
  const delta = Math.abs(aiPct - csatPct);
  if (delta < 20) return '#2c9e57'; // groen — AI en klant zijn het eens
  if (delta < 40) return '#e8970e'; // amber — beetje uit elkaar
  return '#d24a3e'; // rood — AI en klant zien iets totaal anders
}

// Pearson-correlatie (-1..+1). Voor onze 5 datapunten ruw — alleen voor signal.
function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? null : num / denom;
}

function describeCorr(r: number | null): string {
  if (r === null) return 'onvoldoende data';
  const a = Math.abs(r);
  const dir = r > 0 ? 'positief' : 'negatief';
  if (a >= 0.7) return `sterk ${dir} (r=${r.toFixed(2)})`;
  if (a >= 0.4) return `matig ${dir} (r=${r.toFixed(2)})`;
  if (a >= 0.2) return `zwak ${dir} (r=${r.toFixed(2)})`;
  return `geen verband (r=${r.toFixed(2)})`;
}

export function DriverComparisonChart({ data, klantscores }: Props) {
  // Verzamel medewerkers met BEIDE bronnen
  const baseAgents = data.agents
    .filter((a) => a.nCallsTotal > 0 && klantscores.by_agent[a.naam])
    .sort((a, b) => b.nCallsTotal - a.nCallsTotal);

  if (baseAgents.length === 0) {
    return (
      <div className="text-xs italic text-[var(--muted)]">
        Geen medewerkers met zowel gesprek-data als klantscore-data.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PAIRS.map((pair) => {
          const points: Point[] = baseAgents
            .map((a) => {
              const ai = (a.driversTotal[pair.ai] as number | undefined) ?? 0;
              const aiPct = a.nCallsTotal > 0 ? (100 * ai) / a.nCallsTotal : 0;
              const ks = klantscores.by_agent[a.naam];
              const csat = ks.drivers[pair.csat]?.avg;
              if (csat === null || csat === undefined) return null;
              return {
                naam: a.naam,
                voornaam: a.naam.split(' ')[0],
                aiPct,
                csat,
                n: a.nCallsTotal,
              };
            })
            .filter((p): p is Point => p !== null);

          const r = pearson(
            points.map((p) => p.aiPct),
            points.map((p) => p.csat)
          );

          return (
            <div key={pair.ai} className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-md p-3">
              <div className="mb-2">
                <div className="text-xs font-semibold text-[var(--sure-teal-900)] uppercase tracking-wider">
                  {pair.label}
                </div>
                <div className="text-[10px] italic text-[var(--muted)] mt-0.5">{pair.toelichting}</div>
                <div className="text-[10px] text-[var(--muted)] mt-1">
                  Correlatie: <span className="font-semibold">{describeCorr(r)}</span>
                </div>
              </div>
              <MiniScatter points={points} />
            </div>
          );
        })}
      </div>

      <p className="text-xs italic text-[var(--muted)] leading-relaxed">
        <strong>Lees-hulp.</strong> Elke bol is één medewerker (alleen die met Webex-data en
        klantscore-data verschijnen — 5 stuks). X-as: hoe vaak de AI deze gesprek-driver detecteert.
        Y-as: hoe de klant deze CSAT-sub-driver zelf scoort. Diagonale verbanden (linksonder ↔
        rechtsboven) betekenen dat AI en klant het eens zijn. Bij maar 5 datapunten geldt de
        correlatie als indicatie, niet als bewijs.
      </p>
    </div>
  );
}

function MiniScatter({ points }: { points: Point[] }) {
  const W = 280;
  const H = 200;
  const M = { top: 8, right: 8, bottom: 36, left: 36 };
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;

  const x = (v: number) => M.left + (v / 100) * innerW;
  // CSAT-y-bereik 5..10 (zoomen op realistische range; lager dan 5 komt zelden voor)
  const yMin = 5;
  const yMax = 10;
  const y = (v: number) => M.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const xTicks = [0, 25, 50, 75, 100];
  const yTicks = [5, 6, 7, 8, 9, 10];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      {/* Y grid */}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={M.left} x2={M.left + innerW} y1={y(t)} y2={y(t)} stroke="#e3e7ee" strokeDasharray={t === yMin ? '0' : '3 3'} />
          <text x={M.left - 4} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#6b7588">
            {t}
          </text>
        </g>
      ))}
      {/* X ticks */}
      {xTicks.map((t) => (
        <g key={`x${t}`}>
          <line x1={x(t)} x2={x(t)} y1={M.top + innerH} y2={M.top + innerH + 3} stroke="#aab3c2" />
          <text x={x(t)} y={M.top + innerH + 14} textAnchor="middle" fontSize="9" fill="#6b7588">
            {t}%
          </text>
        </g>
      ))}
      {/* As-labels */}
      <text x={M.left + innerW / 2} y={H - 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1A2030">
        AI-detectie (%)
      </text>
      <text transform={`translate(10 ${M.top + innerH / 2}) rotate(-90)`} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1A2030">
        CSAT (1-10)
      </text>
      {/* Diagonale referentielijn (visuele guide: ai 0% ↔ csat 5; ai 100% ↔ csat 10) */}
      <line x1={x(0)} x2={x(100)} y1={y(5)} y2={y(10)} stroke="#d8dde6" strokeDasharray="2 4" />
      {/* Dots */}
      {points.map((p) => {
        const c = colorForDelta(p.aiPct, p.csat);
        return (
          <g key={p.naam}>
            <circle cx={x(p.aiPct)} cy={y(p.csat)} r={5} fill={c} fillOpacity={0.6} stroke={c} strokeWidth={1.2} />
            <text x={x(p.aiPct) + 7} y={y(p.csat) + 3} fontSize="9" fontWeight="600" fill="#1A2030">
              {p.voornaam}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
