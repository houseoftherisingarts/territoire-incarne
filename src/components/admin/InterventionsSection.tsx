import { useMemo, useState } from "react";
import { Mail, Trash2, Phone, ChevronDown, ChevronUp } from "lucide-react";
import type { Timestamp } from "firebase/firestore";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { Card } from "./sections";
import { INTERVENTION_CONFIGS, type InterventionCategory } from "../../lib/interventionFields";

export type InterventionStatus = "new" | "reviewing" | "accepted" | "declined" | "completed";

export interface InterventionRequest {
  id: string;
  category: InterventionCategory;
  categoryLabel: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  details: Record<string, string>;
  status: InterventionStatus;
  notes?: string;
  createdAt: Timestamp | null;
}

const STATUS_LABEL: Record<InterventionStatus, string> = {
  new: "Nouvelle",
  reviewing: "En cours d'examen",
  accepted: "Acceptée",
  declined: "Refusée",
  completed: "Terminée",
};

const STATUS_STYLE: Record<InterventionStatus, string> = {
  new: "bg-amber-200 text-amber-900 dark:bg-amber-700/30 dark:text-amber-200",
  reviewing: "bg-sky-200 text-sky-900 dark:bg-sky-700/30 dark:text-sky-200",
  accepted: "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100",
  declined: "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300",
  completed: "bg-rose-200 text-rose-900 dark:bg-rose-700/30 dark:text-rose-200",
};

const CATEGORY_DOT: Record<InterventionCategory, string> = {
  danse: "bg-orange-400",
  education: "bg-sky-400",
  events: "bg-rose-400",
  therapie: "bg-stone-500",
};

const fmtDate = (ts: Timestamp | null | undefined) => {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
};

