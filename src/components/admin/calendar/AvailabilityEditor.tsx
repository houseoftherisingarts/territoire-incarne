import { useState } from "react";
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { useFirestoreCollection } from "../../../hooks/useFirestoreCollection";
import type { AvailabilityCategory, AvailabilitySlot } from "../../../types/calendar";
import { Card } from "../sections";

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const CATEGORY_LABEL: Record<AvailabilityCategory, string> = {
  consultation: "Consultations",
  danse: "Danse",
};

const CATEGORY_DOT: Record<AvailabilityCategory, string> = {
  consultation: "bg-rose-400",
  danse: "bg-orange-400",
};

export const AvailabilityEditor = () => {
  const { items, loading, add, update, remove } = useFirestoreCollection<AvailabilitySlot>(
    "availability",
    { orderField: "createdAt", orderDirection: "asc" },
  );
  const [form, setForm] = useState<{ dow: number; start: string; end: string; category: AvailabilityCategory }>({
    dow: 1,
    start: "09:00",
    end: "12:00",
    category: "consultation",
  });
  const [oneOff, setOneOff] = useState<{ date: string; start: string; end: string; category: AvailabilityCategory }>({
    date: "",
    start: "09:00",
    end: "12:00",
    category: "consultation",
  });

  const recurring = items.filter((i) => i.recurring);
  const oneOffs = items.filter((i) => !i.recurring);

  const addRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.start >= form.end) {
      alert("L'heure de fin doit être après l'heure de début.");
      return;
    }
    try {
      await add({
        dayOfWeek: form.dow,
        startTime: form.start,
        endTime: form.end,
        recurring: true,
        active: true,
        category: form.category,
      });
    } catch (err) {
      console.error("Ajout récurrent échoué:", err);
      alert("Impossible d'ajouter cette plage. Vérifiez votre connexion ou contactez votre développeuse (les règles Firestore ne sont peut-être pas déployées).");
    }
  };

  const addOneOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oneOff.date) {
      alert("Choisissez une date.");
      return;
    }
    if (oneOff.start >= oneOff.end) {
      alert("L'heure de fin doit être après l'heure de début.");
      return;
    }
    try {
      await add({
        date: oneOff.date,
        startTime: oneOff.start,
        endTime: oneOff.end,
        recurring: false,
        active: true,
        category: oneOff.category,
      });
      setOneOff({ ...oneOff, date: "" });
    } catch (err) {
      console.error("Ajout ponctuel échoué:", err);
      alert("Impossible d'ajouter cette plage. Vérifiez votre connexion ou contactez votre développeuse (les règles Firestore ne sont peut-être pas déployées).");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h4 className="font-sans text-xs uppercase tracking-[0.25em] opacity-60 mb-3">Heures récurrentes (chaque semaine)</h4>
        <form onSubmit={addRecurring} className="grid grid-cols-2 md:grid-cols-[140px_110px_110px_140px_auto] gap-3 items-end">
          <div>
            <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Jour</label>
            <select
              value={form.dow}
              onChange={(e) => setForm({ ...form, dow: parseInt(e.target.value, 10) })}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Début</label>
            <input type="time" step={1800} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust" />
          </div>
          <div>
            <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Fin</label>
            <input type="time" step={1800} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust" />
          </div>
          <div>
            <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Pour</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as AvailabilityCategory })}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
            >
              <option value="consultation">Consultations (rose)</option>
              <option value="danse">Danse (orange)</option>
            </select>
          </div>
          <button type="submit" className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors">
            <Plus size={12} /> Ajouter
          </button>
        </form>
      </Card>

      <Card className="p-5">
        <h4 className="font-sans text-xs uppercase tracking-[0.25em] opacity-60 mb-3">Plage ponctuelle (date précise)</h4>
        <form onSubmit={addOneOff} className="grid grid-cols-2 md:grid-cols-[160px_110px_110px_140px_auto] gap-3 items-end">
          <div>
            <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Date</label>
            <input type="date" value={oneOff.date} onChange={(e) => setOneOff({ ...oneOff, date: e.target.value })}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust" />
          </div>
          <div>
            <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Début</label>
            <input type="time" step={1800} value={oneOff.start} onChange={(e) => setOneOff({ ...oneOff, start: e.target.value })}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust" />
          </div>
          <div>
            <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Fin</label>
            <input type="time" step={1800} value={oneOff.end} onChange={(e) => setOneOff({ ...oneOff, end: e.target.value })}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust" />
          </div>
          <div>
            <label className="text-[10px] font-sans uppercase tracking-widest opacity-60 block mb-1">Pour</label>
            <select
              value={oneOff.category}
              onChange={(e) => setOneOff({ ...oneOff, category: e.target.value as AvailabilityCategory })}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
            >
              <option value="consultation">Consultations (rose)</option>
              <option value="danse">Danse (orange)</option>
            </select>
          </div>
          <button type="submit" className="inline-flex items-center gap-2 bg-ink/5 dark:bg-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-rust hover:text-paper transition-colors">
            <CalendarIcon size={12} /> Ponctuel
          </button>
        </form>
      </Card>

      {loading && <Card className="p-6 text-center italic opacity-60 font-serif">Chargement…</Card>}

      <Card className="p-5">
        <h4 className="font-sans text-xs uppercase tracking-[0.25em] opacity-60 mb-3">Récurrentes ({recurring.length})</h4>
        <div className="space-y-2">
          {recurring.length === 0 && <p className="font-serif italic text-sm opacity-50">Aucune.</p>}
          {recurring.map((s) => {
            const cat = s.category ?? "consultation";
            return (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-ink/5 dark:border-white/5 last:border-0">
                <button
                  onClick={() => update(s.id, { category: cat === "consultation" ? "danse" : "consultation" })}
                  className={`w-3 h-3 rounded-full ${CATEGORY_DOT[cat]} hover:scale-125 transition-transform shrink-0`}
                  title={`Couleur : ${CATEGORY_LABEL[cat]} — cliquer pour changer`}
                />
                <span className="font-mono text-sm w-12 opacity-70">{DAYS[s.dayOfWeek ?? 0]}</span>
                <span className="font-mono text-sm flex-1">{s.startTime} – {s.endTime}</span>
                <button onClick={() => update(s.id, { active: !s.active })} className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${s.active ? "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100" : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"}`}>
                  {s.active ? "Visible" : "Caché"}
                </button>
                <button onClick={() => remove(s.id)} className="p-1 opacity-40 hover:opacity-100 hover:text-rust">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h4 className="font-sans text-xs uppercase tracking-[0.25em] opacity-60 mb-3">Ponctuelles ({oneOffs.length})</h4>
        <div className="space-y-2">
          {oneOffs.length === 0 && <p className="font-serif italic text-sm opacity-50">Aucune.</p>}
          {oneOffs.map((s) => {
            const cat = s.category ?? "consultation";
            return (
            <div key={s.id} className="flex items-center gap-3 py-2 border-b border-ink/5 dark:border-white/5 last:border-0">
              <button
                onClick={() => update(s.id, { category: cat === "consultation" ? "danse" : "consultation" })}
                className={`w-3 h-3 rounded-full ${CATEGORY_DOT[cat]} hover:scale-125 transition-transform shrink-0`}
                title={`Couleur : ${CATEGORY_LABEL[cat]} — cliquer pour changer`}
              />
              <span className="font-mono text-sm flex-1">{s.date} · {s.startTime} – {s.endTime}</span>
              <button onClick={() => update(s.id, { active: !s.active })} className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${s.active ? "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100" : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"}`}>
                {s.active ? "Visible" : "Caché"}
              </button>
              <button onClick={() => remove(s.id)} className="p-1 opacity-40 hover:opacity-100 hover:text-rust">
                <Trash2 size={13} />
              </button>
            </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
