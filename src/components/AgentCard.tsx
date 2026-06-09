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
      {klantscore && <KlantscoreStrip data={klantscore} agent={agent} />}

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

const KLANTSCORE_DRIVER_TOOLTIPS: Record<KlantscoreDriverKey, string> = {
  ease: 'CSAT-vraag: "Hoe makkelijk was het om de klantenservice te bereiken?" Schaal 1-10.',
  follow_up: 'CSAT-vraag: "Hoe goed werd uw verzoek na het gesprek opgevolgd?" Schaal 1-10.',
  listen: 'CSAT-vraag: "Heeft de medewerker uw behoefte begrepen en goed geluisterd?" Schaal 1-10.',
  friendliness: 'CSAT-vraag: "Hoe vriendelijk en betrokken was de medewerker?" Schaal 1-10.',
  clarity: 'CSAT-vraag: "Hoe helder en accuraat waren de uitleg en antwoorden?" Schaal 1-10.',
};

function KlantscoreStrip({ data, agent }: { data: KlantscoreAgent; agent: Agent }) {
  // AI-detectie van de Enquête-driver in de calls
  const enqAsked = (agent.driversTotal.enquete as number | undefined) ?? 0;
  const enqAskPct = agent.nCallsTotal > 0 ? Math.round((100 * enqAsked) / agent.nCallsTotal) : 0;
  const csatLooksHigh = (data.cc_osat_avg ?? 0) >= 8.5;
  const askLooksLow = enqAskPct < 15 && agent.nCallsTotal >= 10;
  const flagMismatch = csatLooksHigh && askLooksLow;

  return (
    <div className="mt-4 bg-gradient-to-r from-[var(--surface-muted)] to-white border border-[var(--border)] rounded-md p-3">
      {/* Header met bron-uitleg */}
      <div className="mb-2">
        <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--sure-teal-900)]">
          Klantscore-enquête (Renault CSAT)
          <span className="ml-2 text-[var(--muted)] font-normal normal-case tracking-normal">
            n = {data.total_enquetes} dossiers year-to-date
          </span>
        </div>
        <div className="text-[10px] italic text-[var(--muted)] mt-0.5">
          Bron: Renault CSAT-enquête die klanten na hun dossier invullen. Elk cijfer hieronder is het
          gemiddelde rapportcijfer over alle {data.total_enquetes} klanten die de enquête hebben
          ingestuurd. Hover op een driver voor de letterlijke vraag aan de klant.
        </div>
      </div>

      {/* Selectie-bias waarschuwing — nu BOVENAAN voor de cijfers, zodat je 'm niet mist */}
      {flagMismatch && (
        <div className="mb-3 text-[11px] leading-snug text-[var(--amber)] bg-[var(--amber)]/15 border border-[var(--amber)] rounded px-3 py-2.5">
          <div className="font-bold uppercase tracking-wider text-[10px] mb-1">
            ⚠ Let op — selectie-bias waarschijnlijk
          </div>
          De CSAT-cijfers hieronder zien er goed uit, maar onze AI detecteert dat {agent.naam.split(' ')[0]} in
          slechts <strong>{enqAskPct}% van haar calls</strong> ({enqAsked} van {agent.nCallsTotal}) zelf om
          de enquête vraagt. De klanten die wél een enquête invullen zijn meestal de tevreden klanten —
          ontevreden klanten gooien hem weg. De {data.total_enquetes} ingevulde enquêtes zijn dus geen
          representatieve steekproef. <strong>Coaching-richting:</strong> actief om de enquête vragen, ook
          bij minder gunstige uitkomsten.
        </div>
      )}

      {/* Headline-cijfers met ⚠ als bias geflagd is */}
      <div className="flex items-center justify-end gap-3 flex-wrap mb-3">
        {flagMismatch && (
          <span className="text-[10px] text-[var(--amber)] font-semibold uppercase tracking-wider">
            ⚠ Niet representatief
          </span>
        )}
        <ScorePill
          label="Klanttevredenheid"
          subtitle="schaal −100 tot +100 · boven +50 = sterk"
          techterm="VoC"
          value={formatVoc(data.voc_index_avg)}
          variant={flagMismatch ? 'grey' : vocClass(data.voc_index_avg)}
          tooltip={`Voice of Customer Index — gewogen gemiddelde over ${data.total_enquetes} ingevulde enquêtes. Schaal −100 tot +100. Boven +50 = sterk, 0 tot +50 = matig, onder 0 = zorgwekkend.${flagMismatch ? ' LET OP: lage AI-vraag-rate maakt deze score niet representatief.' : ''}`}
        />
        <ScorePill
          label="Rapportcijfer"
          subtitle="1 tot 10 · boven 8 = goed"
          techterm="Osat"
          value={formatOsat(data.cc_osat_avg)}
          variant={flagMismatch ? 'grey' : osatClass(data.cc_osat_avg)}
          tooltip={`Overall Satisfaction — gemiddeld rapportcijfer van klanten op 'Hoe tevreden bent u over de helpdesk?'. Schaal 1-10. Boven 8 = goed, 7-8 = neutraal, onder 7 = aandachtspunt.${flagMismatch ? ' LET OP: lage AI-vraag-rate maakt deze score niet representatief.' : ''}`}
        />
      </div>

      {/* 5 sub-drivers */}
      <div className="grid grid-cols-5 gap-1.5">
        {KLANTSCORE_DRIVER_KEYS.map((k) => (
          <div key={k} className="text-center" title={KLANTSCORE_DRIVER_TOOLTIPS[k]}>
            <div className="text-[9px] uppercase tracking-wider text-[var(--muted)] mb-1 cursor-help">
              {KLANTSCORE_DRIVER_LABELS[k]}
            </div>
            <div
              className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${
                KLANTSCORE_COLOR_CLASS[
                  flagMismatch ? 'grey' : driverScoreClass(data.drivers[k]?.avg)
                ]
              }`}
            >
              {formatOsat(data.drivers[k]?.avg)}
            </div>
          </div>
        ))}
      </div>

      {/* AI-detectie footer — feitelijke ratio (compact) */}
      <div className="mt-3 pt-3 border-t border-[var(--border)]/60 flex items-center gap-3 flex-wrap">
        <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--sure-teal-900)]">
          AI-detectie · Enquête actief gevraagd
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-bold border ${
            KLANTSCORE_COLOR_CLASS[askLooksLow ? 'red' : enqAskPct < 30 ? 'amber' : 'green']
          }`}
        >
          {enqAskPct}%
        </span>
        <span className="text-[10px] text-[var(--muted)]">
          ({enqAsked} van {agent.nCallsTotal} calls in scope)
        </span>
      </div>
    </div>
  );
}

function ScorePill({
  label,
  subtitle,
  techterm,
  value,
  variant,
  tooltip,
}: {
  label: string;
  subtitle?: string;
  techterm?: string;
  value: string;
  variant: 'green' | 'amber' | 'red' | 'grey';
  tooltip?: string;
}) {
  return (
    <div className="flex flex-col items-end cursor-help" title={tooltip}>
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold leading-tight">
        {label}
        {techterm && <span className="ml-1 normal-case text-[9px] text-[var(--grey)] font-normal">({techterm})</span>}
      </div>
      <div className="flex items-baseline gap-2 mt-0.5">
        <span className={`px-2.5 py-1 rounded text-sm font-bold border ${KLANTSCORE_COLOR_CLASS[variant]}`}>
          {value}
        </span>
      </div>
      {subtitle && (
        <div className="text-[9px] italic text-[var(--muted)] mt-0.5">{subtitle}</div>
      )}
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
