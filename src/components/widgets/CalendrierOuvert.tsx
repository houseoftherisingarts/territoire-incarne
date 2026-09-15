import { useMemo, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import type { AvailabilitySlot } from "../../types/calendar";
import { addDays, combineMontrealDateTime, dayOfWeekMontreal, fmtTime, halfHourSlots, isoDate } from "../../lib/datetime";
import { locale, tx, useLangue } from "../../i18n/tx";

const HORIZON_JOURS = 60;
const DUREE = 60;
const JOURS = { fr: ["D", "L", "M", "M", "J", "V", "S"], en: ["S", "M", "T", "W", "T", "F", "S"] };

const addMin = (hhmm: string, min: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + min;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/** Les heures ouvertes d'un jour donné, d'après les plages qu'Élise tient dans son calendrier. */
const heuresDuJour = (plages: AvailabilitySlot[], jour: Date, maintenant: Date): Date[] => {
  const cle = isoDate(jour);
  const numero = dayOfWeekMontreal(jour);
  const fenetres = plages.filter(
    (p) => p.active && (p.category ?? "consultation") === "consultation" && (p.recurring ? p.dayOfWeek === numero : p.date === cle),
  );
  const heures: Date[] = [];
  for (const f of fenetres) {
    let curseur = f.startTime;
    while (curseur < f.endTime) {
      const fin = addMin(curseur, DUREE);
      if (fin <= f.endTime && halfHourSlots().includes(fin)) {
        const debut = combineMontrealDateTime(cle, curseur);
        if (debut > maintenant) heures.push(debut);
      }
      curseur = addMin(curseur, 30);
    }
  }
  return heures.sort((a, b) => a.getTime() - b.getTime());
};

interface Props {
  /** Où mène le choix d'une heure : l'espace personnel, avec le jour et l'heure dans l'adresse. */
  cible: string;
  libelleBouton: string;
}

/** Le calendrier ouvert, à la manière de Calendly : le mois à gauche, les jours où Élise reçoit
 *  marqués d'un point, et à droite les heures du jour choisi. Choisir une heure ouvre l'espace
 *  personnel, où le rendez-vous se confirme une fois le compte créé. */
export const CalendrierOuvert = ({ cible, libelleBouton }: Props) => {
  const lang = useLangue();
  const { items: plages, loading } = useFirestoreCollection<AvailabilitySlot>("availability");
  const [decalageMois, setDecalageMois] = useState(0);
  const [jourChoisi, setJourChoisi] = useState<string | null>(null);
  const maintenant = useMemo(() => new Date(), []);
  const moisLong = useMemo(() => new Intl.DateTimeFormat(locale(lang), { month: "long", year: "numeric", timeZone: "America/Montreal" }), [lang]);
  const jourLong = useMemo(() => new Intl.DateTimeFormat(locale(lang), { weekday: "long", day: "numeric", month: "long", timeZone: "America/Montreal" }), [lang]);

  /** Les jours ouverts sur l'horizon, indexés par leur clé ISO. */
  const ouverts = useMemo(() => {
    const out = new Map<string, Date[]>();
    for (let i = 0; i < HORIZON_JOURS; i += 1) {
      const jour = addDays(maintenant, i);
      const heures = heuresDuJour(plages, jour, maintenant);
      if (heures.length > 0) out.set(isoDate(jour), heures);
    }
    return out;
  }, [plages, maintenant]);

  const premierOuvert = useMemo(() => Array.from(ouverts.keys())[0] ?? null, [ouverts]);
  const actif = jourChoisi ?? premierOuvert;

  /** La grille du mois affiché : six semaines à partir du dimanche qui précède le premier. */
  const mois = useMemo(() => {
    const ancre = new Date(maintenant);
    ancre.setMonth(ancre.getMonth() + decalageMois, 1);
    const [y, m] = isoDate(ancre).split("-").map(Number);
    const premier = new Date(Date.UTC(y, m - 1, 1, 12));
    const depart = addDays(premier, -dayOfWeekMontreal(premier));
    const cases: { cle: string; numero: number; dansLeMois: boolean }[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = addDays(depart, i);
      const cle = isoDate(d);
      cases.push({ cle, numero: Number(cle.slice(8, 10)), dansLeMois: cle.slice(0, 7) === `${y}-${String(m).padStart(2, "0")}` });
    }
    return { titre: moisLong.format(ancre), cases };
  }, [maintenant, decalageMois, moisLong]);

  if (loading) return null;

  if (ouverts.size === 0) {
    return (
      <p className="font-serif text-lg text-ink/60 dark:text-stone-400">
        {tx(lang, "Aucune plage n'est ouverte pour l'instant. Écrivez à Elise depuis votre espace et elle vous proposera un moment.")}
      </p>
    );
  }

  const heures = actif ? ouverts.get(actif) ?? [] : [];
  const jourActif = actif ? combineMontrealDateTime(actif, "12:00") : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
      {/* Le mois */}
      <div className="lg:col-span-6">
        <div className="flex items-center justify-between mb-6">
          <p className="font-serif text-2xl text-ink dark:text-stone-100 first-letter:uppercase">{mois.titre}</p>
          <div className="flex items-center gap-1">
            <button type="button" aria-label={tx(lang, "Mois précédent")} disabled={decalageMois === 0} onClick={() => setDecalageMois((d) => Math.max(0, d - 1))} className="w-11 h-11 flex items-center justify-center rounded-full border border-ink/15 dark:border-white/15 disabled:opacity-30 hover:border-rust hover:text-rust transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button type="button" aria-label={tx(lang, "Mois suivant")} disabled={decalageMois >= 1} onClick={() => setDecalageMois((d) => Math.min(1, d + 1))} className="w-11 h-11 flex items-center justify-center rounded-full border border-ink/15 dark:border-white/15 disabled:opacity-30 hover:border-rust hover:text-rust transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center">
          {JOURS[lang].map((j, i) => (
            <span key={i} className="font-sans text-xs uppercase tracking-[0.18em] text-ink/45 dark:text-stone-500 pb-2">{j}</span>
          ))}
          {mois.cases.map((c) => {
            const ouvert = ouverts.has(c.cle);
            const choisi = c.cle === actif;
            return (
              <button
                key={c.cle}
                type="button"
                disabled={!ouvert}
                onClick={() => setJourChoisi(c.cle)}
                aria-pressed={choisi}
                className={`relative mx-auto w-11 h-11 flex items-center justify-center rounded-full font-serif text-lg transition-colors ${
                  !c.dansLeMois ? "opacity-25" : ""
                } ${choisi ? "bg-rust text-paper" : ouvert ? "text-ink dark:text-stone-100 hover:bg-rust/10" : "text-ink/35 dark:text-stone-600 cursor-default"}`}
              >
                {c.numero}
                {ouvert && !choisi && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-rust" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Les heures du jour choisi */}
      <div className="lg:col-span-6 lg:border-l lg:pl-16 border-ink/10 dark:border-white/10">
        <p className="ed-kicker mb-2">{tx(lang, "Heures ouvertes")}</p>
        <p className="font-serif text-2xl text-ink dark:text-stone-100 first-letter:uppercase mb-6">
          {jourActif ? jourLong.format(jourActif) : ""}
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {heures.map((h) => {
            const hhmm = fmtTime(h);
            return (
              <li key={h.toISOString()}>
                <a
                  href={`${cible}&jour=${actif}&heure=${encodeURIComponent(hhmm)}`}
                  className="flex items-center justify-center min-h-[48px] border border-ink/20 dark:border-white/20 font-sans text-xs uppercase tracking-[0.16em] text-ink/80 dark:text-stone-200 hover:bg-rust hover:border-rust hover:text-paper transition-colors"
                >
                  {hhmm}
                </a>
              </li>
            );
          })}
        </ul>
        <a
          href={cible}
          className="mt-10 inline-flex items-center gap-3 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] pl-7 pr-2 rounded-full hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
        >
          {tx(lang, libelleBouton)}
          <span className="w-9 h-9 rounded-full bg-paper/15 flex items-center justify-center"><ArrowUpRight size={16} /></span>
        </a>
        <p className="mt-3 font-serif text-base text-ink/55 dark:text-stone-400">
          {tx(lang, "L'heure choisie se confirme dans votre espace, une fois le compte ouvert.")}
        </p>
      </div>
    </div>
  );
};
