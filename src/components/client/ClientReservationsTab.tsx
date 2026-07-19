import { useEffect, useMemo, useState } from "react";
import {
  Video, Download, X, Clock, MessageSquare, Sparkles,
} from "lucide-react";
import {
  collection, onSnapshot, query, where, addDoc, serverTimestamp, Timestamp, orderBy,
  doc, updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import {
  fmtDateLong, fmtDateShort, fmtTime, isoDate, addDays,
  combineMontrealDateTime, dayOfWeekMontreal, addMin, halfHourSlots,
} from "../../lib/datetime";
import { buildIcs, downloadIcs } from "../../lib/ical";
import { useTarifs, type Tarif } from "../../hooks/useTarifs";
import type { Appointment, AvailabilitySlot } from "../../types/calendar";

interface Props {
  uid: string;
  email: string;
  displayName: string;
  onOpenMessagerie: () => void;
}

type SubTab = "book" | "mine";

const SLOTS_PER_PAGE = 3;
const HORIZON_DAYS = 60;

const useMyAppointments = (uid: string) => {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(
      collection(db, "appointments"),
      where("clientUid", "==", uid),
      orderBy("start", "asc"),
    );
    return onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
        setLoading(false);
      },
      (err) => {
        console.error("Appointments load failed:", err);
        setLoading(false);
      },
    );
  }, [uid]);
  return { items, loading };
};

export const ClientReservationsTab = ({ uid, email, displayName, onOpenMessagerie }: Props) => {
  const [tab, setTab] = useState<SubTab>("mine");
  const { items: mine, loading } = useMyAppointments(uid);
  const { items: availability } = useFirestoreCollection<AvailabilitySlot>("availability");
  const { tarifs } = useTarifs();
  const consultations = useMemo(
    () => tarifs.filter((t) => t.active && t.category === "consultation"),
    [tarifs],
  );
  // Client only sees their own appointments for conflict detection — Firestore rules
  // (rightly) prevent reading other clients' bookings. Elise handles cross-client
  // overlap when approving requests.
  const taken = useMemo(
    () =>
      mine
        .filter((a) => a.status !== "cancelled")
        .map((a) => ({ start: a.start.toDate(), end: a.end.toDate() })),
    [mine],
  );

  const upcoming = useMemo(
    () => mine.filter((a) => a.end.toDate() >= new Date() && a.status !== "cancelled"),
    [mine],
  );
  const past = useMemo(
    () => mine.filter((a) => a.end.toDate() < new Date() || a.status === "cancelled"),
    [mine],
  );
  const pendingRequest = useMemo(
    () => mine.find((a) => a.status === "requested"),
    [mine],
  );

  return (
    <div className="space-y-6 animate-[fadeIn_0.6s_ease-out]">
      <div className="flex bg-ink/5 dark:bg-white/10 rounded-full p-1 gap-1 max-w-2xl">
        <button
          onClick={() => setTab("mine")}
          className={`flex-1 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-colors ${tab === "mine" ? "bg-rust text-paper" : "opacity-60 hover:opacity-100"}`}
        >
          Mes rendez-vous{upcoming.length > 0 ? ` (${upcoming.length})` : ""}
        </button>
        <button
          onClick={() => setTab("book")}
          className={`flex-1 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-colors ${tab === "book" ? "bg-rust text-paper" : "opacity-60 hover:opacity-100"}`}
        >
          Demander un RDV
        </button>
        <button
          onClick={onOpenMessagerie}
          className="flex-1 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-colors opacity-60 hover:opacity-100 inline-flex items-center justify-center gap-1.5"
        >
          <MessageSquare size={11} /> Envoyer un message
        </button>
      </div>

      {tab === "mine" && (
        <MyAppointments
          loading={loading}
          upcoming={upcoming}
          past={past}
          displayName={displayName}
        />
      )}

      {tab === "book" && (
        <BookingFlow
          uid={uid}
          email={email}
          displayName={displayName}
          availability={availability}
          consultations={consultations}
          taken={taken}
          pendingRequest={pendingRequest ?? null}
          onOpenMessagerie={onOpenMessagerie}
        />
      )}
    </div>
  );
};

