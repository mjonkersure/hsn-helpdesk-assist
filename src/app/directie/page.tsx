import { Header } from '@/components/Header';
import { Banner } from '@/components/Banner';
import { FilterBar } from '@/components/FilterBar';
import { KpiCard } from '@/components/KpiCard';
import { MatrixTable } from '@/components/MatrixTable';
import { getDashboardData, pct } from '@/lib/data';

export default function DirectiePage() {
  const data = getDashboardData();
  const { team, agents } = data;

  // KPI berekeningen
  const teamAI = team.aiTotal || 0;
  const agentsWithNps = agents.filter((a) => a.npsAvg !== null && a.npsAvg !== undefined);
  const avgNps =
    agentsWithNps.length > 0
      ? agentsWithNps.reduce((s, a) => s + (a.npsAvg as number), 0) / agentsWithNps.length
      : 0;
  const opgelostJa = team.opgelost.ja || 0;
  const opgelostTotal = Object.values(team.opgelost).reduce((s, v) => s + v, 0);
  const herhaalPct = pct(team.nCallsHerhaal, team.nCallsNieuw + team.nCallsHerhaal);

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-6 space-y-6">
        <Banner
          variant="directie"
          deelLabel="Voor de directie"
          title="Ot Ciolina — strategisch overzicht"
          whoNote="Big picture, KPI-niveau, geen individuele namen"
        />

        <FilterBar showDossier={false} />

        {/* KPI cards */}
        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)] mb-3">
            Kerncijfers
            <span className="ml-2 text-[var(--grey)] normal-case font-normal tracking-normal">
              — team-totaal deze maand
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="AI-score gemiddeld"
              value={`${Math.round(teamAI * 100)}%`}
              sub="gemiddelde over 7 detecteerbare criteria · 5 medewerkers"
              color={teamAI >= 0.75 ? 'green' : teamAI >= 0.4 ? 'amber' : 'red'}
            />
            <KpiCard
              label="Klantscore NPS"
              value={`${avgNps > 0 ? '+' : ''}${Math.round(avgNps)}`}
              sub="gewogen NPS Q1 2026 over alle types"
              color={avgNps >= 50 ? 'green' : avgNps >= 0 ? 'amber' : 'red'}
            />
            <KpiCard
              label="First-call resolution"
              value={`${pct(opgelostJa, opgelostTotal)}%`}
              sub='opgelost in eerste call · groot deel "deels"'
              color={opgelostJa / opgelostTotal >= 0.2 ? 'green' : 'amber'}
            />
            <KpiCard
              label="Herhaalverkeer"
              value={`${herhaalPct}%`}
              sub="van inbound · kostendrijver volgens analyse"
              color={herhaalPct >= 50 ? 'red' : herhaalPct >= 30 ? 'amber' : 'green'}
            />
          </div>
        </section>

        {/* Team matrix */}
        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)] mb-3">
            Ot&apos;s matrix
            <span className="ml-2 text-[var(--grey)] normal-case font-normal tracking-normal">
              — team-totaal, telefoon gesplitst in 1e contact / opvolging
            </span>
          </h2>
          <div className="bg-white border border-[var(--border)] rounded-lg p-6">
            <MatrixTable data={team} drivers={data.drivers} />
          </div>
        </section>

        {/* Exec bullets */}
        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)] mb-3">
            Wat opvalt
            <span className="ml-2 text-[var(--grey)] normal-case font-normal tracking-normal">
              — groei-kansen en aandachtspunten
            </span>
          </h2>
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <ul className="space-y-2">
              <Bullet>
                <strong>Het fundament staat.</strong> Elke activiteit (telefoon 1e contact, telefoon
                opvolging, mail straks, app later) wordt gescoord op dezelfde 9 drivers — de
                &quot;acculader&quot; uit het 5-juni-gesprek.
              </Bullet>
              <Bullet>
                <strong>Daniel&apos;s NPS Support −37 is geen ruis.</strong> AI ziet hetzelfde
                patroon: Empathie en Aandachtig luisteren beide rood. Drie onafhankelijke signalen —
                klant, audio-beluister door Eddy, tekst-detectie — wijzen dezelfde kant op.
              </Bullet>
              <Bullet>
                <strong>Reno scoort hoger bij klant dan in driver-detectie.</strong> Zijn waarde
                zit deels in inhoudelijk-sterke uitleg die de huidige drivers niet meten. De 14
                extra drivers van Eddy zouden hier verschil moeten maken.
              </Bullet>
              <Bullet>
                <strong>Arshad heeft de hoogste NPS Support (+87)</strong> van de 5 met data — bij
                volgende beluister-ronde zijn drivers analyseren om te zien wat hij anders doet dan
                Daniel.
              </Bullet>
              <Bullet>
                <strong>Mail- en App-kanaal nog leeg.</strong> Mail is ~2/3 van het werk volgens jou.
                BCC-koppeling vanuit Salesforce naar onze database is de snelste route.
              </Bullet>
              <Bullet>
                <strong>7 van 12 medewerkers werken via Teams</strong> — voor hen kunnen we voorlopig
                niets meten. Aparte Teams-pipeline overwegen.
              </Bullet>
            </ul>
          </div>
        </section>

        {/* Belofte */}
        <section>
          <div className="bg-[var(--sure-teal-900)] text-white rounded-lg p-6">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-[var(--sure-orange)] mb-2">
              De belofte van deze tool
            </h3>
            <p className="text-sm leading-relaxed">
              Dit dashboard is van de medewerker zelf. AI is een coach, geen meting. Eerste 90 dagen
              geen consequenties. KPI&apos;s stijgen omdat de medewerker zelf elke dag een klein
              ding verbetert — niet omdat we hem afrekenen. De cijfers hierboven zijn een gevolg,
              geen doel.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="pl-6 relative text-sm leading-relaxed">
      <span className="absolute left-0 top-2 w-2.5 h-2.5 bg-[var(--sure-orange)] rounded-full" />
      {children}
    </li>
  );
}