export const InterventionsSection = () => {
  const { items, loading, update, remove, error } = useFirestoreCollection<InterventionRequest>(
    "interventionRequests",
    { orderField: "createdAt", orderDirection: "desc" },
  );
  const [filter, setFilter] = useState<"all" | InterventionStatus>("all");
  const [catFilter, setCatFilter] = useState<"all" | InterventionCategory>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (filter === "all" || i.status === filter) &&
          (catFilter === "all" || i.category === catFilter),
      ),
    [items, filter, catFilter],
  );

  const newCount = items.filter((i) => i.status === "new").length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-2xl p-4 text-sm">
          <p className="font-bold text-red-700 dark:text-red-300">Erreur de chargement</p>
          <p className="font-mono text-xs opacity-70 mt-1">{error.message}</p>
        </div>
      )}

      <Card className="p-5 space-y-4">
        <div>
          <p className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 mb-2">Statut</p>
          <div className="flex gap-2 flex-wrap">
            {(["all", "new", "reviewing", "accepted", "declined", "completed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest font-bold transition-colors ${
                  filter === s
                    ? "bg-ink text-paper dark:bg-stone-100 dark:text-forest"
                    : "bg-ink/5 dark:bg-white/10 hover:bg-rust/15"
                }`}
              >
                {s === "all" ? "Toutes" : STATUS_LABEL[s]} ·{" "}
                {s === "all" ? items.length : items.filter((i) => i.status === s).length}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 mb-2">Type</p>
          <div className="flex gap-2 flex-wrap">
            {(["all", "danse", "education", "events", "therapie"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest font-bold transition-colors flex items-center gap-1.5 ${
                  catFilter === c
                    ? "bg-ink text-paper dark:bg-stone-100 dark:text-forest"
                    : "bg-ink/5 dark:bg-white/10 hover:bg-rust/15"
                }`}
              >
                {c !== "all" && <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT[c]}`} />}
                {c === "all" ? "Toutes" : INTERVENTION_CONFIGS[c].label} ·{" "}
                {c === "all" ? items.length : items.filter((i) => i.category === c).length}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {newCount > 0 && filter !== "new" && (
        <button
          onClick={() => setFilter("new")}
          className="w-full bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/50 rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-amber-200/60 dark:hover:bg-amber-900/30 transition-colors"
        >
          <Mail size={16} className="text-amber-700 dark:text-amber-300 shrink-0" />
          <span className="flex-1 font-serif">
            <strong>{newCount}</strong> nouvelle{newCount > 1 ? "s" : ""} demande{newCount > 1 ? "s" : ""} non lue{newCount > 1 ? "s" : ""}
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-amber-800 dark:text-amber-200">
            Voir →
          </span>
        </button>
      )}

      {loading && <Card className="p-10 text-center italic opacity-60 font-serif">Chargement…</Card>}

      {!loading && filtered.length === 0 && (
        <Card className="p-10 text-center italic opacity-60 font-serif">
          Aucune demande dans cette catégorie.
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((req) => {
          const open = openId === req.id;
          return (
            <Card key={req.id} className="p-5">
              <button
                onClick={() => {
                  setOpenId(open ? null : req.id);
                  if (req.status === "new") update(req.id, { status: "reviewing" });
                }}
                className="w-full text-left flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_DOT[req.category]}`} />
                    <span className="text-[10px] uppercase tracking-widest opacity-70">
                      {INTERVENTION_CONFIGS[req.category]?.label ?? req.categoryLabel}
                    </span>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[req.status]}`}>
                      {STATUS_LABEL[req.status]}
                    </span>
                  </div>
                  <p className="font-serif text-lg">{req.clientName || req.clientEmail}</p>
                  <p className="text-xs opacity-60 font-mono mt-0.5">
                    {req.clientEmail}
                    {req.clientPhone && <span className="ml-3">{req.clientPhone}</span>}
                    <span className="ml-3 opacity-70">{fmtDate(req.createdAt)}</span>
                  </p>
                </div>
                <div className="shrink-0 opacity-50 mt-1">
                  {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {open && (
                <div className="mt-4 pt-4 border-t border-ink/5 dark:border-white/5 space-y-3">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {Object.entries(req.details)
                      .filter(([key]) => !["name", "email", "phone"].includes(key))
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-[10px] font-sans uppercase tracking-widest opacity-50">
                            {labelFor(req.category, key)}
                          </dt>
                          <dd className="font-serif whitespace-pre-wrap">{value || "—"}</dd>
                        </div>
                      ))}
                  </dl>

                  <div className="pt-3 border-t border-ink/5 dark:border-white/5">
                    <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">
                      Notes internes
                    </label>
                    <textarea
                      defaultValue={req.notes ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (req.notes ?? "")) update(req.id, { notes: e.target.value });
                      }}
                      placeholder="Vos notes pour vous-même…"
                      rows={2}
                      className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-serif italic outline-none focus:border-rust resize-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-ink/5 dark:border-white/5">
                    <a
                      href={`mailto:${req.clientEmail}`}
                      className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:bg-ink transition-colors"
                    >
                      <Mail size={12} /> Répondre
                    </a>
                    {req.clientPhone && (
                      <a
                        href={`tel:${req.clientPhone}`}
                        className="inline-flex items-center gap-2 border border-ink/10 dark:border-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:border-rust hover:text-rust transition-colors"
                      >
                        <Phone size={12} /> Appeler
                      </a>
                    )}
                    <select
                      value={req.status}
                      onChange={(e) => update(req.id, { status: e.target.value as InterventionStatus })}
                      className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-xs font-sans"
                    >
                      {(Object.keys(STATUS_LABEL) as InterventionStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (confirm("Supprimer cette demande ?")) remove(req.id);
                      }}
                      className="ml-auto p-2 opacity-40 hover:opacity-100 hover:bg-rust/15 hover:text-rust rounded-full"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/** Lookup the human-readable label of a field, falling back to the raw key. */
const labelFor = (cat: InterventionCategory, fieldName: string): string => {
  const f = INTERVENTION_CONFIGS[cat]?.fields.find((x) => x.name === fieldName);
  return f?.label ?? fieldName;
};
