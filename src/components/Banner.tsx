type BannerVariant = 'medewerker' | 'teamleider' | 'directie';

interface Props {
  variant: BannerVariant;
  deelLabel: string;
  title: string;
  subtitle?: string;
  whoNote?: string;
}

const VARIANT_STYLE: Record<BannerVariant, string> = {
  medewerker: 'bg-gradient-to-r from-[var(--sure-orange)] to-[#fcd34d] text-[var(--sure-teal-900)]',
  teamleider: 'bg-gradient-to-r from-[var(--sure-teal-400)] to-[var(--sure-teal-700)] text-white',
  directie: 'bg-gradient-to-r from-[var(--sure-teal-900)] to-[#2A4070] text-white',
};

export function Banner({ variant, deelLabel, title, subtitle, whoNote }: Props) {
  return (
    <div className={`${VARIANT_STYLE[variant]} px-6 py-4 rounded-lg flex items-center justify-between shadow-sm`}>
      <div>
        <div className="text-[11px] uppercase tracking-[2px] font-bold">★ {deelLabel}</div>
        <div className="text-xl font-bold mt-0.5">
          {title}
          {subtitle && <span className="font-normal text-sm opacity-80 ml-2">{subtitle}</span>}
        </div>
      </div>
      {whoNote && <div className="text-xs opacity-80 italic max-w-md text-right">{whoNote}</div>}
    </div>
  );
}
