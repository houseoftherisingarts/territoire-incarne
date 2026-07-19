import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Trash2, Mail, Video, Clock, FileText, MessageSquare } from "lucide-react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { fmtDateLong, fmtTime } from "../../../lib/datetime";
import { completeSeance, uncompleteSeance } from "../../../lib/seances";
import { createDailyRoom } from "../../../services/daily";
import type { Appointment } from "../../../types/calendar";

interface Props {
  appointment: Appointment;
  onClose: () => void;
}

export const AppointmentDetailModal = ({ appointment: a, onClose }: Props) => {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(a.notes ?? "");

  const start = a.start.toDate();
  const end = a.end.toDate();

  const approve = async () => {
    setBusy(true);
    try {
      let meetingUrl = a.meetingUrl;
      if (!meetingUrl) {
        try {
          meetingUrl = await createDailyRoom(`apt-${a.id}`);
        } catch (err) {
          console.warn("Daily.co room creation failed:", err);
        }
      }
      await updateDoc(doc(db, "appointments", a.id), { status: "confirmed", meetingUrl, notes });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    setBusy(true);
    try {
      await completeSeance(a.clientUid, doc(db, "appointments", a.id), "completed");
      await updateDoc(doc(db, "appointments", a.id), { notes });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      if (a.status === "completed") {
        // Redonne la séance décomptée avant d'annuler.
        await uncompleteSeance(a.clientUid, doc(db, "appointments", a.id), "cancelled");
        await updateDoc(doc(db, "appointments", a.id), { notes });
      } else {
        await updateDoc(doc(db, "appointments", a.id), { status: "cancelled", notes });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Supprimer définitivement ce rendez-vous ?")) return;
    setBusy(true);
    await deleteDoc(doc(db, "appointments", a.id));
    setBusy(false);
    onClose();
  };

  const saveNotes = async () => {
    if (notes === (a.notes ?? "")) return;
    await updateDoc(doc(db, "appointments", a.id), { notes });
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-paper dark:bg-stone-900 max-w-md w-full rounded-[30px] shadow-2xl relative animate-[fadeIn_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Fermer" className="absolute top-4 right-4 p-2 hover:opacity-60 z-10"><X size={18} /></button>

        <div className="p-6 space-y-4">
          <div>
            <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full inline-block mb-2 ${
              a.status === "confirmed" ? "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100" :
              a.status === "requested" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
              a.status === "cancelled" ? "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300 line-through" :
              "bg-rust/15 text-rust"
            }`}>
              {a.status === "confirmed" ? "Confirmé" : a.status === "requested" ? "En attente" : a.status === "cancelled" ? "Annulé" : "Terminé"}
            </span>
            <h2 className="font-serif text-2xl">{a.clientName || a.clientEmail}</h2>
            <p className="text-xs opacity-60 font-mono mt-0.5">{a.clientEmail}</p>
          </div>

          <div className="space-y-1 text-sm">
            <p className="font-serif">{fmtDateLong(start)}</p>
            <p className="font-mono opacity-70 flex items-center gap-2">
              <Clock size={12} /> {fmtTime(start)} – {fmtTime(end)} ({a.durationMin} min)
            </p>
            {a.type && <p className="text-xs uppercase tracking-widest opacity-60">{a.type}</p>}
          </div>

          {a.meetingUrl && (
            <a href={a.meetingUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-ink/5 dark:bg-white/5 px-3 py-2 rounded-sm hover:bg-rust/10 transition-colors">
              <Video size={14} className="text-rust" />
              <span className="font-serif">Ouvrir la salle de visioconférence</span>
            </a>
          )}

          <div>
            <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">
              <FileText size={11} className="inline mr-1" /> Notes
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={3}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-serif italic outline-none focus:border-rust resize-none" />
          </div>

          <div className="flex flex-wrap gap-2 pt-3 border-t border-ink/5 dark:border-white/5">
            {a.status === "requested" && (
              <button onClick={approve} disabled={busy} className="inline-flex items-center gap-2 bg-forest text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50">
                <Check size={12} /> Approuver
              </button>
            )}
            {a.status === "confirmed" && (
              <button onClick={complete} disabled={busy} className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50">
                <Check size={12} /> Séance complétée
              </button>
            )}
            {a.status !== "cancelled" && (
              <button onClick={reject} disabled={busy} className="inline-flex items-center gap-2 border border-rust/30 text-rust px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:bg-rust hover:text-paper transition-colors disabled:opacity-50">
                <X size={12} /> Annuler
              </button>
            )}
            <a href={`mailto:${a.clientEmail}`} className="inline-flex items-center gap-2 border border-ink/10 dark:border-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:border-rust hover:text-rust transition-colors">
              <Mail size={12} /> Écrire
            </a>
            <button onClick={remove} disabled={busy} className="ml-auto p-2 opacity-40 hover:opacity-100 hover:bg-rust/15 hover:text-rust rounded-full">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
