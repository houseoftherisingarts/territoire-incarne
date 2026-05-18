import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export interface ChatMsg {
  id: string;
  senderUid: string;
  text: string;
  sentAt: Date | null;
  read: boolean;
}

export const useChat = (clientUid: string, currentUid: string) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientUid) return;
    const q = query(
      collection(db, "conversations", clientUid, "messages"),
      orderBy("sentAt", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs: ChatMsg[] = snap.docs.map((d) => ({
        id: d.id,
        senderUid: d.data().senderUid ?? "",
        text: d.data().text ?? "",
        sentAt: d.data().sentAt?.toDate() ?? null,
        read: d.data().read ?? false,
      }));
      setMessages(msgs);
      setLoading(false);
      snap.docs.forEach((d) => {
        if (d.data().senderUid !== currentUid && !d.data().read) {
          updateDoc(
            doc(db, "conversations", clientUid, "messages", d.id),
            { read: true },
          );
        }
      });
    });
    return unsub;
  }, [clientUid, currentUid]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    await addDoc(collection(db, "conversations", clientUid, "messages"), {
      senderUid: currentUid,
      text: text.trim(),
      sentAt: serverTimestamp(),
      read: false,
    });
  };

  return { messages, loading, send };
};
