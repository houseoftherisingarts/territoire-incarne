"use strict";
// Logique pure de la synchronisation Google Agenda : aucun appel réseau ni Firestore ici, seulement
// des fonctions qui prennent des données et rendent des données. Portée de Xena Horizon
// (functions/src/agenda/sync.ts) et adaptée au modèle `appointments` de Territoire Incarné.
Object.defineProperty(exports, "__esModule", { value: true });
exports.evenementDepuisRdv = evenementDepuisRdv;
exports.actionPourRdv = actionPourRdv;
exports.occupationsDepuisFreebusy = occupationsDepuisFreebusy;
exports.occupationDepuisRdv = occupationDepuisRdv;
/** Le rendez-vous confirmé, tel qu'il doit apparaître dans l'agenda Google d'Élise. */
function evenementDepuisRdv(rdv) {
    const lignes = [rdv.clientEmail];
    if (rdv.type)
        lignes.push(rdv.type);
    if (rdv.meetingUrl)
        lignes.push(`Rencontre vidéo : ${rdv.meetingUrl}`);
    return {
        summary: `Séance avec ${rdv.clientName}`,
        description: lignes.join("\n"),
        start: { dateTime: rdv.start.toISOString() },
        end: { dateTime: rdv.end.toISOString() },
    };
}
/** Idempotence par googleEventId : confirmé sans événement → créer; confirmé avec → mettre à jour;
 *  annulé ou terminé avec événement → retirer; le reste ne bouge pas. */
function actionPourRdv(rdv) {
    const aEvenement = !!rdv.googleEventId;
    if (rdv.status === "confirmed")
        return aEvenement ? { action: "mettreAJour", eventId: rdv.googleEventId } : { action: "creer" };
    if ((rdv.status === "cancelled" || rdv.status === "completed") && aEvenement)
        return { action: "supprimer", eventId: rdv.googleEventId };
    return { action: "ignorer" };
}
/** Les plages occupées de l'agenda Google (freebusy) → occupations/{id}, id déterministe. */
function occupationsDepuisFreebusy(periodes) {
    return periodes
        .filter((p) => !!p.start && !!p.end)
        .map((p) => ({
        id: `google-${Buffer.from(`${p.start}|${p.end}`).toString("base64url").slice(0, 40)}`,
        start: new Date(p.start),
        end: new Date(p.end),
        source: "google",
    }));
}
/** Un rendez-vous confirmé ou demandé bloque son créneau pour les autres clientes, sans rien
 *  révéler d'elles : seulement le début et la fin. */
function occupationDepuisRdv(id, rdv) {
    if (rdv.status === "cancelled" || rdv.status === "completed")
        return null;
    return { id: `rdv-${id}`, start: rdv.start, end: rdv.end, source: "rdv" };
}
//# sourceMappingURL=sync.js.map