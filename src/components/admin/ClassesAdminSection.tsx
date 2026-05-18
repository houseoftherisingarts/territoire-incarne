import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Eye, EyeOff, Users, CheckCircle, XCircle } from "lucide-react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { Card } from "./sections";

export interface DanceClass {
  id: string;
  title: string;
  description: string;
  capacity: number;
  priceCents: number;
  active: boolean;
  createdAt: Timestamp | null;
}

interface JoinRequest {
  id: string; // = uid
  displayName?: string;
  email?: string;
  status: "pending" | "approved" | "paid" | "rejected";
  requestedAt?: Timestamp;
  paidAt?: Timestamp;
  stripeSessionId?: string;
}

const blank = (): Omit<DanceClass, "id" | "createdAt"> => ({
  title: "",
  description: "",
  capacity: 12,
  priceCents: 0,
  active: true,
});

const money = (cents: number) =>
  cents === 0 ? "Gratuit" : (cents / 100).toLocaleString("fr-CA", { style: "currency", currency: "CAD" });

const useRequests = (classId: string | null) => {
  const [items, setItems] = useState<JoinRequest[]>([]);
  useEffect(() => {
    if (!classId) {
      setItems([]);
      return;
    }
    const q = query(collection(db, `classes/${classId}/requests`), orderBy("requestedAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as JoinRequest)));
    });
  }, [classId]);
  return items;
};

const useMembers = (classId: string | null) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!classId) return;
    return onSnapshot(collection(db, `classes/${classId}/members`), (s) => setCount(s.size));
  }, [classId]);
  return count;
};

export const ClassesAdminSection = () => {
  const { items, loading, add, update, remove } = useFirestoreCollection<DanceClass>("classes", {
    orderField: "createdAt",
    orderDirection: "desc",
  });
  const [editing, setEditing] = useState<DanceClass | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(blank());
  const [viewing, setViewing] = useState<string | null>(null);
  const requests = useRequests(viewing);
  const memberCount = useMembers(viewing);

  const startEdit = (c: DanceClass) => {
    setEditing(c);
    setCreating(false);
    setForm({
      title: c.title,
      description: c.description,
      capacity: c.capacity,
      priceCents: c.priceCents,
      active: c.active,
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

  const approve = async (classId: string, req: JoinRequest) => {
    await setDoc(doc(db, `classes/${classId}/requests/${req.id}`), { status: "approved" }, { merge: true });
    // For free classes, also auto-add as member
    const cls = items.find((c) => c.id === classId);
    if (cls && cls.priceCents === 0) {
      await setDoc(
        doc(db, `classes/${classId}/members/${req.id}`),
        {
          displayName: req.displayName ?? "",
          email: req.email ?? "",
          joinedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await setDoc(doc(db, `classes/${classId}/requests/${req.id}`), { status: "paid" }, { merge: true });
    }
    // Otherwise: a paid class. The client will see "approved" status and can complete payment from their portal.
  };

  const reject = async (classId: string, req: JoinRequest) => {
    await setDoc(doc(db, `classes/${classId}/requests/${req.id}`), { status: "rejected" }, { merge: true });
  };

  const editorOpen = creating || editing !== null;

  if (viewing) {
    const cls = items.find((c) => c.id === viewing);
    return (
      <div className="space-y-6">
        <button
          onClick={() => setViewing(null)}
          className="text-xs font-sans uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          ← Retour aux cours
        </button>
        <Card className="p-6">
          <h2 className="font-serif text-2xl mb-1">{cls?.title}</h2>
          <p className="text-xs opacity-60">
            {memberCount} membre·s · {requests.filter((r) => r.status === "pending").length} en attente
          </p>
        </Card>
        <div className="space-y-2">
          {requests.length === 0 && (
            <Card className="p-10 text-center italic opacity-60 font-serif">Aucune demande.</Card>
          )}
          {requests.map((r) => (
            <Card key={r.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-serif">{r.displayName || r.email || r.id}</p>
                <p className="text-xs opacity-60 font-mono">{r.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full ${
                  r.status === "paid" ? "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100" :
                  r.status === "approved" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                  r.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                }`}>
                  {r.status === "pending" ? "En attente" : r.status === "approved" ? "Approuvé · attend paiement" : r.status === "paid" ? "Membre" : "Refusé"}
                </span>
                {r.status === "pending" && (
                  <>
                    <button onClick={() => approve(viewing, r)} className="p-2 rounded-full text-forest hover:bg-forest/15" aria-label="Approuver">
                      <CheckCircle size={16} />
                    </button>
                    <button onClick={() => reject(viewing, r)} className="p-2 rounded-full text-rust hover:bg-rust/15" aria-label="Refuser">
                      <XCircle size={16} />
                    </button>
                  </>
                )}
              </div>
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
          Cours de danse · titre = jour + lieu (ex. "Classe du Mercredi, Tremblant").
        </p>
        {!editorOpen && (
          <button
            onClick={() => { setCreating(true); setEditing(null); setForm(blank()); }}
            className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
          >
            <Plus size={14} /> Nouveau cours
          </button>
        )}
      </div>

      {editorOpen && (
        <Card className="p-6 space-y-4">
          <input
            type="text"
            placeholder="Classe du Mercredi, Tremblant"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-base font-serif outline-none focus:border-rust"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-serif italic outline-none focus:border-rust resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Capacité</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
              />
            </div>
            <div>
              <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">Prix par cours (CAD)</label>
              <input
                type="number"
                step="0.01"
                value={form.priceCents / 100}
                onChange={(e) => setForm({ ...form, priceCents: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-rust" />
            <span className="text-xs font-sans uppercase tracking-widest">Visible sur le site</span>
          </label>
          <div className="flex gap-3 pt-3 border-t border-ink/5 dark:border-white/5">
            <button onClick={save} className="bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:bg-ink transition-colors">Enregistrer</button>
            <button onClick={cancel} className="border border-ink/10 dark:border-white/10 px-5 py-2 rounded-sm uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:border-rust hover:text-rust transition-colors">Annuler</button>
          </div>
        </Card>
      )}

      {loading && <Card className="p-10 text-center italic opacity-60 font-serif">Chargement…</Card>}
      {!loading && items.length === 0 && (
        <Card className="p-10 text-center italic opacity-60 font-serif">Aucun cours.</Card>
      )}

      <div className="space-y-3">
        {items.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <p className="font-serif text-lg">{c.title}</p>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${c.active ? "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100" : "bg-ink/5 dark:bg-white/10 opacity-60"}`}>
                    {c.active ? "Visible" : "Caché"}
                  </span>
                </div>
                <p className="text-xs opacity-60">
                  {money(c.priceCents)} · {c.capacity} places
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setViewing(c.id)} className="inline-flex items-center gap-1.5 border border-ink/10 dark:border-white/10 px-3 py-1.5 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:border-rust hover:text-rust transition-colors">
                  <Users size={11} /> Demandes
                </button>
                <button onClick={() => update(c.id, { active: !c.active })} className="p-2 rounded-full hover:bg-rust/15 hover:text-rust transition-colors" aria-label={c.active ? "Cacher" : "Activer"}>
                  {c.active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => startEdit(c)} className="p-2 rounded-full hover:bg-rust/15 hover:text-rust transition-colors" aria-label="Modifier">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(c.id)} className="p-2 rounded-full opacity-40 hover:opacity-100 hover:bg-rust/15 hover:text-rust" aria-label="Supprimer">
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
