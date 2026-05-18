import { useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Check, Upload } from "lucide-react";
import { useTarifs, type Tarif, type TarifInput } from "../../hooks/useTarifs";
import { uploadMediaFile } from "../../lib/storage";

const CATEGORIES: { value: Tarif["category"]; label: string }[] = [
  { value: "consultation",   label: "Consultation" },
  { value: "livre",          label: "Livre" },
  { value: "sante-sexuelle", label: "Santé sexuelle" },
  { value: "evenement",      label: "Événement" },
  { value: "autre",          label: "Autre" },
];

const FREQUENCIES: { value: NonNullable<Tarif["frequency"]>; label: string }[] = [
  { value: "monthly",   label: "Mensuel" },
  { value: "quarterly", label: "Trimestriel" },
  { value: "yearly",    label: "Annuel" },
];

const EMPTY: TarifInput = {
  name: "", description: "", type: "one-time",
  price: 0, category: "consultation", active: true,
  shortTag: "", durationMin: 60, image: "",
};

interface FormProps {
  initial?: TarifInput;
  onSave: (d: TarifInput) => Promise<void>;
  onCancel: () => void;
}

const TarifForm = ({ initial = EMPTY, onSave, onCancel }: FormProps) => {
  const [form, setForm] = useState<TarifInput>(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof TarifInput>(k: K, v: TarifInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave(form);
    setBusy(false);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) {
      if (file) alert("Image trop volumineuse (max 10 MB)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMediaFile(file, "products");
      set("image", url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="border border-rust/30 dark:border-stone-500 rounded-2xl p-6 space-y-5 bg-white/50 dark:bg-white/5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <div>
            <label className="block text-[10px] font-sans uppercase tracking-widest opacity-60 mb-2">Petite étiquette au-dessus du titre</label>
            <input
              value={form.shortTag ?? ""}
              onChange={(e) => set("shortTag", e.target.value)}
              placeholder="Ex. Soins · Accompagnement"
              className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust outline-none py-2 font-sans uppercase tracking-widest text-xs transition-colors"
            />
            <p className="text-[10px] opacity-50 italic font-serif mt-1">
              Apparaît en petit, juste au-dessus du nom — comme une catégorie. Optionnel.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-sans uppercase tracking-widest opacity-60 mb-2">Nom (titre principal)</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust outline-none py-2 font-serif text-lg transition-colors"
              placeholder="Ex. Suivi mensuel somatique"
            />
          </div>

          <div>
            <label className="block text-[10px] font-sans uppercase tracking-widest opacity-60 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust outline-none py-2 font-serif text-base resize-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-sans uppercase tracking-widest opacity-60 mb-2">Image</label>
          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 mb-2">
            {form.image && <img src={form.image} alt="" className="w-full h-full object-cover" />}
          </div>
          <label className="flex items-center justify-center gap-2 bg-ink/5 dark:bg-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans cursor-pointer hover:bg-rust hover:text-paper transition-colors">
            <Upload size={12} /> {uploading ? "Téléversement…" : form.image ? "Remplacer" : "Téléverser"}
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        <div>
          <label className="block text-[10px] font-sans uppercase tracking-widest opacity-60 mb-2">Type</label>
          <div className="flex gap-3">
            {(["one-time", "subscription"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => set("type", t)}
                className={`flex-1 py-2 rounded-xl border font-sans text-[11px] uppercase tracking-widest transition-all ${
                  form.type === t
                    ? "bg-ink text-paper dark:bg-stone-200 dark:text-forest border-ink dark:border-stone-200"
                    : "border-stone-300 dark:border-stone-600 hover:border-stone-400"
                }`}
              >
                {t === "one-time" ? "Unique" : "Abonnement"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-sans uppercase tracking-widest opacity-60 mb-2">Catégorie</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value as Tarif["category"])}
            className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 outline-none py-2 font-serif text-base transition-colors focus:border-rust"
          >
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-sans uppercase tracking-widest opacity-60 mb-2">Prix (CAD $)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.price}
            onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
            required
            className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust outline-none py-2 font-serif text-lg transition-colors"
          />
        </div>

        {form.category === "consultation" && (
          <div>
            <label className="block text-[10px] font-sans uppercase tracking-widest opacity-60 mb-2">Durée (min)</label>
            <select
              value={form.durationMin ?? 60}
              onChange={(e) => set("durationMin", parseInt(e.target.value, 10))}
              className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 outline-none py-2 font-serif text-base transition-colors focus:border-rust"
            >
              {[30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        {form.type === "subscription" && (
          <div>
            <label className="block text-[10px] font-sans uppercase tracking-widest opacity-60 mb-2">Fréquence</label>
            <select
              value={form.frequency ?? "monthly"}
              onChange={(e) => set("frequency", e.target.value as Tarif["frequency"])}
              className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 outline-none py-2 font-serif text-base transition-colors focus:border-rust"
            >
              {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-2.5 bg-ink text-paper dark:bg-stone-100 dark:text-forest rounded-xl font-sans text-[10px] uppercase tracking-widest hover:bg-rust transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Check size={13} /> {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl font-sans text-[10px] uppercase tracking-widest hover:border-stone-400 transition-colors flex items-center gap-2"
        >
          <X size={13} /> Annuler
        </button>
      </div>
    </form>
  );
};

export const TarifsSection = () => {
  const { tarifs, loading, addTarif, updateTarif, deleteTarif } = useTarifs();
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  if (loading) return <p className="font-sans text-sm opacity-50 py-10 text-center">Chargement…</p>;

  const handleAdd = async (data: TarifInput) => {
    await addTarif(data);
    setShowNew(false);
  };

  const handleUpdate = async (id: string, data: TarifInput) => {
    await updateTarif(id, data);
    setEditing(null);
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.6s_ease-out]">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs opacity-50 uppercase tracking-widest">
          {tarifs.length} consultation{tarifs.length !== 1 ? "s" : ""} · visibles dans la section <em>Soins somatiques</em>
        </p>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-ink text-paper dark:bg-stone-100 dark:text-forest rounded-xl font-sans text-[10px] uppercase tracking-widest hover:bg-rust transition-colors"
        >
          <Plus size={13} /> Nouvelle consultation
        </button>
      </div>

      {showNew && (
        <TarifForm
          onSave={handleAdd}
          onCancel={() => setShowNew(false)}
        />
      )}

      {tarifs.length === 0 && !showNew ? (
        <div className="border border-dashed border-stone-300 dark:border-stone-600 rounded-2xl p-10 text-center">
          <p className="font-serif italic text-stone-400 mb-3">Aucune consultation créée pour l'instant.</p>
          <button
            onClick={() => setShowNew(true)}
            className="font-sans text-[10px] uppercase tracking-widest text-rust hover:opacity-70 transition-opacity"
          >
            Créer la première →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tarifs.map((t) =>
            editing === t.id ? (
              <TarifForm
                key={t.id}
                initial={{
                  name: t.name, description: t.description, type: t.type, price: t.price,
                  frequency: t.frequency, category: t.category, active: t.active,
                  shortTag: t.shortTag ?? "", durationMin: t.durationMin ?? 60, image: t.image ?? "",
                }}
                onSave={(data) => handleUpdate(t.id, data)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div key={t.id} className="flex items-start gap-4 border border-stone-200 dark:border-stone-700 rounded-2xl p-5 bg-white/40 dark:bg-white/5">
                {t.image && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                    <img src={t.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {t.shortTag && (
                      <span className="font-sans text-[9px] uppercase tracking-widest text-rust opacity-80">{t.shortTag}</span>
                    )}
                    <span className="font-serif text-lg">{t.name}</span>
                    <span className="font-sans text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-stone-300 dark:border-stone-600 opacity-60">
                      {CATEGORIES.find((c) => c.value === t.category)?.label}
                    </span>
                    {t.category === "consultation" && t.durationMin && (
                      <span className="font-sans text-[9px] uppercase tracking-widest opacity-50">{t.durationMin} min</span>
                    )}
                    {!t.active && (
                      <span className="font-sans text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800">
                        Inactif
                      </span>
                    )}
                  </div>
                  {t.description && <p className="font-sans text-xs opacity-50 mb-2 line-clamp-1">{t.description}</p>}
                  <p className="font-serif text-2xl text-rust dark:text-stone-300">
                    {t.price.toFixed(2)} $
                    {t.type === "subscription" && t.frequency && (
                      <span className="text-sm font-sans opacity-50 ml-1">/ {FREQUENCIES.find((f) => f.value === t.frequency)?.label.toLowerCase()}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateTarif(t.id, { active: !t.active })}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                    title={t.active ? "Désactiver" : "Activer"}
                  >
                    {t.active ? <ToggleRight size={22} className="text-emerald-600" /> : <ToggleLeft size={22} />}
                  </button>
                  <button
                    onClick={() => setEditing(t.id)}
                    className="opacity-40 hover:opacity-100 transition-opacity hover:text-rust"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => { if (confirm("Supprimer cette consultation ?")) deleteTarif(t.id); }}
                    className="opacity-40 hover:opacity-100 transition-opacity hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
