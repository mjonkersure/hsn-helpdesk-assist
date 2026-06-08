/**
 * & sure-it logo — tekstvariant.
 * Vervang door <img src="/logo.svg" /> wanneer de echte SVG in public/ staat.
 *
 * Kleuren uit huisstijl-sheet:
 *  - & teken: #005A6C (donker teal)
 *  - "sure" tekst: #67B3BE (light teal)
 *  - ".": #005A6C (donker teal, klein cirkeltje)
 *  - "it": #F8971D (oranje)
 */
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const fontSize =
    size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl';

  return (
    <span
      className={`font-bold inline-flex items-baseline ${fontSize}`}
      style={{ fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '-0.02em' }}
    >
      <span style={{ color: 'var(--sure-teal-900)' }}>&amp;</span>
      <span style={{ color: 'var(--sure-teal-400)' }}>sure</span>
      <span style={{ color: 'var(--sure-teal-900)' }}>.</span>
      <span style={{ color: 'var(--sure-orange)' }}>it</span>
    </span>
  );
}

export function LogoWithPayoff({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const payoffSize = size === 'lg' ? 'text-base' : 'text-xs';
  return (
    <div className="inline-flex flex-col">
      <Logo size={size} />
      <span
        className={`${payoffSize} font-normal`}
        style={{ color: 'var(--sure-teal-900)', marginTop: '-4px' }}
      >
        in a demanding world
      </span>
    </div>
  );
}
