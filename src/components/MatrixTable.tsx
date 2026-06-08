import type { Agent, AggregateBlock, Driver, DriverKey } from '@/types/data';
import { pct, driverPctClass, formatAiScore, aiScoreClass, formatNps, npsClass } from '@/lib/data';

const GROUP_CLASS: Record<string, string> = {
  welkom: 'bg-[var(--g-welkom)]',
  vraag: 'bg-[var(--g-vraag)]',
  oplossing: 'bg-[var(--g-oplossing)]',
  empathie: 'bg-[var(--g-empathie)]',
  afsluiting: 'bg-[var(--g-afsluiting)]',
  inhoud: 'bg-[var(--g-inhoud)]',
};

interface Props {
  /** Aggregate (team-totaal of per medewerker) */
  data: AggregateBlock;
  /** Optioneel: klantscore (NPS gewogen) toevoegen */
  klantscore?: number | null;
  klantscoreMeta?: string;
  /** Driver-definities (uit dashboardData.drivers) */
  drivers: Driver[];
  /** Focus drivers: oranje markering in matrix */
  focusDrivers?: DriverKey[];
}

export function MatrixTable({ data, klantscore, klantscoreMeta, drivers, focusDrivers = [] }: Props) {
  return (
    <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th className="border border-[var(--border)] bg-[var(--surface-muted)] w-[130px]"></th>
          {drivers.map((d) => {
            const isFocus = focusDrivers.includes(d.key);
            return (
              <th
                key={d.key}
                className={`border border-[var(--border)] text-center font-semibold leading-tight whitespace-pre-line p-1 h-[60px] ${
                  GROUP_CLASS[d.group] || ''
                } ${isFocus ? 'shadow-[inset_0_-3px_0_var(--sure-orange)]' : ''}`}
                style={{ color: '#1a3045', fontSize: '11px' }}
              >
                {d.label}
              </th>
            );
          })}
          <th
            className="border border-[var(--border)] text-center font-semibold leading-tight bg-[var(--sure-teal-900)] text-white"
            style={{ fontSize: '11px', width: '78px' }}
          >
            Score
            <br />
            AI-analyse
          </th>
          <th
            className="border border-[var(--border)] text-center font-semibold leading-tight bg-[var(--sure-teal-900)] text-white"
            style={{ fontSize: '11px', width: '78px' }}
          >
            Klantscore
            <br />
            enquête
          </th>
        </tr>
      </thead>
      <tbody>
        {/* Mail-rij — leeg */}
        <EmptyRow label="Mail" sub="geen pipeline" drivers={drivers} />

        {/* Telefoon — 1e contact */}
        <DataRow
          label="Telefoon"
          sub="1e contact"
          driverCounts={data.driversNieuw}
          n={data.nCallsNieuw}
          aiScore={data.aiNieuw}
          klantscore={klantscore}
          klantscoreMeta={klantscoreMeta}
          drivers={drivers}
          focusDrivers={focusDrivers}
        />

        {/* Telefoon — opvolging */}
        <DataRow
          label="Telefoon"
          sub="opvolging"
          driverCounts={data.driversHerhaal}
          n={data.nCallsHerhaal}
          aiScore={data.aiHerhaal}
          drivers={drivers}
          focusDrivers={focusDrivers}
        />

        {/* App-rij — leeg */}
        <EmptyRow label="App" sub="fase 3" drivers={drivers} />
      </tbody>
    </table>
  );
}

