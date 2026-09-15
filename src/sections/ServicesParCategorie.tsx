import { useMemo, useState } from "react";
import { ArrowUpRight, Clock } from "lucide-react";
import { useTarifs, type Tarif } from "../hooks/useTarifs";
import { InterventionRequestModal } from "../components/widgets/InterventionRequestModal";
import { INTERVENTION_CONFIGS } from "../lib/interventionFields";
import type { InterventionCategory } from "../lib/interventionFields";
import { EditableText } from "../components/edit/EditableText";
import { Reveal } from "../components/motion/Reveal";
import { locale, tx, useLangue } from "../i18n/tx";
import type { Lang } from "../types";

const prix = (lang: Lang, n: number) =>
  n === 0 ? tx(lang, "Sur demande") : n.toLocaleString(locale(lang), { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

interface Props {
  /** La catégorie de tarifs affichée, gérée depuis Consultations dans l'admin. */
  categorie: Tarif["category"];
  /** La clé du texte long, pour qu'Élise le récrive en ligne. */
  cleTexte: string;
  texteParDefaut: string;
  /** Le formulaire ouvert par le bouton, parmi ceux déjà écrits. */
  demande: InterventionCategory;
  /** Vrai quand le texte s'affiche ailleurs sur la page (l'ouverture vidéo de l'éducation sexuelle). */
  sansTexte?: boolean;
}

/** Une page de services : le texte d'Élise, les offres de la catégorie telles qu'elle les
 *  tient dans son admin, et la porte pour la rejoindre. L'intro se lit déjà dans l'en-tête
 *  commun (DetailView), donc elle ne se répète pas ici. */
export const ServicesParCategorie = ({ categorie, cleTexte, texteParDefaut, demande, sansTexte = false }: Props) => {
  const { tarifs, loading } = useTarifs();
  const lang = useLangue();
  const [ouvert, setOuvert] = useState(false);
  const config = INTERVENTION_CONFIGS[demande];

  const offres = useMemo(
    () => tarifs.filter((t) => t.active && t.category === categorie),
    [tarifs, categorie],
  );

  return (
    <div className="w-full">
      {!sansTexte && (
        <div className="max-w-3xl font-serif text-xl leading-relaxed text-ink/75 dark:text-stone-300">
          <EditableText as="p" contentKey={cleTexte} defaultValue={texteParDefaut} />
        </div>
      )}

      {!loading && offres.length > 0 && (
        <ul className={`${sansTexte ? "" : "mt-14"} border-t border-ink/10 dark:border-white/10`}>
          {offres.map((o, i) => (
            <Reveal key={o.id} delay={i * 0.04}>
              <li className="border-b border-ink/10 dark:border-white/10 py-7 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-3 items-baseline">
                <div className="md:col-span-5">
                  <h3 className="font-serif text-2xl md:text-3xl font-light leading-tight text-ink dark:text-stone-100">{o.name}</h3>
                  {o.shortTag && (
                    <p className="mt-2 font-sans text-xs uppercase tracking-[0.18em] text-rust">{o.shortTag}</p>
                  )}
                </div>
                <p className="md:col-span-5 font-serif text-lg leading-relaxed text-ink/65 dark:text-stone-300">{o.description}</p>
                <div className="md:col-span-2 md:text-right font-sans text-xs uppercase tracking-[0.18em] text-rust">
                  {prix(lang, o.price)}
                  {o.durationMin ? (
                    <span className="mt-1 flex md:justify-end items-center gap-1.5 text-ink/45 dark:text-stone-500">
                      <Clock size={12} /> {o.durationMin} min
                    </span>
                  ) : null}
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      )}

      <div className="mt-14">
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="inline-flex items-center gap-3 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] pl-7 pr-2 rounded-full hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
        >
          <EditableText contentKey={`formulaire.${config.id}.cta`} defaultValue={config.ctaLabel} />
          <span className="w-9 h-9 rounded-full bg-paper/15 flex items-center justify-center"><ArrowUpRight size={16} /></span>
        </button>
        {config.ctaSubtitle && (
          <p className="mt-3 font-sans text-xs uppercase tracking-[0.18em] text-ink/50 dark:text-stone-400"><EditableText contentKey={`formulaire.${config.id}.cta-sous`} defaultValue={config.ctaSubtitle ?? ""} /></p>
        )}
      </div>

      {ouvert && <InterventionRequestModal config={config} onClose={() => setOuvert(false)} />}
    </div>
  );
};
