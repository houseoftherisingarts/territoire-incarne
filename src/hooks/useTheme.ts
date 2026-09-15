import { useLayoutEffect, useState } from "react";
import type { Theme } from "../types";

const STORAGE_KEY = "ti-theme";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved) return saved;
    // No stored choice yet: honour the OS preference on first load.
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // useLayoutEffect, pas useEffect : la classe doit se poser AVANT que le navigateur peigne,
  // sinon un visiteur en mode sombre voit une première image claire qui se fond vers le sombre
  // (transition-colors duration-1000 sur les pages qui en portent une), avec un texte illisible
  // pendant la seconde que dure le fondu.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return { theme, setTheme, toggle };
};
