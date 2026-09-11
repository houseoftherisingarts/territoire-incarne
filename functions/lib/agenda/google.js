"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agendaSyncSurEcriture = exports.agendaGoogleSync = exports.agendaGoogleDeconnecter = exports.agendaGoogleEtat = exports.agendaGoogleRetour = exports.agendaGoogleConnecter = exports.AGENDA_STATE_SECRET = exports.GOOGLE_OAUTH_CLIENT_SECRET = exports.GOOGLE_OAUTH_CLIENT_ID = void 0;
exports.assertAdmin = assertAdmin;
// Synchronisation avec Google Agenda (demande d'Alex, 11 septembre 2026) : les rendez-vous confirmés
// d'Élise deviennent des événements dans SON agenda Google, et les plages qu'elle a déjà occupées
// dans Google bloquent les nouveaux créneaux côté client (occupations/{id}). Porté de Xena Horizon.
//
// Le jeton d'accès d'Élise (refresh_token OAuth) vit seul dans prive/agenda_google, un document que
// SEULES ces fonctions lisent : aucune règle client ne l'expose, l'admin non plus (firestore.rules).
// Tant que le client OAuth n'est pas créé dans la console (docs/BRANCHEMENTS.md), les secrets portent
// des valeurs vides et le panneau admin dit calmement que la synchronisation n'est pas encore branchée.
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
const firestore_2 = require("firebase-admin/firestore");
const googleapis_1 = require("googleapis");
const node_crypto_1 = require("node:crypto");
const sync_1 = require("./sync");
const admins_1 = require("../admins");
const REGION = "us-central1";
const PUBLIC_BASE_URL = "https://territoireincarne.com";
const PRIVE_PATH = "prive/agenda_google";
const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.readonly"];
const HORIZON_JOURS = 60;
const ETAT_TTL_MS = 10 * 60 * 1000;
exports.GOOGLE_OAUTH_CLIENT_ID = (0, params_1.defineSecret)("GOOGLE_OAUTH_CLIENT_ID");
exports.GOOGLE_OAUTH_CLIENT_SECRET = (0, params_1.defineSecret)("GOOGLE_OAUTH_CLIENT_SECRET");
exports.AGENDA_STATE_SECRET = (0, params_1.defineSecret)("AGENDA_STATE_SECRET");
const AGENDA_SECRETS = [exports.GOOGLE_OAUTH_CLIENT_ID, exports.GOOGLE_OAUTH_CLIENT_SECRET, exports.AGENDA_STATE_SECRET];
function assertAdmin(request) {
    const auth = request.auth;
    const email = (auth?.token?.email || "").toLowerCase();
    const emailOk = !!auth?.token?.email_verified && !!email && admins_1.ADMIN_EMAILS.includes(email);
    if (!auth || (!admins_1.ADMIN_UIDS.includes(auth.uid) && !emailOk)) {
        throw new https_1.HttpsError("permission-denied", "Admin only.");
    }
}
const branche = () => exports.GOOGLE_OAUTH_CLIENT_ID.value().length > 10 && exports.GOOGLE_OAUTH_CLIENT_SECRET.value().length > 10 && exports.AGENDA_STATE_SECRET.value().length > 10;
const projectId = () => process.env.GCLOUD_PROJECT || "territoireincarne-80bb9";
const redirectUri = () => `https://${REGION}-${projectId()}.cloudfunctions.net/agendaGoogleRetour`;
function oauthClient() {
    return new googleapis_1.google.auth.OAuth2(exports.GOOGLE_OAUTH_CLIENT_ID.value(), exports.GOOGLE_OAUTH_CLIENT_SECRET.value(), redirectUri());
}
function signerEtat() {
    const payload = String(Date.now());
    const sig = (0, node_crypto_1.createHmac)("sha256", exports.AGENDA_STATE_SECRET.value()).update(payload).digest("base64url");
    return `${payload}.${sig}`;
}
function etatValide(etat) {
    const [payload, sig] = String(etat || "").split(".");
    if (!payload || !sig)
        return false;
    const attendu = (0, node_crypto_1.createHmac)("sha256", exports.AGENDA_STATE_SECRET.value()).update(payload).digest("base64url");
    const recu = Buffer.from(sig);
    const voulu = Buffer.from(attendu);
    if (recu.length !== voulu.length || !(0, node_crypto_1.timingSafeEqual)(recu, voulu))
        return false;
    return Date.now() - Number(payload) < ETAT_TTL_MS;
}
async function chargerConnexion() {
    const snap = await (0, firestore_2.getFirestore)().doc(PRIVE_PATH).get();
    return snap.exists ? snap.data() : null;
}
function calendrierClient(refreshToken) {
    const client = oauthClient();
    client.setCredentials({ refresh_token: refreshToken });
    return googleapis_1.google.calendar({ version: "v3", auth: client });
}
// ─── Ouvrir la porte : l'adresse de consentement Google ─────────────────────
exports.agendaGoogleConnecter = (0, https_1.onCall)({ region: REGION, secrets: AGENDA_SECRETS }, async (request) => {
    assertAdmin(request);
    if (!branche())
        throw new https_1.HttpsError("failed-precondition", "indisponible");
    const url = oauthClient().generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES, state: signerEtat() });
    return { url };
});
// ─── Le retour de Google : échange le code contre un jeton, l'écrit, referme la porte ───────────
exports.agendaGoogleRetour = (0, https_1.onRequest)({ region: REGION, secrets: AGENDA_SECRETS }, async (req, res) => {
    const code = String(req.query.code || "");
    const etat = String(req.query.state || "");
    if (!branche() || !code || !etatValide(etat)) {
        res.redirect(`${PUBLIC_BASE_URL}/admin?google=erreur`);
        return;
    }
    try {
        const client = oauthClient();
        const { tokens } = await client.getToken(code);
        if (!tokens.refresh_token) {
            res.redirect(`${PUBLIC_BASE_URL}/admin?google=erreur`);
            return;
        }
        client.setCredentials(tokens);
        const oauth2 = googleapis_1.google.oauth2({ auth: client, version: "v2" });
        const info = await oauth2.userinfo.get();
        await (0, firestore_2.getFirestore)().doc(PRIVE_PATH).set({ refreshToken: tokens.refresh_token, email: info.data.email || "", calendrierId: "primary", connectedAt: firestore_2.Timestamp.now(), derniereSync: null }, { merge: true });
        res.redirect(`${PUBLIC_BASE_URL}/admin?google=ok`);
    }
    catch (e) {
        console.error("[agendaGoogleRetour]", e);
        res.redirect(`${PUBLIC_BASE_URL}/admin?google=erreur`);
    }
});
exports.agendaGoogleEtat = (0, https_1.onCall)({ region: REGION, secrets: AGENDA_SECRETS }, async (request) => {
    assertAdmin(request);
    if (!branche())
        return { disponible: false, connecte: false };
    const ref = (0, firestore_2.getFirestore)().doc(PRIVE_PATH);
    const snap = await ref.get();
    if (!snap.exists)
        return { disponible: true, connecte: false };
    const data = snap.data();
    const calendrierId = request.data?.calendrierId;
    if (calendrierId && calendrierId !== data.calendrierId) {
        await ref.update({ calendrierId });
        data.calendrierId = calendrierId;
    }
    let calendriers = [];
    try {
        const liste = await calendrierClient(data.refreshToken).calendarList.list();
        calendriers = (liste.data.items || []).map((c) => ({ id: c.id || "", nom: c.summary || c.id || "" }));
    }
    catch (e) {
        console.warn("[agendaGoogleEtat] liste des calendriers", e);
    }
    return {
        disponible: true,
        connecte: true,
        email: data.email || "",
        calendrierId: data.calendrierId || "primary",
        derniereSync: data.derniereSync ? data.derniereSync.toMillis() : null,
        calendriers,
    };
});
// ─── Retirer l'accès ──────────────────────────────────────────────────────
exports.agendaGoogleDeconnecter = (0, https_1.onCall)({ region: REGION, secrets: AGENDA_SECRETS }, async (request) => {
    assertAdmin(request);
    await (0, firestore_2.getFirestore)().doc(PRIVE_PATH).delete();
    return { ok: true };
});
// ─── La synchronisation elle-même ─────────────────────────────────────────
const versDate = (v) => (v?.toDate ? v.toDate() : v instanceof Date ? v : new Date(v));
const rdvDepuisDoc = (d) => ({
    clientName: d.clientName || "",
    clientEmail: d.clientEmail || "",
    start: versDate(d.start),
    end: versDate(d.end),
    type: d.type,
    meetingUrl: d.meetingUrl,
    status: d.status,
    googleEventId: d.googleEventId,
});
async function synchroniserUnRdv(cal, calendarId, db, id, rdv) {
    const geste = (0, sync_1.actionPourRdv)(rdv);
    const ref = db.doc(`appointments/${id}`);
    if (geste.action === "creer") {
        const { data } = await cal.events.insert({ calendarId, requestBody: (0, sync_1.evenementDepuisRdv)(rdv) });
        if (data.id)
            await ref.update({ googleEventId: data.id });
    }
    else if (geste.action === "mettreAJour") {
        try {
            await cal.events.update({ calendarId, eventId: geste.eventId, requestBody: (0, sync_1.evenementDepuisRdv)(rdv) });
        }
        catch (e) {
            console.warn(`[agendaGoogleSync] mise à jour ${id}`, e);
        }
    }
    else if (geste.action === "supprimer") {
        try {
            await cal.events.delete({ calendarId, eventId: geste.eventId });
        }
        catch (e) {
            console.warn(`[agendaGoogleSync] suppression ${id}`, e);
        }
        await ref.update({ googleEventId: firestore_2.FieldValue.delete() });
    }
}
async function synchroniserOccupationsGoogle(cal, calendarId, db) {
    const maintenant = new Date();
    const horizon = new Date(maintenant.getTime() + HORIZON_JOURS * 86400000);
    const { data } = await cal.freebusy.query({
        requestBody: { timeMin: maintenant.toISOString(), timeMax: horizon.toISOString(), items: [{ id: calendarId }] },
    });
    const fraiches = (0, sync_1.occupationsDepuisFreebusy)(data.calendars?.[calendarId]?.busy || []);
    const existantes = await db.collection("occupations").where("source", "==", "google").get();
    const idsFrais = new Set(fraiches.map((o) => o.id));
    const batch = db.batch();
    for (const doc of existantes.docs)
        if (!idsFrais.has(doc.id))
            batch.delete(doc.ref);
    for (const o of fraiches)
        batch.set(db.doc(`occupations/${o.id}`), { start: firestore_2.Timestamp.fromDate(o.start), end: firestore_2.Timestamp.fromDate(o.end), source: "google" });
    await batch.commit();
}
async function synchroniserTout(db) {
    const connexion = await chargerConnexion();
    if (!connexion)
        return;
    const cal = calendrierClient(connexion.refreshToken);
    const calendarId = connexion.calendrierId || "primary";
    const rdvs = await db.collection("appointments").where("status", "in", ["confirmed", "cancelled", "completed"]).get();
    for (const doc of rdvs.docs)
        await synchroniserUnRdv(cal, calendarId, db, doc.id, rdvDepuisDoc(doc.data()));
    await synchroniserOccupationsGoogle(cal, calendarId, db);
    await db.doc(PRIVE_PATH).update({ derniereSync: firestore_2.Timestamp.now() });
}
// Toutes les 15 minutes : rattrape ce que le déclencheur par écriture aurait manqué.
exports.agendaGoogleSync = (0, scheduler_1.onSchedule)({ schedule: "every 15 minutes", region: REGION, secrets: AGENDA_SECRETS }, async () => {
    if (!branche())
        return;
    await synchroniserTout((0, firestore_2.getFirestore)());
});
// À chaque écriture d'un rendez-vous : (1) le miroir occupations/{rdv-id}, qui bloque le créneau
// pour les autres clientes sans rien révéler; (2) l'événement Google si le compte est connecté.
exports.agendaSyncSurEcriture = (0, firestore_1.onDocumentWritten)({ document: "appointments/{rdvId}", region: REGION, secrets: AGENDA_SECRETS }, async (event) => {
    const db = (0, firestore_2.getFirestore)();
    const apres = event.data?.after;
    const id = event.params.rdvId;
    const occRef = db.doc(`occupations/rdv-${id}`);
    if (!apres?.exists) {
        await occRef.delete().catch(() => undefined);
        return;
    }
    const rdv = rdvDepuisDoc(apres.data());
    const occ = (0, sync_1.occupationDepuisRdv)(id, rdv);
    if (occ)
        await occRef.set({ start: firestore_2.Timestamp.fromDate(occ.start), end: firestore_2.Timestamp.fromDate(occ.end), source: "rdv" });
    else
        await occRef.delete().catch(() => undefined);
    if (!branche())
        return;
    const connexion = await chargerConnexion();
    if (!connexion)
        return;
    await synchroniserUnRdv(calendrierClient(connexion.refreshToken), connexion.calendrierId || "primary", db, id, rdv);
});
//# sourceMappingURL=google.js.map