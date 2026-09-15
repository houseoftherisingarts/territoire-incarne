import { useMemo, useState } from "react";
import { ArrowUpRight, Clock } from "lucide-react";
import { useTarifs, type Tarif } from "../hooks/useTarifs";
import { InterventionRequestModal } from "../components/widgets/InterventionRequestModal";
import { INTERVENTION_CONFIGS } from "../lib/interventionFields";
import type { InterventionCategory } from "../lib/interventionFields";
import { EditableText } from "../components/edit/EditableText";
import { Reveal } from "../components/motion/Reveal";

const prix = (n: number) =>
  n === 0 ? "Sur demande" : n.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

interface Props {
  /** La catégorie de tarifs affichée, gérée depuis Consultations dans l'admin. */
  categorie: Tarif["category"];
  /** La clé du texte long, pour qu'Élise le récrive en ligne. */
  cleTexte: string;
  texteParDefaut: string;
  /** Le formulaire ouvert par le bouton, parmi ceux déjà écrits. */
  demande: InterventionCategory;
}

/** Une page de services : l'intro, le texte d'Élise, les offres de la catégorie
 *  telles qu'elle les tient dans son admin, et la porte pour la rejoindre. */
export const ServicesParCategorie = ({ intro, categorie, cleTexte, texteParDefaut, demande }: Props) => {
  const { tarifs, loading } = useTarifs();
  const [ouvert, setOuvert] = useState(false);
  const config = INTERVENTION_CONFIGS[demande];

  const offres = useMemo(
    () => tarifs.filter((t) => t.active && t.category === categorie),
    [tarifs, categorie],
  );

  return (
    <div className="w-full">
      <p className="max-w-3xl font-serif text-2xl md:text-3xl font-light leading-snug text-ink/85 dark:text-stone-200">
        {intro}
      </p>

      <div className="mt-8 max-w-3xl font-serif text-xl leading-relaxed text-ink/75 dark:text-stone-300">
        <EditableText as="p" contentKey={cleTexte} defaultValue={texteParDefaut} />
      </div>

      {!loading && offres.length > 0 && (
        <ul className="mt-14 border-t border-ink/10 dark:border-white/10">
          {offres.map((o, i) => (
            <Reveal key={o.id} delay={i * 0.04}>
              <li className="border-b border-ink/10 dark:border-white/10 py-7 grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-3 items-baseline">
                <h3 className="md:col-span-5 ed-display text-2xl md:text-3xl text-ink dark:text-stone-100">{o.name}</h3>
                <p className="md:col-span-5 font-serif text-lg leading-snug text-ink/65 dark:text-stone-300">{o.description}</p>
                <p className="md:col-span-2 md:text-right font-sans text-xs uppercase tracking-[0.18em] text-rust">
                  {prix(o.price)}
                  {o.durationMin ? (
                    <span className="block mt-1 text-ink/45 dark:text-stone-500">
                      <Clock size={12} className="inline mr-1" />{o.durationMin} min
                    </span>
                  ) : null}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="mt-12 inline-flex items-center gap-3 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] pl-7 pr-2 rounded-full hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
      >
        {config.ctaLabel}
        <span className="w-9 h-9 rounded-full bg-paper/15 flex items-center justify-center"><ArrowUpRight size={16} /></span>
      </button>

      {ouvert && <InterventionRequestModal config={config} onClose={() => setOuvert(false)} />}
    </div>
  );
};
