'use client';

import { useState } from 'react';

const PERIODES = ['Vandaag', 'Week', 'Deze maand', 'Kwartaal'];
const DOSSIERS = ['Alle', 'Verzoeken', 'Claims', 'Support'];

export function FilterBar({ showDossier = true }: { showDossier?: boolean }) {
  const [periode, setPeriode] = useState('Deze maand');
  const [dossier, setDossier] = useState('Alle');

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 bg-white border border-[var(--border)] rounded-lg">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--muted)] mr-1">
        Periode
      </span>
      {PERIODES.map((p) => (
        <Pill key={p} active={p === periode} onClick={() => setPeriode(p)}>
          {p}
        </Pill>
      ))}

      {showDossier && (
        <>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--muted)] mx-1 ml-4">
            Dossier
          </span>
          {DOSSIERS.map((d) => (
            <Pill key={d} active={d === dossier} onClick={() => setDossier(d)}>
              {d}
            </Pill>
          ))}
        </>
      )}

      <span className="flex-1" />
      <span className="text-[10px] text-[var(--grey)] italic">
        Filters werken nog niet — UI-mockup voor demo
      </span>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs transition-colors border ${
        active
          ? 'bg-[var(--sure-teal-900)] text-white border-[var(--sure-teal-900)]'
          : 'bg-[var(--background)] text-[var(--muted)] border-[var(--border)] hover:bg-white'
      }`}
    >
      {children}
    </button>
  );
}
