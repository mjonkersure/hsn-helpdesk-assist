interface Props {
  label: string;
  value: string | number;
  sub: string;
  color?: 'green' | 'amber' | 'red';
}

export function KpiCard({ label, value, sub, color }: Props) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-5">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--muted)]">
        {label}
      </div>
      <div className={`text-3xl font-bold mt-1.5 leading-none ${color ? `text-[var(--${color})]` : 'text-[var(--foreground)]'}`}>
        {value}
      </div>
      <div className="text-xs text-[var(--muted)] mt-1">{sub}</div>
    </div>
  );
}
