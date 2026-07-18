import {
  doc,
  runTransaction,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "../firebase";

/** Séances counter lives on users/{uid}: seancesTotal (forfait) + seancesRemaining.
 *  Writes are admin-only (enforced by firestore.rules). Meeting docs (bookings /
 *  appointments) carry a `seanceCounted` flag so toggling a status back and forth
 *  never counts the same rencontre twice. */

export const setForfait = async (clientUid: string, total: number) => {
  const n = Math.max(0, Math.floor(total));
  await runTransaction(db, async (tx) => {
    tx.update(doc(db, "users", clientUid), {
      seancesTotal: n,
      seancesRemaining: n,
    });
  });
};

export const adjustSeances = async (clientUid: string, delta: number) => {
  const ref = doc(db, "users", clientUid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const current = (snap.data().seancesRemaining as number | undefined) ?? 0;
    tx.update(ref, { seancesRemaining: Math.max(0, current + delta) });
  });
};

/** Mark a rencontre as done: set its status, flag it counted, decrement the counter.
 *  If the doc was already counted, only the status changes. */
export const completeSeance = async (
  clientUid: string,
  meetingRef: DocumentReference,
  statusValue: string,
) => {
  const userRef = doc(db, "users", clientUid);
  await runTransaction(db, async (tx) => {
    const [meetingSnap, userSnap] = await Promise.all([
      tx.get(meetingRef),
      tx.get(userRef),
    ]);
    if (!meetingSnap.exists()) return;
    const alreadyCounted = meetingSnap.data().seanceCounted === true;
    tx.update(meetingRef, { status: statusValue, seanceCounted: true });
    if (!alreadyCounted && userSnap.exists()) {
      const current = (userSnap.data().seancesRemaining as number | undefined) ?? 0;
      tx.update(userRef, { seancesRemaining: Math.max(0, current - 1) });
    }
  });
};

/** Undo: move a rencontre out of "done", give the séance back if it was counted. */
export const uncompleteSeance = async (
  clientUid: string,
  meetingRef: DocumentReference,
  statusValue: string,
) => {
  const userRef = doc(db, "users", clientUid);
  await runTransaction(db, async (tx) => {
    const [meetingSnap, userSnap] = await Promise.all([
      tx.get(meetingRef),
      tx.get(userRef),
    ]);
    if (!meetingSnap.exists()) return;
    const wasCounted = meetingSnap.data().seanceCounted === true;
    tx.update(meetingRef, { status: statusValue, seanceCounted: false });
    if (wasCounted && userSnap.exists()) {
      const current = (userSnap.data().seancesRemaining as number | undefined) ?? 0;
      tx.update(userRef, { seancesRemaining: current + 1 });
    }
  });
};
