import { useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useFirestoreClients } from "../../hooks/useFirestoreClients";
import type { ClientProfile } from "../../hooks/useClientAuth";
import { ClientDetailView } from "./ClientDetailView";

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

export const ClientsSection = () => {
  const { clients, loading, updateStatus } = useFirestoreClients();
  const [filter, setFilter] = useState<ClientProfile["status"] | "all">("all");
  const [selected, setSelected] = useState<ClientProfile | null>(null);

  const visible = filter === "all" ? clients : clients.filter((c) => c.status === filter);

  if (selected) {
    return (
      <ClientDetailView
        client={selected}
        onBack={() => setSelected(null)}
        onUpdateStatus={updateStatus}
      />
    );
  }

  if (loading) return <p className="font-sans text-sm opacity-50 py-10 text-center">Chargement…</p>;

  return (
    <div className="space-y-6 animate-[fadeIn_0.6s_ease-out]">
      <div className="grid grid-cols-3 gap-4">
        {(["all", "pending", "accepted"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              filter === s
                ? "border-rust bg-rust/5 dark:border-stone-400 dark:bg-white/5"
                : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-500 bg-white/40 dark:bg-white/5"
            }`}
          >
            <p className="text-2xl font-light">
              {s === "all" ? clients.length : clients.filter((c) => c.status === s).length}
            </p>
            <p className="font-sans text-[10px] uppercase tracking-widest opacity-50 mt-1">
              {s === "all" ? "Total" : s === "pending" ? "En attente" : "Acceptées"}
            </p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "accepted", "refused"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full font-sans text-[10px] uppercase tracking-widest border transition-all ${
              filter === s
                ? "bg-ink text-paper dark:bg-stone-100 dark:text-forest border-ink dark:border-stone-100"
                : "border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-400"
            }`}
          >
            {s === "all" ? "Toutes" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="font-serif italic text-stone-400 py-8 text-center">
          Aucune cliente pour l'instant.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((client) => (
            <button
              key={client.uid}
              className="w-full flex items-center gap-4 p-4 text-left rounded-2xl border border-stone-200 dark:border-stone-700 bg-white/40 dark:bg-white/5 hover:border-rust dark:hover:border-stone-400 hover:bg-rust/5 dark:hover:bg-white/10 transition-all"
              onClick={() => setSelected(client)}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 shrink-0 flex items-center justify-center font-serif text-lg">
                {client.avatarUrl ? (
                  <img src={client.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (client.displayName || client.email)[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-lg truncate">{client.displayName || "—"}</p>
                <p className="font-sans text-xs opacity-50 truncate">{client.email}</p>
              </div>
              <div
                className={`flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest shrink-0 ${statusColor(client.status)}`}
              >
                {client.status === "accepted" && <CheckCircle size={13} />}
                {client.status === "refused" && <XCircle size={13} />}
                {client.status === "pending" && <Clock size={13} />}
                {STATUS_LABEL[client.status]}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
