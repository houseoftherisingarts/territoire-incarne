import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Upload, Eye, EyeOff, Users } from "lucide-react";
import { collection, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { uploadMediaFile } from "../../lib/storage";
import { Card } from "./sections";

export interface AdminEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  location: string;
  priceCents: number;
  capacity: number;
  image: string;
  published: boolean;
  createdAt: Timestamp | null;
}

interface Registration {
  id: string;
  displayName?: string;
  email?: string;
  status?: string;
  registeredAt?: Timestamp;
}

const blank = (): Omit<AdminEvent, "id" | "createdAt"> => ({
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  priceCents: 0,
  capacity: 20,
  image: "",
  published: false,
});

const money = (cents: number) =>
  cents === 0
    ? "Gratuit"
    : (cents / 100).toLocaleString("fr-CA", { style: "currency", currency: "CAD" });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
};

const useRegistrations = (eventId: string | null) => {
  const [items, setItems] = useState<Registration[]>([]);
  useEffect(() => {
    if (!eventId) {
      setItems([]);
      return;
    }
    const q = query(
      collection(db, `events/${eventId}/registrations`),
      orderBy("registeredAt", "desc"),
    );
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Registration)));
    });
  }, [eventId]);
  return items;
};

export const EventsAdminSection = () => {
  const { items, loading, add, update, remove } = useFirestoreCollection<AdminEvent>("events", {
    orderField: "date",
    orderDirection: "asc",
  });
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(blank());
  const [uploading, setUploading] = useState(false);
  const [viewingRegs, setViewingRegs] = useState<string | null>(null);
  const registrations = useRegistrations(viewingRegs);

  const startEdit = (ev: AdminEvent) => {
    setEditing(ev);
    setCreating(false);
    setForm({ ...ev, createdAt: undefined as never } as never);
    setForm({
      title: ev.title,
      description: ev.description,
      date: ev.date,
      location: ev.location,
      priceCents: ev.priceCents,
      capacity: ev.capacity,
      image: ev.image,
      published: ev.published,
    });
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setForm(blank());
  };

  const save = async () => {
    if (!form.title.trim()) return;
    if (editing) await update(editing.id, form);
    else await add(form);
    cancel();
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) {
      if (file) alert("Image trop volumineuse (max 10 MB)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMediaFile(file, "events");
      setForm((f) => ({ ...f, image: url }));
    } finally {
      setUploading(false);
    }
  };

  const setPriceDollars = (val: string) => {
    const p = parseFloat(val) || 0;
    setForm((f) => ({ ...f, priceCents: Math.round(p * 100) }));
  };

  const editorOpen = creating || editing !== null;

  if (viewingRegs) {
    const ev = items.find((i) => i.id === viewingRegs);
    return (
      <div className="space-y-6">
        <button
          onClick={() => setViewingRegs(null)}
          className="text-xs font-sans uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          ← Retour aux événements
        </button>
        <Card className="p-6">
          <h2 className="font-serif text-2xl mb-1">{ev?.title}</h2>
          <p className="text-xs opacity-60">{registrations.length} inscription·s</p>
        </Card>
        <div className="space-y-2">
          {registrations.length === 0 && (
            <Card className="p-10 text-center italic opacity-60 font-serif">Aucune inscription.</Card>
          )}
          {registrations.map((r) => (
            <Card key={r.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-serif">{r.displayName || r.email || r.id}</p>
                <p className="text-xs opacity-60 font-mono">{r.email}</p>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100">
                {r.status ?? "ok"}
              </span>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm font-serif italic opacity-70">
          Vos événements et leurs inscriptions.
        </p>
        {!editorOpen && (
          <button
            onClick={() => { setCreating(true); setEditing(null); setForm(blank()); }}
            className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
          >
            <Plus size={14} /> Nouvel événement
          </button>
        )}
      </div>

      {editorOpen && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <input
                type="text"
                placeholder="Titre"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-base font-serif outline-none focus:border-rust"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-serif italic outline-none focus:border-rust resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
                />
                <input
                  type="text"
                  placeholder="Lieu"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
                />
                <div>
                  <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Prix (CAD, 0 = gratuit)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.priceCents / 100}
                    onChange={(e) => setPriceDollars(e.target.value)}
                    className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Capacité</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="accent-rust"
                />
                <span className="text-xs font-sans uppercase tracking-widest">Publié (visible)</span>
              </label>
            </div>
            <div className="space-y-1">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 mb-2">
                {form.image && <img src={form.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <label className="flex items-center justify-center gap-2 bg-ink/5 dark:bg-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans cursor-pointer hover:bg-rust hover:text-paper transition-colors">
                <Upload size={12} /> {uploading ? "Téléversement…" : form.image ? "Remplacer" : "Image"}
                <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-ink/5 dark:border-white/5">
            <button onClick={save} className="bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:bg-ink transition-colors">Enregistrer</button>
            <button onClick={cancel} className="border border-ink/10 dark:border-white/10 px-5 py-2 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:border-rust hover:text-rust transition-colors">Annuler</button>
          </div>
        </Card>
      )}

      {loading && <Card className="p-10 text-center italic opacity-60 font-serif">Chargement…</Card>}
      {!loading && items.length === 0 && (
        <Card className="p-10 text-center italic opacity-60 font-serif">Aucun événement.</Card>
      )}

      <div className="space-y-3">
        {items.map((ev) => (
          <Card key={ev.id} className="p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {ev.image && (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                  <img src={ev.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <p className="font-serif text-lg">{ev.title}</p>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${ev.published ? "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100" : "bg-ink/5 dark:bg-white/10 opacity-60"}`}>
                    {ev.published ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <p className="text-xs opacity-60">
                  {fmtDate(ev.date)} · {ev.location} · {money(ev.priceCents)} · {ev.capacity} places
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setViewingRegs(ev.id)} className="inline-flex items-center gap-1.5 border border-ink/10 dark:border-white/10 px-3 py-1.5 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:border-rust hover:text-rust transition-colors">
                  <Users size={11} /> Inscriptions
                </button>
                <button onClick={() => update(ev.id, { published: !ev.published })} className="p-2 rounded-full hover:bg-rust/15 hover:text-rust transition-colors" aria-label={ev.published ? "Cacher" : "Publier"}>
                  {ev.published ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => startEdit(ev)} className="p-2 rounded-full hover:bg-rust/15 hover:text-rust transition-colors" aria-label="Modifier">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(ev.id)} className="p-2 rounded-full opacity-40 hover:opacity-100 hover:bg-rust/15 hover:text-rust" aria-label="Supprimer">
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