const MyAppointments = ({
  loading, upcoming, past, displayName,
}: { loading: boolean; upcoming: Appointment[]; past: Appointment[]; displayName: string }) => {
  const [callOpen, setCallOpen] = useState<Appointment | null>(null);

  const exportSingle = (a: Appointment) => {
    const ics = buildIcs([{
      uid: a.id,
      start: a.start.toDate(),
      end: a.end.toDate(),
      summary: `Rendez-vous avec Elise — ${a.type ?? "Consultation"}`,
      description: a.notes ?? "",
      url: a.meetingUrl,
    }], "Territoire Incarné");
    downloadIcs(`rdv-${isoDate(a.start.toDate())}.ics`, ics);
  };

  const exportAll = () => {
    const events = upcoming.map((a) => ({
      uid: a.id,
      start: a.start.toDate(),
      end: a.end.toDate(),
      summary: `Rendez-vous avec Elise — ${a.type ?? "Consultation"}`,
      description: a.notes ?? "",
      url: a.meetingUrl,
    }));
    const ics = buildIcs(events, "Mes rendez-vous · Territoire Incarné");
    downloadIcs("mes-rendez-vous.ics", ics);
  };

  if (loading) return <p className="font-serif italic opacity-60 py-10 text-center">Chargement…</p>;

  return (
    <div className="space-y-6">
      {callOpen && callOpen.meetingUrl && (
        <CallOverlay url={callOpen.meetingUrl} onClose={() => setCallOpen(null)} />
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <p className="font-serif italic opacity-60 py-10 text-center">
          Vous n'avez encore aucun rendez-vous.
        </p>
      )}

      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-rust dark:text-stone-400">À venir</h3>
            {upcoming.length > 1 && (
              <button onClick={exportAll} className="inline-flex items-center gap-1 text-[10px] font-sans uppercase tracking-widest opacity-60 hover:opacity-100">
                <Download size={11} /> Tout ajouter à mon agenda
              </button>
            )}
          </div>
          <div className="space-y-3">
            {upcoming.map((a) => {
              const start = a.start.toDate();
              const end = a.end.toDate();
              const isPending = a.status === "requested";
              const isToday = isoDate(start) === isoDate(new Date());
              return (
                <div key={a.id} className={`border rounded-2xl p-5 ${isPending ? "border-amber-300 bg-amber-50/50 dark:bg-amber-900/10" : "border-stone-200 dark:border-stone-700 bg-white/40 dark:bg-white/5"}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${isPending ? "bg-amber-200 text-amber-800 dark:bg-amber-700/30 dark:text-amber-200" : "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100"}`}>
                        {isPending ? "En attente d'approbation" : "Confirmé"}
                      </span>
                      <p className="font-serif text-xl mt-2">{fmtDateLong(start)}</p>
                      <p className="font-mono text-sm opacity-70 flex items-center gap-2 mt-1">
                        <Clock size={12} /> {fmtTime(start)} – {fmtTime(end)} ({a.durationMin} min)
                      </p>
                      {a.type && <p className="text-xs uppercase tracking-widest opacity-60 mt-1">{a.type}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      {a.meetingUrl && !isPending && (
                        <button
                          onClick={() => setCallOpen(a)}
                          disabled={!isToday}
                          className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Video size={12} /> {isToday ? "Rejoindre la séance" : "Rejoindre (le jour J)"}
                        </button>
                      )}
                      <button onClick={() => exportSingle(a)} className="inline-flex items-center gap-2 border border-ink/10 dark:border-white/10 px-5 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold hover:border-rust hover:text-rust transition-colors">
                        <Download size={12} /> Ajouter à mon agenda
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="pt-6 border-t border-stone-200 dark:border-stone-700">
          <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] opacity-60 mb-3">Passés</h3>
          <div className="space-y-2">
            {past.slice(0, 8).map((a) => (
              <PastAppointmentRow key={a.id} a={a} />
            ))}
          </div>
        </div>
      )}
      <p className="text-[10px] uppercase tracking-widest opacity-40 text-center pt-4">
        Bienvenue, {displayName.split(" ")[0] || ""}.
      </p>
    </div>
  );
};

const BookingFlow = ({
  uid, email, displayName, availability, consultations, taken, pendingRequest, onOpenMessagerie,
}: {
  uid: string;
  email: string;
  displayName: string;
  availability: AvailabilitySlot[];
  consultations: Tarif[];
  taken: Array<{ start: Date; end: Date }>;
  pendingRequest: Appointment | null;
  onOpenMessagerie: () => void;
}) => {
  const [consultationId, setConsultationId] = useState<string>(consultations[0]?.id ?? "");
  const consultation = consultations.find((c) => c.id === consultationId) ?? null;
  const duration = consultation?.durationMin ?? 60;
  const [picked, setPicked] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [page, setPage] = useState(0);

  // Default to first consultation when list arrives
  useEffect(() => {
    if (!consultationId && consultations[0]) setConsultationId(consultations[0].id);
  }, [consultations, consultationId]);

  // Reset pagination when consultation changes
  useEffect(() => {
    setPage(0);
    setPicked(null);
  }, [consultationId]);

  // Compute the chronological list of upcoming available start times across the next HORIZON_DAYS,
  // for the chosen consultation duration, excluding the user's own conflicts.
  const allSlots = useMemo(() => {
    if (!consultation) return [];
    const out: Date[] = [];
    const now = new Date();
    for (let dayOffset = 0; dayOffset < HORIZON_DAYS; dayOffset++) {
      const day = addDays(now, dayOffset);
      const dKey = isoDate(day);
      const dow = dayOfWeekMontreal(day);
      const windows = availability.filter(
        (a) =>
          a.active &&
          (a.category ?? "consultation") === "consultation" &&
          (a.recurring ? a.dayOfWeek === dow : a.date === dKey),
      );
      for (const w of windows) {
        let cur = w.startTime;
        while (cur < w.endTime) {
          const start = combineMontrealDateTime(dKey, cur);
          const end = new Date(start.getTime() + duration * 60_000);
          const endTimeStr = addMin(cur, duration);
          // Slot fully fits within the window?
          if (endTimeStr > w.endTime || !halfHourSlots().includes(endTimeStr)) {
            cur = addMin(cur, 30);
            continue;
          }
          if (start > now) {
            const conflict = taken.some((t) => t.start < end && t.end > start);
            if (!conflict) out.push(start);
          }
          cur = addMin(cur, 30);
        }
      }
    }
    return out.sort((a, b) => a.getTime() - b.getTime());
  }, [availability, consultation, duration, taken]);

  const visibleSlots = allSlots.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE);
  const hasNext = (page + 1) * SLOTS_PER_PAGE < allSlots.length;
  const hasPrev = page > 0;

  const submit = async () => {
    if (!picked || !consultation) return;
    setBusy(true);
    try {
      const end = new Date(picked.getTime() + duration * 60_000);
      await addDoc(collection(db, "appointments"), {
        clientUid: uid,
        clientName: displayName,
        clientEmail: email,
        start: Timestamp.fromDate(picked),
        end: Timestamp.fromDate(end),
        durationMin: duration,
        status: "requested",
        type: consultation.name,
        consultationId: consultation.id,
        priceQuoted: consultation.price,
        notes: "",
        meetingUrl: "",
        createdBy: "client",
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setPicked(null);
    } catch (err) {
      console.error("Demande échouée:", err);
      alert("Impossible d'envoyer la demande. Réessayez ou écrivez à Elise.");
    } finally {
      setBusy(false);
    }
  };

  // Pending request: top banner + prevent new requests
  if (pendingRequest) {
    const start = pendingRequest.start.toDate();
    const end = pendingRequest.end.toDate();
    return (
      <div className="space-y-6">
        <div className="border-2 border-amber-300 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-900/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-amber-600 dark:text-amber-400" />
            <span className="font-sans uppercase tracking-widest text-[10px] font-bold text-amber-700 dark:text-amber-300">
              Demande en attente
            </span>
          </div>
          <div>
            <p className="font-serif text-xl">{fmtDateLong(start)}</p>
            <p className="font-mono text-sm opacity-70 mt-1">
              {fmtTime(start)} – {fmtTime(end)} · {pendingRequest.durationMin} min
            </p>
            {pendingRequest.type && (
              <p className="text-xs uppercase tracking-widest opacity-60 mt-1">{pendingRequest.type}</p>
            )}
          </div>
          <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            Elise examine votre demande et reviendra vers vous bientôt. Vous recevrez une notification dans
            <em> Mes rendez-vous</em> dès qu'elle aura confirmé.
          </p>
          <button
            onClick={onOpenMessagerie}
            className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-rust hover:text-ink dark:hover:text-stone-100 transition-colors"
          >
            <MessageSquare size={12} /> Lui écrire un mot
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="border border-forest/30 bg-forest/5 dark:bg-forest/10 rounded-2xl p-6 text-center space-y-3">
        <Sparkles className="mx-auto text-forest" size={28} />
        <p className="font-serif text-lg">Demande envoyée. Elise vous confirmera bientôt.</p>
        <p className="text-xs font-sans uppercase tracking-widest opacity-50">
          Vous la verrez ici en attente, et dans <em>Mes rendez-vous</em> une fois confirmée.
        </p>
        <button onClick={() => setSuccess(false)} className="text-xs font-sans uppercase tracking-widest opacity-60 hover:opacity-100">
          OK
        </button>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <p className="font-serif italic opacity-60 py-12 text-center">
        Aucun soin disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consultation picker */}
      <div>
        <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 mb-2">
          Choisissez un soin
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {consultations.map((c) => {
            const sel = c.id === consultationId;
            return (
              <button
                key={c.id}
                onClick={() => { setConsultationId(c.id); }}
                className={`text-left p-4 rounded-2xl border transition-colors ${sel ? "border-rust bg-rust/5 dark:bg-rust/10" : "border-stone-200 dark:border-stone-700 hover:border-rust/50"}`}
              >
                {c.shortTag && (
                  <span className="block text-[10px] font-sans uppercase tracking-widest text-rust dark:text-stone-400 mb-1">
                    {c.shortTag}
                  </span>
                )}
                <p className="font-serif text-base leading-tight">{c.name}</p>
                <p className="text-sm text-rust dark:text-stone-300 mt-1">
                  {c.price.toFixed(0)} $
                  {c.durationMin && <span className="opacity-50 ml-1 text-xs">· {c.durationMin} min</span>}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available slots */}
      <div className="pt-3 border-t border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-rust dark:text-stone-400">
            Prochaines plages disponibles
          </p>
          {allSlots.length > SLOTS_PER_PAGE && (
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono">
              {Math.min((page + 1) * SLOTS_PER_PAGE, allSlots.length)} / {allSlots.length}
            </p>
          )}
        </div>

        {allSlots.length === 0 ? (
          <p className="font-serif italic opacity-60 py-6 text-center">
            Aucune plage disponible dans les {HORIZON_DAYS} prochains jours.
            <br />
            <button onClick={onOpenMessagerie} className="text-rust hover:text-ink dark:hover:text-stone-100 transition-colors text-sm uppercase tracking-widest font-bold mt-2 inline-flex items-center gap-1">
              <MessageSquare size={11} /> Écrire à Elise
            </button>
          </p>
        ) : (
          <div className="space-y-2">
            {visibleSlots.map((s) => {
              const selected = picked?.getTime() === s.getTime();
              return (
                <button
                  key={s.getTime()}
                  onClick={() => setPicked(selected ? null : s)}
                  className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-colors text-left ${selected ? "border-rust bg-rust/10 dark:bg-rust/20" : "border-stone-200 dark:border-stone-700 bg-white/40 dark:bg-white/5 hover:border-rust/50"}`}
                >
                  <div>
                    <p className="font-serif text-base leading-tight">{fmtDateLong(s)}</p>
                    <p className="font-mono text-sm opacity-70 mt-0.5">{fmtTime(s)} · {duration} min</p>
                  </div>
                  {selected && (
                    <span className="text-[10px] uppercase tracking-widest font-bold text-rust">
                      Sélectionné
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {(hasPrev || hasNext) && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => { setPage(page - 1); setPicked(null); }}
              disabled={!hasPrev}
              className="text-xs font-sans uppercase tracking-widest opacity-60 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              ← Précédentes
            </button>
            <button
              onClick={() => { setPage(page + 1); setPicked(null); }}
              disabled={!hasNext}
              className="text-xs font-sans uppercase tracking-widest opacity-60 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              Voir d'autres →
            </button>
          </div>
        )}
      </div>

      {picked && consultation && (
        <div className="border border-rust/30 bg-rust/5 dark:bg-white/5 rounded-2xl p-5">
          <p className="text-[10px] font-sans uppercase tracking-widest text-rust dark:text-stone-400 mb-1">
            {consultation.shortTag || consultation.name}
          </p>
          <p className="font-serif text-lg mb-1">
            {fmtDateLong(picked)} · {fmtTime(picked)}
          </p>
          <p className="text-sm opacity-70">
            {consultation.name} · {duration} min · {consultation.price.toFixed(0)} $
          </p>
          <button onClick={submit} disabled={busy} className="mt-4 bg-rust text-paper px-6 py-2 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-ink transition-colors disabled:opacity-50">
            {busy ? "Envoi…" : "Envoyer la demande"}
          </button>
        </div>
      )}
    </div>
  );
};

const CallOverlay = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden">
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-3 right-3 z-10 bg-black/60 text-white p-2 rounded-full hover:bg-rust transition-colors"
      >
        <X size={18} />
      </button>
      <iframe
        src={url}
        title="Visioconférence"
        allow="camera; microphone; fullscreen; speaker; display-capture"
        className="w-full h-full border-0"
      />
    </div>
  </div>
);
