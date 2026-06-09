'use client';

import { Logo } from './Logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/medewerker', label: 'Voor medewerker' },
  { href: '/teamleider', label: 'Voor teamleider' },
  { href: '/directie', label: 'Voor directie' },
  { href: '/mail', label: 'Mail-generator' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-[var(--border)] sticky top-0 z-10">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <div className="hidden md:block h-7 w-px bg-[var(--border)]" />
          <div className="hidden md:flex flex-col">
            <span className="font-semibold text-[var(--foreground)]" style={{ fontSize: '15px' }}>
              HSN Helpdesk Assist
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              klant Renault Nederland · helpdesk-coaching
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--sure-teal-900)] text-white'
                    : 'text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
