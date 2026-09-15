import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Upload, X, RotateCcw, Image as ImageIcon } from "lucide-react";
import { useSiteEdit } from "../../lib/siteEdit";
import { saveOverride, clearOverride } from "../../hooks/useSiteOverrides";
import { uploadMediaFile } from "../../lib/storage";
import { PHOTO_DE_SECOURS } from "../../assets/images";

interface Props {
  /** Stable identifier — e.g. "home.flower". */
  contentKey: string;
  /** Original image URL from the codebase. */
  defaultUrl: string;
  alt?: string;
  className?: string;
  /** Pass-throughs */
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  /** Optional render override — wrap the resolved URL, e.g. for picture/source tags. */
  children?: (url: string) => ReactNode;
}

/** Le cadrage d'une photo, tel que l'admin Recadrer les photos l'enregistre :
 *  « x,y,zoom » en pourcentages et facteur, lu sous la clé `<contentKey>.cadre`. */
export interface Cadre { x: number; y: number; zoom: number; }
export const CADRE_PAR_DEFAUT: Cadre = { x: 50, y: 50, zoom: 1 };
export const lireCadre = (brut: string): Cadre => {
  const [x, y, z] = brut.split(",").map(Number);
  if (![x, y, z].every((n) => Number.isFinite(n))) return CADRE_PAR_DEFAUT;
  return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)), zoom: Math.min(2.5, Math.max(1, z)) };
};
export const ecrireCadre = (c: Cadre) => `${Math.round(c.x)},${Math.round(c.y)},${c.zoom.toFixed(2)}`;
export const styleCadre = (c: Cadre): React.CSSProperties => ({
  objectPosition: `${c.x}% ${c.y}%`,
  transform: c.zoom !== 1 ? `scale(${c.zoom})` : undefined,
  transformOrigin: `${c.x}% ${c.y}%`,
});

/** Une photo du site que l'admin peut remplacer et recadrer. Si l'adresse enregistrée ne
 *  répond plus (fichier retiré de la médiathèque), la photo d'origine revient d'elle-même,
 *  et si celle-là manque aussi, la photo de secours du site prend la place : jamais de cadre vide. */
export const EditableImage = ({
  contentKey, defaultUrl, alt, className, loading = "lazy", decoding = "async", children,
}: Props) => {
  const { editing, read } = useSiteEdit();
  const voulue = read(contentKey, defaultUrl);
  const cadre = lireCadre(read(`${contentKey}.cadre`, ""));
  const [url, setUrl] = useState(voulue);
  useEffect(() => { setUrl(voulue); }, [voulue]);
  const [open, setOpen] = useState(false);

  const enPanne = () => {
    if (url !== defaultUrl && url !== PHOTO_DE_SECOURS) setUrl(defaultUrl);
    else if (url !== PHOTO_DE_SECOURS) setUrl(PHOTO_DE_SECOURS);
  };

  const img = children
    ? children(url)
    : <img src={url} alt={alt ?? ""} className={className} style={styleCadre(cadre)} loading={loading} decoding={decoding} onError={enPanne} />;

  if (!editing) return <>{img}</>;

  return (
    <>
      <div
        className="relative group cursor-pointer w-full h-full"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
      >
        {img}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-2 bg-rust text-paper px-3 py-1.5 rounded-full text-xs uppercase tracking-widest font-bold">
            <ImageIcon size={12} /> Changer
          </span>
        </div>
      </div>
      {open && (
        <ImagePopover
          contentKey={contentKey}
          defaultUrl={defaultUrl}
          currentUrl={url}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

interface PopoverProps {
  contentKey: string;
  defaultUrl: string;
  currentUrl: string;
  onClose: () => void;
}

const ImagePopover = ({ contentKey, defaultUrl, currentUrl, onClose }: PopoverProps) => {
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const isOverridden = currentUrl !== defaultUrl;

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image trop volumineuse (max 10 MB)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMediaFile(file, "media");
      await saveOverride(contentKey, url);
      onClose();
    } catch (err) {
      console.error("Image override failed:", err);
      alert("Échec du téléversement.");
    } finally {
      setUploading(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await clearOverride(contentKey);
      await clearOverride(`${contentKey}.cadre`);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans uppercase tracking-[0.3em] text-rust">Modifier l'image</span>
          <button onClick={onClose} aria-label="Fermer" className="opacity-50 hover:opacity-100">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs font-mono opacity-50">{contentKey}</p>

        <div className="aspect-video overflow-hidden bg-stone-200 dark:bg-stone-800">
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        </div>

        <label className="flex items-center justify-center gap-2 bg-rust text-paper px-4 py-3 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans cursor-pointer hover:bg-ink transition-colors">
          <Upload size={12} /> {uploading ? "Téléversement…" : "Choisir une nouvelle image"}
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
        </label>

        <a href="/admin?section=recadrer" className="block text-center text-xs font-sans uppercase tracking-[0.2em] opacity-60 hover:opacity-100 hover:text-rust transition-colors">
          Recadrer cette photo dans le tableau de bord
        </a>

        {isOverridden && (
          <button
            onClick={reset}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 border border-ink/10 dark:border-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:border-rust hover:text-rust transition-colors"
          >
            <RotateCcw size={11} /> Revenir à l'image d'origine
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
};
