import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Crosshair, ExternalLink, Images, RotateCcw } from "lucide-react";
import { Card } from "./sections";
import { PHOTOS_DU_SITE, type PhotoDuSite } from "../../assets/images";
import { useSiteOverrides, saveOverride, clearOverride } from "../../hooks/useSiteOverrides";
import { listMediaFiles, type FichierMedia } from "../../lib/storage";
import { CADRE_PAR_DEFAUT, ecrireCadre, lireCadre, styleCadre, type Cadre } from "../edit/EditableImage";
import { usePhotoPortrait } from "../../hooks/usePhotoPortrait";

const cleCadre = (cle: string) => `${cle}.cadre`;
const encode = (key: string) => key.replace(/\//g, "__").replace(/\./g, "_");

/** Une photo du site avec son cadre réel : Élise clique sur la photo pour poser le point
 *  d'attention, glisse le zoom, choisit une autre photo de sa médiathèque si elle veut, et
 *  enregistre. Le cadre montré ici a exactement les proportions de la page. */
const CartePhoto = ({ photo, overrides, fichiers }: { photo: PhotoDuSite; overrides: Record<string, string>; fichiers: FichierMedia[] }) => {
  const urlEnLigne = overrides[encode(photo.cle)] ?? photo.defaut;
  const cadreEnLigne = lireCadre(overrides[encode(cleCadre(photo.cle))] ?? "");
  const [url, setUrl] = useState(urlEnLigne);
  const [cadre, setCadre] = useState<Cadre>(cadreEnLigne);
  const [choix, setChoix] = useState(false);
  const [etat, setEtat] = useState<"" | "envoi" | "fait" | "erreur">("");
  const cadreRef = useRef<HTMLDivElement>(null);
  // Une photo en hauteur met la page en double page (cadre 3:4); en largeur, elle fait un bandeau.
  const enHauteur = usePhotoPortrait(url);
  const ratio = photo.ratio < 1 ? photo.ratio : enHauteur ? 3 / 4 : photo.ratio;

  useEffect(() => { setUrl(urlEnLigne); }, [urlEnLigne]);
  useEffect(() => { setCadre(cadreEnLigne); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [overrides[encode(cleCadre(photo.cle))]]);

  const modifie = url !== urlEnLigne || ecrireCadre(cadre) !== ecrireCadre(cadreEnLigne);
  const photos = useMemo(() => fichiers.filter((f) => !f.type.startsWith("video/") && !/\.(mp4|mov|webm|m4v)$/i.test(f.nom)), [fichiers]);

  const viser = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = cadreRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setCadre((c) => ({ ...c, x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) }));
  };

  const enregistrer = async () => {
    setEtat("envoi");
    try {
      if (url !== photo.defaut) await saveOverride(photo.cle, url);
      else await clearOverride(photo.cle);
      if (ecrireCadre(cadre) !== ecrireCadre(CADRE_PAR_DEFAUT)) await saveOverride(cleCadre(photo.cle), ecrireCadre(cadre));
      else await clearOverride(cleCadre(photo.cle));
      setEtat("fait");
      window.setTimeout(() => setEtat(""), 2000);
    } catch {
      setEtat("erreur");
    }
  };

  const revenir = async () => {
    setUrl(photo.defaut);
    setCadre(CADRE_PAR_DEFAUT);
  };

  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl text-ink dark:text-stone-100">{photo.libelle}</h3>
          <a href={photo.page} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-[0.18em] text-ink/50 dark:text-stone-400 hover:text-rust">
            Voir la page <ExternalLink size={12} />
          </a>
        </div>
        <span className="font-sans text-xs uppercase tracking-[0.18em] text-ink/40 dark:text-stone-500">
          {ratio >= 2 ? "Bandeau 21:9" : ratio >= 1 ? "Paysage" : "Portrait 3:4"}
        </span>
      </div>

      <div
        ref={cadreRef}
        onClick={viser}
        role="button"
        tabIndex={0}
        aria-label="Cliquez pour poser le point d'attention"
        className="mt-4 relative w-full overflow-hidden bg-ink/5 dark:bg-black/30 cursor-crosshair ring-1 ring-ink/10 dark:ring-white/10"
        style={{ aspectRatio: String(ratio) }}
      >
        <img src={url} alt="" className="w-full h-full object-cover" style={styleCadre(cadre)} draggable={false} />
        <span
          className="pointer-events-none absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-paper shadow-[0_0_0_2px_rgba(0,0,0,0.45)]"
          style={{ left: `${cadre.x}%`, top: `${cadre.y}%` }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-2 flex items-center gap-2 font-serif text-base text-ink/60 dark:text-stone-400">
        <Crosshair size={14} /> Cliquez sur la photo pour choisir ce qui reste au centre du cadre.
      </p>

      <label className="mt-4 block">
        <span className="font-sans text-xs uppercase tracking-[0.18em] text-ink/60 dark:text-stone-400">Zoom · {Math.round(cadre.zoom * 100)} %</span>
        <input
          type="range"
          min={100}
          max={250}
          step={5}
          value={Math.round(cadre.zoom * 100)}
          onChange={(e) => setCadre((c) => ({ ...c, zoom: Number(e.target.value) / 100 }))}
          className="mt-2 w-full accent-rust"
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => { void enregistrer(); }}
          disabled={!modifie || etat === "envoi"}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-rust text-paper font-sans text-xs uppercase tracking-[0.18em] font-semibold hover:bg-ink transition-colors disabled:opacity-40"
        >
          <Check size={15} /> {etat === "envoi" ? "Enregistrement…" : etat === "fait" ? "Enregistré" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => setChoix((v) => !v)}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-ink/20 dark:border-white/20 font-sans text-xs uppercase tracking-[0.18em] hover:border-rust hover:text-rust transition-colors"
        >
          <Images size={15} /> {choix ? "Refermer la médiathèque" : "Choisir une autre photo"}
        </button>
        {(url !== photo.defaut || ecrireCadre(cadre) !== ecrireCadre(CADRE_PAR_DEFAUT)) && (
          <button
            type="button"
            onClick={() => { void revenir(); }}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full font-sans text-xs uppercase tracking-[0.18em] text-ink/60 dark:text-stone-400 hover:text-rust transition-colors"
          >
            <RotateCcw size={14} /> Photo et cadrage d'origine
          </button>
        )}
        {etat === "erreur" && <span className="font-serif text-base text-rust">L'enregistrement a échoué. Réessayez.</span>}
      </div>

      {choix && (
        <ul className="mt-5 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-72 overflow-y-auto p-1">
          {photos.length === 0 && (
            <li className="col-span-full font-serif text-base text-ink/60 dark:text-stone-400">Votre médiathèque ne contient pas encore de photo.</li>
          )}
          {photos.map((f) => (
            <li key={f.chemin}>
              <button
                type="button"
                onClick={() => { setUrl(f.url); setCadre(CADRE_PAR_DEFAUT); setChoix(false); }}
                aria-label={`Utiliser ${f.nom}`}
                className={`block w-full aspect-square overflow-hidden ring-2 transition-colors ${f.url === url ? "ring-rust" : "ring-transparent hover:ring-ink/30"}`}
              >
                <img src={f.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

/** Recadrer les photos : chaque photo du site, dans le cadre exact de sa page, avec le point
 *  d'attention et le zoom à la main d'Élise, et le choix d'une autre photo de la médiathèque. */
export const RecadrerSection = () => {
  const { overrides } = useSiteOverrides();
  const [fichiers, setFichiers] = useState<FichierMedia[]>([]);

  useEffect(() => {
    listMediaFiles("media").then(setFichiers).catch(() => setFichiers([]));
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8">
        <h2 className="font-serif text-2xl md:text-3xl text-ink dark:text-stone-100">Recadrer les photos</h2>
        <p className="mt-2 max-w-2xl font-serif text-lg leading-snug text-ink/70 dark:text-stone-300">
          Chaque photo du site est montrée ici dans le cadre exact de sa page. Cliquez sur la photo pour
          choisir ce qui reste au centre, glissez le zoom pour resserrer, et changez de photo depuis votre
          médiathèque si vous le souhaitez. Le site se met à jour dès que vous enregistrez.
        </p>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {PHOTOS_DU_SITE.map((p) => (
          <CartePhoto key={p.cle} photo={p} overrides={overrides} fichiers={fichiers} />
        ))}
      </div>
    </div>
  );
};
