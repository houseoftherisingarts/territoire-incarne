import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface ClientDoc {
  id: string;
  name: string;
  url: string;
  description: string;
  addedAt: Date | null;
}

export const useClientDocs = (clientUid: string) => {
  const [docs, setDocs] = useState<ClientDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientUid) return;
    const q = query(
      collection(db, "users", clientUid, "docs"),
      orderBy("addedAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setDocs(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name ?? "",
          url: d.data().url ?? "",
          description: d.data().description ?? "",
          addedAt: d.data().addedAt?.toDate() ?? null,
        })),
      );
      setLoading(false);
    });
    return unsub;
  }, [clientUid]);

  const add = async (name: string, url: string, description: string) => {
    if (!name.trim()) return;
    await addDoc(collection(db, "users", clientUid, "docs"), {
      name: name.trim(),
      url: url.trim(),
      description: description.trim(),
      addedAt: serverTimestamp(),
    });
  };

  const remove = async (id: string) => {
    await deleteDoc(doc(db, "users", clientUid, "docs", id));
  };

  return { docs, loading, add, remove };
};
