import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import type { AvailabilitySlot } from "../../types/calendar";
import {
  addDays,
  combineMontrealDateTime,
  dayOfWeekMontreal,
  fmtTime,
  halfHourSlots,
  isoDate,
} from "../../lib/datetime";
import { locale, tx, useLangue } from "../../i18n/tx";

const JOURS_MONTRES = 14;
const DUREE_PAR_DEFAUT = 60;

const addMin = (hhmm: string, min: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + min;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

interface Jour {
  cle: string;
  libelle: string;
  heures: Date[];
}

/** L'horaire d'Élise, montré à ciel ouvert : les plages qu'elle a ouvertes dans son
 *  calendrier, jour par jour, sans rien demander à personne. La réservation elle-même
 *  se fait dans l'espace client, une fois le compte créé. */
export const ApercuHoraire = ({ onAller, libelleBouton }: { onAller: () => void; libelleBouton: string }) => {
  const lang = useLangue();
  const { items: plages, loading } = useFirestoreCollection<AvailabilitySlot>("availability");

  const jours = useMemo<Jour[]>(() => {
    const jourLong = new Intl.DateTimeFormat(locale(lang), { weekday: "long", day: "numeric", month: "long", timeZone: "America/Montreal" });
    const maintenant = new Date();
    const out: Jour[] = [];
    for (let i = 0; i < JOURS_MONTRES; i += 1) {
      const jour = addDays(maintenant, i);
      const cle = isoDate(jour);
      const numeroJour = dayOfWeekMontreal(jour);
      const fenetres = plages.filter(
        (p) =>
          p.active &&
          (p.category ?? "consultation") === "consultation" &&
          (p.recurring ? p.dayOfWeek === numeroJour : p.date === cle),
      );
      const heures: Date[] = [];
      for (const f of fenetres) {
        let curseur = f.startTime;
        while (curseur < f.endTime) {
          const fin = addMin(curseur, DUREE_PAR_DEFAUT);
          if (fin <= f.endTime && halfHourSlots().includes(fin)) {
            const debut = combineMontrealDateTime(cle, curseur);
            if (debut > maintenant) heures.push(debut);
          }
          curseur = addMin(curseur, 30);
        }
      }
      if (heures.length > 0) {
        out.push({
          cle,
          libelle: jourLong.format(jour),
          heures: heures.sort((a, b) => a.getTime() - b.getTime()).slice(0, 6),
        });
      }
    }
    return out.slice(0, 5);
  }, [plages, lang]);

  if (loading || jours.length === 0) return null;

  return (
    <section className="mt-16 border-t border-ink/10 dark:border-white/10 pt-10" aria-label={tx(lang, "Son horaire")}>
      <p className="ed-kicker">{tx(lang, "Son horaire")}</p>
      <h3 className="ed-display mt-3 text-3xl md:text-4xl text-ink dark:text-stone-100">
        {tx(lang, "Les prochaines heures ouvertes")}
      </h3>
      <ul className="mt-8 divide-y divide-ink/10 dark:divide-white/10 border-y border-ink/10 dark:border-white/10">
        {jours.map((j) => (
          <li key={j.cle} className="py-5 grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-3 items-baseline">
            <p className="md:col-span-4 font-serif text-xl text-ink dark:text-stone-100 first-letter:uppercase">
              {j.libelle}
            </p>
            <ul className="md:col-span-8 flex flex-wrap gap-2">
              {j.heures.map((h) => (
                <li
                  key={h.toISOString()}
                  className="min-h-[44px] px-4 flex items-center border border-ink/20 dark:border-white/20 font-sans text-xs uppercase tracking-[0.16em] text-ink/75 dark:text-stone-300"
                >
                  {fmtTime(h)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAller}
        className="mt-10 inline-flex items-center gap-3 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] pl-7 pr-2 rounded-full hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
      >
        {tx(lang, libelleBouton)}
        <span className="w-9 h-9 rounded-full bg-paper/15 flex items-center justify-center"><ArrowUpRight size={16} /></span>
      </button>
      <p className="mt-3 font-serif text-base text-ink/55 dark:text-stone-400">
        {tx(lang, "Vous choisissez l'heure qui vous convient une fois votre espace ouvert.")}
      </p>
    </section>
  );
};
