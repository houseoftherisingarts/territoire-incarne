import { Moon, Sun, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "../../firebase";
import type { Lang, Theme } from "../../types";

interface Props {
  lang: Lang;
  theme: Theme;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  clientSpaceLabel: string;
  myClientSpaceLabel: string;
}

export const LangThemeToggles = ({
  lang,
  theme,
  onToggleLang,
  onToggleTheme,
  clientSpaceLabel,
  myClientSpaceLabel,
}: Props) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  const goToClient = () => {
    window.location.href = "/client";
  };

  return (
    <div className="fixed top-8 right-8 z-[60] flex flex-col items-end gap-3 text-ink dark:text-stone-100 mix-blend-multiply dark:mix-blend-normal">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleLang}
          aria-label={lang === "fr" ? "Switch to English" : "Passer au français"}
          className="text-xs tracking-widest opacity-50 hover:opacity-100 transition-opacity uppercase"
        >
          {lang === "fr" ? "en" : "fr"}
        </button>

        <button
          onClick={goToClient}
          aria-label={user ? myClientSpaceLabel : clientSpaceLabel}
          className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" loading="lazy" decoding="async" />
          ) : user?.displayName ? (
            <span className="w-5 h-5 rounded-full bg-stone-300 dark:bg-stone-600 flex items-center justify-center text-[10px] font-serif shrink-0">
              {user.displayName[0].toUpperCase()}
            </span>
          ) : (
            <LogIn size={12} className="shrink-0" />
          )}
          <span className="hidden sm:inline text-[10px] font-sans uppercase tracking-widest">
            {user ? user.displayName?.split(" ")[0] || myClientSpaceLabel : clientSpaceLabel}
          </span>
        </button>
      </div>

      <button
        onClick={onToggleTheme}
        aria-label={
          theme === "light"
            ? (lang === "fr" ? "Passer au mode sombre" : "Switch to dark mode")
            : (lang === "fr" ? "Passer au mode clair" : "Switch to light mode")
        }
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    </div>
  );
};
