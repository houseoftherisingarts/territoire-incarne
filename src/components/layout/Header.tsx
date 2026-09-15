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

/** Les quatre portes de la barre, comme chez Krystine : trois catégories principales et la
 *  boutique. Tout le reste vit dans le menu, si bien que rien ne sort jamais du cadre. */
const PORTES: SectionId[] = ["therapie", "massotherapie", "education", "boutique"];

/** L'en-tête : la marque à gauche, quatre portes au centre à partir de 1280 px, les commodités
 *  à droite, et un menu plein écran pour tout le sommaire en dessous. Fixe, translucide, il se
 *  densifie quand la page défile. */
export const Header = ({ t, lang, theme, current, accueil = false, onOpen, onToggleLang, onToggleTheme }: Props) => {
  const { visibles, estVisible } = useSections();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [defile, setDefile] = useState(false);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    const onScroll = () => setDefile(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
  const portes = PORTES.filter((id) => visibles.includes(id));

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-[background-color,border-color,box-shadow] duration-500 border-b ${
        defile || !accueil
          ? "bg-paper/95 dark:bg-forest/95 backdrop-blur-xl border-ink/15 dark:border-white/15 shadow-[0_6px_34px_rgba(43,41,38,0.08)]"
          : "bg-paper/80 dark:bg-forest/80 backdrop-blur-xl border-ink/10 dark:border-white/10"
      }`}
    >
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-[4.5rem] flex items-center justify-between gap-3">
        <a
          href="/"
          onClick={aller(null)}
          className="flex-shrink-0 min-h-[44px] flex items-center font-serif font-semibold uppercase text-ink dark:text-stone-100 text-[0.95rem] leading-[1.05] tracking-[0.1em] sm:whitespace-nowrap sm:text-[1.25rem] sm:tracking-[0.12em] hover:text-rust transition-colors"
        >
          Territoire <br className="sm:hidden" />Incarné
        </a>

        <nav className="hidden xl:flex items-center gap-5 2xl:gap-8" aria-label="Sections">
          {portes.map((id) => {
            const actif = current === id;
            return (
              <a
                key={id}
                href={pathForSection(id)}
                onClick={aller(id)}
                aria-current={actif ? "page" : undefined}
                className={`group relative inline-flex items-center whitespace-nowrap px-2 py-2 font-sans text-xs uppercase tracking-[0.14em] 2xl:tracking-[0.18em] transition-colors ${
                  actif ? "text-rust" : "text-ink/75 dark:text-stone-300 hover:text-rust"
                }`}
              >
                {t.nav[id]}
                <span className={`pointer-events-none absolute left-2 right-2 -bottom-[3px] h-px bg-rust transition-[transform] origin-left duration-300 ${actif ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {estVisible("rendezvous") && (
            <a
              href={pathForSection("rendezvous")}
              onClick={aller("rendezvous")}
              className="hidden md:inline-flex whitespace-nowrap items-center bg-rust text-paper font-sans text-xs uppercase tracking-[0.14em] font-semibold min-h-[44px] px-4 rounded-full hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
            >
              {t.general.prendreRdv}
            </a>
          )}
          <button
            onClick={onToggleLang}
            aria-label={lang === "fr" ? "Switch to English" : "Passer au français"}
            className="min-w-[44px] min-h-[44px] font-sans text-xs uppercase tracking-[0.2em] font-semibold text-ink/75 dark:text-stone-300 border border-ink/10 dark:border-white/15 hover:border-rust hover:text-rust rounded-full transition-colors"
          >
            {lang === "fr" ? "en" : "fr"}
          </button>
          <button
            onClick={onToggleTheme}
            aria-label={theme === "light" ? (lang === "fr" ? "Passer au mode sombre" : "Switch to dark mode") : (lang === "fr" ? "Passer au mode clair" : "Switch to light mode")}
            className="w-11 h-11 flex items-center justify-center rounded-full border border-ink/10 dark:border-white/15 text-ink/75 dark:text-stone-300 hover:border-rust hover:text-rust transition-colors"
          >
            {theme === "light" ? <Moon size={16} strokeWidth={1.75} /> : <Sun size={16} strokeWidth={1.75} />}
          </button>
          <a
            href="/client"
            aria-label={libelleEspace}
            title={libelleEspace}
            className="w-11 h-11 flex items-center justify-center rounded-full border border-ink/10 dark:border-white/15 text-ink/75 dark:text-stone-300 hover:border-rust hover:text-rust transition-colors overflow-hidden"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <LogIn size={16} strokeWidth={1.75} />
            )}
          </a>
          <button
            type="button"
            onClick={() => setOuvert(true)}
            aria-label={t.general.menu}
            aria-expanded={ouvert}
            className="w-11 h-11 flex items-center justify-center rounded-full text-ink/80 dark:text-stone-200 hover:text-rust transition-colors"
          >
            <Menu size={20} strokeWidth={1.75} />
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
            <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-[4.5rem] flex items-center justify-between">
              <span className="font-serif font-semibold uppercase tracking-[0.12em] text-[1.25rem]">Territoire Incarné</span>
              <button type="button" onClick={() => setOuvert(false)} aria-label={t.general.fermerMenu} className="w-11 h-11 flex items-center justify-center rounded-full hover:text-rust transition-colors">
                <X size={22} strokeWidth={1.75} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 md:px-12 lg:px-16 pb-12" aria-label="Sections">
              <ul className="lg:columns-2 lg:gap-16">
                {[...(estVisible("rendezvous") ? (["rendezvous"] as SectionId[]) : []), ...visibles].map((id, i) => (
                  <motion.li
                    key={id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.04 * i, ease: EASE }}
                    className="border-b border-ink/10 dark:border-white/10 break-inside-avoid"
                  >
                    <a href={pathForSection(id)} onClick={aller(id)} className="block py-4">
                      <span className={`font-serif text-3xl font-light ${id === "rendezvous" ? "text-rust" : current === id ? "text-rust" : ""}`}>
                        {id === "rendezvous" ? t.general.prendreRdv : t.nav[id]}
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>
              <a href="/client" className="mt-10 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.22em] opacity-70 hover:opacity-100">
                <LogIn size={14} /> {libelleEspace}
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
