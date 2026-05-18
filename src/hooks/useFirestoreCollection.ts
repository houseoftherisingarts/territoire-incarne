import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  type DocumentData,
  type WhereFilterOp,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";

export interface FirestoreDoc {
  id: string;
}

export interface CollectionOptions {
  orderField?: string;
  orderDirection?: "asc" | "desc";
  /** Tuples of [field, op, value] applied as where() clauses. */
  where?: Array<[string, WhereFilterOp, unknown]>;
}

/**
 * Generic Firestore collection hook with realtime subscription + CRUD.
 *
 * Pass `options` as a stable reference (use useMemo if computed) — re-renders
 * with a new object identity will re-subscribe.
 */
export function useFirestoreCollection<T extends FirestoreDoc>(
  path: string,
  options?: CollectionOptions,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stable key for effect dep
  const key = useMemo(
    () => JSON.stringify({ path, options: options ?? null }),
    [path, options],
  );

  useEffect(() => {
    const ref = collection(db, path);
    const constraints: QueryConstraint[] = [];
    if (options?.where) {
      for (const [field, op, value] of options.where) {
        constraints.push(where(field, op, value));
      }
    }
    if (options?.orderField) {
      constraints.push(orderBy(options.orderField, options.orderDirection ?? "desc"));
    }
    const q = constraints.length ? query(ref, ...constraints) : query(ref);

    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const add = (data: Omit<T, "id" | "createdAt"> & { createdAt?: unknown }) =>
    addDoc(collection(db, path), {
      ...data,
      createdAt: data.createdAt ?? serverTimestamp(),
    } as DocumentData);

  /** Add with a chosen document ID (e.g. slug). */
  const set = (id: string, data: Omit<T, "id">, merge = false) =>
    setDoc(doc(db, path, id), data as DocumentData, { merge });

  const update = (id: string, data: Partial<Omit<T, "id">>) =>
    updateDoc(doc(db, path, id), {
      ...data,
      updatedAt: serverTimestamp(),
    } as DocumentData);

  const remove = (id: string) => deleteDoc(doc(db, path, id));

  return { items, loading, error, add, set, update, remove };
}
