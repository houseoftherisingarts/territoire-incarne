import { Download, ExternalLink, FolderOpen, Globe, Phone } from "lucide-react";
import { useMemo } from "react";
import { useFirestoreCollection, type CollectionOptions } from "../../hooks/useFirestoreCollection";
import { useClientDocs } from "../../hooks/useClientDocs";
import type { Resource } from "../admin/ResourcesSection";

const ICONS = { Download, Phone, Book: FolderOpen, Globe } as const;

const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" }) : "");

export const RessourcesTab = ({ uid }: { uid: string }) => {
  const { items, loading } = useFirestoreCollection<Resource>("resources", useMemo(() => ({ where: [["active", "==", true]] }), []));
  const { docs, loading: docsLoading } = useClientDocs(uid);

  if (loading || docsLoading) return <p className="font-sans text-sm opacity-50 py-10 text-center">Chargement…</p>;

  return (
    <div className="space-y-10 animate-[fadeIn_0.6s_ease-out]">
      <div className="space-y-3">
        <h2 className="font-serif text-xl">Partagées par Élise</h2>
        {items.length === 0 ? (
          <p className="font-serif text-stone-400 text-center py-8">Rien de partagé pour l'instant.</p>
        ) : (
          <div className="space-y-3">
            {items.map((r) => {
              const Icon = ICONS[r.icon] ?? FolderOpen;
              return (
                <a
                  key={r.id}
                  href={r.fileUrl || r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-stone-200 dark:border-stone-700 rounded-2xl bg-white/40 dark:bg-white/5 hover:border-rust transition-colors"
                >
                  <Icon size={16} className="shrink-0 text-rust opacity-70" />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[10px] uppercase tracking-widest opacity-50">{r.category}</p>
                    <p className="font-serif text-base">{r.label}</p>
                  </div>
                  <ExternalLink size={13} className="shrink-0 opacity-40" />
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-xl">Pour toi</h2>
        {docs.length === 0 ? (
          <p className="font-serif text-stone-400 text-center py-8">Aucun document personnel pour l'instant.</p>
        ) : (
          <div className="space-y-3">
            {docs.map((d) => (
              <div key={d.id} className="flex items-start gap-3 p-4 border border-stone-200 dark:border-stone-700 rounded-2xl bg-white/40 dark:bg-white/5">
                <FolderOpen size={16} className="shrink-0 mt-0.5 text-rust opacity-70" />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base">{d.name}</p>
                  {d.description && <p className="font-serif text-sm opacity-70 mt-0.5">{d.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-rust text-[11px] font-sans uppercase tracking-widest hover:underline">
                        <ExternalLink size={11} /> Ouvrir
                      </a>
                    )}
                    <span className="text-[10px] opacity-40 font-sans">{fmtDate(d.addedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
