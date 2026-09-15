import { useState } from "react";
import { Plus, Trash2, Pencil, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import type { Timestamp } from "firebase/firestore";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { Card } from "./sections";

export interface Atelier {
  id: string;
  titre: string;
  /** Une phrase qui dit de quoi il retourne. */
  chapeau: string;
  duree: string;
  format: string;
  pourQui: string;
  /** Le texte long, tel qu'Élise l'écrit. */
  description: string;
  ordre: number;
  publie: boolean;
  createdAt: Timestamp | null;
}

const vide = (): Omit<Atelier, "id" | "createdAt"> => ({
  titre: "",
  chapeau: "",
  duree: "",
  format: "",
  pourQui: "",
  description: "",
  ordre: 0,
  publie: true,
});

const champ =
  "w-full min-h-[44px] px-4 py-2 rounded-[12px] border border-ink/15 dark:border-white/15 bg-white/70 dark:bg-black/20 font-serif text-lg text-ink dark:text-stone-100";

/** Le répertoire des ateliers qu'Élise peut animer : ce qu'elle remplit ici s'affiche
 *  sur la page Ateliers du site, dans l'ordre qu'elle choisit. */
export const AteliersAdminSection = () => {
  const { items, loading, add, update, remove } = useFirestoreCollection<Atelier>("ateliers", {
    orderField: "ordre",
    orderDirection: "asc",
  });
  const [form, setForm] = useState(vide());
  const [enCours, setEnCours] = useState<Atelier | null>(null);
  const [ouvert, setOuvert] = useState(false);

  const ouvrir = (a?: Atelier) => {
    setEnCours(a ?? null);
    setForm(a ? { ...a } : { ...vide(), ordre: items.length });
    setOuvert(true);
  };

  const enregistrer = async () => {
    if (!form.titre.trim()) return;
    if (enCours) await update(enCours.id, form);
    else await add(form);
    setOuvert(false);
    setEnCours(null);
    setForm(vide());
  };

  const deplacer = async (a: Atelier, sens: -1 | 1) => {
    const voisin = items[items.indexOf(a) + sens];
    if (!voisin) return;
    await update(a.id, { ordre: voisin.ordre });
    await update(voisin.id, { ordre: a.ordre });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-ink dark:text-stone-100">Vos ateliers</h2>
            <p className="mt-2 max-w-2xl font-serif text-lg leading-snug text-ink/70 dark:text-stone-300">
              Chaque atelier que vous ajoutez ici apparaît sur la page Ateliers de votre site, avec le bouton
              qui permet à une école, un festival ou un groupe de vous écrire pour vous inviter.
            </p>
          </div>
          <button
            type="button"
            onClick={() => ouvrir()}
            className="inline-flex items-center gap-2 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[44px] px-5 rounded-full hover:bg-ink transition-colors"
          >
            <Plus size={16} /> Ajouter un atelier
          </button>
        </div>
      </Card>

      {ouvert && (
        <Card className="p-6 md:p-8 space-y-4">
          <h3 className="font-serif text-xl text-ink dark:text-stone-100">
            {enCours ? "Modifier l'atelier" : "Nouvel atelier"}
          </h3>
          <label className="block">
            <span className="ed-kicker">Titre</span>
            <input className={`${champ} mt-2`} value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
          </label>
          <label className="block">
            <span className="ed-kicker">La phrase qui le résume</span>
            <input className={`${champ} mt-2`} value={form.chapeau} onChange={(e) => setForm({ ...form, chapeau: e.target.value })} />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="ed-kicker">Durée</span>
              <input className={`${champ} mt-2`} placeholder="Ex. 3 heures" value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} />
            </label>
            <label className="block">
              <span className="ed-kicker">Format</span>
              <input className={`${champ} mt-2`} placeholder="Ex. en personne" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} />
            </label>
            <label className="block">
              <span className="ed-kicker">Pour qui</span>
              <input className={`${champ} mt-2`} placeholder="Ex. groupes de 8 à 20" value={form.pourQui} onChange={(e) => setForm({ ...form, pourQui: e.target.value })} />
            </label>
          </div>
          <label className="block">
            <span className="ed-kicker">Description</span>
            <textarea rows={5} className={`${champ} mt-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => { void enregistrer(); }} className="inline-flex items-center gap-2 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[44px] px-5 rounded-full hover:bg-ink transition-colors">
              Enregistrer
            </button>
            <button type="button" onClick={() => { setOuvert(false); setEnCours(null); }} className="min-h-[44px] px-5 rounded-full border border-ink/20 dark:border-white/20 font-sans text-xs uppercase tracking-[0.22em]">
              Annuler
            </button>
          </div>
        </Card>
      )}

      <Card className="p-6 md:p-8">
        {loading ? (
          <p className="font-serif text-lg text-ink/60 dark:text-stone-400">Lecture de vos ateliers…</p>
        ) : items.length === 0 ? (
          <p className="font-serif text-lg text-ink/60 dark:text-stone-400">
            Aucun atelier pour l'instant. Le premier que vous ajoutez ouvrira la page Ateliers de votre site.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10 dark:divide-white/10">
            {items.map((a) => (
              <li key={a.id} className="py-4 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-xl text-ink dark:text-stone-100">{a.titre}</p>
                  {a.chapeau && <p className="mt-1 font-serif text-base text-ink/60 dark:text-stone-400">{a.chapeau}</p>}
                  <p className="mt-1 font-sans text-xs uppercase tracking-[0.18em] text-ink/45 dark:text-stone-500">
                    {[a.duree, a.format, a.pourQui].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Monter" onClick={() => { void deplacer(a, -1); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-ink dark:text-stone-400"><ArrowUp size={16} /></button>
                  <button type="button" aria-label="Descendre" onClick={() => { void deplacer(a, 1); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-ink dark:text-stone-400"><ArrowDown size={16} /></button>
                  <button type="button" aria-label={a.publie ? "Masquer" : "Afficher"} onClick={() => { void update(a.id, { publie: !a.publie }); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-ink dark:text-stone-400">
                    {a.publie ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button type="button" aria-label="Modifier" onClick={() => ouvrir(a)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-ink dark:text-stone-400"><Pencil size={16} /></button>
                  <button type="button" aria-label="Supprimer" onClick={() => { if (window.confirm(`Supprimer « ${a.titre} » ?`)) void remove(a.id); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-rust"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
