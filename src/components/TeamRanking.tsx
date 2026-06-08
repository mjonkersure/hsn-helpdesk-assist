import type { DashboardData } from '@/types/data';
import { formatAiScore, aiScoreClass, formatNps, npsClass } from '@/lib/data';

export function TeamRanking({ data }: { data: DashboardData }) {
  const sorted = [...data.agents].sort((a, b) => (b.aiTotal ?? -1) - (a.aiTotal ?? -1));

  return (
    <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
      <thead>
        <tr>
          <Th className="text-center w-[40px]">#</Th>
          <Th>Medewerker</Th>
          <Th>Rol</Th>
          <Th className="text-center w-[60px]">Calls</Th>
          <Th className="text-center w-[80px]">AI-score</Th>
          <Th className="text-center w-[80px]">NPS gem.</Th>
          <Th className="text-center w-[70px]">Marten</Th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((a, i) => {
          const aiCls = aiScoreClass(a.aiTotal);
          const ncls = npsClass(a.npsAvg);
          return (
            <tr key={a.naam} className="border-b border-[#F0EBDE]">
              <td className="px-2 py-2 text-center font-semibold">{i + 1}</td>
              <td className="px-2 py-2">
                <span className="font-semibold text-[var(--foreground)]">{a.naam}</span>
                {a.teams && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#efe6f5] text-[#6b4a8a]">
                    Teams
                  </span>
                )}
                <div className="text-[10px] text-[var(--muted)] mt-0.5">{a.specs.join(' + ')}</div>
              </td>
              <td className="px-2 py-2 text-[var(--muted)]">{a.rol}</td>
              <td className="px-2 py-2 text-center font-semibold">
                {a.nCallsTotal || <span className="text-[var(--grey)] font-normal">—</span>}
              </td>
              <td className={`px-2 py-2 text-center font-semibold text-[var(--${aiCls})]`}>
                {formatAiScore(a.aiTotal)}
              </td>
              <td className={`px-2 py-2 text-center font-semibold text-[var(--${ncls})]`}>
                {formatNps(a.npsAvg)}
              </td>
              <td className="px-2 py-2 text-center font-semibold">
                {a.marten !== null && a.marten !== undefined ? a.marten.toFixed(2) : <span className="text-[var(--grey)] font-normal">—</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`bg-[var(--sure-teal-900)] text-white px-2 py-2 text-left font-semibold uppercase tracking-wider ${className}`}
      style={{ fontSize: '10px' }}
    >
      {children}
    </th>
  );
}
