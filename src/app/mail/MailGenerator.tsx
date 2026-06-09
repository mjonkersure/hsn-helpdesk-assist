'use client';

import { useState } from 'react';
import type { SampleTranscript } from '@/types/data';
import type { GenereerMailResponse, MailDriverKey, MailDrivers } from '@/types/mail';
import { MAIL_DRIVER_LABELS, MAIL_DRIVER_TOELICHTING } from '@/types/mail';

interface Props {
  transcripts: SampleTranscript[];
}

const DRIVER_ORDER: MailDriverKey[] = [
  'welkom',
  'identificatie',
  'vraag_capteren',
  'oplossing',
  'proactief_ondersteunend',
  'empathie',
  'afsluiting',
  'enquete',
];

export function MailGenerator({ transcripts }: Props) {
  const [selectedId, setSelectedId] = useState<string>(transcripts[0]?.case_id ?? '');
  const [result, setResult] = useState<GenereerMailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = transcripts.find((t) => t.case_id === selectedId) ?? null;

  async function generate() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/genereer-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: selected.case_id }),
      });
      const data = (await res.json()) as GenereerMailResponse;
      if (!res.ok || data.error) {
        setError(data.error ?? `Fout: ${res.status}`);
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  }

  async function copyMail() {
    if (!result) return;
    const text = `Onderwerp: ${result.onderwerp}\n\n${result.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (transcripts.length === 0) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-lg p-6">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">Geen sample-transcripten beschikbaar</h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          De demo-transcripten zijn lokaal-only (gitignored vanwege klantnamen). Voor de productie-demo:
        </p>
        <ul className="text-sm text-[var(--muted)] list-disc ml-5 mt-2 space-y-1">
          <li>Anonimiseer 1-2 transcripten en commit ze naar <code className="font-mono text-xs">src/data/sample-transcripts/</code>, óf</li>
          <li>Stel een upload-/storage-route in zodra Supabase aangesloten is</li>
        </ul>
        <p className="text-sm text-[var(--muted)] leading-relaxed mt-3">
          Lokaal werkt de mail-generator wel — draai <code className="font-mono text-xs">npm run dev</code> en open <code className="font-mono text-xs">/mail</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Transcript-keuze */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4">
        <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--muted)] mb-2">
          Kies transcript
        </label>
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setResult(null);
            setError(null);
          }}
          className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sure-teal-400)]"
        >
          {transcripts.map((t) => (
            <option key={t.case_id} value={t.case_id}>
              {t.case_id} — {t.agent_naam} — {t.merk} — {t.hoofdcategorie} ({t.duration_mmss})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transcript-weergave */}
        <section className="bg-white border border-[var(--border)] rounded-lg p-5 flex flex-col">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)] mb-3">
            Telefoongesprek
          </h2>

          {selected && (
            <>
              <div className="text-sm space-y-1 mb-3 pb-3 border-b border-[var(--border)]">
                <div>
                  <span className="text-[var(--muted)]">Medewerker:</span>{' '}
                  <span className="font-medium">{selected.agent_naam}</span>
                  {selected.agent_whisper && (
                    <span className="text-[var(--muted)] italic">
                      {' '}
                      (transcript hoorde &quot;{selected.agent_whisper}&quot;)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[var(--muted)]">Dossier:</span>{' '}
                  <span className="font-medium">{selected.case_id}</span>{' '}
                  <span className="text-[var(--muted)]">
                    · {selected.merk} · {selected.gesprekstype} · {selected.duration_mmss}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)]">Categorie:</span>{' '}
                  <span className="font-medium">{selected.hoofdcategorie}</span>
                  {selected.subonderwerp && (
                    <span className="text-[var(--muted)]"> — {selected.subonderwerp}</span>
                  )}
                </div>
                <div>
                  <span className="text-[var(--muted)]">Klant-emotie:</span>{' '}
                  <span className="font-medium">{selected.klant_emotie}</span>
                </div>
                <div className="text-xs italic text-[var(--muted)] mt-2">
                  Samenvatting (pipeline): {selected.samenvatting}
                </div>
              </div>

              <div className="overflow-y-auto max-h-[60vh] text-sm space-y-2 pr-1">
                {selected.utterances.map((u, i) => (
                  <div key={i} className="flex gap-2">
                    <span
                      className={`shrink-0 text-[10px] uppercase font-semibold tracking-wider mt-0.5 ${
                        u.speaker === 'agent' ? 'text-[var(--sure-teal-700)]' : 'text-[var(--sure-orange)]'
                      }`}
                    >
                      {u.speaker === 'agent' ? 'Mdwk' : 'Klant'}
                    </span>
                    <span className="text-[var(--foreground)]">{u.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Mail-output */}
        <section className="bg-white border border-[var(--border)] rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
              Conceptmail
            </h2>
            <div className="flex gap-2">
              {result && (
                <button
                  onClick={copyMail}
                  className="text-xs px-3 py-1.5 rounded-md border border-[var(--border)] hover:bg-[var(--background)] transition-colors"
                >
                  {copied ? '✓ Gekopieerd' : 'Kopiëren'}
                </button>
              )}
              <button
                onClick={generate}
                disabled={loading || !selected}
                className="text-sm px-4 py-1.5 rounded-md bg-[var(--sure-teal-900)] text-white font-medium hover:bg-[var(--sure-teal-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Bezig...' : result ? 'Opnieuw genereren' : 'Genereer opvolgmail'}
              </button>
            </div>
          </div>

          {result?.mock && (
            <div className="mb-3 text-xs px-3 py-2 rounded-md bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/30">
              ⚠ Mock-respons getoond. Vul <code className="font-mono">ANTHROPIC_API_KEY</code> in{' '}
              <code className="font-mono">.env.local</code> en herstart de dev-server voor echte AI-output.
            </div>
          )}

          {error && (
            <div className="mb-3 text-xs px-3 py-2 rounded-md bg-[var(--red)]/10 text-[var(--red)] border border-[var(--red)]/30">
              {error}
            </div>
          )}

          {result ? (
            <div className="bg-[var(--surface-muted)] rounded-md p-4 border border-[var(--border)] overflow-y-auto max-h-[60vh]">
              <div className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)] mb-1">
                Onderwerp
              </div>
              <div className="text-sm font-semibold text-[var(--foreground)] mb-3 pb-3 border-b border-[var(--border)]">
                {result.onderwerp}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--foreground)]">
                {result.body}
              </pre>
            </div>
          ) : (
            <div className="text-sm text-[var(--muted)] italic flex-1 flex items-center justify-center min-h-[200px] bg-[var(--surface-muted)] rounded-md border border-dashed border-[var(--border)]">
              {loading
                ? 'AI denkt na...'
                : 'Klik op "Genereer opvolgmail" om een conceptmail te maken op basis van het gesprek.'}
            </div>
          )}
        </section>
      </div>

      {/* Driver-checklist — toont wat AI heeft toegepast */}
      {result && <DriverChecklist drivers={result.drivers} />}
    </div>
  );
}

function DriverChecklist({ drivers }: { drivers: MailDrivers }) {
  const used = DRIVER_ORDER.filter((k) => drivers[k]?.gebruikt).length;

  return (
    <section className="bg-white border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
          Drivers in deze mail
          <span className="ml-2 normal-case font-normal tracking-normal text-[var(--grey)]">
            — {used} van {DRIVER_ORDER.length} toegepast
          </span>
        </h2>
        <p className="text-[10px] italic text-[var(--muted)]">
          De AI markeert per driver of hij is gebruikt en geeft een citaat (of de reden om over te slaan).
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {DRIVER_ORDER.map((k) => {
          const d = drivers[k];
          const used = d?.gebruikt;
          const accent = used
            ? 'border-[var(--green)]/40 bg-[var(--green)]/5'
            : 'border-[var(--grey)]/30 bg-[var(--surface-muted)]';
          return (
            <div key={k} className={`rounded-md border p-3 ${accent}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {MAIL_DRIVER_LABELS[k]}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold ${
                    used ? 'text-[var(--green)]' : 'text-[var(--grey)]'
                  }`}
                >
                  {used ? '✓ Toegepast' : '— Overgeslagen'}
                </span>
              </div>
              <p className="text-[10px] italic text-[var(--muted)] mb-2">
                {MAIL_DRIVER_TOELICHTING[k]}
              </p>
              {used ? (
                <p className="text-xs text-[var(--foreground)] bg-white border border-[var(--border)] rounded px-2 py-1.5 italic">
                  &ldquo;{d.hoe}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  {d?.reden_overgeslagen || 'Niet toegepast.'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
