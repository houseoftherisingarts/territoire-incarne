import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { useTarifs } from "../hooks/useTarifs";
import type { Content } from "../i18n";

const CIBLE = "/client?onglet=reservations";

/** La page « Prendre rendez-vous » : les trois temps, les soins ouverts à la réservation avec leur
 *  prix, et le geste unique qui ouvre le calendrier dans l'espace personnel. */
export const RendezVous = ({ content, general }: { content: Content["sections"]["rendezvous"]; general: Content["general"] }) => {
  const { tarifs, loading } = useTarifs();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const consultations = useMemo(() => tarifs.filter((t) => t.active && t.category === "consultation"), [tarifs]);

  return (
    <div className="space-y-16">
      <ol className="border-t border-ink/10 dark:border-white/10">
        {content.etapes.map((e, i) => (
          <li key={i} className="grid grid-cols-12 gap-x-4 md:gap-x-8 py-6 border-b border-ink/10 dark:border-white/10">
            <span className="col-span-2 md:col-span-1 font-serif text-base text-rust">0{i + 1}</span>
            <span className="col-span-10 md:col-span-4 font-serif text-2xl md:text-3xl font-light leading-tight">{e.titre}</span>
            <span className="col-span-10 col-start-3 md:col-span-7 md:col-start-6 mt-2 md:mt-1 font-serif text-lg leading-relaxed text-ink/70 dark:text-stone-300">{e.texte}</span>
          </li>
        ))}
      </ol>

      {!loading && consultations.length > 0 && (
        <div>
          <p className="ed-kicker mb-6">Soins ouverts à la réservation</p>
          <ul className="border-t border-ink/10 dark:border-white/10">
            {consultations.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5 border-b border-ink/10 dark:border-white/10">
                <span className="font-serif text-2xl font-light">{c.name}</span>
                <span className="font-serif text-lg text-rust">
                  {c.price.toFixed(0)} $
                  {c.durationMin ? <span className="text-ink/50 dark:text-stone-400"> · {c.durationMin} min</span> : null}
                </span>
                {c.description && <p className="w-full font-serif text-base text-ink/60 dark:text-stone-400 leading-relaxed mt-1">{c.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="font-serif text-lg leading-relaxed text-ink/70 dark:text-stone-300 max-w-2xl">
        Le paiement se fait par virement Interac à{" "}
        <a href="mailto:territoireincarne@gmail.com" className="text-rust underline">territoireincarne@gmail.com</a>,
        ou par carte quand la caisse en ligne est ouverte.
      </p>

      <div className="flex flex-wrap items-center gap-5">
        <a
          href={CIBLE}
          className="inline-flex items-center gap-3 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[56px] pl-8 pr-2 rounded-full hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
        >
          {content.ouvrirEspace}
          <span className="w-10 h-10 rounded-full bg-paper/15 flex items-center justify-center"><ArrowUpRight size={16} /></span>
        </a>
        <span className="font-sans text-xs uppercase tracking-[0.22em] opacity-50">
          {user ? general.myClientSpace : content.dejaUnCompte}
        </span>
      </div>
    </div>
  );
};
