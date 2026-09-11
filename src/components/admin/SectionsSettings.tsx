import { Card, SectionTitle } from "./sections";
import { useSections, setSectionHidden } from "../../hooks/useSections";
import { SECTIONS_ETEIGNABLES, type SectionId } from "../../types";
import { getContent } from "../../i18n";

/** Paramètres › Sections du site : chaque section s'allume ou s'éteint d'un geste. Une section
 *  éteinte disparaît du sommaire, de l'en-tête, du pied de page et répond 404 à son adresse. */
export const SectionsSettings = () => {
  const { hidden, loading } = useSections();
  const t = getContent("fr");
  const libelle = (id: SectionId) => (id === "rendezvous" ? "Prendre rendez-vous" : t.nav[id]);

  return (
    <Card className="p-6">
      <SectionTitle>Sections du site</SectionTitle>
      <p className="text-sm font-serif opacity-80 leading-relaxed mb-5">
        Éteignez une section que vous ne voulez pas montrer pour l'instant, la boutique par exemple. Elle
        disparaît du site sur-le-champ et revient quand vous la rallumez, avec tout son contenu.
      </p>
      <ul className="divide-y divide-ink/10 dark:divide-white/10">
        {SECTIONS_ETEIGNABLES.map((id) => {
          const allumee = !hidden.has(id);
          return (
            <li key={id} className="flex items-center justify-between gap-4 py-3">
              <span className="font-serif text-lg">{libelle(id)}</span>
              <button
                type="button"
                role="switch"
                aria-checked={allumee}
                aria-label={`${libelle(id)} : ${allumee ? "visible" : "cachée"}`}
                disabled={loading}
                onClick={() => setSectionHidden(id, allumee, hidden)}
                className={`relative w-14 h-8 rounded-full transition-colors ${allumee ? "bg-rust" : "bg-stone-300 dark:bg-stone-600"}`}
              >
                <span className={`absolute top-1 w-6 h-6 rounded-full bg-paper shadow transition-transform ${allumee ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
