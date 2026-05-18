import { useState } from "react";
import { ELISE_MAIN_IMG, IMG_ZEN_STONE } from "../../assets/images";
import { SomaticCurves } from "../decor/SomaticCurves";

interface Props {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onDevBypass?: () => void;
}

export const AdminLogin = ({ onLogin, onDevBypass }: Props) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    const ok = await onLogin(email, pass);
    if (!ok) {
      setError(true);
      setTimeout(() => setError(false), 2200);
    }
  };

  return (
    <div className="min-h-screen w-full bg-paper dark:bg-forest text-ink dark:text-stone-100 flex flex-col md:flex-row overflow-hidden transition-colors duration-1000">
      <div className="relative w-full md:w-1/2 h-[30vh] md:h-screen overflow-hidden bg-stone-200 dark:bg-stone-900/40 flex items-center justify-center p-6 md:p-12">
        <SomaticCurves className="z-10 text-white/40 absolute inset-0" />
        <div className="absolute inset-0 bg-stone-500/5 dark:bg-black/40 mix-blend-multiply dark:mix-blend-overlay" />
        <div className="absolute inset-0">
          <img src={IMG_ZEN_STONE} className="w-full h-full object-cover opacity-30 mix-blend-multiply dark:mix-blend-overlay" alt="" />
        </div>
        <div className="relative z-20 w-full max-w-sm aspect-[3/4] shadow-2xl -rotate-1 rounded-[30px] overflow-hidden">
          <img src={ELISE_MAIN_IMG} className="w-full h-full object-cover grayscale-[20%] opacity-90" alt="Elise G. Lortie" />
        </div>
      </div>

      <div className="relative w-full md:w-1/2 min-h-[70vh] md:min-h-screen flex items-center justify-center p-8 md:p-16">
        <SomaticCurves className="text-stone-400/20 dark:text-white/5 absolute inset-0 z-0 pointer-events-none" />

        <form onSubmit={submit} className="relative z-10 w-full max-w-md">
          <span className="block text-xs font-sans tracking-widest opacity-60 dark:opacity-50 mb-4 uppercase border-b border-stone-300 dark:border-stone-500 inline-block pb-1">
            Espace privé
          </span>
          <h1 className="text-4xl md:text-5xl font-light leading-none mb-3">
            Territoire Incarné
          </h1>
          <p className="font-sans text-[11px] tracking-[0.25em] opacity-50 uppercase mb-10 border-l border-stone-400 dark:border-stone-500 pl-4 py-1">
            Tableau de bord · Elise G. Lortie
          </p>

          <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 mb-2">
            Courriel
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust dark:focus:border-stone-100 outline-none py-2 font-serif text-lg mb-7 transition-colors"
            required
          />

          <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 mb-2">
            Mot de passe
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust dark:focus:border-stone-100 outline-none py-2 font-serif text-lg mb-8 transition-colors"
            required
          />

          {error && (
            <p className="font-sans text-[11px] uppercase tracking-widest text-rust dark:text-stone-200 mb-4">
              Identifiants invalides.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-ink dark:bg-stone-100 text-paper dark:text-forest py-4 rounded-sm font-sans uppercase tracking-[0.25em] text-xs font-bold hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
          >
            Entrer
          </button>

          <a
            href="/"
            className="block mt-8 font-sans text-[10px] uppercase tracking-[0.25em] opacity-50 hover:opacity-100 transition-opacity"
          >
            ← Retour au site
          </a>

          {import.meta.env.DEV && onDevBypass && (
            <button
              type="button"
              onClick={onDevBypass}
              className="mt-6 w-full border border-dashed border-rust/60 text-rust dark:text-stone-300 py-3 rounded-sm font-sans uppercase tracking-[0.25em] text-[10px] hover:bg-rust/5 transition-colors"
              title="Contourne le login (lecture seule — Firestore refusera les écritures)"
            >
              Dev bypass · lecture seule
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
