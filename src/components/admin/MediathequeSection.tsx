import { useCallback, useEffect, useState } from "react";
import { Upload, Trash2, Copy, Check, ImageOff, Play } from "lucide-react";
import { uploadMediaFile, listMediaFiles, deleteMediaByPath, type FichierMedia } from "../../lib/storage";
import { Card } from "./sections";

const poids = (o: number) => (o > 1024 * 1024 ? `${(o / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(o / 1024)} Ko`);

const estVideo = (f: FichierMedia) => f.type.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(f.nom);

const leJour = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
};

/** « 5 photos et 2 vidéos », au singulier comme au pluriel. */
const leCompte = (fichiers: FichierMedia[]) => {
  const videos = fichiers.filter(estVideo).length;
  const photos = fichiers.length - videos;
  const bouts: string[] = [];
  if (photos > 0) bouts.push(`${photos} photo${photos > 1 ? "s" : ""}`);
  if (videos > 0) bouts.push(`${videos} vidéo${videos > 1 ? "s" : ""}`);
  return bouts.join(" et ");
};

/** La médiathèque : Élise dépose ses photos ici, les retrouve toutes au même endroit,
 *  copie l'adresse de celle qu'elle veut poser sur une page, et retire ce qui ne sert plus. */
export const MediathequeSection = () => {
  const [fichiers, setFichiers] = useState<FichierMedia[]>([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(0);
  const [erreur, setErreur] = useState("");
  const [copie, setCopie] = useState("");

  const relire = useCallback(async () => {
    setChargement(true);
    try {
      setFichiers(await listMediaFiles("media"));
      setErreur("");
    } catch {
      setErreur("La liste des photos n'a pas pu être lue. Réessayez dans un instant.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { void relire(); }, [relire]);

  const deposer = async (liste: FileList | null) => {
    if (!liste || liste.length === 0) return;
    const medias = Array.from(liste).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (medias.length === 0) {
      setErreur("Ces fichiers ne sont ni des photos ni des vidéos.");
      return;
    }
    setErreur("");
    setEnvoi(medias.length);
    try {
      for (const media of medias) await uploadMediaFile(media, "media");
      await relire();
    } catch {
      setErreur("Le dépôt a échoué. Vérifiez votre connexion, puis réessayez.");
    } finally {
      setEnvoi(0);
    }
  };

  const copier = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopie(url);
    window.setTimeout(() => setCopie(""), 2000);
  };

  const retirer = async (f: FichierMedia) => {
    if (!window.confirm(`Retirer « ${f.nom} » de votre médiathèque ? Les pages qui l'affichent perdront ce fichier.`)) return;
    try {
      await deleteMediaByPath(f.chemin);
      await relire();
    } catch {
      setErreur("La photo n'a pas pu être retirée.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8">
        <h2 className="font-serif text-2xl md:text-3xl text-ink dark:text-stone-100">Votre médiathèque</h2>
        <p className="mt-2 max-w-2xl font-serif text-lg leading-snug text-ink/70 dark:text-stone-300">
          Déposez ici les photos et les vidéos que vous voulez garder sous la main. Elles restent disponibles
          pour vos pages, vos écrits et votre boutique, et le bouton « Copier le lien » vous donne l'adresse à
          coller partout où une image ou une vidéo se demande.
        </p>

        <label className="mt-6 flex flex-col items-center justify-center gap-3 border border-dashed border-ink/25 dark:border-white/20 rounded-[20px] py-10 px-6 cursor-pointer hover:bg-ink/[0.03] dark:hover:bg-white/[0.04] transition-colors">
          <Upload size={22} className="text-rust" />
          <span className="font-sans text-xs uppercase tracking-[0.22em] font-semibold text-ink dark:text-stone-100">
            {envoi > 0 ? `Dépôt en cours (${envoi})` : "Ajouter des photos ou des vidéos"}
          </span>
          <span className="font-serif text-base text-ink/60 dark:text-stone-400">
            Vous pouvez en choisir plusieurs à la fois.
          </span>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="sr-only"
            disabled={envoi > 0}
            onChange={(e) => { void deposer(e.target.files); e.target.value = ""; }}
          />
        </label>

        {erreur && <p className="mt-4 font-serif text-base text-rust">{erreur}</p>}
      </Card>

      <Card className="p-6 md:p-8">
        {chargement ? (
          <p className="font-serif text-lg text-ink/60 dark:text-stone-400">Lecture de vos photos…</p>
        ) : fichiers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <ImageOff size={24} className="text-ink/30 dark:text-white/30" />
            <p className="font-serif text-lg text-ink/60 dark:text-stone-400">
              Votre médiathèque est vide pour l'instant. Le premier fichier que vous déposez apparaîtra ici.
            </p>
          </div>
        ) : (
          <>
            <p className="ed-kicker mb-5">{leCompte(fichiers)}</p>
            <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {fichiers.map((f) => (
                <li key={f.chemin} className="group rounded-[15px] overflow-hidden ring-1 ring-ink/10 dark:ring-white/10 bg-ink/[0.03] dark:bg-white/[0.04]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink/5 dark:bg-black/30">
                    {estVideo(f) ? (
                      <>
                        <video src={f.url} preload="metadata" muted playsInline controls className="w-full h-full object-cover" />
                        <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 font-sans text-[10px] uppercase tracking-[0.18em] text-paper">
                          <Play size={11} /> Vidéo
                        </span>
                      </>
                    ) : (
                      <img src={f.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-serif text-base leading-snug text-ink dark:text-stone-100 truncate" title={f.nom}>{f.nom}</p>
                    <p className="font-sans text-xs text-ink/50 dark:text-stone-400 mt-1">
                      {poids(f.taille)} · {leJour(f.depose)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { void copier(f.url); }}
                        className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-full border border-ink/20 dark:border-white/20 font-sans text-xs uppercase tracking-[0.18em] hover:bg-ink hover:text-paper dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
                      >
                        {copie === f.url ? <Check size={15} /> : <Copy size={15} />}
                        {copie === f.url ? "Copié" : "Copier le lien"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { void retirer(f); }}
                        aria-label={`Retirer ${f.nom}`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-ink/50 dark:text-stone-400 hover:text-rust transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
};
