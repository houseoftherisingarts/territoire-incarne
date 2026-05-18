import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Mail, Download, Search } from "lucide-react";
import { db } from "../../firebase";
import { Card } from "./sections";

interface UserDoc {
  id: string;
  email: string;
  displayName: string;
  status: "pending" | "accepted" | "refused";
  newsletterOptIn?: boolean;
  createdAt?: { toDate: () => Date };
}

interface LeadDoc {
  id: string;
  email: string;
  source: string;
  createdAt?: { toDate: () => Date };
}

const fmtDate = (d?: Date | null) => {
  if (!d) return "—";
  return d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
};

export const NewsletterAdminSection = () => {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [leads, setLeads] = useState<LeadDoc[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const u = onSnapshot(query(collection(db, "users")), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDoc)));
    });
    const l = onSnapshot(query(collection(db, "leads")), (snap) => {
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadDoc)));
    });
    return () => { u(); l(); };
  }, []);

  // Subscribed = users with newsletterOptIn !== false (default opt-in if undefined)
  const subscribers = useMemo(() => {
    type Entry = { source: "compte" | "connecter"; email: string; name: string; joined: Date | null };
    const fromUsers: Entry[] = users
      .filter((u) => u.newsletterOptIn !== false)
      .map((u) => ({ source: "compte", email: u.email, name: u.displayName, joined: u.createdAt?.toDate() ?? null }));
    const fromLeads: Entry[] = leads.map((l) => ({
      source: "connecter",
      email: l.email,
      name: "",
      joined: l.createdAt?.toDate() ?? null,
    }));
    // Dedupe by email (compte wins over connecter if same email is in both)
    const map = new Map<string, Entry>();
    for (const e of fromLeads) map.set(e.email.toLowerCase(), e);
    for (const e of fromUsers) map.set(e.email.toLowerCase(), e);
    return Array.from(map.values()).sort((a, b) => (b.joined?.getTime() ?? 0) - (a.joined?.getTime() ?? 0));
  }, [users, leads]);

  const filtered = filter
    ? subscribers.filter((s) =>
        s.email.toLowerCase().includes(filter.toLowerCase()) ||
        s.name.toLowerCase().includes(filter.toLowerCase()),
      )
    : subscribers;

  const optedOut = users.filter((u) => u.newsletterOptIn === false).length;

  const exportCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [
      ["Email", "Nom", "Source", "Inscrit le"],
      ...subscribers.map((s) => [s.email, s.name, s.source, s.joined ? fmtDate(s.joined) : ""]),
    ].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["﻿" + lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infolettre-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="block text-[10px] font-sans uppercase tracking-[0.3em] text-rust font-bold">Abonné·e·s</p>
          <p className="text-3xl font-light mt-3 flex items-center gap-2">
            <Mail size={20} className="text-rust opacity-60" /> {subscribers.length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="block text-[10px] font-sans uppercase tracking-[0.3em] text-rust font-bold">Désabonné·e·s</p>
          <p className="text-3xl font-light mt-3">{optedOut}</p>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="block text-[10px] font-sans uppercase tracking-[0.3em] text-rust font-bold">Export</p>
            <p className="text-xs opacity-70 mt-2 font-serif italic">Télécharger la liste</p>
          </div>
          <button
            onClick={exportCsv}
            className="bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:bg-ink transition-colors"
          >
            <Download size={11} className="inline mr-1" /> CSV
          </button>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Search size={14} className="opacity-60" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Rechercher par courriel ou nom…"
            className="flex-1 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
          />
        </div>
        <p className="text-xs font-serif italic opacity-60 mb-2">
          Inscription par défaut à la création d'un compte. Désinscription depuis l'espace client.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/5 dark:border-white/5">
                {["Courriel", "Nom", "Source", "Depuis"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={`${s.email}-${i}`} className="border-b border-ink/5 dark:border-white/5">
                  <td className="py-2 px-3 font-mono text-xs">{s.email}</td>
                  <td className="py-2 px-3 font-serif">{s.name || <span className="opacity-40">—</span>}</td>
                  <td className="py-2 px-3">
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-ink/5 dark:bg-white/10">
                      {s.source}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-xs opacity-70">{s.joined ? fmtDate(s.joined) : "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center italic opacity-50 font-serif">
                    Aucun·e abonné·e.
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
