import type { DashboardData } from '@/types/data';

export function DriverLegenda({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.drivers.map((d) => {
        const phase2 = !d.detect;
        return (
          <div
            key={d.key}
            className={`px-3 py-2.5 rounded-md border-l-[3px] ${
              phase2 ? 'border-l-[var(--grey)] opacity-70' : 'border-l-[var(--sure-orange)]'
            } bg-[var(--surface-muted)]`}
          >
            <div className="font-bold text-[var(--foreground)]" style={{ fontSize: '12px' }}>
              {d.label.replace(/\n/g, ' ')}
            </div>
            <div className="text-[var(--muted)] mt-1" style={{ fontSize: '11px', lineHeight: 1.4 }}>
              {data.driverDefs[d.key]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
