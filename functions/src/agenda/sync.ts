// Logique pure de la synchronisation Google Agenda : aucun appel réseau ni Firestore ici, seulement
// des fonctions qui prennent des données et rendent des données. Portée de Xena Horizon
// (functions/src/agenda/sync.ts) et adaptée au modèle `appointments` de Territoire Incarné.

export type StatutRdv = "requested" | "confirmed" | "cancelled" | "completed";

export interface RdvPourEvenement {
  clientName: string;
  clientEmail: string;
  start: Date;
  end: Date;
  type?: string;
  meetingUrl?: string;
  status: StatutRdv;
  googleEventId?: string;
}

export interface EvenementGoogle {
  summary: string;
  description: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

/** Le rendez-vous confirmé, tel qu'il doit apparaître dans l'agenda Google d'Élise. */
export function evenementDepuisRdv(rdv: RdvPourEvenement): EvenementGoogle {
  const lignes = [rdv.clientEmail];
  if (rdv.type) lignes.push(rdv.type);
  if (rdv.meetingUrl) lignes.push(`Rencontre vidéo : ${rdv.meetingUrl}`);
  return {
    summary: `Séance avec ${rdv.clientName}`,
    description: lignes.join("\n"),
    start: { dateTime: rdv.start.toISOString() },
    end: { dateTime: rdv.end.toISOString() },
  };
}

export type ActionSync =
  | { action: "creer" }
  | { action: "mettreAJour"; eventId: string }
  | { action: "supprimer"; eventId: string }
  | { action: "ignorer" };

/** Idempotence par googleEventId : confirmé sans événement → créer; confirmé avec → mettre à jour;
 *  annulé ou terminé avec événement → retirer; le reste ne bouge pas. */
export function actionPourRdv(rdv: Pick<RdvPourEvenement, "status" | "googleEventId">): ActionSync {
  const aEvenement = !!rdv.googleEventId;
  if (rdv.status === "confirmed") return aEvenement ? { action: "mettreAJour", eventId: rdv.googleEventId! } : { action: "creer" };
  if ((rdv.status === "cancelled" || rdv.status === "completed") && aEvenement) return { action: "supprimer", eventId: rdv.googleEventId! };
  return { action: "ignorer" };
}

export interface PeriodeOccupee {
  start?: string | null;
  end?: string | null;
}

export interface Occupation {
  id: string;
  start: Date;
  end: Date;
  source: "google" | "rdv";
}

/** Les plages occupées de l'agenda Google (freebusy) → occupations/{id}, id déterministe. */
export function occupationsDepuisFreebusy(periodes: PeriodeOccupee[]): Occupation[] {
  return periodes
    .filter((p): p is { start: string; end: string } => !!p.start && !!p.end)
    .map((p) => ({
      id: `google-${Buffer.from(`${p.start}|${p.end}`).toString("base64url").slice(0, 40)}`,
      start: new Date(p.start),
      end: new Date(p.end),
      source: "google" as const,
    }));
}

/** Un rendez-vous confirmé ou demandé bloque son créneau pour les autres clientes, sans rien
 *  révéler d'elles : seulement le début et la fin. */
export function occupationDepuisRdv(id: string, rdv: Pick<RdvPourEvenement, "start" | "end" | "status">): Occupation | null {
  if (rdv.status === "cancelled" || rdv.status === "completed") return null;
  return { id: `rdv-${id}`, start: rdv.start, end: rdv.end, source: "rdv" };
}
