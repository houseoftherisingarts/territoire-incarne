import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Tarif {
  id: string;
  name: string;
  description: string;
  type: "subscription" | "one-time";
  price: number;
  frequency?: "monthly" | "quarterly" | "yearly";
  category: "consultation" | "livre" | "sante-sexuelle" | "evenement" | "autre";
  active: boolean;
  /** Short tag shown above the title on public cards (e.g. "Soins", "Accompagnement"). */
  shortTag?: string;
  /** Optional consultation duration in minutes — only meaningful for category=consultation. */
  durationMin?: number;
  /** Hero image shown on the public Therapie service card + modal. */
  image?: string;
  stripePriceId?: string;
  createdAt: unknown;
}

export type TarifInput = Omit<Tarif, "id" | "createdAt">;

export const useTarifs = () => {
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "tarifs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTarifs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Tarif)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addTarif = (data: TarifInput) =>
    addDoc(collection(db, "tarifs"), { ...data, createdAt: serverTimestamp() });

  const updateTarif = (id: string, data: Partial<TarifInput>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateDoc(doc(db, "tarifs", id), data as any);

  const deleteTarif = (id: string) => deleteDoc(doc(db, "tarifs", id));

  return { tarifs, loading, addTarif, updateTarif, deleteTarif };
};
