import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/** Realtime map of all site content overrides keyed by their content key.
 *  Public reads, admin writes. Empty map until the snapshot resolves. */
export const useSiteOverrides = () => {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "siteOverrides"),
      (snap) => {
        const map: Record<string, string> = {};
        for (const d of snap.docs) {
          const data = d.data();
          if (typeof data.value === "string") map[d.id] = data.value;
        }
        setOverrides(map);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  return { overrides, loading };
};

export const saveOverride = (key: string, value: string) =>
  setDoc(doc(db, "siteOverrides", encodeKey(key)), {
    value,
    updatedAt: serverTimestamp(),
  });

export const clearOverride = (key: string) =>
  deleteDoc(doc(db, "siteOverrides", encodeKey(key)));

/** Firestore doc IDs cannot contain "/", so encode keys deterministically. */
const encodeKey = (key: string): string => key.replace(/\//g, "__").replace(/\./g, "_");
