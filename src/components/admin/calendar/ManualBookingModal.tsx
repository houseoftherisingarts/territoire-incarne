import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Users, Calendar as CalendarIcon, FileText } from "lucide-react";
import { collection, onSnapshot, query, addDoc, serverTimestamp, Timestamp, where } from "firebase/firestore";
import { db } from "../../../firebase";
import { combineMontrealDateTime, isoDate } from "../../../lib/datetime";
import { createDailyRoom } from "../../../services/daily";

interface UserDoc {
  id: string;
  displayName: string;
  email: string;
}

type Mode = "appointment" | "personal";

interface Props {
  initialDate: Date;
  initialStart?: string; // "HH:mm"
  onClose: () => void;
}

export const ManualBookingModal = ({ initialDate, initialStart, onClose }: Props) => {
  const [mode, setMode] = useState<Mode>("appointment");
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [pickedUid, setPickedUid] = useState<string>("");
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [type, setType] = useState("Consultation");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(isoDate(initialDate));
  const [startTime, setStartTime] = useState(initialStart ?? "09:00");
  const [duration, setDuration] = useState(60);
  const [createRoom, setCreateRoom] = useState(true);
  const [busy, setBusy] = useState(false);

  // Personal event fields
  const [personalTitle, setPersonalTitle] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"), where("status", "==", "accepted"));
    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({
        id: d.id,
        displayName: d.data().displayName ?? "",
        email: d.data().email ?? "",
      })));
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const start = combineMontrealDateTime(date, startTime);
      const end = new Date(start.getTime() + duration * 60_000);

      if (mode === "personal") {
        if (!personalTitle.trim()) return;
        await addDoc(collection(db, "personalEvents"), {
          title: personalTitle.trim(),
          start: Timestamp.fromDate(start),
          end: Timestamp.fromDate(end),
          notes: notes || "",
          createdAt: serverTimestamp(),
        });
      } else {
        let uid = pickedUid;
        let name = manualName;
        let email = manualEmail;
        if (uid) {
          const u = users.find((x) => x.id === uid);
          name = u?.displayName ?? "";
          email = u?.email ?? "";
        } else if (!name.trim() || !email.trim()) {
          alert("Choisir un client existant OU entrer nom + courriel.");
          setBusy(false);
          return;
        } else {
          uid = `manual_${Date.now()}`;
        }

        let meetingUrl = "";
        if (createRoom) {
          try {
            meetingUrl = await createDailyRoom(`apt-${Date.now()}`);
          } catch (err) {
            console.warn("Daily.co room creation failed:", err);
          }
        }

        await addDoc(collection(db, "appointments"), {
          clientUid: uid,
          clientName: name,
          clientEmail: email,
          start: Timestamp.fromDate(start),
          end: Timestamp.fromDate(end),
          durationMin: duration,
          status: "confirmed",
          type,
          notes,
          meetingUrl,
          createdBy: "admin",
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err) {
      console.error("Booking failed:", err);
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      alert(`Échec de la création : ${msg}\n\nSi l'erreur mentionne "permission-denied", les règles Firestore ne sont pas encore déployées.`);
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-paper dark:bg-stone-900 max-w-lg w-full rounded-[30px] shadow-2xl relative animate-[fadeIn_0.3s_ease-out] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-paper/95 dark:bg-stone-900/95 backdrop-blur-sm p-6 border-b border-ink/10 dark:border-white/10 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Nouvelle entrée au calendrier</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 hover:opacity-60"><X size={18} /></button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex bg-ink/5 dark:bg-white/10 rounded-full p-1 mb-4">
            <button onClick={() => setMode("appointment")} className={`flex-1 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-colors ${mode === "appointment" ? "bg-rust text-paper" : "opacity-60"}`}>
              <Users size={11} className="inline mr-1" /> Rendez-vous
            </button>
            <button onClick={() => setMode("personal")} className={`flex-1 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-colors ${mode === "personal" ? "bg-rust text-paper" : "opacity-60"}`}>
              <CalendarIcon size={11} className="inline mr-1" /> Événement perso
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="p-6 pt-2 space-y-4">
          {mode === "appointment" && (
            <>
              <div>
                <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Client existant</label>
                <select value={pickedUid} onChange={(e) => setPickedUid(e.target.value)}
                  className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust">
                  <option value="">— Aucun (entrer manuellement ci-dessous) —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.displayName || u.email}</option>
                  ))}
                </select>
              </div>
              {!pickedUid && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Nom"
                    className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust" />
                  <input type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="Courriel"
                    className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Type</label>
                  <input type="text" value={type} onChange={(e) => setType(e.target.value)}
                    className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust" />
                </div>
                <label className="flex items-center gap-2 mt-6 cursor-pointer">
                  <input type="checkbox" checked={createRoom} onChange={(e) => setCreateRoom(e.target.checked)} className="accent-rust" />
                  <span className="text-xs">Préparer une salle de visioconférence</span>
                </label>
              </div>
            </>
          )}

          {mode === "personal" && (
            <input type="text" value={personalTitle} onChange={(e) => setPersonalTitle(e.target.value)} placeholder="Titre (privé)"
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-base font-serif outline-none focus:border-rust" required />
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust" />
            </div>
            <div>
              <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Heure</label>
              <input type="time" step={1800} value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust" />
            </div>
            <div>
              <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Durée (min)</label>
              <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust">
                {[30, 45, 60, 75, 90, 120].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">
              <FileText size={11} className="inline mr-1" /> Notes
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-serif italic outline-none focus:border-rust resize-none" />
          </div>

          <div className="flex gap-3 pt-2 border-t border-ink/5 dark:border-white/5">
            <button type="submit" disabled={busy} className="bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50">
              {busy ? "…" : "Créer"}
            </button>
            <button type="button" onClick={onClose} className="border border-ink/10 dark:border-white/10 px-5 py-2 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:border-rust hover:text-rust transition-colors">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
