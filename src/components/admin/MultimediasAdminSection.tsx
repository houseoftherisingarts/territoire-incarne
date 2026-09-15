import { useState } from "react";
import { Plus, Trash2, Pencil, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import type { Timestamp } from "firebase/firestore";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { Card } from "./sections";

export type MultimediaType = "video" | "podcast";
export type MultimediaPlateforme = "youtube" | "vimeo" | "spotify" | "apple" | "autre";

export interface Multimedia {
  id: string;
  type: MultimediaType;
  titre: string;
  description: string;
  url: string;
  plateforme: MultimediaPlateforme;
  /** Date ISO (AAAA-MM-JJ). */
  date: string;
  ordre: number;
  publie: boolean;
  createdAt: Timestamp | null;
}

const vide = (): Omit<Multimedia, "id" | "createdAt"> => ({
  type: "video",
  titre: "",
  description: "",
  url: "",
  plateforme: "youtube",
  date: new Date().toISOString().slice(0, 10),
  ordre: 0,
  publie: true,
});

const champ =
  "w-full min-h-[44px] px-4 py-2 rounded-[12px] border border-ink/15 dark:border-white/15 bg-white/70 dark:bg-black/20 font-serif text-lg text-ink dark:text-stone-100";

const PLATEFORMES_VIDEO: { value: MultimediaPlateforme; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "autre", label: "Autre (fichier vidéo)" },
];
const PLATEFORMES_PODCAST: { value: MultimediaPlateforme; label: string }[] = [
  { value: "spotify", label: "Spotify" },
  { value: "apple", label: "Apple Podcasts" },
  { value: "autre", label: "Autre (fichier audio)" },
];

/** Le répertoire des vidéos et balados d'Élise : ce qu'elle ajoute ici s'affiche, lecteur
 *  embarqué, sur la page Multimédias du site, dans l'ordre qu'elle choisit. */
export const MultimediasAdminSection = () => {
  const { items, loading, add, update, remove } = useFirestoreCollection<Multimedia>("multimedias", {
    orderField: "ordre",
    orderDirection: "asc",
  });
  const [form, setForm] = useState(vide());
  const [enCours, setEnCours] = useState<Multimedia | null>(null);
  const [ouvert, setOuvert] = useState(false);

  const plateformes = form.type === "video" ? PLATEFORMES_VIDEO : PLATEFORMES_PODCAST;

  const ouvrir = (m?: Multimedia) => {
    setEnCours(m ?? null);
    setForm(m ? { ...m } : { ...vide(), ordre: items.length });
    setOuvert(true);
  };

  const changerType = (type: MultimediaType) => {
    const dispo = type === "video" ? PLATEFORMES_VIDEO : PLATEFORMES_PODCAST;
    setForm({ ...form, type, plateforme: dispo[0].value });
  };

  const [erreurUrl, setErreurUrl] = useState("");
  const enregistrer = async () => {
    if (!form.titre.trim() || !form.url.trim()) return;
    if (!/^https:\/\//i.test(form.url.trim())) { setErreurUrl("L'adresse doit commencer par https://"); return; }
    setErreurUrl("");
    if (enCours) await update(enCours.id, form);
    else await add(form);
    setOuvert(false);
    setEnCours(null);
    setForm(vide());
  };

  const deplacer = async (m: Multimedia, sens: -1 | 1) => {
    const voisin = items[items.indexOf(m) + sens];
    if (!voisin) return;
    await update(m.id, { ordre: voisin.ordre });
    await update(voisin.id, { ordre: m.ordre });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-ink dark:text-stone-100">Vos multimédias</h2>
            <p className="mt-2 max-w-2xl font-serif text-lg leading-snug text-ink/70 dark:text-stone-300">
              Chaque vidéo ou balado que vous ajoutez ici apparaît sur la page Multimédias de votre site,
              avec son lecteur embarqué directement dans la page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => ouvrir()}
            className="inline-flex items-center gap-2 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[44px] px-5 rounded-full hover:bg-ink transition-colors"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </Card>

      {ouvert && (
        <Card className="p-6 md:p-8 space-y-4">
          <h3 className="font-serif text-xl text-ink dark:text-stone-100">
            {enCours ? "Modifier" : "Nouveau"}
          </h3>
          <div className="flex gap-3">
            {(["video", "podcast"] as MultimediaType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => changerType(t)}
                className={`min-h-[44px] px-5 rounded-full font-sans text-xs uppercase tracking-[0.22em] font-semibold border transition-colors ${
                  form.type === t
                    ? "bg-rust text-paper border-rust"
                    : "border-ink/20 dark:border-white/20 text-ink dark:text-stone-100"
                }`}
              >
                {t === "video" ? "Vidéo" : "Balado"}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="ed-kicker">Titre</span>
            <input className={`${champ} mt-2`} value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
          </label>
          <label className="block">
            <span className="ed-kicker">Description</span>
            <textarea rows={4} className={`${champ} mt-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block md:col-span-2">
              <span className="ed-kicker">Adresse (URL)</span>
              <input
                className={`${champ} mt-2`}
                placeholder={form.type === "video" ? "https://www.youtube.com/watch?v=…" : "https://open.spotify.com/episode/…"}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            {erreurUrl && <span className="block mt-2 font-serif text-base text-rust">{erreurUrl}</span>}
          </label>
            <label className="block">
              <span className="ed-kicker">Plateforme</span>
              <select className={`${champ} mt-2`} value={form.plateforme} onChange={(e) => setForm({ ...form, plateforme: e.target.value as MultimediaPlateforme })}>
                {plateformes.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block max-w-xs">
            <span className="ed-kicker">Date</span>
            <input type="date" className={`${champ} mt-2`} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
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
          <p className="font-serif text-lg text-ink/60 dark:text-stone-400">Lecture de vos multimédias…</p>
        ) : items.length === 0 ? (
          <p className="font-serif text-lg text-ink/60 dark:text-stone-400">
            Aucune vidéo ni balado pour l'instant. Le premier que vous ajoutez ouvrira la page Multimédias de votre site.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10 dark:divide-white/10">
            {items.map((m) => (
              <li key={m.id} className="py-4 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-xl text-ink dark:text-stone-100">{m.titre}</p>
                  <p className="mt-1 font-sans text-xs uppercase tracking-[0.18em] text-ink/45 dark:text-stone-500">
                    {[m.type === "video" ? "Vidéo" : "Balado", m.plateforme, m.date].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Monter" onClick={() => { void deplacer(m, -1); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-ink dark:text-stone-400"><ArrowUp size={16} /></button>
                  <button type="button" aria-label="Descendre" onClick={() => { void deplacer(m, 1); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-ink dark:text-stone-400"><ArrowDown size={16} /></button>
                  <button type="button" aria-label={m.publie ? "Masquer" : "Afficher"} onClick={() => { void update(m.id, { publie: !m.publie }); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-ink dark:text-stone-400">
                    {m.publie ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button type="button" aria-label="Modifier" onClick={() => ouvrir(m)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-ink dark:text-stone-400"><Pencil size={16} /></button>
                  <button type="button" aria-label="Supprimer" onClick={() => { if (window.confirm(`Supprimer « ${m.titre} » ?`)) void remove(m.id); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-rust"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
