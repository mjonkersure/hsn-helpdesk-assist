import type { Agent, Driver, DriverKey, EmotionKey, KlantscoreAgent, KlantscoreDriverKey } from '@/types/data';
import { EMO_COLORS, KLANTSCORE_DRIVER_LABELS } from '@/types/data';
import { MatrixTable } from './MatrixTable';
import { pct, formatAiScore, formatNps, npsClass, aiScoreClass } from '@/lib/data';
import { osatClass, vocClass, driverScoreClass, formatVoc, formatOsat } from '@/lib/klantscores';

interface Props {
  agent: Agent;
  drivers: Driver[];
  catLabels: Record<string, string>;
  typeLabels: Record<string, string>;
  emoLabels: Record<string, string>;
  /** Show personal blocks (focus, tip, vorig gesprek, trend) — alleen voor medewerker-view */
  showPersonal?: boolean;
  /** Klantscore-aggregaat uit Renault CSAT-enquête (optioneel) */
  klantscore?: KlantscoreAgent;
}

const ROL_STYLE: Record<string, string> = {
  'Front Office': 'bg-[var(--sure-teal-400)]/30 text-[var(--sure-teal-900)] border-[var(--sure-teal-400)]',
  'Back Office': 'bg-[var(--sure-orange)]/20 text-[var(--sure-teal-900)] border-[var(--sure-orange)]',
};

