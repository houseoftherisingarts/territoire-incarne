import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import type { ClientProfile } from "./useClientAuth";

export const useFirestoreClients = () => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setClients(snap.docs.map((d) => d.data() as ClientProfile));
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateStatus = async (uid: string, status: ClientProfile["status"]) => {
    await updateDoc(doc(db, "users", uid), { status });
  };

  return { clients, loading, updateStatus };
};