function EmptyRow({ label, sub, drivers }: { label: string; sub: string; drivers: Driver[] }) {
  return (
    <tr>
      <th className="border border-[var(--border)] bg-[var(--surface-muted)] text-left p-2 px-3 font-semibold text-[var(--grey)]" style={{ fontSize: '12px' }}>
        {label}
        <span className="block text-[10px] font-normal text-[var(--muted)] mt-0.5">{sub}</span>
      </th>
      {drivers.map((d) => (
        <td key={d.key} className="border border-[var(--border)] bg-[var(--surface-muted)] text-center text-[var(--grey)]" style={{ fontSize: '14px' }}>
          —
        </td>
      ))}
      <td className="border border-[var(--border)] bg-[var(--surface-muted)] text-center text-[var(--grey)] font-normal">—</td>
      <td className="border border-[var(--border)] bg-[var(--surface-muted)] text-center text-[var(--grey)] font-normal">—</td>
    </tr>
  );
}

interface DataRowProps {
  label: string;
  sub: string;
  driverCounts: Agent['driversNieuw'];
  n: number;
  aiScore: number | null;
  klantscore?: number | null;
  klantscoreMeta?: string;
  drivers: Driver[];
  focusDrivers: DriverKey[];
}

function DataRow({ label, sub, driverCounts, n, aiScore, klantscore, klantscoreMeta, drivers, focusDrivers }: DataRowProps) {
  const aiCls = aiScoreClass(aiScore);
  const klantCls = npsClass(klantscore);
  const klantStr = klantscore !== undefined && klantscore !== null ? formatNps(klantscore) : '—';

  return (
    <tr>
      <th className="border border-[var(--border)] bg-[var(--surface-muted)] text-left p-2 px-3 font-semibold text-[var(--foreground)]" style={{ fontSize: '12px' }}>
        {label}
        <span className="block text-[10px] font-normal text-[var(--muted)] mt-0.5">{sub}</span>
      </th>
      {drivers.map((d) => {
        if (!d.detect) {
          return (
            <td
              key={d.key}
              className="border border-[var(--border)] text-center italic text-[var(--grey)] font-normal"
              style={{
                fontSize: '10px',
                background:
                  'repeating-linear-gradient(45deg, #f0f2f6, #f0f2f6 4px, #fafbfc 4px, #fafbfc 8px)',
              }}
            >
              fase 2
            </td>
          );
        }
        if (n === 0) {
          return (
            <td
              key={d.key}
              className="border border-[var(--border)] text-center bg-[var(--surface-muted)] text-[var(--grey)] font-normal"
              style={{ fontSize: '14px' }}
            >
              —
            </td>
          );
        }
        const cnt = (driverCounts[d.key] as number | undefined) || 0;
        const p = pct(cnt, n);
        const isFocus = focusDrivers.includes(d.key);
        const cls = isFocus ? 'text-[var(--sure-orange)]' : `text-[var(--${driverPctClass(p)})]`;
        return (
          <td key={d.key} className="border border-[var(--border)] text-center font-bold p-1.5" style={{ fontSize: '13px' }}>
            <span className={`block ${cls}`} style={{ fontSize: isFocus ? '15px' : '13px', lineHeight: 1 }}>
              {p}%
            </span>
            <span className="block text-[10px] text-[var(--muted)] font-normal mt-0.5">
              {cnt}/{n}
            </span>
          </td>
        );
      })}
      <td className={`border border-[var(--border)] bg-[var(--surface-muted)] text-center font-bold text-[var(--${aiCls})]`} style={{ fontSize: '15px' }}>
        {formatAiScore(aiScore)}
        {n > 0 && <span className="block text-[10px] text-[var(--muted)] font-normal mt-0.5">n={n}</span>}
      </td>
      {klantscore !== undefined ? (
        <td className={`border border-[var(--border)] bg-[var(--surface-muted)] text-center font-bold text-[var(--${klantCls})]`} style={{ fontSize: '15px' }}>
          {klantStr}
          {klantscoreMeta && (
            <span className="block text-[10px] text-[var(--muted)] font-normal mt-0.5">{klantscoreMeta}</span>
          )}
        </td>
      ) : (
        <td className="border border-[var(--border)] bg-[var(--surface-muted)] text-center text-[var(--grey)] font-normal">—</td>
      )}
    </tr>
  );
}
