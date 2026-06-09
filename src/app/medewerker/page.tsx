import { Header } from '@/components/Header';
import { Banner } from '@/components/Banner';
import { FilterBar } from '@/components/FilterBar';
import { AgentCard } from '@/components/AgentCard';
import { getDashboardData } from '@/lib/data';
import { getKlantscores } from '@/lib/klantscores';

export default function MedewerkerPage() {
  const data = getDashboardData();
  const klantscores = getKlantscores();

  // Sorteer: medewerkers met klantscore-data of calls eerst, daarna lege kaarten
  const sorted = [...data.agents].sort((a, b) => {
    const aHas = (klantscores.by_agent[a.naam]?.total_enquetes ?? 0) + a.nCallsTotal;
    const bHas = (klantscores.by_agent[b.naam]?.total_enquetes ?? 0) + b.nCallsTotal;
    return bHas - aHas;
  });

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-6 space-y-6">
        <Banner
          variant="medewerker"
          deelLabel="Voor de medewerker"
          title="Mijn persoonlijke coaching-overzicht"
          whoNote="In productie ziet elke medewerker alleen zijn eigen card. Hier tonen we alle 12 als demo."
        />

        <FilterBar />

        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)] mb-3">
            Per medewerker
            <span className="ml-2 text-[var(--grey)] normal-case font-normal tracking-normal">
              — focus, tip, vorig gesprek + matrix + context
            </span>
          </h2>
          <div className="space-y-5">
            {sorted.map((agent) => (
              <AgentCard
                key={agent.naam}
                agent={agent}
                drivers={data.drivers}
                catLabels={data.catLabels}
                typeLabels={data.typeLabels}
                emoLabels={data.emoLabels}
                showPersonal
                klantscore={klantscores.by_agent[agent.naam]}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
