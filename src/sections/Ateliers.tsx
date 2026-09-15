import { useEffect, useState } from "react";
import { EditableText } from "../components/edit/EditableText";
import { ArrowUpRight, Clock, MapPin, Users } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { Content } from "../i18n";
import type { Atelier } from "../components/admin/AteliersAdminSection";
import { InterventionRequestModal } from "../components/widgets/InterventionRequestModal";
import { INTERVENTION_CONFIGS } from "../lib/interventionFields";
import { Reveal } from "../components/motion/Reveal";

const useAteliers = () => {
  const [items, setItems] = useState<Atelier[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "ateliers"), where("publie", "==", true));
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Atelier))
          .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)),
      );
      setLoading(false);
    });
  }, []);
  return { items, loading };
};

/** La page Ateliers : le répertoire de ce qu'Élise anime, et la porte pour l'inviter.
 *  Le formulaire est celui des interventions éducatives, déjà écrit dans ses mots.
 *  L'intro se lit déjà dans l'en-tête commun (DetailView), donc elle ne se répète pas ici. */
export const Ateliers = (_props: { content: Content["sections"]["ateliers"] }) => {
  const { items, loading } = useAteliers();
  const [demande, setDemande] = useState(false);
  const config = INTERVENTION_CONFIGS.education;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setDemande(true)}
        className="inline-flex items-center gap-3 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] pl-7 pr-2 rounded-full hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
      >
        <EditableText contentKey={`formulaire.${config.id}.cta`} defaultValue={config.ctaLabel} />
        <span className="w-9 h-9 rounded-full bg-paper/15 flex items-center justify-center"><ArrowUpRight size={16} /></span>
      </button>
      {config.ctaSubtitle && (
        <p className="mt-3 font-sans text-xs uppercase tracking-[0.18em] text-ink/50 dark:text-stone-400"><EditableText contentKey={`formulaire.${config.id}.cta-sous`} defaultValue={config.ctaSubtitle ?? ""} /></p>
      )}

      {!loading && items.length > 0 && (
        <ul className="mt-14 border-t border-ink/10 dark:border-white/10">
          {items.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.04}>
              <li className="border-b border-ink/10 dark:border-white/10 py-8 md:py-10 grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-4">
                <div className="md:col-span-5">
                  <h3 className="ed-display text-3xl md:text-4xl text-ink dark:text-stone-100">{a.titre}</h3>
                  {a.chapeau && (
                    <p className="mt-3 font-serif text-lg leading-snug text-ink/65 dark:text-stone-300">{a.chapeau}</p>
                  )}
                </div>
                <div className="md:col-span-7">
                  {a.description && (
                    <p className="font-serif text-xl leading-relaxed text-ink/80 dark:text-stone-200 whitespace-pre-line">
                      {a.description}
                    </p>
                  )}
                  {(a.duree || a.format || a.pourQui) && (
                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-xs uppercase tracking-[0.18em] text-ink/55 dark:text-stone-400">
                      {a.duree && <span className="inline-flex items-center gap-2"><Clock size={14} /> {a.duree}</span>}
                      {a.format && <span className="inline-flex items-center gap-2"><MapPin size={14} /> {a.format}</span>}
                      {a.pourQui && <span className="inline-flex items-center gap-2"><Users size={14} /> {a.pourQui}</span>}
                    </div>
                  )}
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      )}

      {demande && <InterventionRequestModal config={config} onClose={() => setDemande(false)} />}
    </div>
  );
};
