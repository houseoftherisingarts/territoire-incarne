// Le calendrier d'Élise en flux iCal vivant : elle s'y abonne une fois dans Google Agenda (« Ajouter
// un agenda › À partir de l'URL ») ou Apple Calendrier, et ses rendez-vous confirmés y apparaissent
// et s'y mettent à jour sans OAuth. Le lien porte un jeton secret gardé dans prive/ics, que seule
// l'admin obtient par `calendrierIcsLien`.
import { onCall, onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { assertAdmin } from "./agenda/google";

const REGION = "us-central1";
const PRIVE_PATH = "prive/ics";

const pad = (n: number) => String(n).padStart(2, "0");
const fmtUtc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

export const calendrierIcsLien = onCall({ region: REGION }, async (request) => {
  assertAdmin(request);
  const db = getFirestore();
  const ref = db.doc(PRIVE_PATH);
  const snap = await ref.get();
  let token = snap.exists ? (snap.data() as { token?: string }).token : undefined;
  if (!token || request.data?.regenerer) {
    token = randomBytes(24).toString("base64url");
    await ref.set({ token, createdAt: new Date() }, { merge: true });
  }
  const projet = process.env.GCLOUD_PROJECT || "territoireincarne-80bb9";
  return { url: `https://${REGION}-${projet}.cloudfunctions.net/calendrierIcs?t=${token}` };
});

export const calendrierIcs = onRequest({ region: REGION }, async (req, res) => {
  const db = getFirestore();
  const snap = await db.doc(PRIVE_PATH).get();
  const attendu = snap.exists ? (snap.data() as { token?: string }).token : undefined;
  const recu = String(req.query.t || "");
  if (!attendu || !recu || recu.length !== attendu.length || !timingSafeEqual(Buffer.from(recu), Buffer.from(attendu))) {
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
    const a = d.data() as { start: FirebaseFirestore.Timestamp; end: FirebaseFirestore.Timestamp; status: string; clientName?: string; clientEmail?: string; type?: string; meetingUrl?: string };
    if (a.status === "cancelled") continue;
    const titre = a.status === "requested" ? `Demande · ${a.clientName || ""}` : `Séance avec ${a.clientName || ""}`;
    const desc = [a.clientEmail, a.type, a.meetingUrl ? `Rencontre vidéo : ${a.meetingUrl}` : ""].filter(Boolean).join("\n");
    lignes.push(
      "BEGIN:VEVENT",
      `UID:${d.id}@territoireincarne.com`,
      `DTSTAMP:${fmtUtc(new Date())}`,
      `DTSTART:${fmtUtc(a.start.toDate())}`,
      `DTEND:${fmtUtc(a.end.toDate())}`,
      `SUMMARY:${esc(titre)}`,
      `DESCRIPTION:${esc(desc)}`,
      `STATUS:${a.status === "requested" ? "TENTATIVE" : "CONFIRMED"}`,
      "END:VEVENT",
    );
  }
  lignes.push("END:VCALENDAR");
  res.set("Content-Type", "text/calendar; charset=utf-8");
  res.set("Cache-Control", "private, max-age=300");
  res.send(lignes.join("\r\n"));
});
