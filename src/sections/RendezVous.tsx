import { useMemo } from "react";
import { EditableText } from "../components/edit/EditableText";
import { useTarifs } from "../hooks/useTarifs";
import type { Content } from "../i18n";
import { CalendrierOuvert } from "../components/widgets/CalendrierOuvert";
import { Reveal } from "../components/motion/Reveal";
import { tx, useLangue } from "../i18n/tx";

const CIBLE = "/client?onglet=reservations";

/** La page « Prendre rendez-vous » : le calendrier ouvert d'abord, parce que c'est lui qu'on
 *  vient chercher, puis les soins ouverts à la réservation, puis les trois temps du parcours,
 *  chacun dans beaucoup d'air. Aucune image : la page est un carnet, pas une affiche. */
export const RendezVous = ({ content }: { content: Content["sections"]["rendezvous"]; general: Content["general"] }) => {
  const lang = useLangue();
  const { tarifs, loading } = useTarifs();
  const consultations = useMemo(() => tarifs.filter((t) => t.active && t.category === "consultation"), [tarifs]);

  return (
    <div className="space-y-24 md:space-y-32">
      <Reveal>
        <CalendrierOuvert cible={CIBLE} libelleBouton="Investir sur mon bien-être" />
      </Reveal>

      {!loading && consultations.length > 0 && (
        <Reveal>
          <section aria-label={tx(lang, "Soins ouverts à la réservation")}>
            <p className="ed-kicker mb-8"><EditableText as="span" contentKey="rendezvous.soins-ouverts-a-la-reservation" defaultValue={"Soins ouverts à la réservation"} /></p>
            <ul className="border-t border-ink/10 dark:border-white/10">
              {consultations.map((c) => (
                <li key={c.id} className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-2 py-7 border-b border-ink/10 dark:border-white/10 items-baseline">
                  <span className="md:col-span-5 font-serif text-2xl md:text-3xl font-light text-ink dark:text-stone-100">{c.name}</span>
                  <span className="md:col-span-5 font-serif text-lg leading-relaxed text-ink/60 dark:text-stone-400">{c.description}</span>
                  <span className="md:col-span-2 md:text-right font-sans text-xs uppercase tracking-[0.18em] text-rust">
                    {c.price.toFixed(0)} $
                    {c.durationMin ? <span className="block mt-1 text-ink/45 dark:text-stone-500">{c.durationMin} min</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section aria-label={tx(lang, "Le parcours")}>
          <p className="ed-kicker mb-8"><EditableText as="span" contentKey="rendezvous.le-parcours" defaultValue={"Le parcours"} /></p>
          <ol className="border-t border-ink/10 dark:border-white/10">
            {content.etapes.map((_e, i) => (
              <li key={i} className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-2 py-7 border-b border-ink/10 dark:border-white/10">
                <span className="md:col-span-5 font-serif text-2xl md:text-3xl font-light leading-tight text-ink dark:text-stone-100"><EditableText i18n={`sections.rendezvous.etapes.${i}.titre`} /></span>
                <span className="md:col-span-7 font-serif text-lg leading-relaxed text-ink/65 dark:text-stone-300"><EditableText i18n={`sections.rendezvous.etapes.${i}.texte`} /></span>
              </li>
            ))}
          </ol>
          <p className="mt-10 max-w-2xl font-serif text-lg leading-relaxed text-ink/65 dark:text-stone-300">
            <EditableText as="span" contentKey="rendezvous.le-paiement-se-fait-par" defaultValue={"Le paiement se fait par virement Interac à"} />{" "}
            <a href="mailto:territoireincarne@gmail.com" className="text-rust underline underline-offset-4">territoireincarne@gmail.com</a>
            <EditableText as="span" contentKey="rendezvous.ou-par-carte-quand-la" defaultValue={", ou par carte quand la caisse en ligne est ouverte."} />
          </p>
        </section>
      </Reveal>
    </div>
  );
};
