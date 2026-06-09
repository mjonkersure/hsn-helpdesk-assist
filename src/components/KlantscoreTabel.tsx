import type { KlantscoreData, KlantscoreDriverKey } from '@/types/data';
import { KLANTSCORE_DRIVER_LABELS } from '@/types/data';
import { osatClass, vocClass, driverScoreClass, formatVoc, formatOsat } from '@/lib/klantscores';

interface Props {
  data: KlantscoreData;
}

const COLOR_CLASS: Record<'green' | 'amber' | 'red' | 'grey', string> = {
  green: 'bg-[var(--green)]/15 text-[var(--green)]',
  amber: 'bg-[var(--amber)]/15 text-[var(--amber)]',
  red: 'bg-[var(--red)]/15 text-[var(--red)]',
  grey: 'bg-[var(--grey)]/15 text-[var(--grey)]',
};

const DRIVER_KEYS: KlantscoreDriverKey[] = ['ease', 'follow_up', 'listen', 'friendliness', 'clarity'];

function ScoreCell({
  value,
  variant,
}: {
  value: string;
  variant: 'green' | 'amber' | 'red' | 'grey';
}) {
  return (
    <span
      className={`inline-block min-w-[3rem] text-center px-2 py-1 rounded-md text-xs font-semibold ${COLOR_CLASS[variant]}`}
    >
      {value}
    </span>
  );
}

export function KlantscoreTabel({ data }: Props) {
  const agents = Object.entries(data.by_agent).sort(
    ([, a], [, b]) => b.total_enquetes - a.total_enquetes
  );

  return (
    <div className="space-y-4">
      {/* Team-totaal */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-sm">
        <div>
          <div className="text-xs text-[var(--muted)] uppercase tracking-wider">Team-totaal</div>
          <div className="font-semibold">{data.team.total_enquetes} enquêtes</div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted)] uppercase tracking-wider">VoC Index</div>
          <ScoreCell value={formatVoc(data.team.voc_index_avg)} variant={vocClass(data.team.voc_index_avg)} />
        </div>
        <div>
          <div className="text-xs text-[var(--muted)] uppercase tracking-wider">CC Osat</div>
          <ScoreCell value={formatOsat(data.team.cc_osat_avg)} variant={osatClass(data.team.cc_osat_avg)} />
        </div>
        {DRIVER_KEYS.map((k) => (
          <div key={k}>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wider">{KLANTSCORE_DRIVER_LABELS[k]}</div>
            <ScoreCell
              value={formatOsat(data.team.drivers[k]?.avg)}
              variant={driverScoreClass(data.team.drivers[k]?.avg)}
            />
          </div>
        ))}
      </div>

      {/* Per medewerker */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="text-left py-2 pr-3 font-semibold">Medewerker</th>
              <th className="text-right py-2 px-2 font-semibold">N</th>
              <th className="text-center py-2 px-2 font-semibold">VoC</th>
              <th className="text-center py-2 px-2 font-semibold">Osat</th>
              {DRIVER_KEYS.map((k) => (
                <th key={k} className="text-center py-2 px-2 font-semibold">
                  {KLANTSCORE_DRIVER_LABELS[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map(([naam, a]) => (
              <tr key={naam} className="border-b border-[var(--border)]/60 hover:bg-[var(--surface-muted)]">
                <td className="py-2 pr-3 font-medium">{naam}</td>
                <td className="py-2 px-2 text-right text-[var(--muted)]">{a.total_enquetes}</td>
                <td className="py-2 px-2 text-center">
                  <ScoreCell value={formatVoc(a.voc_index_avg)} variant={vocClass(a.voc_index_avg)} />
                </td>
                <td className="py-2 px-2 text-center">
                  <ScoreCell value={formatOsat(a.cc_osat_avg)} variant={osatClass(a.cc_osat_avg)} />
                </td>
                {DRIVER_KEYS.map((k) => (
                  <td key={k} className="py-2 px-2 text-center">
                    <ScoreCell value={formatOsat(a.drivers[k]?.avg)} variant={driverScoreClass(a.drivers[k]?.avg)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs italic text-[var(--muted)]">
        Bron: Salesforce CSAT-export (Claims + Request + Custom Support, year-to-date). Drivers zijn de
        klant-zelf-rating op 5 dimensies (1-10). VoC Index loopt van -100 tot +100.
      </p>
    </div>
  );
}
