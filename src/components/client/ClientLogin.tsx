import { useState } from "react";
import { SomaticCurves } from "../decor/SomaticCurves";
import { setSignupNewsletterOptOut } from "../../hooks/useClientAuth";

interface Props {
  onSignInGoogle: () => Promise<void>;
  onSignInEmail: (email: string, pass: string) => Promise<void>;
  onSignUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  error: string | null;
}

export const ClientLogin = ({ onSignInGoogle, onSignInEmail, onSignUpEmail, error }: Props) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [optOut, setOptOut] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") setSignupNewsletterOptOut(optOut);
    if (mode === "login") await onSignInEmail(email, pass);
    else await onSignUpEmail(email, pass, name);
    setBusy(false);
  };

  const handleGoogle = async () => {
    setBusy(true);
    if (mode === "signup") setSignupNewsletterOptOut(optOut);
    await onSignInGoogle();
    setBusy(false);
  };

  return (
    <div className="min-h-screen w-full bg-paper dark:bg-forest text-ink dark:text-stone-100 flex items-center justify-center p-6 transition-colors duration-1000 relative overflow-hidden">
      <SomaticCurves className="absolute inset-0 text-stone-300/20 dark:text-white/5 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="block text-[10px] font-sans uppercase tracking-[0.3em] text-rust dark:text-stone-400 mb-3">
            Espace personnel
          </span>
          <h1 className="text-4xl font-light leading-none mb-2">Territoire Incarné</h1>
          <p className="font-sans text-[11px] tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase">
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </p>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 border border-stone-300 dark:border-stone-600 py-3.5 rounded-xl font-sans text-sm hover:border-rust dark:hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 transition-all mb-6 disabled:opacity-50"
        >
          {/* Google icon */}
          <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 46c5.5 0 10.5-1.9 14.4-5l-6.7-5.5C29.6 37 26.9 38 24 38c-6 0-11.1-4-12.9-9.5L4 34c3.5 7.2 10.7 12 20 12z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-1 3-3.5 5.5-6.8 7l6.7 5.5C40.3 37.1 44.5 31 44.5 24c0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Continuer avec Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
          <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400">ou</span>
          <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
        </div>

        <form onSubmit={submit} className="space-y-5">
          {mode === "signup" && (
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 mb-2">
                Prénom et nom
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust dark:focus:border-stone-100 outline-none py-2 font-serif text-lg transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 mb-2">
              Courriel
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust dark:focus:border-stone-100 outline-none py-2 font-serif text-lg transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              minLength={6}
              className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust dark:focus:border-stone-100 outline-none py-2 font-serif text-lg transition-colors"
            />
          </div>

          {error && (
            <p className="font-sans text-[11px] uppercase tracking-widest text-rust dark:text-stone-200">
              {error}
            </p>
          )}

          {mode === "signup" && (
            <label className="flex items-start gap-2 cursor-pointer text-xs opacity-80">
              <input
                type="checkbox"
                checked={optOut}
                onChange={(e) => setOptOut(e.target.checked)}
                className="accent-rust mt-1 shrink-0"
              />
              <span className="font-serif italic">
                Je préfère <strong className="not-italic">ne pas</strong> recevoir l'infolettre
                <span className="block text-[10px] uppercase tracking-widest opacity-60 mt-0.5 not-italic font-sans">
                  Sinon, vous serez ajouté·e — vous pouvez vous désabonner à tout moment.
                </span>
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-ink dark:bg-stone-100 text-paper dark:text-forest py-4 rounded-xl font-sans uppercase tracking-[0.25em] text-xs font-bold hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors disabled:opacity-50"
          >
            {busy ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-50 hover:opacity-100 transition-opacity"
          >
            {mode === "login" ? "Pas encore de compte ? Créer un compte →" : "Déjà un compte ? Se connecter →"}
          </button>
          <br />
          <a
            href="/"
            className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-40 hover:opacity-80 transition-opacity"
          >
            ← Retour au site
          </a>
        </div>
      </div>
    </div>
  );
};
