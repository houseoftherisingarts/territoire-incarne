/* =========================================================================
   L'horaire d'un cours de groupe : quand la porte s'ouvre, quand elle se
   ferme, et jusqu'a quand la salle Daily doit vivre. Aucune dependance,
   donc verifiable par `node scripts/test-group-schedule.ts`.
   ========================================================================= */

export interface Seance {
  id: string;
  titre: string;
  /** Instant complet en ISO (ex. 2026-09-10T23:00:00.000Z). */
  debut: string;
  /** Duree en minutes. */
  duree: number;
}

/** La porte s'ouvre un quart d'heure avant l'heure dite. */
export const OUVERTURE_AVANCE_MS = 15 * 60 * 1000;

const instant = (s: Seance): number => new Date(s.debut).getTime();
const valide = (s: Seance): boolean => !Number.isNaN(instant(s));

export const seanceEnCours = (s: Seance, maintenant = Date.now()): boolean => {
  if (!valide(s)) return false;
  const debut = instant(s);
  return maintenant >= debut - OUVERTURE_AVANCE_MS && maintenant <= debut + s.duree * 60000;
};

export const prochaineSeance = (seances: Seance[] = [], maintenant = Date.now()): Seance | null => {
  const ouvertes = seances
    .filter(valide)
    .filter((s) => instant(s) + s.duree * 60000 >= maintenant)
    .sort((a, b) => instant(a) - instant(b));
  return ouvertes[0] ?? null;
};

export const classeEnDirect = (seances: Seance[] = [], maintenant = Date.now()): boolean =>
  seances.some((s) => seanceEnCours(s, maintenant));

/**
 * Jusqu'a quand la salle Daily doit vivre, en secondes Unix. Une salle de
 * groupe sert plusieurs semaines : elle expire un jour apres la derniere
 * rencontre inscrite, et trente jours plus tard quand l'horaire est encore
 * vide. Daily refuse une expiration deja passee, d'ou le plancher a une heure.
 */
export const expirationSalle = (seances: Seance[] = [], maintenant = Date.now()): number => {
  const fins = seances.filter(valide).map((s) => instant(s) + s.duree * 60000);
  const derniere = fins.length ? Math.max(...fins) : 0;
  const cible = derniere ? derniere + 24 * 3600_000 : maintenant + 30 * 24 * 3600_000;
  return Math.round(Math.max(cible, maintenant + 3600_000) / 1000);
};

/* ---------------------------------------------------------------------
   Le champ <input type="datetime-local"> parle en heure locale et tait
   son fuseau. Ce qui est range dans Firestore est un instant complet, pour
   qu'une personne qui suit le groupe d'ailleurs voie la bonne heure.
   --------------------------------------------------------------------- */
export const versChampLocal = (valeur: string): string => {
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const depuisChampLocal = (local: string): string => {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
};

export const formatSeance = (debut: string, lang: "fr" | "en" = "fr"): string => {
  const d = new Date(debut);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(lang === "fr" ? "fr-CA" : "en-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};
