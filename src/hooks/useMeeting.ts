import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../firebase";
import { createDailyRoom, createDailyToken } from "../services/daily";

export type MeetingStatus = "waiting" | "active" | "ended";

export type TranscriptStatus = "processing" | "done" | "no_recording" | "error" | null;

export interface Meeting {
  id: string;
  title: string;
  roomUrl: string;
  adminToken: string;
  clientToken: string;
  status: MeetingStatus;
  createdAt: Date | null;
  endedAt: Date | null;
  adminTranscript: string;
  clientTranscript: string;
  transcriptStatus: TranscriptStatus;
}

export const useMeeting = (clientUid: string) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientUid) return;
    const q = query(
      collection(db, "conversations", clientUid, "meetings"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMeetings(
          snap.docs.map((d) => ({
            id: d.id,
            title: (d.data().title as string) ?? "Réunion",
            roomUrl: d.data().roomUrl as string,
            adminToken: d.data().adminToken as string,
            clientToken: d.data().clientToken as string,
            status: (d.data().status as MeetingStatus) ?? "waiting",
            createdAt: d.data().createdAt?.toDate() ?? null,
            endedAt: d.data().endedAt?.toDate() ?? null,
            adminTranscript: (d.data().adminTranscript as string) ?? "",
            clientTranscript: (d.data().clientTranscript as string) ?? "",
            transcriptStatus: (d.data().transcriptStatus as TranscriptStatus) ?? null,
          })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [clientUid]);

  const create = async (title: string): Promise<Meeting["id"]> => {
    const slug = `ti-${clientUid.slice(0, 8)}-${Date.now()}`;
    const roomUrl = await createDailyRoom(slug);
    const [adminToken, clientToken] = await Promise.all([
      createDailyToken(slug, true),
      createDailyToken(slug, false),
    ]);
    const ref = await addDoc(
      collection(db, "conversations", clientUid, "meetings"),
      {
        title: title || `Séance du ${new Date().toLocaleDateString("fr-CA")}`,
        roomUrl,
        adminToken,
        clientToken,
        status: "waiting",
        createdAt: serverTimestamp(),
        endedAt: null,
        adminTranscript: "",
        clientTranscript: "",
        transcriptStatus: null,
      },
    );
    return ref.id;
  };

  const start = (meetingId: string) =>
    updateDoc(doc(db, "conversations", clientUid, "meetings", meetingId), {
      status: "active",
    });

  const end = async (meetingId: string) => {
    await updateDoc(doc(db, "conversations", clientUid, "meetings", meetingId), {
      status: "ended",
      endedAt: serverTimestamp(),
      transcriptStatus: "processing",
    });
    // Kick off transcription asynchronously — don't await so UI unblocks immediately
    const transcribe = httpsCallable(getFunctions(), "transcribeMeeting");
    transcribe({ clientUid, meetingId }).catch((err) => {
      console.error("transcribeMeeting callable error:", err);
    });
  };

  const appendTranscript = (meetingId: string, side: "admin" | "client", chunk: string) => {
    const field = side === "admin" ? "adminTranscript" : "clientTranscript";
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return Promise.resolve();
    const current = side === "admin" ? meeting.adminTranscript : meeting.clientTranscript;
    return updateDoc(doc(db, "conversations", clientUid, "meetings", meetingId), {
      [field]: current + (current ? " " : "") + chunk,
    });
  };

  const saveTranscript = (meetingId: string, side: "admin" | "client", text: string) => {
    const field = side === "admin" ? "adminTranscript" : "clientTranscript";
    return updateDoc(doc(db, "conversations", clientUid, "meetings", meetingId), {
      [field]: text,
    });
  };

  return { meetings, loading, create, start, end, appendTranscript, saveTranscript };
};
