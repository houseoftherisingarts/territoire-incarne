import { useState } from "react";
import { Plus, Trash2, Pencil, Upload, Eye, EyeOff } from "lucide-react";
import type { Timestamp } from "firebase/firestore";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { uploadMediaFile } from "../../lib/storage";
import { Card } from "./sections";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // CAD dollars (UI), stored as cents below
  priceCents: number;
  stock: number;
  category: string;
  image: string;
  active: boolean;
  createdAt: Timestamp | null;
}

const blank = (): Omit<Product, "id" | "createdAt"> => ({
  title: "",
  description: "",
  price: 0,
  priceCents: 0,
  stock: 0,
  category: "",
  image: "",
  active: true,
});

const money = (cents: number) =>
  (cents / 100).toLocaleString("fr-CA", { style: "currency", currency: "CAD" });

export const ProductsSection = () => {
  const { items, loading, add, update, remove } = useFirestoreCollection<Product>("products", {
    orderField: "createdAt",
    orderDirection: "desc",
  });
  const [form, setForm] = useState(blank());
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const startEdit = (p: Product) => {
    setEditing(p);
    setCreating(false);
    setForm({
      title: p.title,
      description: p.description,
      price: p.price,
      priceCents: p.priceCents,
      stock: p.stock,
      category: p.category,
      image: p.image,
      active: p.active,
    });
  };

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(blank());
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setForm(blank());
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image trop volumineuse (max 10 MB)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMediaFile(file, "products");
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      console.error(err);
      alert("Échec du téléversement");
    } finally {
      setUploading(false);
    }
  };

  const setPrice = (val: string) => {
    const p = parseFloat(val) || 0;
    setForm((f) => ({ ...f, price: p, priceCents: Math.round(p * 100) }));
  };

  const save = async () => {
    if (!form.title.trim()) return;
    if (editing) {
      await update(editing.id, form);
    } else {
      await add(form);
    }
    cancel();
  };

  const editorOpen = creating || editing !== null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm font-serif italic opacity-70">
          Vos produits visibles sur la boutique publique.
        </p>
        {!editorOpen && (
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
          >
            <Plus size={14} /> Nouveau produit
          </button>
        )}
      </div>

      {editorOpen && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Titre</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-base font-serif outline-none focus:border-rust"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-serif italic outline-none focus:border-rust resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Prix (CAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Catégorie</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Soins, Livres…"
                    className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
                  />
                </div>
              </div>
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

            <div className="space-y-1">
              <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Image</label>
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 mb-2">
                {form.image && (
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <label className="flex items-center justify-center gap-2 bg-ink/5 dark:bg-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans cursor-pointer hover:bg-rust hover:text-paper transition-colors">
                <Upload size={12} /> {uploading ? "Téléversement…" : form.image ? "Remplacer" : "Téléverser"}
                <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-ink/5 dark:border-white/5">
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
        <Card className="p-10 text-center italic opacity-60 font-serif">Aucun produit.</Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex gap-4">
              {p.image && (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                  <img src={p.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-serif text-lg leading-tight">{p.title}</p>
                <p className="text-xs opacity-60 mt-1">
                  {money(p.priceCents)} · {p.stock} en inventaire
                  {p.stock === 0 && <span className="text-red-400 ml-1">· épuisé</span>}
                </p>
                <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1">{p.category}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => update(p.id, { active: !p.active })}
                  className="p-2 rounded-full hover:bg-rust/15 hover:text-rust transition-colors"
                  aria-label={p.active ? "Cacher" : "Activer"}
                >
                  {p.active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => startEdit(p)}
                  className="p-2 rounded-full hover:bg-rust/15 hover:text-rust transition-colors"
                  aria-label="Modifier"
                >
                  <Pencil size={14} />
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
      </div>
    </div>
  );
};
