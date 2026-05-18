import { useState } from "react";
import { Plus, Trash2, Pencil, Eye, EyeOff, Upload } from "lucide-react";
import type { Timestamp } from "firebase/firestore";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { uploadMediaFile } from "../../lib/storage";
import { Card } from "./sections";

export interface Resource {
  id: string;
  category: string;
  label: string;
  link: string;
  icon: "Download" | "Phone" | "Book" | "Globe";
  fileUrl?: string;
  requiresAuth: boolean;
  active: boolean;
  createdAt: Timestamp | null;
}

const ICON_OPTIONS: Resource["icon"][] = ["Download", "Phone", "Book", "Globe"];

const blankForm = (): Omit<Resource, "id" | "createdAt"> => ({
  category: "Lectures",
  label: "",
  link: "",
  icon: "Book",
  fileUrl: "",
  requiresAuth: false,
  active: true,
});

export const ResourcesSection = () => {
  const { items, loading, add, update, remove } = useFirestoreCollection<Resource>("resources", {
    orderField: "createdAt",
    orderDirection: "desc",
  });
  const [editing, setEditing] = useState<Resource | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [uploading, setUploading] = useState(false);

  const startEdit = (r: Resource) => {
    setEditing(r);
    setCreating(false);
    setForm({
      category: r.category,
      label: r.label,
      link: r.link,
      icon: r.icon,
      fileUrl: r.fileUrl ?? "",
      requiresAuth: r.requiresAuth,
      active: r.active,
    });
  };

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(blankForm());
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setForm(blankForm());
  };

  const save = async () => {
    if (!form.label.trim()) return;
    if (editing) {
      await update(editing.id, form);
    } else {
      await add(form);
    }
    cancel();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Fichier trop volumineux (max 10 MB)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMediaFile(file, "resources");
      setForm((f) => ({ ...f, fileUrl: url, link: url, icon: "Download", requiresAuth: true }));
    } catch (err) {
      console.error(err);
      alert("Échec du téléversement");
    } finally {
      setUploading(false);
    }
  };

  const editorOpen = creating || editing !== null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm font-serif italic opacity-70">
          Gérez les ressources visibles dans la section Ressources du site.
        </p>
        {!editorOpen && (
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
          >
            <Plus size={14} /> Nouvelle ressource
          </button>
        )}
      </div>

      {editorOpen && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Étiquette</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Catégorie</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Lectures, Lignes d'écoute…"
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Lien internet ou numéro de téléphone</label>
              <input
                type="text"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://exemple.com ou tel:418-555-0123"
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-mono outline-none focus:border-rust"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Icône</label>
              <select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value as Resource["icon"] })}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
              >
                {ICON_OPTIONS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Fichier téléchargeable (PDF, etc.)</label>
              <label className="inline-flex items-center gap-2 bg-ink/5 dark:bg-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans cursor-pointer hover:bg-rust hover:text-paper transition-colors">
                <Upload size={12} /> {uploading ? "Téléversement…" : form.fileUrl ? "Remplacer" : "Téléverser"}
                <input type="file" onChange={onFileChange} className="hidden" disabled={uploading} />
              </label>
              {form.fileUrl && (
                <p className="text-[10px] opacity-50 truncate font-mono">{form.fileUrl}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 border-t border-ink/5 dark:border-white/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requiresAuth}
                onChange={(e) => setForm({ ...form, requiresAuth: e.target.checked })}
                className="accent-rust"
              />
              <span className="text-xs font-sans uppercase tracking-widest">Réservé aux client·e·s connecté·e·s</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="accent-rust"
              />
              <span className="text-xs font-sans uppercase tracking-widest">Visible sur le site</span>
            </label>
          </div>
          <p className="text-[10px] opacity-50 italic font-serif">
            "Réservé aux connecté·e·s" — la personne devra créer un compte et se connecter pour télécharger.
          </p>

          <div className="flex gap-3 pt-3">
            <button
              onClick={save}
              className="bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
            >
              Enregistrer
            </button>
            <button
              onClick={cancel}
              className="border border-ink/10 dark:border-white/10 px-5 py-2 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:border-rust hover:text-rust transition-colors"
            >
              Annuler
            </button>
          </div>
        </Card>
      )}

      {loading && <Card className="p-10 text-center italic opacity-60 font-serif">Chargement…</Card>}

      {!loading && items.length === 0 && (
        <Card className="p-10 text-center italic opacity-60 font-serif">Aucune ressource.</Card>
      )}

      <div className="space-y-3">
        {items.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <p className="font-serif text-lg">{r.label}</p>
                  <span className="text-[10px] uppercase tracking-widest opacity-60">
                    {r.category}
                  </span>
                  {r.requiresAuth && (
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      Privé
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-50 truncate font-mono">{r.link}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => update(r.id, { active: !r.active })}
                  className="inline-flex items-center gap-1.5 border border-ink/10 dark:border-white/10 px-3 py-1.5 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:border-rust hover:text-rust transition-colors"
                >
                  {r.active ? <EyeOff size={11} /> : <Eye size={11} />}
                  {r.active ? "Cacher" : "Activer"}
                </button>
                <button
                  onClick={() => startEdit(r)}
                  className="p-2 rounded-full hover:bg-rust/15 hover:text-rust transition-colors"
                  aria-label="Modifier"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="p-2 rounded-full opacity-40 hover:opacity-100 hover:bg-rust/15 hover:text-rust"
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
