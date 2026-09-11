import { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { DossierNote } from "../types/dossier";

/** Notes privées d'Élise sur une cliente : users/{uid}/notes, admin-only (voir firestore.rules). */
export const useDossierNotes = (clientUid: string) => {
  const [notes, setNotes] = useState<DossierNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users", clientUid, "notes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DossierNote)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [clientUid]);

  const add = (texte: string) => addDoc(collection(db, "users", clientUid, "notes"), { texte, createdAt: serverTimestamp() });
  const remove = (id: string) => deleteDoc(doc(db, "users", clientUid, "notes", id));

  return { notes, loading, add, remove };
};
