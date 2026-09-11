import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Sun, X, LogIn } from "lucide-react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "../../firebase";
import { pathForSection } from "../../routes";
import { useSections } from "../../hooks/useSections";
import type { Content } from "../../i18n";
import type { Lang, SectionId, Theme } from "../../types";

interface Props {
  t: Content;
  lang: Lang;
  theme: Theme;
  current: SectionId | null;
  /** Sur l'accueil, la barre ne porte que les commodités : le sommaire vit dans la page. */
  accueil?: boolean;
  onOpen: (id: SectionId | null) => void;
  onToggleLang: () => void;
  onToggleTheme: () => void;
}

const EASE = [0.16, 0.8, 0.24, 1] as const;

/** L'en-tête de navigation des pages de section : la marque, le sommaire, l'appel au rendez-vous
 *  et les commodités (langue, thème, espace client). Sur mobile, un menu plein écran numéroté. */
export const Header = ({ t, lang, theme, current, accueil = false, onOpen, onToggleLang, onToggleTheme }: Props) => {
  const { visibles, estVisible } = useSections();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [ouvert]);

  const aller = (id: SectionId | null) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setOuvert(false);
    onOpen(id);
  };

  const libelleEspace = user ? user.displayName?.split(" ")[0] || t.general.myClientSpace : t.general.clientSpace;

  return (
    <header className={`relative z-40 w-full ${accueil ? "" : "sticky top-0 bg-paper/90 dark:bg-forest/90 backdrop-blur-md border-b border-ink/10 dark:border-white/10"}`}>
      <div className={`px-5 md:px-12 lg:px-16 h-16 md:h-20 flex items-center gap-6 ${accueil ? "lg:w-7/12 text-paper lg:text-ink dark:lg:text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] lg:drop-shadow-none" : ""}`}>
        <a href="/" onClick={aller(null)} className={`font-serif text-xl md:text-2xl leading-none whitespace-nowrap ${accueil ? "opacity-0 pointer-events-none" : ""}`} aria-hidden={accueil}>
          Territoire Incarné
        </a>

        {!accueil && (
          <nav className="hidden lg:flex items-center gap-4 xl:gap-7 ml-4 xl:ml-6" aria-label="Sections">
            {visibles.map((id, i) => (
              <a
                key={id}
                href={pathForSection(id)}
                onClick={aller(id)}
                aria-current={current === id ? "page" : undefined}
                className={`${i >= 6 ? "hidden 2xl:inline-block" : i >= 4 ? "hidden xl:inline-block" : ""} font-sans text-xs uppercase tracking-[0.16em] xl:tracking-[0.2em] whitespace-nowrap py-2 border-b transition-colors ${current === id ? "border-rust text-rust" : "border-transparent text-ink/70 dark:text-stone-300 hover:text-ink dark:hover:text-white"}`}
              >
                {t.nav[id]}
              </a>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1 xl:gap-3">
          {estVisible("rendezvous") && !accueil && (
            <a
              href={pathForSection("rendezvous")}
              onClick={aller("rendezvous")}
              className="hidden sm:inline-flex whitespace-nowrap items-center bg-rust text-paper font-sans text-xs uppercase tracking-[0.18em] xl:tracking-[0.22em] font-semibold min-h-[44px] px-5 rounded-full hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
            >
              {t.general.prendreRdv}
            </a>
          )}
          <button
            onClick={onToggleLang}
            aria-label={lang === "fr" ? "Switch to English" : "Passer au français"}
            className="min-w-[44px] min-h-[44px] font-sans text-xs uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-opacity"
          >
            {lang === "fr" ? "en" : "fr"}
          </button>
          <button
            onClick={onToggleTheme}
            aria-label={theme === "light" ? (lang === "fr" ? "Passer au mode sombre" : "Switch to dark mode") : (lang === "fr" ? "Passer au mode clair" : "Switch to light mode")}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <a
            href="/client"
            aria-label={libelleEspace}
            className="hidden md:inline-flex items-center gap-2 min-h-[44px] font-sans text-xs uppercase tracking-[0.2em] whitespace-nowrap opacity-70 hover:opacity-100 transition-opacity"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <LogIn size={14} />
            )}
            <span className={accueil ? "" : "hidden xl:inline"}>{libelleEspace}</span>
          </a>
          <button
            type="button"
            onClick={() => setOuvert(true)}
            aria-label={t.general.menu}
            aria-expanded={ouvert}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${accueil ? "md:hidden" : ""}`}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {ouvert && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.general.menu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-[120] bg-paper dark:bg-forest text-ink dark:text-stone-100 flex flex-col"
          >
            <div className="px-5 md:px-12 h-16 md:h-20 flex items-center justify-between">
              <span className="font-serif text-xl">Territoire Incarné</span>
              <button type="button" onClick={() => setOuvert(false)} aria-label={t.general.fermerMenu} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 md:px-12 pb-10" aria-label="Sections">
              <ul>
                {[...(estVisible("rendezvous") ? (["rendezvous"] as SectionId[]) : []), ...visibles].map((id, i) => (
                  <motion.li
                    key={id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.05 * i, ease: EASE }}
                    className="border-b border-ink/10 dark:border-white/10"
                  >
                    <a href={pathForSection(id)} onClick={aller(id)} className="flex items-baseline gap-5 py-4">
                      <span className="ed-kicker w-8">0{i + 1}</span>
                      <span className={`font-serif text-3xl font-light ${id === "rendezvous" ? "text-rust" : ""}`}>
                        {id === "rendezvous" ? t.general.prendreRdv : t.nav[id]}
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>
              <a href="/client" className="mt-8 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.22em] opacity-70">
                <LogIn size={14} /> {libelleEspace}
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
