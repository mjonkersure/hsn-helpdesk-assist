import type { DashboardData } from '@/types/data';
import { pct, driverPctClass, formatNps, npsClass, formatAiScore, aiScoreClass } from '@/lib/data';

const GROUP_CLASS: Record<string, string> = {
  welkom: 'bg-[var(--g-welkom)]',
  vraag: 'bg-[var(--g-vraag)]',
  oplossing: 'bg-[var(--g-oplossing)]',
  empathie: 'bg-[var(--g-empathie)]',
  afsluiting: 'bg-[var(--g-afsluiting)]',
  inhoud: 'bg-[var(--g-inhoud)]',
};

export function DriverOverviewTable({ data }: { data: DashboardData }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th className="border border-[var(--border)] bg-[var(--surface-muted)] text-left px-3 py-2 uppercase tracking-wider font-semibold w-[200px]" style={{ fontSize: '11px' }}>
              Medewerker
            </th>
            {data.drivers.map((d) => (
              <th
                key={d.key}
                className={`border border-[var(--border)] text-center font-semibold leading-tight p-1.5 h-[60px] ${GROUP_CLASS[d.group]}`}
                style={{ fontSize: '10px', color: '#1a3045' }}
              >
                {d.label}
              </th>
            ))}
            <th className="border border-[var(--border)] bg-[var(--sure-teal-900)] text-white text-center font-semibold leading-tight" style={{ fontSize: '10px', width: '78px' }}>
              Score<br />AI-analyse
            </th>
            <th className="border border-[var(--border)] bg-[var(--sure-teal-900)] text-white text-center font-semibold leading-tight" style={{ fontSize: '10px', width: '78px' }}>
              Klantscore<br />NPS
            </th>
          </tr>
        </thead>
        <tbody>
          {data.agents.map((a) => {
            const n = a.nCallsTotal;
            const aiCls = aiScoreClass(a.aiTotal);
            const npsCls = npsClass(a.npsAvg);
            return (
              <tr key={a.naam}>
                <td className="border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
                  <div className="font-semibold" style={{ fontSize: '12px' }}>
                    {a.naam}
                    {a.teams && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#efe6f5] text-[#6b4a8a]">
                        Teams
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">
                    {a.rol} · {n > 0 ? `${n} calls` : a.teams ? 'via Teams' : 'geen calls'}
                  </div>
                </td>
                {data.drivers.map((d) => {
                  if (!d.detect) {
                    return (
                      <td
                        key={d.key}
                        className="border border-[var(--border)] text-center italic text-[var(--grey)] font-normal"
                        style={{
                          fontSize: '9px',
                          background:
                            'repeating-linear-gradient(45deg, #f0f2f6, #f0f2f6 4px, #fafbfc 4px, #fafbfc 8px)',
                        }}
                      >
                        fase 2
                      </td>
                    );
                  }
                  if (!n) {
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
                  const cnt = (a.driversTotal[d.key] as number | undefined) || 0;
                  const p = pct(cnt, n);
                  const cls = driverPctClass(p);
                  return (
                    <td key={d.key} className="border border-[var(--border)] text-center font-bold p-1.5">
                      <span className={`block text-[var(--${cls})]`} style={{ fontSize: '12px', lineHeight: 1 }}>
                        {p}%
                      </span>
                      <span className="block text-[9px] text-[var(--muted)] font-normal mt-0.5">
                        {cnt}/{n}
                      </span>
                    </td>
                  );
                })}
                <td className={`border border-[var(--border)] bg-[var(--surface-muted)] text-center font-bold text-[var(--${aiCls})]`} style={{ fontSize: '13px' }}>
                  {formatAiScore(a.aiTotal)}
                </td>
                <td className={`border border-[var(--border)] bg-[var(--surface-muted)] text-center font-bold text-[var(--${npsCls})]`} style={{ fontSize: '13px' }}>
                  {formatNps(a.npsAvg)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
