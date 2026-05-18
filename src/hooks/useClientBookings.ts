import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export type BookingStatus = "à venir" | "confirmé" | "annulé" | "complété";

export interface ClientBooking {
  id: string;
  clientUid: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  status: BookingStatus;
  createdAt: Date | null;
}

export const useClientBookings = (clientUid: string) => {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientUid) return;
    const q = query(
      collection(db, "bookings"),
      where("clientUid", "==", clientUid),
      orderBy("date", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setBookings(
        snap.docs.map((d) => ({
          id: d.id,
          clientUid: d.data().clientUid ?? "",
          title: d.data().title ?? "",
          date: d.data().date ?? "",
          time: d.data().time ?? "",
          notes: d.data().notes ?? "",
          status: (d.data().status as BookingStatus) ?? "à venir",
          createdAt: d.data().createdAt?.toDate() ?? null,
        })),
      );
      setLoading(false);
    });
    return unsub;
  }, [clientUid]);

  const add = async (
    title: string,
    date: string,
    time: string,
    notes: string,
  ) => {
    if (!title.trim() || !date) return;
    await addDoc(collection(db, "bookings"), {
      clientUid,
      title: title.trim(),
      date,
      time,
      notes: notes.trim(),
      status: "à venir" as BookingStatus,
      createdAt: serverTimestamp(),
    });
  };

  const patch = async (id: string, status: BookingStatus) => {
    await updateDoc(doc(db, "bookings", id), { status });
  };

  const remove = async (id: string) => {
    await deleteDoc(doc(db, "bookings", id));
  };

  return { bookings, loading, add, patch, remove };
};
