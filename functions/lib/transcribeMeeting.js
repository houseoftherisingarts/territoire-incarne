"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeMeeting = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const DAILY_BASE = "https://api.daily.co/v1";
// Mirror of src/lib/admins.ts ADMIN_UIDS. Keep in sync with firestore.rules.
const ADMIN_UIDS = [
    "yDsFujEL8lUkEzrtFXQvgFoseH22", // fruiterre@gmail.com (added 2026-05-01)
    "BYR9pdEGCfYpU5kmbMoyRr9paRq1", // legacy admin — remove once new account is verified
];
exports.transcribeMeeting = (0, https_1.onCall)({
    secrets: ["DAILY_API_KEY", "OPENAI_API_KEY"],
    timeoutSeconds: 540,
    memory: "512MiB",
    region: "us-central1",
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Sign-in required");
    }
    const { clientUid, meetingId } = request.data;
    if (!clientUid || !meetingId) {
        throw new https_1.HttpsError("invalid-argument", "clientUid and meetingId are required");
    }
    // Only the meeting's own client or an admin can trigger transcription.
    const isAdmin = ADMIN_UIDS.includes(request.auth.uid);
    if (request.auth.uid !== clientUid && !isAdmin) {
        throw new https_1.HttpsError("permission-denied", "Not allowed to transcribe this meeting");
    }
    const db = (0, firestore_1.getFirestore)();
    const ref = db.doc(`conversations/${clientUid}/meetings/${meetingId}`);
    const snap = await ref.get();
    const data = snap.data();
    if (!data)
        throw new https_1.HttpsError("not-found", "Meeting not found");
    if (data.transcriptStatus === "done")
        return { status: "already_done" };
    await ref.update({ transcriptStatus: "processing" });
    const DAILY_API_KEY = process.env.DAILY_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    try {
        const roomName = data.roomUrl.split("/").pop() ?? "";
        let recJson = {};
        for (let attempt = 0; attempt < 10; attempt++) {
            await wait(30 * 1000);
            const recRes = await fetch(`${DAILY_BASE}/recordings?room_name=${encodeURIComponent(roomName)}&limit=1`, { headers: { Authorization: `Bearer ${DAILY_API_KEY}` } });
            recJson = await recRes.json();
            if (recJson.data?.length)
                break;
            console.log(`Attempt ${attempt + 1}: recording not ready yet`);
        }
        if (!recJson.data?.length) {
            await ref.update({ transcriptStatus: "no_recording" });
            return { status: "no_recording" };
        }
        const recordingId = recJson.data[0].id;
        const linkRes = await fetch(`${DAILY_BASE}/recordings/${recordingId}/access-link`, { headers: { Authorization: `Bearer ${DAILY_API_KEY}` } });
        const linkJson = await linkRes.json();
        if (!linkJson.download_link) {
            await ref.update({ transcriptStatus: "error" });
            throw new https_1.HttpsError("internal", "No download link from Daily.co");
        }
        const audioRes = await fetch(linkJson.download_link);
        if (!audioRes.ok) {
            await ref.update({ transcriptStatus: "error" });
            throw new https_1.HttpsError("internal", "Failed to download recording");
        }
        const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
        const form = new FormData();
        form.append("file", new Blob([audioBuffer], { type: "video/mp4" }), "recording.mp4");
        form.append("model", "whisper-1");
        form.append("language", "fr");
        form.append("response_format", "text");
        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
            body: form,
        });
        if (!whisperRes.ok) {
            console.error("Whisper error:", await whisperRes.text());
            await ref.update({ transcriptStatus: "error" });
            throw new https_1.HttpsError("internal", "Whisper transcription failed");
        }
        const transcript = await whisperRes.text();
        await ref.update({ adminTranscript: transcript, transcriptStatus: "done" });
        await db
            .doc(`conversations/${clientUid}`)
            .set({ lastTranscriptAt: new Date() }, { merge: true });
        return { status: "done" };
    }
    catch (err) {
        if (err instanceof https_1.HttpsError)
            throw err;
        console.error("transcribeMeeting error:", err);
        await ref.update({ transcriptStatus: "error" });
        throw new https_1.HttpsError("internal", "Transcription failed");
    }
});
function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
//# sourceMappingURL=transcribeMeeting.js.map