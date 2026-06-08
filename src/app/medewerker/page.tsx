import { Header } from '@/components/Header';
import { Banner } from '@/components/Banner';
import { FilterBar } from '@/components/FilterBar';
import { AgentCard } from '@/components/AgentCard';
import { getDashboardData } from '@/lib/data';

export default function MedewerkerPage() {
  const data = getDashboardData();

  // Voor MVP: toon alle medewerkers in volgorde van calls (meest data eerst)
  const sorted = [...data.agents].sort((a, b) => b.nCallsTotal - a.nCallsTotal);

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
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
