import { useEffect, useState } from "react";
import type { Theme } from "../types";

const STORAGE_KEY = "ti-theme";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    return saved ?? "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return { theme, setTheme, toggle };
};
