import { useState } from "react";
import { ELISE_MAIN_IMG } from "../../assets/images";
import { GoogleIcon } from "../common/GoogleIcon";

interface Props {
  onLoginGoogle: () => Promise<void>;
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onLogout: () => Promise<void>;
  /** Un compte est connecté mais n'est pas dans la liste des administratrices. */
  notAdmin?: boolean;
  connectedEmail?: string | null;
  error?: string | null;
  onDevBypass?: () => void;
}

/** La porte de l'admin. Google en premier : Élise entre avec son compte Google, Alex avec le sien.
 *  Le courriel et le mot de passe restent pour le compte historique. */
export const AdminLogin = ({ onLoginGoogle, onLogin, onLogout, notAdmin, connectedEmail, error, onDevBypass }: Props) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [parCourriel, setParCourriel] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onLogin(email, pass);
    setBusy(false);
  };

  const google = async () => {
    setBusy(true);
    await onLoginGoogle();
    setBusy(false);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-paper dark:bg-forest text-ink dark:text-stone-100 grid grid-cols-1 md:grid-cols-12 transition-colors duration-700">
      <div className="relative md:col-span-5 h-[34vh] md:h-auto md:min-h-[100dvh] overflow-hidden bg-stone-300 dark:bg-stone-900">
        <img
          src={ELISE_MAIN_IMG}
          className="absolute inset-0 w-full h-full object-cover grayscale-[15%]"
          alt="Elise .G Lortie"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
        <p className="absolute left-6 bottom-6 md:left-10 md:bottom-10 font-sans text-xs uppercase tracking-[0.3em] text-paper/90">
          Espace privé
        </p>
      </div>

      <div className="md:col-span-7 flex items-center px-6 py-14 md:px-16 lg:px-24">
        <div className="w-full max-w-md">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-rust mb-4">Tableau de bord</p>
          <h1 className="font-serif text-4xl md:text-5xl font-light leading-[1.05] mb-3">Territoire Incarné</h1>
          <p className="font-sans text-xs uppercase tracking-[0.25em] opacity-50 mb-10">Elise .G Lortie</p>

          {notAdmin ? (
            <div className="space-y-6">
              <p className="font-serif text-lg leading-relaxed">
                Le compte <span className="text-rust">{connectedEmail}</span> est connecté, mais il n'a pas accès au tableau de bord.
              </p>
              <button
                type="button"
                onClick={async () => { await onLogout(); }}
                className="w-full bg-ink dark:bg-stone-100 text-paper dark:text-forest min-h-[48px] rounded-full font-sans uppercase tracking-[0.25em] text-xs font-bold hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
              >
                Changer de compte
              </button>
              <a href="/" className="block font-sans text-xs uppercase tracking-[0.25em] opacity-50 hover:opacity-100 transition-opacity">
                Retour au site
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              <button
                type="button"
                onClick={google}
                disabled={busy}
                className="w-full flex items-center justify-center gap-3 bg-ink dark:bg-stone-100 text-paper dark:text-forest min-h-[52px] rounded-full font-sans text-xs uppercase tracking-[0.25em] font-bold hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors disabled:opacity-50"
              >
                <GoogleIcon className="w-[18px] h-[18px] bg-paper rounded-full p-[2px]" />
                Continuer avec Google
              </button>

              {error && (
                <p className="font-sans text-xs uppercase tracking-widest text-rust" role="alert">{error}</p>
              )}

              {!parCourriel ? (
                <button
                  type="button"
                  onClick={() => setParCourriel(true)}
                  className="font-sans text-xs uppercase tracking-[0.25em] opacity-50 hover:opacity-100 hover:text-rust transition-all"
                >
                  Entrer avec un courriel et un mot de passe
                </button>
              ) : (
                <form onSubmit={submit} className="space-y-6 pt-2 border-t border-ink/10 dark:border-white/10">
                  <div className="pt-4">
                    <label htmlFor="admin-email" className="block text-xs font-sans uppercase tracking-[0.25em] opacity-60 mb-2">Courriel</label>
                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust dark:focus:border-stone-100 outline-none py-2 font-serif text-lg transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-pass" className="block text-xs font-sans uppercase tracking-[0.25em] opacity-60 mb-2">Mot de passe</label>
                    <input
                      id="admin-pass"
                      type="password"
                      autoComplete="current-password"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust dark:focus:border-stone-100 outline-none py-2 font-serif text-lg transition-colors"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full border border-ink/30 dark:border-stone-300/30 min-h-[48px] rounded-full font-sans uppercase tracking-[0.25em] text-xs font-bold hover:bg-ink hover:text-paper dark:hover:bg-stone-100 dark:hover:text-forest transition-colors disabled:opacity-50"
                  >
                    Entrer
                  </button>
                </form>
              )}

              <a href="/" className="block font-sans text-xs uppercase tracking-[0.25em] opacity-40 hover:opacity-80 transition-opacity">
                Retour au site
              </a>

              {import.meta.env.DEV && onDevBypass && (
                <button
                  type="button"
                  onClick={onDevBypass}
                  className="w-full border border-dashed border-rust/60 text-rust dark:text-stone-300 py-3 rounded-full font-sans uppercase tracking-[0.25em] text-xs hover:bg-rust/5 transition-colors"
                  title="Contourne le login (lecture seule)"
                >
                  Dev bypass · lecture seule
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
