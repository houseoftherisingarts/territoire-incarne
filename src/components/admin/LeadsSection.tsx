import { useState } from "react";
import { Trash2, Mail } from "lucide-react";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import type { Timestamp } from "firebase/firestore";
import { Card } from "./sections";

export type LeadTier = "cold" | "warm" | "hot";

export interface Lead {
  id: string;
  email: string;
  name?: string;
  source: string;
  tier: LeadTier;
  notes?: string;
  createdAt: Timestamp | null;
  lastContactedAt?: Timestamp | null;
}

const TIER_LABEL: Record<LeadTier, string> = {
  cold: "Froid",
  warm: "Tiède",
  hot: "Chaud",
};

const TIER_STYLES: Record<LeadTier, string> = {
  cold: "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300",
  warm: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  hot: "bg-rust/15 text-rust dark:bg-rust/30 dark:text-stone-100",
};

const fmtDate = (ts: Timestamp | null | undefined) => {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
};

export const LeadsSection = () => {
  const { items, loading, update, remove } = useFirestoreCollection<Lead>("leads", {
    orderField: "createdAt",
    orderDirection: "desc",
  });
  const [filter, setFilter] = useState<"all" | LeadTier>("all");

  const filtered = filter === "all" ? items : items.filter((l) => l.tier === filter);

  const setTier = (id: string, tier: LeadTier) => update(id, { tier });
  const setNotes = (id: string, notes: string) => update(id, { notes });

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 mr-2">Filtrer</span>
          {(["all", "hot", "warm", "cold"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest font-bold transition-colors ${
                filter === t
                  ? "bg-ink text-paper dark:bg-stone-100 dark:text-forest"
                  : "bg-ink/5 dark:bg-white/10 hover:bg-rust/15"
              }`}
            >
              {t === "all" ? "Tous" : TIER_LABEL[t]} ·{" "}
              {t === "all" ? items.length : items.filter((l) => l.tier === t).length}
            </button>
          ))}
        </div>
      </Card>

      {loading && (
        <Card className="p-10 text-center italic opacity-60 font-serif">Chargement…</Card>
      )}

      {!loading && filtered.length === 0 && (
        <Card className="p-10 text-center italic opacity-60 font-serif">
          Aucun prospect dans cette catégorie.
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((lead) => (
          <Card key={lead.id} className="p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <p className="font-serif text-lg">{lead.name || lead.email}</p>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full ${TIER_STYLES[lead.tier]}`}>
                    {TIER_LABEL[lead.tier]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs opacity-60">
                  <span className="font-mono">{lead.email}</span>
                  <span>· {lead.source}</span>
                  <span>· {fmtDate(lead.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={lead.tier}
                  onChange={(e) => setTier(lead.id, e.target.value as LeadTier)}
                  className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-2 py-1.5 text-xs"
                >
                  <option value="cold">Froid</option>
                  <option value="warm">Tiède</option>
                  <option value="hot">Chaud</option>
                </select>
                <a
                  href={`mailto:${lead.email}`}
                  className="p-2 rounded-full hover:bg-rust/15 hover:text-rust transition-colors"
                  aria-label="Écrire"
                >
                  <Mail size={14} />
                </a>
                <button
                  onClick={() => remove(lead.id)}
                  className="p-2 rounded-full opacity-40 hover:opacity-100 hover:bg-rust/15 hover:text-rust"
                  aria-label="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <textarea
              defaultValue={lead.notes ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (lead.notes ?? "")) setNotes(lead.id, e.target.value);
              }}
              placeholder="Notes…"
              rows={2}
              className="w-full mt-3 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-serif italic outline-none focus:border-rust resize-none"
            />
          </Card>
        ))}
      </div>
    </div>
  );
};
