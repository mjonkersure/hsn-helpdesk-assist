import type { DashboardData, KlantscoreData } from '@/types/data';
import { vocClass } from '@/lib/klantscores';

interface Props {
  data: DashboardData;
  klantscores: KlantscoreData;
}

interface Point {
  naam: string;
  askPct: number; // % calls met enquête-driver gedetecteerd
  enquetesReceived: number; // # enquêtes ontvangen
  nCalls: number;
  voc: number | null;
}

const COLOR: Record<'green' | 'amber' | 'red' | 'grey', string> = {
  green: '#2c9e57',
  amber: '#e8970e',
  red: '#d24a3e',
  grey: '#aab3c2',
};

export function EnqueteCorrelationChart({ data, klantscores }: Props) {
  // Verzamel medewerkers met BEIDE gesprek-driver-data EN klantscore-data
  const points: Point[] = data.agents
    .filter((a) => a.nCallsTotal > 0)
    .map((a) => {
      const ks = klantscores.by_agent[a.naam];
      if (!ks) return null;
      const enqCount = (a.driversTotal.enquete as number | undefined) ?? 0;
      return {
        naam: a.naam,
        askPct: a.nCallsTotal > 0 ? (100 * enqCount) / a.nCallsTotal : 0,
        enquetesReceived: ks.total_enquetes,
        nCalls: a.nCallsTotal,
        voc: ks.voc_index_avg,
      };
    })
    .filter((p): p is Point => p !== null);

  if (points.length === 0) {
    return (
      <div className="text-xs italic text-[var(--muted)]">
        Geen medewerkers met zowel gesprek-data als klantscore-data.
      </div>
    );
  }

  // SVG-dimensies + assen
  const W = 720;
  const H = 380;
  const M = { top: 20, right: 130, bottom: 50, left: 60 };
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;

  const maxAsk = Math.max(10, Math.ceil(Math.max(...points.map((p) => p.askPct))));
  const maxRecv = Math.max(50, Math.ceil(Math.max(...points.map((p) => p.enquetesReceived)) / 10) * 10);
  const maxCalls = Math.max(...points.map((p) => p.nCalls));

  const x = (v: number) => M.left + (v / maxAsk) * innerW;
  const y = (v: number) => M.top + innerH - (v / maxRecv) * innerH;
  const r = (v: number) => 6 + Math.sqrt(v / maxCalls) * 14;

  const xTicks = Array.from({ length: 6 }, (_, i) => (maxAsk * i) / 5);
  const yTicks = Array.from({ length: 6 }, (_, i) => Math.round((maxRecv * i) / 5));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[760px] h-auto" role="img">
          {/* Grid + Y-as ticks */}
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line
                x1={M.left}
                x2={M.left + innerW}
                y1={y(t)}
                y2={y(t)}
                stroke="#e3e7ee"
                strokeWidth={1}
                strokeDasharray={t === 0 ? '0' : '3 3'}
              />
              <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#6b7588">
                {t}
              </text>
            </g>
          ))}
          {/* X-as ticks */}
          {xTicks.map((t) => (
            <g key={`x${t}`}>
              <line
                x1={x(t)}
                x2={x(t)}
                y1={M.top + innerH}
                y2={M.top + innerH + 4}
                stroke="#aab3c2"
                strokeWidth={1}
              />
              <text x={x(t)} y={M.top + innerH + 18} textAnchor="middle" fontSize="10" fill="#6b7588">
                {t.toFixed(0)}%
              </text>
            </g>
          ))}
          {/* As-labels */}
          <text
            x={M.left + innerW / 2}
            y={H - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#1A2030"
          >
            % calls waarin om enquête gevraagd (AI-detectie)
          </text>
          <text
            transform={`translate(16 ${M.top + innerH / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#1A2030"
          >
            Aantal ontvangen klantscore-enquêtes
          </text>
          {/* Dots */}
          {points.map((p) => {
            const c = COLOR[vocClass(p.voc)];
            return (
              <g key={p.naam}>
                <circle
                  cx={x(p.askPct)}
                  cy={y(p.enquetesReceived)}
                  r={r(p.nCalls)}
                  fill={c}
                  fillOpacity={0.5}
                  stroke={c}
                  strokeWidth={1.5}
                />
                <text
                  x={x(p.askPct) + r(p.nCalls) + 4}
                  y={y(p.enquetesReceived) + 4}
                  fontSize="11"
                  fontWeight="600"
                  fill="#1A2030"
                >
                  {p.naam.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend + tabel */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
        <span className="font-semibold uppercase tracking-wider">Kleur = VoC</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLOR.green }} />
          ≥ +50
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLOR.amber }} />
          0 tot +49
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLOR.red }} />
          &lt; 0
        </span>
        <span className="ml-4 font-semibold uppercase tracking-wider">Grootte = aantal calls</span>
      </div>

      <table className="text-xs w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted)] uppercase tracking-wider">
            <th className="text-left py-2 font-semibold">Medewerker</th>
            <th className="text-right py-2 px-2 font-semibold">Calls</th>
            <th className="text-right py-2 px-2 font-semibold">Gevraagd om enquête</th>
            <th className="text-right py-2 px-2 font-semibold">Enquêtes ontvangen</th>
            <th className="text-right py-2 px-2 font-semibold">Ratio (ontvangen / calls)</th>
            <th className="text-right py-2 px-2 font-semibold">VoC</th>
          </tr>
        </thead>
        <tbody>
          {[...points]
            .sort((a, b) => b.enquetesReceived - a.enquetesReceived)
            .map((p) => (
              <tr key={p.naam} className="border-b border-[var(--border)]/50">
                <td className="py-1.5 font-medium">{p.naam}</td>
                <td className="py-1.5 px-2 text-right">{p.nCalls}</td>
                <td className="py-1.5 px-2 text-right">{p.askPct.toFixed(1)}%</td>
                <td className="py-1.5 px-2 text-right">{p.enquetesReceived}</td>
                <td className="py-1.5 px-2 text-right">
                  {((100 * p.enquetesReceived) / p.nCalls).toFixed(0)}%
                </td>
                <td
                  className="py-1.5 px-2 text-right font-semibold"
                  style={{ color: COLOR[vocClass(p.voc)] }}
                >
                  {p.voc !== null ? (p.voc > 0 ? '+' : '') + Math.round(p.voc) : '—'}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <p className="text-xs italic text-[var(--muted)] leading-relaxed">
        <strong>Lees-hulp.</strong> X-as toont hoe vaak de medewerker in de call zelf vraagt om
        de enquête (AI-detectie van de driver &quot;Enquête&quot;). Y-as toont hoeveel enquêtes er
        feitelijk binnenkomen via de Renault CSAT. Beperking: de periode van gesprek-aggregaten
        ({data.meta.generated_at}) en de CSAT-enquêtes (year-to-date) overlapt niet exact — voor
        het MVP genoeg om de richting te zien, voor productie nog gelijk te trekken.
      </p>
    </div>
  );
}