export function AgentCard({
  agent,
  drivers,
  catLabels,
  typeLabels,
  emoLabels,
  showPersonal = false,
  klantscore,
}: Props) {
  const isTeamsOnly = agent.teams && agent.nCallsTotal === 0;
  const rolClass = ROL_STYLE[agent.rol] ?? 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]';

  return (
    <div
      className={`bg-white border border-[var(--border)] rounded-lg p-6 ${
        isTeamsOnly ? 'bg-[var(--surface-muted)]' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-[var(--border)] mb-4 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl font-semibold text-[var(--foreground)]">{agent.naam}</span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${rolClass}`}>
            {agent.rol}
          </span>
          <div className="inline-flex gap-1">
            {agent.specs.map((s) => (
              <span
                key={s}
                className="px-2 py-1 rounded text-[10px] bg-[var(--background)] text-[#555] font-medium"
              >
                {s}
              </span>
            ))}
            {agent.teams && (
              <span className="px-2 py-1 rounded text-[10px] bg-[#efe6f5] text-[#6b4a8a] font-semibold">
                via Teams
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-[var(--muted)] text-right shrink-0">
          {agent.nCallsTotal > 0
            ? `${agent.nCallsTotal} calls · ${agent.nCallsNieuw} 1e + ${agent.nCallsHerhaal} opvolging · ${Math.round(agent.durationMinTotal)} min`
            : agent.teams
              ? 'Webex-data niet beschikbaar (belt via Teams)'
              : 'geen calls in scope'}
        </div>
      </div>

      {/* Persoonlijke blocks — alleen op medewerker-view en alleen voor non-empty */}
      {showPersonal && agent.nCallsTotal > 0 && (
        <div className="space-y-3 mb-4">
          {/* Focus chips */}
          {agent.focusDrivers.length > 0 && (
            <FocusStrip drivers={drivers} focusDrivers={agent.focusDrivers} />
          )}
          {/* Tip */}
          {agent.profile.tip && <TipBox text={agent.profile.tip} focusDrivers={agent.focusDrivers} drivers={drivers} />}
          {/* Vorig gesprek */}
          {agent.lastCall && <PrevCallBox lastCall={agent.lastCall} />}
        </div>
      )}

      {/* Matrix */}
      <MatrixTable
        data={agent}
        klantscore={agent.npsAvg}
        klantscoreMeta={agent.npsAvg !== null ? 'gewogen NPS Q1 26' : ''}
        drivers={drivers}
        focusDrivers={showPersonal ? agent.focusDrivers : []}
      />

      {/* Klantscore-strip — Renault CSAT enquête (overkoepelend cijfer) */}
      {klantscore && <KlantscoreStrip data={klantscore} />}

      {/* Teams banner */}
      {isTeamsOnly && (
        <div className="mt-4 px-4 py-3 rounded-r border-l-4 border-l-[#6b4a8a] bg-[#efe6f5] text-[#4a3a5f] text-xs">
          <strong className="text-[#6b4a8a]">Belt via Teams.</strong> Geen Webex-opnames beschikbaar,
          dus geen driver-detectie via transcript mogelijk. NPS Q1 2026 en eventueel profiel staan
          rechts.
        </div>
      )}

      {/* Rich section */}
      {!isTeamsOnly && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1.1fr] gap-4">
          {/* Linker kolom: categorieën + gesprekstype + emotie */}
          <div className="space-y-3">
            <BlockTitle>Hoofdcategorie (top 5)</BlockTitle>
            <BarChart obj={agent.hoofdcategorie} labels={catLabels} max={5} />

            <BlockTitle>Gesprekstype</BlockTitle>
            <BarChart obj={agent.gesprekstype} labels={typeLabels} />

            <BlockTitle>Klant-emotie</BlockTitle>
            <EmotionBar emo={agent.klantEmotie} labels={emoLabels} />
          </div>

          {/* Midden: operationele cijfers + NPS + Marten */}
          <div>
            <BlockTitle>Operationele kerncijfers</BlockTitle>
            <OperationalStats agent={agent} />

            <BlockTitle className="mt-3">Klantbeleving — NPS Q1 2026</BlockTitle>
            <NpsStrip nps={agent.nps} />

            {agent.marten !== null && agent.marten !== undefined && (
              <div className="mt-2.5 flex justify-between items-center bg-[var(--sure-teal-900)] text-white px-3 py-2 rounded text-xs">
                <span>Marten QA-score (handmatig)</span>
                <span className="font-semibold text-sm">{agent.marten.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Rechter: profiel */}
          <div>
            <BlockTitle>Profiel (Eddy&apos;s analyse)</BlockTitle>
            {agent.profile && Object.keys(agent.profile).length ? (
              <div className="space-y-2 text-xs leading-relaxed">
                {agent.profile.sterk && <ProfileSection label="Sterke kant" text={agent.profile.sterk} />}
                {agent.profile.zwak && <ProfileSection label="Zwakke kant" text={agent.profile.zwak} />}
                {agent.profile.training && <ProfileSection label="Trainings-richting" text={agent.profile.training} />}
              </div>
            ) : (
              <p className="text-xs italic text-[var(--muted)]">Geen profiel beschikbaar.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const KLANTSCORE_COLOR_CLASS: Record<'green' | 'amber' | 'red' | 'grey', string> = {
  green: 'bg-[var(--green)]/15 text-[var(--green)] border-[var(--green)]/30',
  amber: 'bg-[var(--amber)]/15 text-[var(--amber)] border-[var(--amber)]/30',
  red: 'bg-[var(--red)]/15 text-[var(--red)] border-[var(--red)]/30',
  grey: 'bg-[var(--grey)]/15 text-[var(--grey)] border-[var(--grey)]/30',
};

const KLANTSCORE_DRIVER_KEYS: KlantscoreDriverKey[] = ['ease', 'follow_up', 'listen', 'friendliness', 'clarity'];

function KlantscoreStrip({ data }: { data: KlantscoreAgent }) {
  return (
    <div className="mt-4 bg-gradient-to-r from-[var(--surface-muted)] to-white border border-[var(--border)] rounded-md p-3">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--sure-teal-900)]">
          Klantscore-enquête (Renault CSAT)
          <span className="ml-2 text-[var(--muted)] font-normal normal-case tracking-normal">
            n = {data.total_enquetes} dossiers year-to-date
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ScorePill label="VoC" value={formatVoc(data.voc_index_avg)} variant={vocClass(data.voc_index_avg)} />
          <ScorePill label="Osat" value={formatOsat(data.cc_osat_avg)} variant={osatClass(data.cc_osat_avg)} />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {KLANTSCORE_DRIVER_KEYS.map((k) => (
          <div key={k} className="text-center">
            <div className="text-[9px] uppercase tracking-wider text-[var(--muted)] mb-1">
              {KLANTSCORE_DRIVER_LABELS[k]}
            </div>
            <div
              className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${
                KLANTSCORE_COLOR_CLASS[driverScoreClass(data.drivers[k]?.avg)]
              }`}
            >
              {formatOsat(data.drivers[k]?.avg)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScorePill({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: 'green' | 'amber' | 'red' | 'grey';
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">{label}</span>
      <span className={`px-2 py-1 rounded text-xs font-bold border ${KLANTSCORE_COLOR_CLASS[variant]}`}>
        {value}
      </span>
    </div>
  );
}

function BlockTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[10px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-1.5 ${className}`}>
      {children}
    </div>
  );
}

function FocusStrip({ drivers, focusDrivers }: { drivers: Driver[]; focusDrivers: DriverKey[] }) {
  return (
    <div className="bg-gradient-to-br from-[var(--sure-teal-900)] to-[#2A4070] text-white p-4 rounded-md">
      <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--sure-orange)] mb-2">
        ★ Mijn focus deze week — automatische suggestie op basis van laagste scores
      </div>
      <div className="flex flex-wrap gap-2">
        {focusDrivers.map((key) => {
          const d = drivers.find((x) => x.key === key);
          return (
            <span
              key={key}
              className="bg-[var(--sure-orange)] text-[var(--sure-teal-900)] px-3 py-1 rounded-full text-xs font-semibold"
            >
              ★ {d?.label.replace(/\n/g, ' ')}
            </span>
          );
        })}
        <span className="border border-[var(--sure-orange)] text-white px-3 py-1 rounded-full text-xs">
          + wijzig
        </span>
      </div>
      <div className="text-[10px] italic mt-2 text-white/70">
        In productie: door medewerker zelf gekozen. AI focust feedback op deze drie.
      </div>
    </div>
  );
}

function TipBox({ text, focusDrivers, drivers }: { text: string; focusDrivers: DriverKey[]; drivers: Driver[] }) {
  const focusLabels = focusDrivers
    .map((k) => drivers.find((d) => d.key === k)?.label.replace(/\n/g, ' '))
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-[#FFF8E6] border-l-4 border-[var(--sure-orange)] p-3 rounded-r">
      <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--sure-orange)]">
        ★ Vandaag oefenen — één ding
      </div>
      <div className="text-sm mt-1">{text}</div>
      <div className="text-[10px] italic text-[var(--muted)] mt-1.5">
        Gebaseerd op Eddy&apos;s beluister-analyse en je focus-drivers: {focusLabels}.
      </div>
    </div>
  );
}

function PrevCallBox({ lastCall }: { lastCall: NonNullable<Agent['lastCall']> }) {
  return (
    <div className="bg-[#F5F1E8] p-3 rounded">
      <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--sure-teal-900)] mb-2">
        Vorig gesprek — case {lastCall.case} · {lastCall.duur}
      </div>
      <div className="text-xs space-y-1.5">
        <div>
          <strong className="text-[var(--sure-teal-900)]">Wat ging goed:</strong>{' '}
          <span className="text-[var(--green)]">{lastCall.goed}</span>
        </div>
        <div>
          <strong className="text-[var(--sure-teal-900)]">Klant zei aan einde:</strong> {lastCall.klant_zei}
        </div>
        <div>
          <strong className="text-[var(--sure-teal-900)]">Wat AI ook zag:</strong> {lastCall.ai_zag}
        </div>
      </div>
    </div>
  );
}

function BarChart({ obj, labels, max }: { obj: Record<string, number>; labels: Record<string, string>; max?: number }) {
  const items = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const total = items.reduce((s, [, v]) => s + v, 0);
  const top = max ? items.slice(0, max) : items;

  if (total === 0) {
    return <div className="text-xs italic text-[var(--muted)]">geen data</div>;
  }

  return (
    <div className="space-y-1">
      {top.map(([k, v]) => {
        const p = pct(v, total);
        return (
          <div key={k} className="flex items-center text-[11px] gap-1.5">
            <div className="w-[120px] flex-shrink-0 text-[#354051]">{labels[k] || k}</div>
            <div className="flex-1 h-3 bg-[#f0f2f6] rounded overflow-hidden">
              <div className="h-full bg-[#4a6fa5]" style={{ width: `${p}%` }} />
            </div>
            <div className="text-[10px] text-[var(--muted)] min-w-[56px] text-right">
              {v} ({p}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmotionBar({ emo, labels }: { emo: Record<string, number>; labels: Record<string, string> }) {
  const total = Object.values(emo).reduce((s, v) => s + v, 0);
  if (total === 0) return <div className="text-xs italic text-[var(--muted)]">geen data</div>;
  const order: EmotionKey[] = ['tevreden', 'neutraal', 'licht_geirriteerd', 'gefrustreerd_boos', 'onbekend'];

  return (
    <div>
      <div className="flex h-4 rounded overflow-hidden border border-[var(--border)]">
        {order
          .filter((k) => emo[k])
          .map((k) => {
            const w = pct(emo[k], total);
            return (
              <div
                key={k}
                style={{ width: `${w}%`, background: EMO_COLORS[k] }}
                title={`${labels[k]}: ${emo[k]}`}
              />
            );
          })}
      </div>
      <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] text-[var(--muted)]">
        {order
          .filter((k) => emo[k])
          .map((k) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-sm"
                style={{ background: EMO_COLORS[k] }}
              />
              {labels[k]} {emo[k]}
            </span>
          ))}
      </div>
    </div>
  );
}

function OperationalStats({ agent }: { agent: Agent }) {
  const opgelostJa = agent.opgelost.ja || 0;
  const opgelostTotal = Object.values(agent.opgelost).reduce((s, v) => s + v, 0);
  const eersteTotal = agent.nCallsNieuw + agent.nCallsHerhaal;
  const terugbel = agent.terugbelBelofte.ja || 0;
  const tbTotal = Object.values(agent.terugbelBelofte).reduce((s, v) => s + v, 0);
  const irritated = (agent.klantEmotie.gefrustreerd_boos || 0) + (agent.klantEmotie.licht_geirriteerd || 0);
  const knownEmo =
    Object.values(agent.klantEmotie).reduce((s, v) => s + v, 0) - (agent.klantEmotie.onbekend || 0);

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatBox
        label="Opgelost in call"
        value={`${pct(opgelostJa, opgelostTotal)}%`}
        meta={`${opgelostJa} van ${opgelostTotal}`}
        color={opgelostTotal && opgelostJa / opgelostTotal >= 0.2 ? 'green' : 'amber'}
      />
      <StatBox
        label="1e contact"
        value={`${pct(agent.nCallsNieuw, eersteTotal)}%`}
        meta="rest = opvolging"
      />
      <StatBox
        label="Terugbel-belofte"
        value={`${pct(terugbel, tbTotal)}%`}
        meta={`${terugbel} van ${tbTotal}`}
      />
      <StatBox
        label="Klant geïrriteerd"
        value={`${pct(irritated, knownEmo)}%`}
        meta="licht + boos"
        color={knownEmo && irritated / knownEmo >= 0.3 ? 'red' : 'amber'}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  meta,
  color,
}: {
  label: string;
  value: string;
  meta: string;
  color?: 'green' | 'amber' | 'red';
}) {
  return (
    <div className="bg-[var(--surface-muted)] border border-[var(--border)] rounded p-2 px-2.5">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className={`text-base font-semibold mt-0.5 ${color ? `text-[var(--${color})]` : ''}`}>
        {value}
      </div>
      <div className="text-[10px] text-[var(--muted)]">{meta}</div>
    </div>
  );
}

function NpsStrip({ nps }: { nps: Agent['nps'] }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <NpsCell label="Verzoeken" data={nps.verzoeken !== undefined ? { val: nps.verzoeken, n: nps.n_v || 0 } : null} />
      <NpsCell label="Klachten" data={nps.klachten !== undefined ? { val: nps.klachten, n: nps.n_k || 0 } : null} />
      <NpsCell label="Support" data={nps.support !== undefined ? { val: nps.support, n: nps.n_s || 0 } : null} />
    </div>
  );
}

function NpsCell({ label, data }: { label: string; data: { val: number; n: number } | null }) {
  if (!data) {
    return (
      <div className="bg-[var(--surface-muted)] border border-[var(--border)] rounded p-1.5 text-center">
        <div className="text-[9px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
        <div className="text-sm text-[var(--grey)] font-normal mt-0.5">—</div>
        <div className="text-[9px] text-[var(--muted)]">geen data</div>
      </div>
    );
  }
  const cls = npsClass(data.val);
  return (
    <div className="bg-[var(--surface-muted)] border border-[var(--border)] rounded p-1.5 text-center">
      <div className="text-[9px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className={`text-sm font-bold mt-0.5 text-[var(--${cls})]`}>
        {data.val > 0 ? '+' : ''}
        {Math.round(data.val)}
      </div>
      <div className="text-[9px] text-[var(--muted)]">n={data.n}</div>
    </div>
  );
}

function ProfileSection({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-0.5">
        {label}
      </div>
      <p className="text-[var(--foreground)]">{text}</p>
    </div>
  );
}
