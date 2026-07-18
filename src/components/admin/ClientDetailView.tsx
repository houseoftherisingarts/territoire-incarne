import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Plus,
  Minus,
  Trash2,
  FolderOpen,
  ExternalLink,
  CalendarDays,
  Video,
} from "lucide-react";
import { doc } from "firebase/firestore";
import { db } from "../../firebase";
import { setForfait, adjustSeances, completeSeance, uncompleteSeance } from "../../lib/seances";
import { MeetingTab } from "./MeetingTab";
import { useChat } from "../../hooks/useChat";
import { useClientDocs } from "../../hooks/useClientDocs";
import { useClientBookings, type BookingStatus } from "../../hooks/useClientBookings";
import type { ClientProfile } from "../../hooks/useClientAuth";
import { Card } from "./sections";
import { PRIMARY_ADMIN_UID, isAdmin as checkIsAdmin } from "../../lib/admins";

// Use the primary admin UID as Elise's identity in chat threads (sender label).
// Messages from any admin UID are still rendered as "from admin" — see ChatTab below.
const ADMIN_UID = PRIMARY_ADMIN_UID;

const STATUS_LABEL: Record<ClientProfile["status"], string> = {
  pending: "En attente",
  accepted: "Acceptée",
  refused: "Refusée",
};

const statusColor = (s: ClientProfile["status"]) =>
  s === "accepted"
    ? "text-emerald-600 dark:text-emerald-400"
    : s === "refused"
    ? "text-red-500 dark:text-red-400"
    : "text-amber-500 dark:text-amber-400";

