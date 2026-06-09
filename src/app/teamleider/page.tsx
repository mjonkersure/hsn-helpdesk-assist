import { Header } from '@/components/Header';
import { Banner } from '@/components/Banner';
import { FilterBar } from '@/components/FilterBar';
import { MatrixTable } from '@/components/MatrixTable';
import { DriverOverviewTable } from '@/components/DriverOverviewTable';
import { TeamRanking } from '@/components/TeamRanking';
import { DriverLegenda } from '@/components/DriverLegenda';
import { KlantscoreTabel } from '@/components/KlantscoreTabel';
import { DriverComparisonChart } from '@/components/DriverComparisonChart';
import { getDashboardData } from '@/lib/data';
import { getKlantscores } from '@/lib/klantscores';

export default function TeamleiderPage() {
  const data = getDashboardData();
  const klantscores = getKlantscores();

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-6 space-y-6">
        <Banner
          variant="teamleider"
          deelLabel="Voor de teamleider"
          title="Kim Hillenaar — coaching-overzicht"
          whoNote="Aggregaten over het hele team, geen individuele coaching-tips"
        />

        <FilterBar />

        {/* Team-totaal matrix */}
        <Section
          title="Team-totaal"
          sub={`alle ${data.team.nCallsTotal} calls van 5 medewerkers met Webex-data, telefoon gesplitst`}
        >
          <div className="bg-white border border-[var(--border)] rounded-lg p-6">
            <MatrixTable
              data={data.team}
              drivers={data.drivers}
            />
          </div>
        </Section>

        {/* Driver-overzicht — alle medewerkers 1 rij per persoon */}
        <Section
          title="Driver-overzicht per medewerker"
          sub="alle kanalen bij elkaar, 1 rij per persoon"
        >
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <p className="text-xs italic text-[var(--muted)] mb-3">
              Telefoon-1e + telefoon-opvolging samengeteld. Mail en App nog geen pipeline.
              Cel = percentage van calls waar driver via patroon-detectie is gevonden.
            </p>
            <DriverOverviewTable data={data} klantscores={klantscores} />
          </div>
        </Section>

        {/* Vergelijking: AI-detectie gesprek vs Klant-rating CSAT */}
        <Section
          title="AI ziet versus klant ervaart"
          sub="5 gesprek-drivers (AI-detectie) naast 5 CSAT-sub-drivers (klant zelf)"
        >
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <p className="text-xs italic text-[var(--muted)] mb-3">
              Per medewerker, voor elk gesprek-driver ↔ CSAT-sub-driver paar: hoe vaak we het
              detecteren tegenover hoe de klant het in de enquête beoordeelt. Beide naar 0-100%
              geschaald zodat ze vergelijkbaar zijn.
            </p>
            <DriverComparisonChart data={data} klantscores={klantscores} />
          </div>
        </Section>

        {/* Klantscore-enquête — Renault CSAT */}
        <Section
          title="Klantscore-enquête"
          sub={`${klantscores.team.total_enquetes} klant-enquêtes year-to-date, gekoppeld via Salesforce`}
        >
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <p className="text-xs italic text-[var(--muted)] mb-3">
              Wat de klant zelf zegt in de Renault CSAT-enquête na het dossier — naast (en straks correleerbaar met) onze AI-gespreksdrivers.
            </p>
            <KlantscoreTabel data={klantscores} />
          </div>
        </Section>

        {/* Team-overzicht ranking */}
        <Section
          title="Team-overzicht"
          sub="alle 12 medewerkers, geen ranking-competitie"
        >
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <p className="text-xs italic text-[var(--muted)] mb-3">
              Niet bedoeld als competitief overzicht (Ed&apos;s punt: psychologisch effect).
              Doel: zien wie waar extra ondersteuning kan gebruiken.
            </p>
            <TeamRanking data={data} />
          </div>
        </Section>

        {/* Driver-uitleg legenda */}
        <Section title="Driver-uitleg" sub="wat meten we precies">
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <DriverLegenda data={data} />
          </div>
        </Section>
      </main>
    </>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)] mb-3">
        {title}
        {sub && <span className="ml-2 text-[var(--grey)] normal-case font-normal tracking-normal">— {sub}</span>}
      </h2>
      {children}
    </section>
  );
}
