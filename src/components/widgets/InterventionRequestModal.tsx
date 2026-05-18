import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Send, Sparkles } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import type { CategoryConfig, FieldDef } from "../../lib/interventionFields";

interface Props {
  config: CategoryConfig;
  onClose: () => void;
}

const isVisible = (f: FieldDef, values: Record<string, string>): boolean =>
  f.showIf ? f.showIf(values) : true;

export const InterventionRequestModal = ({ config, onClose }: Props) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (name: string, val: string) => setValues((v) => ({ ...v, [name]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate visible required fields
    for (const f of config.fields) {
      if (!isVisible(f, values)) continue;
      if (f.required && !values[f.name]?.toString().trim()) {
        setError(`Le champ "${f.label}" est requis.`);
        return;
      }
      if (f.type === "number" && f.min !== undefined && values[f.name]) {
        const n = parseInt(values[f.name], 10);
        if (Number.isNaN(n) || n < f.min) {
          setError(`"${f.label}" doit être au moins ${f.min}.`);
          return;
        }
      }
    }

    setBusy(true);
    try {
      // Strip hidden fields from saved details
      const details: Record<string, string> = {};
      for (const f of config.fields) {
        if (isVisible(f, values) && values[f.name]) details[f.name] = values[f.name];
      }
      await addDoc(collection(db, "interventionRequests"), {
        category: config.id,
        categoryLabel: config.label,
        clientName: values.name ?? "",
        clientEmail: values.email ?? "",
        clientPhone: values.phone ?? "",
        details,
        status: "new",
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (err) {
      console.error("Intervention request failed:", err);
      setError("Impossible d'envoyer la demande. Réessayez plus tard.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-paper dark:bg-stone-900 max-w-xl w-full rounded-[30px] shadow-2xl relative animate-[fadeIn_0.3s_ease-out] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Fermer" className="absolute top-4 right-4 z-10 p-2 hover:opacity-60 bg-paper/80 dark:bg-stone-900/80 rounded-full">
          <X size={18} />
        </button>

        {success ? (
          <div className="p-10 text-center space-y-4">
            <Sparkles className="mx-auto text-rust" size={32} />
            <h3 className="font-serif text-2xl">Merci — votre demande est partie.</h3>
            <p className="font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">
              Elise lit chaque demande personnellement et reviendra vers vous à l'adresse fournie.
            </p>
            <button
              onClick={onClose}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-ink text-paper dark:bg-stone-100 dark:text-forest rounded-full text-xs uppercase tracking-widest font-bold hover:bg-rust transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 md:p-8 space-y-5">
            <div>
              <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-rust dark:text-stone-400 mb-2">
                {config.label}
              </p>
              <h2 className="font-serif text-2xl md:text-3xl mb-3 leading-tight">{config.modalTitle}</h2>
              <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {config.intro}
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-ink/10 dark:border-white/10">
              {config.fields.map((f) => {
                if (!isVisible(f, values)) return null;
                return (
                  <div key={f.name} className="space-y-1">
                    <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-60">
                      {f.label}
                      {f.required && <span className="text-rust ml-1">*</span>}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea
                        value={values[f.name] ?? ""}
                        onChange={(e) => set(f.name, e.target.value)}
                        placeholder={f.placeholder}
                        rows={3}
                        className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust outline-none py-2 font-serif text-base resize-none transition-colors"
                      />
                    ) : f.type === "select" ? (
                      <select
                        value={values[f.name] ?? ""}
                        onChange={(e) => set(f.name, e.target.value)}
                        className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust outline-none py-2 font-serif text-base transition-colors"
                      >
                        <option value="">— Choisir —</option>
                        {f.options?.map((o) => (
                          <option key={o} value={o} className="bg-paper dark:bg-stone-800">
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type}
                        value={values[f.name] ?? ""}
                        onChange={(e) => set(f.name, e.target.value)}
                        placeholder={f.placeholder}
                        min={f.type === "number" ? f.min : undefined}
                        className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust outline-none py-2 font-serif text-base transition-colors"
                      />
                    )}
                    {f.helpText && (
                      <p className="text-[10px] font-serif italic opacity-50">{f.helpText}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <p className="font-sans text-xs uppercase tracking-widest text-rust py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-3 border-t border-ink/10 dark:border-white/10">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 bg-ink text-paper dark:bg-stone-100 dark:text-forest px-6 py-3 rounded-full text-xs uppercase tracking-[0.25em] font-bold font-sans hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors disabled:opacity-50"
              >
                <Send size={12} /> {busy ? "Envoi…" : "Envoyer la demande"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-ink/10 dark:border-white/10 rounded-full text-xs uppercase tracking-[0.25em] font-bold font-sans hover:border-rust hover:text-rust transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
};
