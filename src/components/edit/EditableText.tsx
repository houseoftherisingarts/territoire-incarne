import { useState, type ElementType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Pencil, X, Check, RotateCcw } from "lucide-react";
import { useSiteEdit } from "../../lib/siteEdit";
import { saveOverride, clearOverride } from "../../hooks/useSiteOverrides";
import { tx, useLangue } from "../../i18n/tx";
import { CONTENT } from "../../i18n";

/** Lit une valeur dans le contenu i18n par son chemin, « sections.apropos.title » ou
 *  « sections.rendezvous.etapes.0.titre ». Une chaîne absente rend vide, jamais une erreur. */
const lireI18n = (racine: unknown, chemin: string): string => {
  const v = chemin.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), racine);
  return typeof v === "string" ? v : "";
};

interface Props {
  /** Stable identifier — e.g. "home.hero.title". Used as the Firestore doc ID. */
  contentKey?: string;
  /** Un chemin dans le contenu i18n (fr.ts / en.ts) : la clé et les deux défauts en découlent. */
  i18n?: string;
  /** Original copy from the codebase, in French. Shown when no override exists. */
  defaultValue?: string;
  /** The English original. When absent, the French default is looked up in the dictionary. */
  defaultValueEn?: string;
  /** Render tag (h1, h2, p, span, button…). Default: span. */
  as?: ElementType;
  /** Pass through className to the rendered element. */
  className?: string;
  /** Multiline editor (textarea instead of input). */
  multiline?: boolean;
  /** Optional render override — wrap children, e.g. for icons. */
  children?: (text: string) => ReactNode;
}

/** Un texte du site qu'Élise récrit en ligne. Chaque langue a sa propre clé : le texte
 *  anglais se range sous `<contentKey>.en`, si bien que la bascule EN ne montre jamais un
 *  texte français enregistré par-dessus l'anglais d'origine. */
export const EditableText = ({
  contentKey: cleDonnee, i18n, defaultValue: defautDonne, defaultValueEn, as: Tag = "span", className, multiline, children,
}: Props) => {
  const { editing, read } = useSiteEdit();
  const lang = useLangue();
  const [open, setOpen] = useState(false);
  const contentKey = cleDonnee ?? `i18n.${i18n}`;
  const defaultValue = defautDonne ?? (i18n ? lireI18n(CONTENT.fr, i18n) : "");
  const defautEn = defaultValueEn ?? (i18n ? lireI18n(CONTENT.en, i18n) || undefined : undefined);
  const cle = lang === "en" ? `${contentKey}.en` : contentKey;
  const defaut = lang === "en" ? defautEn ?? tx("en", defaultValue) : defaultValue;
  const text = read(cle, defaut);

  const content = children ? children(text) : text;

  if (!editing) {
    return <Tag className={className}>{content}</Tag>;
  }

  return (
    <>
      <Tag
        className={`${className ?? ""} relative outline-1 outline-dashed outline-rust/40 hover:outline-rust hover:outline-2 cursor-pointer transition-all rounded-sm`}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {content}
        <span className="not-inline-flex items-center justify-center w-4 h-4 ml-1 align-middle bg-rust text-paper rounded-full">
          <Pencil size={9} />
        </span>
      </Tag>
      {open && (
        <EditPopover
          contentKey={cle}
          defaultValue={defaut}
          currentValue={text}
          multiline={!!multiline}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

interface PopoverProps {
  contentKey: string;
  defaultValue: string;
  currentValue: string;
  multiline: boolean;
  onClose: () => void;
}

const EditPopover = ({ contentKey, defaultValue, currentValue, multiline, onClose }: PopoverProps) => {
  const [draft, setDraft] = useState(currentValue);
  const [busy, setBusy] = useState(false);
  const isOverridden = currentValue !== defaultValue;

  const save = async () => {
    setBusy(true);
    try {
      await saveOverride(contentKey, draft);
      onClose();
    } catch (err) {
      console.error("Save override failed:", err);
      alert("Erreur d'enregistrement.");
    } finally {
      setBusy(false);
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
        className="bg-paper dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans uppercase tracking-[0.3em] text-rust">
            {contentKey.endsWith(".en") ? "Modifier le texte anglais" : "Modifier le texte"}
          </span>
          <button onClick={onClose} aria-label="Fermer" className="opacity-50 hover:opacity-100">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs font-mono opacity-50">{contentKey}</p>

        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            autoFocus
            className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 font-serif text-base outline-none focus:border-rust resize-y"
          />
        ) : (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 font-serif text-base outline-none focus:border-rust"
          />
        )}

        {isOverridden && (
          <p className="text-xs font-serif opacity-60">
            Valeur d'origine : <span className="font-mono not-">{defaultValue}</span>
          </p>
        )}

        <div className="flex gap-2 pt-2 border-t border-ink/5 dark:border-white/5">
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50"
          >
            <Check size={12} /> {busy ? "…" : "Enregistrer"}
          </button>
          {isOverridden && (
            <button
              onClick={reset}
              disabled={busy}
              className="inline-flex items-center gap-2 border border-ink/10 dark:border-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:border-rust hover:text-rust transition-colors"
            >
              <RotateCcw size={11} /> Revenir à l'original
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 text-xs font-sans uppercase tracking-widest opacity-60 hover:opacity-100"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
