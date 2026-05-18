import { useMemo, useState } from "react";
import {
  Check,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Eye,
  EyeOff,
  Pencil,
  Calendar as CalendarIcon,
  Link as LinkIcon,
} from "lucide-react";
import type {
  AdminData,
  Transaction,
  Booking,
  Message,
  Product,
  EventItem,
  Post,
  Subscriber,
  TransactionCategory,
} from "../../hooks/useAdminStore";
import type { AdminSectionId } from "./AdminShell";

const uid = () => Math.random().toString(36).slice(2, 10);
const money = (n: number) => n.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Shared primitives ────────────────────────────────────────────────────────

export const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white/70 dark:bg-black/20 border border-ink/5 dark:border-white/5 rounded-[20px] shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <span className="block text-[10px] font-sans uppercase tracking-[0.3em] text-rust font-bold">
    {children}
  </span>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-sans uppercase tracking-[0.25em] opacity-60 font-bold mb-4">
    {children}
  </h3>
);

// ─── Dashboard (overview) ─────────────────────────────────────────────────────

interface DashboardProps {
  data: AdminData;
  onNavigate: (s: AdminSectionId) => void;
}

export const DashboardSection = ({ data, onNavigate }: DashboardProps) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const monthRevenue = data.transactions
    .filter((t) => t.date >= monthStart && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = data.transactions
    .filter((t) => t.date >= monthStart && t.amount < 0)
    .reduce((s, t) => s + t.amount, 0);
  const newBookings = data.bookings.filter((b) => b.status === "nouvelle").length;
  const upcomingEvents = data.events.filter((e) => new Date(e.date) >= now).length;
  const unread = data.messages.filter((m) => !m.read).length;

  const stats = [
    { label: "Revenus du mois",  value: money(monthRevenue), section: "finances" as const },
    { label: "Dépenses du mois", value: money(monthExpense), section: "finances" as const },
    { label: "Nouvelles demandes", value: String(newBookings), section: "bookings" as const },
    { label: "Événements à venir", value: String(upcomingEvents), section: "events" as const },
    { label: "Messages non lus",   value: String(unread), section: "messages" as const },
    { label: "Infolettre",          value: String(data.subscribers.length), section: "newsletter" as const },
  ];

  return (
    <div className="space-y-8">
      <Card className="p-6 md:p-8 bg-gradient-to-br from-ink to-charcoal text-stone-100 border-rust/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <Kicker>Bienvenue</Kicker>
            <h2 className="text-2xl md:text-3xl font-light mt-3 mb-1">
              Votre territoire, en un regard.
            </h2>
            <p className="text-sm text-stone-100/70 max-w-xl font-serif italic">
              Un lieu intime pour tenir votre pratique, vos échanges, votre économie et vos écrits.
            </p>
          </div>
          <button
            onClick={() => onNavigate("calendar")}
            className="shrink-0 inline-flex items-center gap-2 bg-rust text-paper px-6 py-3 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:bg-paper hover:text-ink transition-colors"
          >
            <CalendarIcon size={14} /> Ouvrir le calendrier
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 hover:shadow-md transition-shadow">
            <button onClick={() => onNavigate(s.section)} className="w-full text-left">
              <p className="text-3xl md:text-4xl font-light">{s.value}</p>
              <p className="text-[10px] uppercase tracking-[0.25em] mt-2 font-sans opacity-60 font-bold">
                {s.label}
              </p>
            </button>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <SectionTitle>Dernières demandes</SectionTitle>
          {data.bookings.slice(0, 5).length === 0 ? (
            <p className="text-sm opacity-50 italic font-serif">Aucune demande pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {data.bookings.slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm gap-3">
                  <div className="min-w-0">
                    <p className="font-serif truncate">{b.clientName}</p>
                    <p className="text-xs opacity-50 truncate">
                      {b.service} · {fmtDate(b.date)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full ${
                      b.status === "confirmée"
                        ? "bg-forest/10 text-forest dark:bg-forest/30 dark:text-stone-100"
                        : b.status === "annulée"
                        ? "bg-red-50 text-red-500"
                        : "bg-rust/15 text-rust"
                    }`}
                  >
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <SectionTitle>Prochains événements</SectionTitle>
          {data.events.length === 0 ? (
            <p className="text-sm opacity-50 italic font-serif">Aucun événement planifié.</p>
          ) : (
            <ul className="space-y-3">
              {data.events.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm gap-3">
                  <div className="min-w-0">
                    <p className="font-serif truncate">{e.title}</p>
                    <p className="text-xs opacity-50 truncate">
                      {fmtDate(e.date)} · {e.location}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full bg-rust/10 text-rust">
                    {e.registered}/{e.capacity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

// ─── Calendar ─────────────────────────────────────────────────────────────────

interface CalendarProps {
  embedSrc: string | null;
  onSave: (src: string | null) => void;
}

const normalizeCalendarSrc = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.includes("<iframe")) {
    const match = trimmed.match(/src=["']([^"']+)["']/);
    if (match) return match[1];
  }
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.includes("@")) {
    return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(trimmed)}&ctz=America%2FMontreal`;
  }
  return trimmed;
};

export const CalendarSection = ({ embedSrc, onSave }: CalendarProps) => {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(embedSrc === null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const src = normalizeCalendarSrc(draft);
    if (!src) return;
    onSave(src);
    setDraft("");
    setEditing(false);
  };

  const disconnect = () => {
    onSave(null);
    setEditing(true);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <Kicker>Google Calendar</Kicker>
            <h2 className="text-xl md:text-2xl font-light mt-2">Votre calendrier, intégré.</h2>
            <p className="text-sm opacity-70 font-serif italic mt-1">
              Collez le lien ou le code d'intégration d'un calendrier Google public, ou l'adresse de
              votre calendrier (ex. <span className="font-mono not-italic">vous@gmail.com</span>).
            </p>
          </div>
          {embedSrc && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 inline-flex items-center gap-2 bg-ink/5 dark:bg-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:bg-rust hover:text-paper transition-colors"
            >
              <Pencil size={12} /> Modifier
            </button>
          )}
        </div>

        {(editing || !embedSrc) && (
          <form onSubmit={submit} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3">
              <LinkIcon size={14} className="opacity-50" />
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="https://calendar.google.com/calendar/embed?src=… ou vous@gmail.com"
                className="flex-1 bg-transparent py-3 outline-none font-mono text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-rust text-paper px-6 py-3 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
            >
              Connecter
            </button>
            {embedSrc && (
              <button
                type="button"
                onClick={disconnect}
                className="px-6 py-3 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans border border-ink/10 dark:border-white/10 hover:border-rust hover:text-rust transition-colors"
              >
                Déconnecter
              </button>
            )}
          </form>
        )}
      </Card>

      {embedSrc ? (
        <Card className="p-0 overflow-hidden">
          <iframe
            src={embedSrc}
            title="Google Calendar"
            className="w-full h-[70vh] border-0 bg-white"
          />
        </Card>
      ) : (
        <Card className="p-10 text-center font-serif italic opacity-60">
          Aucun calendrier connecté pour l'instant.
        </Card>
      )}
    </div>
  );
};

// ─── Finances ─────────────────────────────────────────────────────────────────

interface FinancesProps {
  transactions: Transaction[];
  onChange: (next: Transaction[]) => void;
}

const CATEGORIES: TransactionCategory[] = ["Thérapie", "Atelier", "Événement", "Boutique", "Dépense"];

export const FinancesSection = ({ transactions, onChange }: FinancesProps) => {
  const [form, setForm] = useState<{ date: string; label: string; amount: string; category: TransactionCategory }>({
    date: new Date().toISOString().slice(0, 10),
    label: "",
    amount: "",
    category: "Thérapie",
  });

  const totals = useMemo(() => {
    const revenue = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
    return { revenue, expense, net: revenue + expense };
  }, [transactions]);

  const byCategory = useMemo(() => {
    const map = new Map<TransactionCategory, number>();
    for (const t of transactions) map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    return Array.from(map.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  }, [transactions]);

  const monthly = useMemo(() => {
    const bins = new Map<string, { revenue: number; expense: number }>();
    for (const t of transactions) {
      const key = t.date.slice(0, 7);
      const bin = bins.get(key) ?? { revenue: 0, expense: 0 };
      if (t.amount >= 0) bin.revenue += t.amount;
      else bin.expense += Math.abs(t.amount);
      bins.set(key, bin);
    }
    return Array.from(bins.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  }, [transactions]);

  const max = monthly.reduce((m, [, v]) => Math.max(m, v.revenue, v.expense), 1);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.label.trim() || Number.isNaN(amt)) return;
    const signed = form.category === "Dépense" ? -Math.abs(amt) : Math.abs(amt);
    onChange([{ id: uid(), date: form.date, label: form.label.trim(), amount: signed, category: form.category }, ...transactions]);
    setForm({ ...form, label: "", amount: "" });
  };

  const remove = (id: string) => onChange(transactions.filter((t) => t.id !== id));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <Kicker>Revenus</Kicker>
          <p className="text-3xl md:text-4xl font-light mt-3 text-forest dark:text-stone-100 flex items-center gap-2">
            <ArrowUpRight size={20} className="text-forest" />
            {money(totals.revenue)}
          </p>
        </Card>
        <Card className="p-6">
          <Kicker>Dépenses</Kicker>
          <p className="text-3xl md:text-4xl font-light mt-3 flex items-center gap-2 text-rust">
            <ArrowDownRight size={20} />
            {money(Math.abs(totals.expense))}
          </p>
        </Card>
        <Card className="p-6">
          <Kicker>Net</Kicker>
          <p className="text-3xl md:text-4xl font-light mt-3">{money(totals.net)}</p>
        </Card>
      </div>

      <Card className="p-6">
        <SectionTitle>Tendance · 6 derniers mois</SectionTitle>
        {monthly.length === 0 ? (
          <p className="text-sm opacity-50 italic font-serif">Aucune donnée encore.</p>
        ) : (
          <div className="flex items-end justify-between gap-3 h-40">
            {monthly.map(([month, v]) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end gap-1 h-32">
                  <div
                    className="flex-1 bg-forest/70 dark:bg-forest rounded-t-sm transition-all"
                    style={{ height: `${(v.revenue / max) * 100}%` }}
                    title={`Revenus ${money(v.revenue)}`}
                  />
                  <div
                    className="flex-1 bg-rust/70 rounded-t-sm transition-all"
                    style={{ height: `${(v.expense / max) * 100}%` }}
                    title={`Dépenses ${money(v.expense)}`}
                  />
                </div>
                <span className="text-[10px] font-sans uppercase tracking-widest opacity-60">
                  {month.slice(5)}/{month.slice(2, 4)}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 flex items-center gap-5 text-[10px] font-sans uppercase tracking-widest opacity-70">
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-forest/70" /> Revenus</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-rust/70" /> Dépenses</span>
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle>Par catégorie</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {byCategory.map(([cat, total]) => {
            const ratio = Math.min(100, Math.round((Math.abs(total) / Math.max(1, totals.revenue)) * 100));
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-serif">{cat}</span>
                  <span className={`font-bold ${total < 0 ? "text-rust" : ""}`}>{money(total)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all ${total < 0 ? "bg-rust" : "bg-forest"}`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle>Ajouter une transaction</SectionTitle>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-[140px_1fr_140px_160px_auto] gap-3">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <input
            type="text"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Description"
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="Montant"
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as TransactionCategory })}
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
          >
            <Plus size={12} /> Ajouter
          </button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-3">
          <SectionTitle>Transactions récentes</SectionTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/5 dark:border-white/5">
                {["Date", "Description", "Catégorie", "Montant", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-6 text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 font-bold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-ink/5 dark:border-white/5 group">
                  <td className="py-3 px-6 font-mono text-xs opacity-70">{fmtDate(t.date)}</td>
                  <td className="py-3 px-6 font-serif">{t.label}</td>
                  <td className="py-3 px-6">
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-ink/5 dark:bg-white/10">
                      {t.category}
                    </span>
                  </td>
                  <td className={`py-3 px-6 font-bold ${t.amount < 0 ? "text-rust" : "text-forest dark:text-stone-100"}`}>
                    {money(t.amount)}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      onClick={() => remove(t.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-rust hover:text-ink"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center italic opacity-50 font-serif">
                    Aucune transaction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ─── Bookings ────────────────────────────────────────────────────────────────

interface BookingsProps {
  bookings: Booking[];
  onChange: (next: Booking[]) => void;
}

export const BookingsSection = ({ bookings, onChange }: BookingsProps) => {
  const setStatus = (id: string, status: Booking["status"]) =>
    onChange(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
  const remove = (id: string) => onChange(bookings.filter((b) => b.id !== id));

  return (
    <div className="space-y-4">
      {bookings.length === 0 && (
        <Card className="p-10 text-center italic opacity-60 font-serif">Aucune demande.</Card>
      )}
      {bookings.map((b) => (
        <Card key={b.id} className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xl font-light">{b.clientName}</p>
              <p className="text-xs opacity-60">
                {b.email} · <span className="font-serif italic">{b.service}</span> · {fmtDate(b.date)}
              </p>
              {b.notes && <p className="text-sm opacity-80 mt-2 font-serif italic">{b.notes}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
                  b.status === "confirmée"
                    ? "bg-forest/15 text-forest dark:bg-forest/40 dark:text-stone-100"
                    : b.status === "annulée"
                    ? "bg-red-50 text-red-500"
                    : "bg-rust/15 text-rust"
                }`}
              >
                {b.status}
              </span>
              {b.status !== "confirmée" && (
                <button
                  onClick={() => setStatus(b.id, "confirmée")}
                  className="p-2 rounded-full hover:bg-forest/15 text-forest dark:text-stone-100"
                  aria-label="Confirmer"
                >
                  <Check size={14} />
                </button>
              )}
              {b.status !== "annulée" && (
                <button
                  onClick={() => setStatus(b.id, "annulée")}
                  className="p-2 rounded-full hover:bg-rust/15 text-rust"
                  aria-label="Annuler"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => remove(b.id)}
                className="p-2 rounded-full opacity-40 hover:opacity-100 hover:bg-ink/5 dark:hover:bg-white/10"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ─── Messages ────────────────────────────────────────────────────────────────

interface MessagesProps {
  messages: Message[];
  onChange: (next: Message[]) => void;
}

export const MessagesSection = ({ messages, onChange }: MessagesProps) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleRead = (id: string, read: boolean) =>
    onChange(messages.map((m) => (m.id === id ? { ...m, read } : m)));
  const remove = (id: string) => {
    if (openId === id) setOpenId(null);
    onChange(messages.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-3">
      {messages.length === 0 && (
        <Card className="p-10 text-center italic opacity-60 font-serif">Boîte vide.</Card>
      )}
      {messages.map((m) => {
        const open = openId === m.id;
        return (
          <Card key={m.id} className={`p-5 ${!m.read ? "border-rust/30" : ""}`}>
            <button
              onClick={() => {
                setOpenId(open ? null : m.id);
                if (!m.read) toggleRead(m.id, true);
              }}
              className="w-full text-left"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <Mail size={16} className={m.read ? "opacity-30" : "text-rust"} />
                  <div className="min-w-0">
                    <p className="text-base">
                      <span className={m.read ? "opacity-70" : "font-bold"}>{m.from}</span>{" "}
                      <span className="opacity-40 text-xs">· {m.email}</span>
                    </p>
                    <p className="text-sm opacity-80 font-serif italic truncate">{m.subject}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest opacity-50 font-sans shrink-0">
                  {fmtDate(m.date)}
                </span>
              </div>
            </button>
            {open && (
              <div className="mt-4 pt-4 border-t border-ink/5 dark:border-white/5">
                <p className="text-sm font-serif leading-relaxed whitespace-pre-wrap">{m.body}</p>
                <div className="mt-4 flex gap-2">
                  <a
                    href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                    className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:bg-ink transition-colors"
                  >
                    <Mail size={12} /> Répondre
                  </a>
                  <button
                    onClick={() => toggleRead(m.id, !m.read)}
                    className="inline-flex items-center gap-2 border border-ink/10 dark:border-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:border-rust hover:text-rust transition-colors"
                  >
                    {m.read ? <EyeOff size={12} /> : <Eye size={12} />} Marquer {m.read ? "non lu" : "lu"}
                  </button>
                  <button
                    onClick={() => remove(m.id)}
                    className="inline-flex items-center gap-2 border border-ink/10 dark:border-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:border-red-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} /> Supprimer
                  </button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

// ─── Boutique ────────────────────────────────────────────────────────────────

interface BoutiqueProps {
  products: Product[];
  onChange: (next: Product[]) => void;
}

export const BoutiqueSection = ({ products, onChange }: BoutiqueProps) => {
  const [form, setForm] = useState<{ title: string; price: string; stock: string }>({
    title: "",
    price: "",
    stock: "0",
  });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (!form.title.trim() || Number.isNaN(price)) return;
    onChange([
      { id: uid(), title: form.title.trim(), price, stock: Number.isFinite(stock) ? stock : 0, active: true },
      ...products,
    ]);
    setForm({ title: "", price: "", stock: "0" });
  };

  const patch = (id: string, p: Partial<Product>) =>
    onChange(products.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const remove = (id: string) => onChange(products.filter((x) => x.id !== id));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionTitle>Ajouter un produit</SectionTitle>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px_auto] gap-3">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Titre"
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Prix"
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <input
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            placeholder="Stock"
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
          >
            <Plus size={12} /> Ajouter
          </button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-light">{p.title}</p>
                <p className="text-xs opacity-60 mt-1">
                  {money(p.price)} · stock {p.stock}{" "}
                  {p.stock === 0 && <span className="text-red-400 ml-1">· rupture</span>}
                </p>
              </div>
              <button
                onClick={() => patch(p.id, { active: !p.active })}
                className={`shrink-0 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full transition-colors ${
                  p.active ? "bg-forest/15 text-forest dark:bg-forest/40 dark:text-stone-100" : "bg-ink/5 dark:bg-white/10 opacity-50"
                }`}
              >
                {p.active ? "Actif" : "Désactivé"}
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                value={p.stock}
                onChange={(e) => patch(p.id, { stock: parseInt(e.target.value, 10) || 0 })}
                className="w-24 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-rust"
              />
              <input
                type="number"
                step="0.01"
                value={p.price}
                onChange={(e) => patch(p.id, { price: parseFloat(e.target.value) || 0 })}
                className="w-28 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-rust"
              />
              <button
                onClick={() => remove(p.id)}
                className="ml-auto p-2 rounded-full opacity-40 hover:opacity-100 hover:bg-rust/15 hover:text-rust"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
        {products.length === 0 && (
          <Card className="p-10 text-center italic opacity-60 font-serif col-span-full">
            Aucun produit.
          </Card>
        )}
      </div>
    </div>
  );
};

// ─── Events ──────────────────────────────────────────────────────────────────

interface EventsProps {
  events: EventItem[];
  onChange: (next: EventItem[]) => void;
}

export const EventsSection = ({ events, onChange }: EventsProps) => {
  const [form, setForm] = useState({ title: "", date: "", location: "", capacity: "20" });
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const cap = parseInt(form.capacity, 10) || 0;
    if (!form.title.trim() || !form.date) return;
    onChange([
      { id: uid(), title: form.title.trim(), date: form.date, location: form.location.trim() || "À préciser", capacity: cap, registered: 0 },
      ...events,
    ]);
    setForm({ title: "", date: "", location: "", capacity: "20" });
  };
  const remove = (id: string) => onChange(events.filter((e) => e.id !== id));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionTitle>Nouvel événement</SectionTitle>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-[1fr_160px_1fr_120px_auto] gap-3">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Titre"
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Lieu"
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <input
            type="number"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            placeholder="Capacité"
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
          >
            <Plus size={12} /> Ajouter
          </button>
        </form>
      </Card>

      <div className="space-y-3">
        {events.map((e) => {
          const full = e.registered >= e.capacity;
          const ratio = e.capacity ? Math.round((e.registered / e.capacity) * 100) : 0;
          return (
            <Card key={e.id} className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-light">{e.title}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {fmtDate(e.date)} · <span className="font-serif italic">{e.location}</span>
                  </p>
                </div>
                <div className="min-w-[160px]">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{e.registered}/{e.capacity} inscrits</span>
                    {full && <span className="text-rust font-bold">Complet</span>}
                  </div>
                  <div className="h-1.5 rounded-full bg-ink/5 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full ${full ? "bg-rust" : "bg-forest"} transition-all`} style={{ width: `${ratio}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => remove(e.id)}
                  className="p-2 rounded-full opacity-40 hover:opacity-100 hover:bg-rust/15 hover:text-rust"
                  aria-label="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          );
        })}
        {events.length === 0 && (
          <Card className="p-10 text-center italic opacity-60 font-serif">Aucun événement.</Card>
        )}
      </div>
    </div>
  );
};

// ─── Writings ────────────────────────────────────────────────────────────────

interface PostsProps {
  posts: Post[];
  onChange: (next: Post[]) => void;
}

export const WritingsSection = ({ posts, onChange }: PostsProps) => {
  const [form, setForm] = useState({ title: "", excerpt: "" });
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onChange([
      { id: uid(), title: form.title.trim(), excerpt: form.excerpt.trim(), date: new Date().toISOString().slice(0, 10), published: false },
      ...posts,
    ]);
    setForm({ title: "", excerpt: "" });
  };
  const patch = (id: string, p: Partial<Post>) => onChange(posts.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const remove = (id: string) => onChange(posts.filter((x) => x.id !== id));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionTitle>Nouveau texte</SectionTitle>
        <form onSubmit={add} className="space-y-3">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Titre"
            className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-base font-serif outline-none focus:border-rust"
          />
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="Extrait…"
            rows={3}
            className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-serif outline-none focus:border-rust resize-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
          >
            <Plus size={12} /> Créer brouillon
          </button>
        </form>
      </Card>

      <div className="space-y-3">
        {posts.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-xl font-light">{p.title}</p>
                  <span
                    className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                      p.published ? "bg-forest/15 text-forest dark:bg-forest/40 dark:text-stone-100" : "bg-ink/5 dark:bg-white/10 opacity-60"
                    }`}
                  >
                    {p.published ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <p className="text-xs opacity-60">{fmtDate(p.date)}</p>
                {p.excerpt && <p className="text-sm mt-2 font-serif italic opacity-80">{p.excerpt}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => patch(p.id, { published: !p.published })}
                  className="inline-flex items-center gap-2 border border-ink/10 dark:border-white/10 px-3 py-1.5 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:border-rust hover:text-rust transition-colors"
                >
                  {p.published ? <EyeOff size={12} /> : <Eye size={12} />}
                  {p.published ? "Dépublier" : "Publier"}
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="p-2 rounded-full opacity-40 hover:opacity-100 hover:bg-rust/15 hover:text-rust"
                  aria-label="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {posts.length === 0 && (
          <Card className="p-10 text-center italic opacity-60 font-serif">Aucun texte encore.</Card>
        )}
      </div>
    </div>
  );
};

// ─── Newsletter ──────────────────────────────────────────────────────────────

interface NewsletterProps {
  subscribers: Subscriber[];
  onChange: (next: Subscriber[]) => void;
}

export const NewsletterSection = ({ subscribers, onChange }: NewsletterProps) => {
  const [form, setForm] = useState({ email: "", name: "" });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email || subscribers.some((s) => s.email.toLowerCase() === email)) return;
    onChange([
      { id: uid(), email, name: form.name.trim() || undefined, joinedAt: new Date().toISOString().slice(0, 10) },
      ...subscribers,
    ]);
    setForm({ email: "", name: "" });
  };
  const remove = (id: string) => onChange(subscribers.filter((s) => s.id !== id));

  const exportCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [
      ["Email", "Nom", "Inscrit le"],
      ...subscribers.map((s) => [s.email, s.name ?? "", s.joinedAt]),
    ]
      .map((r) => r.map(esc).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "infolettre-territoire-incarne.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <Kicker>Abonné·e·s</Kicker>
          <p className="text-3xl font-light mt-3">{subscribers.length}</p>
        </Card>
        <Card className="p-5">
          <Kicker>Ce mois-ci</Kicker>
          <p className="text-3xl font-light mt-3">
            {
              subscribers.filter((s) => s.joinedAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)).length
            }
          </p>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <Kicker>Export</Kicker>
            <p className="text-xs opacity-70 mt-2 font-serif italic">Télécharger la liste complète</p>
          </div>
          <button
            onClick={exportCsv}
            className="bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:bg-ink transition-colors"
          >
            CSV
          </button>
        </Card>
      </div>

      <Card className="p-6">
        <SectionTitle>Ajouter une personne</SectionTitle>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="courriel@exemple.com"
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
            required
          />
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nom (facultatif)"
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
          >
            <Plus size={12} /> Ajouter
          </button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-3">
          <SectionTitle>Liste</SectionTitle>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/5 dark:border-white/5">
              {["Courriel", "Nom", "Inscrit le", ""].map((h) => (
                <th
                  key={h}
                  className="text-left py-3 px-6 text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 font-bold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-ink/5 dark:border-white/5 group">
                <td className="py-3 px-6 font-mono text-xs">{s.email}</td>
                <td className="py-3 px-6 font-serif">{s.name ?? <span className="opacity-40">—</span>}</td>
                <td className="py-3 px-6 text-xs opacity-70">{fmtDate(s.joinedAt)}</td>
                <td className="py-3 px-6 text-right">
                  <button
                    onClick={() => remove(s.id)}
                    className="opacity-0 group-hover:opacity-100 text-rust hover:text-ink"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center italic opacity-50 font-serif">
                  Aucun·e abonné·e.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── Settings ────────────────────────────────────────────────────────────────

interface SettingsProps {
  onReset: () => void;
}

export const SettingsSection = ({ onReset }: SettingsProps) => {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionTitle>Accès</SectionTitle>
        <p className="text-sm font-serif opacity-80 leading-relaxed">
          Votre identifiant est <span className="font-mono bg-ink/5 dark:bg-white/10 px-2 py-0.5 rounded">Elise</span>.
          Pour changer votre mot de passe, contactez votre développeuse — elle s'en occupera.
        </p>
      </Card>

      <Card className="p-6">
        <SectionTitle>Données du tableau de bord</SectionTitle>
        <p className="text-sm font-serif opacity-80 leading-relaxed mb-4">
          Toutes les données (transactions, rendez-vous, messages, etc.) sont stockées localement dans
          votre navigateur. Vous pouvez les réinitialiser avec les exemples de départ.
        </p>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-2 border border-rust/30 text-rust px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-rust hover:text-paper transition-colors"
          >
            <Trash2 size={12} /> Réinitialiser
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => {
                onReset();
                setConfirming(false);
              }}
              className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
            >
              Confirmer
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="inline-flex items-center gap-2 border border-ink/10 dark:border-white/10 px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:border-rust hover:text-rust transition-colors"
            >
              Annuler
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};
