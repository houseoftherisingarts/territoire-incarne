import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/** Generic realtime single-document read, mirroring useFirestoreCollection's style.
 *  `path` is a full doc path, e.g. "settings/dossier". */
export function useDocument<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, path),
      (snap) => {
        setData(snap.exists() ? (snap.data() as T) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [path]);

  return { data, loading };
}
