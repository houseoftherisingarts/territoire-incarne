"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendrierIcs = exports.calendrierIcsLien = void 0;
// Le calendrier d'Élise en flux iCal vivant : elle s'y abonne une fois dans Google Agenda (« Ajouter
// un agenda › À partir de l'URL ») ou Apple Calendrier, et ses rendez-vous confirmés y apparaissent
// et s'y mettent à jour sans OAuth. Le lien porte un jeton secret gardé dans prive/ics, que seule
// l'admin obtient par `calendrierIcsLien`.
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const node_crypto_1 = require("node:crypto");
const google_1 = require("./agenda/google");
const REGION = "us-central1";
const PRIVE_PATH = "prive/ics";
const pad = (n) => String(n).padStart(2, "0");
const fmtUtc = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");
exports.calendrierIcsLien = (0, https_1.onCall)({ region: REGION }, async (request) => {
    (0, google_1.assertAdmin)(request);
    const db = (0, firestore_1.getFirestore)();
    const ref = db.doc(PRIVE_PATH);
    const snap = await ref.get();
    let token = snap.exists ? snap.data().token : undefined;
    if (!token || request.data?.regenerer) {
        token = (0, node_crypto_1.randomBytes)(24).toString("base64url");
        await ref.set({ token, createdAt: new Date() }, { merge: true });
    }
    const projet = process.env.GCLOUD_PROJECT || "territoireincarne-80bb9";
    return { url: `https://${REGION}-${projet}.cloudfunctions.net/calendrierIcs?t=${token}` };
});
exports.calendrierIcs = (0, https_1.onRequest)({ region: REGION }, async (req, res) => {
    const db = (0, firestore_1.getFirestore)();
    const snap = await db.doc(PRIVE_PATH).get();
    const attendu = snap.exists ? snap.data().token : undefined;
    const recu = String(req.query.t || "");
    if (!attendu || !recu || recu.length !== attendu.length || !(0, node_crypto_1.timingSafeEqual)(Buffer.from(recu), Buffer.from(attendu))) {
        res.status(404).send("Not found");
        return;
    }
    const depuis = new Date(Date.now() - 90 * 86400000);
    const rdvs = await db.collection("appointments").where("start", ">=", depuis).get();
    const lignes = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Territoire Incarné//FR",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Territoire Incarné · Rendez-vous",
        "X-PUBLISHED-TTL:PT1H",
    ];
    for (const d of rdvs.docs) {
        const a = d.data();
        if (a.status === "cancelled")
            continue;
        const titre = a.status === "requested" ? `Demande · ${a.clientName || ""}` : `Séance avec ${a.clientName || ""}`;
        const desc = [a.clientEmail, a.type, a.meetingUrl ? `Rencontre vidéo : ${a.meetingUrl}` : ""].filter(Boolean).join("\n");
        lignes.push("BEGIN:VEVENT", `UID:${d.id}@territoireincarne.com`, `DTSTAMP:${fmtUtc(new Date())}`, `DTSTART:${fmtUtc(a.start.toDate())}`, `DTEND:${fmtUtc(a.end.toDate())}`, `SUMMARY:${esc(titre)}`, `DESCRIPTION:${esc(desc)}`, `STATUS:${a.status === "requested" ? "TENTATIVE" : "CONFIRMED"}`, "END:VEVENT");
    }
    lignes.push("END:VCALENDAR");
    res.set("Content-Type", "text/calendar; charset=utf-8");
    res.set("Cache-Control", "private, max-age=300");
    res.send(lignes.join("\r\n"));
});
//# sourceMappingURL=calendrierIcs.js.map