const fmtDate = (d: Date | null) => {
  if (!d) return "";
  return d.toLocaleDateString("fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtTime = (d: Date | null) => {
  if (!d) return "";
  return d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
};

// ─── Chat ────────────────────────────────────────────────────────────────────

const ChatTab = ({ clientUid }: { clientUid: string }) => {
  const { messages, loading, send } = useChat(clientUid, ADMIN_UID);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await send(text);
    setText("");
  };

  if (loading) return <p className="font-sans text-sm opacity-50 py-10 text-center">Chargement…</p>;

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-3 px-1 py-2">
        {messages.length === 0 && (
          <p className="font-serif italic text-stone-400 text-center py-10">
            Aucun message pour l'instant.
          </p>
        )}
        {messages.map((m) => {
          const isAdmin = checkIsAdmin(m.senderUid);
          return (
            <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                <div
                  className={`px-4 py-2.5 text-sm leading-relaxed font-serif ${
                    isAdmin
                      ? "bg-ink text-stone-100 dark:bg-stone-700 rounded-2xl rounded-br-sm"
                      : "bg-stone-100 dark:bg-white/10 rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
                <p
                  className={`text-[10px] opacity-40 mt-1 font-sans ${
                    isAdmin ? "text-right" : "text-left"
                  }`}
                >
                  {fmtDate(m.sentAt)} {fmtTime(m.sentAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 pt-3 border-t border-ink/10 dark:border-white/10">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Votre message…"
          className="flex-1 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-rust font-serif"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2.5 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors disabled:opacity-40"
        >
          <Send size={12} /> Envoyer
        </button>
      </form>
    </div>
  );
};

// ─── Documents ───────────────────────────────────────────────────────────────

const DocsTab = ({ clientUid }: { clientUid: string }) => {
  const { docs, loading, add, remove } = useClientDocs(clientUid);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", description: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    await add(form.name, form.url, form.description);
    setForm({ name: "", url: "", description: "" });
    setOpen(false);
    setBusy(false);
  };

  if (loading) return <p className="font-sans text-sm opacity-50 py-10 text-center">Chargement…</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
        >
          <Plus size={12} /> Ajouter un document
        </button>
      </div>

      {open && (
        <Card className="p-5">
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-50 mb-1.5">
                Nom du document *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
              />
            </div>
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-50 mb-1.5">
                Lien (optionnel)
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://…"
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-50 mb-1.5">
                Description (optionnel)
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust resize-none font-serif"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50"
              >
                <Plus size={12} /> Ajouter
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 py-2 border border-ink/10 dark:border-white/10 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:border-rust hover:text-rust transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </Card>
      )}

      {docs.length === 0 && !open && (
        <p className="font-serif italic text-stone-400 text-center py-10">
          Aucun document partagé pour l'instant.
        </p>
      )}

      <div className="space-y-3">
        {docs.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex items-start gap-3">
              <FolderOpen size={16} className="shrink-0 mt-0.5 text-rust opacity-70" />
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base">{d.name}</p>
                {d.description && (
                  <p className="font-serif italic text-sm opacity-70 mt-0.5">{d.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-rust text-[11px] font-sans uppercase tracking-widest hover:underline"
                    >
                      <ExternalLink size={11} /> Ouvrir
                    </a>
                  )}
                  <span className="text-[10px] opacity-40 font-sans">{fmtDate(d.addedAt)}</span>
                </div>
              </div>
              <button
                onClick={() => remove(d.id)}
                className="p-1.5 rounded-full opacity-30 hover:opacity-100 hover:bg-rust/10 hover:text-rust transition-all"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── Rendez-vous ─────────────────────────────────────────────────────────────

const STATUS_BOOKING_COLORS: Record<BookingStatus, string> = {
  "à venir": "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
  confirmé: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  annulé: "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
  complété: "text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/40",
};

const BookingsTab = ({ clientUid }: { clientUid: string }) => {
  const { bookings, loading, add, patch, remove } = useClientBookings(clientUid);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", notes: "" });
  const [busy, setBusy] = useState(false);

  // "complété" décompte une séance du forfait; en sortir la redonne.
  const changeStatus = async (b: { id: string; status: BookingStatus }, status: BookingStatus) => {
    const ref = doc(db, "bookings", b.id);
    if (status === "complété" && b.status !== "complété") {
      await completeSeance(clientUid, ref, status);
    } else if (b.status === "complété" && status !== "complété") {
      await uncompleteSeance(clientUid, ref, status);
    } else {
      await patch(b.id, status);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    setBusy(true);
    await add(form.title, form.date, form.time, form.notes);
    setForm({ title: "", date: "", time: "", notes: "" });
    setOpen(false);
    setBusy(false);
  };

  if (loading) return <p className="font-sans text-sm opacity-50 py-10 text-center">Chargement…</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
        >
          <Plus size={12} /> Nouveau rendez-vous
        </button>
      </div>

      {open && (
        <Card className="p-5">
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-50 mb-1.5">
                Titre *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="ex. Séance somatique"
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust font-serif"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-50 mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
                />
              </div>
              <div>
                <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-50 mb-1.5">
                  Heure
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-50 mb-1.5">
                Notes
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust resize-none font-serif"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50"
              >
                <CalendarDays size={12} /> Créer
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 py-2 border border-ink/10 dark:border-white/10 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:border-rust hover:text-rust transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </Card>
      )}

      {bookings.length === 0 && !open && (
        <p className="font-serif italic text-stone-400 text-center py-10">
          Aucun rendez-vous pour l'instant.
        </p>
      )}

      <div className="space-y-3">
        {bookings.map((b) => (
          <Card key={b.id} className="p-5">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-serif text-lg">{b.title}</p>
                <p className="font-sans text-xs opacity-50 mt-0.5">
                  {b.date}
                  {b.time && ` · ${b.time}`}
                </p>
                {b.notes && (
                  <p className="font-serif italic text-sm opacity-70 mt-1">{b.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={b.status}
                  onChange={(e) => changeStatus(b, e.target.value as BookingStatus)}
                  className={`text-[10px] font-sans uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border-0 outline-none cursor-pointer ${STATUS_BOOKING_COLORS[b.status]}`}
                >
                  {(["à venir", "confirmé", "annulé", "complété"] as BookingStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => remove(b.id)}
                  className="p-1.5 rounded-full opacity-30 hover:opacity-100 hover:bg-rust/10 hover:text-rust transition-all"
                  aria-label="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── Séances (forfait + décompte) ────────────────────────────────────────────

const SeancesWidget = ({ client }: { client: ClientProfile }) => {
  const [forfaitVal, setForfaitVal] = useState("");
  const [busy, setBusy] = useState(false);

  const remaining = client.seancesRemaining ?? 0;
  const total = client.seancesTotal;
  const hasForfait = typeof total === "number";

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const applyForfait = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(forfaitVal, 10);
    if (Number.isNaN(n) || n < 0) return;
    await run(() => setForfait(client.uid, n));
    setForfaitVal("");
  };

  return (
    <div className="mt-5 pt-5 border-t border-ink/10 dark:border-white/10 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-center gap-4">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-50 mb-1">Séances restantes</p>
          <p className="font-serif text-3xl leading-none">
            {remaining}
            {hasForfait && (
              <span className="text-base opacity-50"> / {total}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => run(() => adjustSeances(client.uid, -1))}
            disabled={busy || remaining === 0}
            aria-label="Retirer une séance"
            className="p-2 rounded-full border border-ink/10 dark:border-white/10 hover:border-rust hover:text-rust transition-colors disabled:opacity-30"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={() => run(() => adjustSeances(client.uid, 1))}
            disabled={busy}
            aria-label="Ajouter une séance"
            className="p-2 rounded-full border border-ink/10 dark:border-white/10 hover:border-rust hover:text-rust transition-colors disabled:opacity-30"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <form onSubmit={applyForfait} className="flex items-center gap-2 md:ml-auto">
        <input
          type="number"
          min={0}
          value={forfaitVal}
          onChange={(e) => setForfaitVal(e.target.value)}
          placeholder={hasForfait ? `Forfait : ${total}` : "ex. 10"}
          aria-label="Nombre de séances du forfait"
          className="w-28 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
        />
        <button
          type="submit"
          disabled={busy || forfaitVal === ""}
          className="px-4 py-2 border border-ink/10 dark:border-white/10 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:border-rust hover:text-rust transition-colors disabled:opacity-40"
        >
          Définir le forfait
        </button>
      </form>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = "messagerie" | "documents" | "rendez-vous" | "réunion";

interface Props {
  client: ClientProfile;
  onBack: () => void;
  onUpdateStatus: (uid: string, status: ClientProfile["status"]) => Promise<void>;
}

export const ClientDetailView = ({ client, onBack, onUpdateStatus }: Props) => {
  const [tab, setTab] = useState<Tab>("messagerie");
  const [busy, setBusy] = useState(false);

  const act = async (status: ClientProfile["status"]) => {
    setBusy(true);
    await onUpdateStatus(client.uid, status);
    setBusy(false);
  };

  const TABS: { id: Tab; label: string; icon?: React.ReactNode }[] = [
    { id: "messagerie",  label: "Messagerie" },
    { id: "documents",   label: "Documents" },
    { id: "rendez-vous", label: "Rendez-vous" },
    { id: "réunion",     label: "Réunion vidéo", icon: <Video size={11} className="inline mr-1" /> },
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.25em] opacity-50 hover:opacity-100 hover:text-rust transition-all"
      >
        <ArrowLeft size={13} /> Retour aux clientes
      </button>

      <Card className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 shrink-0 flex items-center justify-center font-serif text-xl">
            {client.avatarUrl ? (
              <img src={client.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (client.displayName || client.email)[0].toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-serif text-2xl">{client.displayName || "—"}</p>
            <p className="font-mono text-xs opacity-50 truncate mt-0.5">{client.email}</p>
            <div className={`flex items-center gap-1.5 mt-1.5 font-sans text-[10px] uppercase tracking-widest ${statusColor(client.status)}`}>
              {client.status === "accepted" && <CheckCircle size={12} />}
              {client.status === "refused" && <XCircle size={12} />}
              {client.status === "pending" && <Clock size={12} />}
              {STATUS_LABEL[client.status]}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              disabled={busy || client.status === "accepted"}
              onClick={() => act("accepted")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-sans text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-40"
            >
              <CheckCircle size={11} className="inline mr-1.5" />Accepter
            </button>
            <button
              disabled={busy || client.status === "refused"}
              onClick={() => act("refused")}
              className="px-4 py-2 bg-red-500 text-white rounded-xl font-sans text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-40"
            >
              <XCircle size={11} className="inline mr-1.5" />Refuser
            </button>
            <button
              disabled={busy || client.status === "pending"}
              onClick={() => act("pending")}
              className="px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-xl font-sans text-[10px] uppercase tracking-widest hover:border-stone-400 transition-colors disabled:opacity-40"
            >
              <Clock size={11} className="inline mr-1.5" />En attente
            </button>
          </div>
        </div>
      </Card>

      <div className="border-b border-ink/10 dark:border-white/10 flex gap-6 flex-wrap">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`pb-3 font-sans text-[11px] uppercase tracking-[0.2em] font-bold transition-colors border-b-2 -mb-px ${
              tab === id
                ? "border-rust text-rust"
                : "border-transparent opacity-50 hover:opacity-100"
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      <div>
        {tab === "messagerie"  && <ChatTab     clientUid={client.uid} />}
        {tab === "documents"   && <DocsTab     clientUid={client.uid} />}
        {tab === "rendez-vous" && <BookingsTab clientUid={client.uid} />}
        {tab === "réunion"     && <MeetingTab  clientUid={client.uid} />}
      </div>
    </div>
  );
};
