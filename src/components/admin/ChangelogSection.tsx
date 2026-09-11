import { JOURNAL, nombreEtapes } from "../../lib/changelog";
import { Card } from "./sections";

const enClair = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${d} ${mois[m - 1]} ${y}`;
};

export const ChangelogSection = () => (
  <div className="space-y-6 animate-[fadeIn_0.6s_ease-out]">
    <div className="grid grid-cols-3 gap-4">
      <Card className="p-4">
        <p className="text-2xl font-light">{JOURNAL.length}</p>
        <p className="font-sans text-[10px] uppercase tracking-widest opacity-50 mt-1">Journées de travail</p>
      </Card>
      <Card className="p-4">
        <p className="text-2xl font-light">{nombreEtapes()}</p>
        <p className="font-sans text-[10px] uppercase tracking-widest opacity-50 mt-1">Choses livrées</p>
      </Card>
      <Card className="p-4">
        <p className="text-2xl font-light">{enClair(JOURNAL[JOURNAL.length - 1].date)}</p>
        <p className="font-sans text-[10px] uppercase tracking-widest opacity-50 mt-1">Depuis le</p>
      </Card>
    </div>

    <ol className="relative border-l border-ink/10 dark:border-white/10 space-y-8 pl-6">
      {JOURNAL.map((entree, i) => (
        <li key={entree.date} className="relative">
          <span
            className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full ${i === 0 ? "bg-rust" : "bg-stone-300 dark:bg-stone-600"}`}
            aria-hidden="true"
          />
          <p className="font-sans text-[10px] uppercase tracking-widest opacity-50">{enClair(entree.date)}</p>
          <h3 className="font-serif text-xl mt-1">{entree.titre}</h3>
          <p className="font-serif text-sm opacity-70 mt-1.5 leading-relaxed">{entree.intro}</p>
          <ul className="mt-3 space-y-1.5">
            {entree.etapes.map((e, j) => (
              <li key={j} className="font-sans text-sm flex items-start gap-2">
                <span className="text-rust mt-1.5 shrink-0">·</span> {e}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  </div>
);
