import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Upload, X, RotateCcw, Image as ImageIcon } from "lucide-react";
import { useSiteEdit } from "../../lib/siteEdit";
import { saveOverride, clearOverride } from "../../hooks/useSiteOverrides";
import { uploadMediaFile } from "../../lib/storage";

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

export const EditableImage = ({
  contentKey, defaultUrl, alt, className, loading = "lazy", decoding = "async", children,
}: Props) => {
  const { editing, read } = useSiteEdit();
  const url = read(contentKey, defaultUrl);
  const [open, setOpen] = useState(false);

  const img = children
    ? children(url)
    : <img src={url} alt={alt ?? ""} className={className} loading={loading} decoding={decoding} />;

  if (!editing) return <>{img}</>;

  return (
    <>
      <div
        className="relative group cursor-pointer"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
      >
        {img}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-2 bg-rust text-paper px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold">
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
          <span className="text-[10px] font-sans uppercase tracking-[0.3em] text-rust">Modifier l'image</span>
          <button onClick={onClose} aria-label="Fermer" className="opacity-50 hover:opacity-100">
            <X size={16} />
          </button>
        </div>

        <p className="text-[10px] font-mono opacity-50">{contentKey}</p>

        <div className="aspect-video rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800">
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        </div>

        <label className="flex items-center justify-center gap-2 bg-rust text-paper px-4 py-3 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans cursor-pointer hover:bg-ink transition-colors">
          <Upload size={12} /> {uploading ? "Téléversement…" : "Choisir une nouvelle image"}
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
        </label>

        {isOverridden && (
          <button
            onClick={reset}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 border border-ink/10 dark:border-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:border-rust hover:text-rust transition-colors"
          >
            <RotateCcw size={11} /> Revenir à l'image d'origine
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
};
