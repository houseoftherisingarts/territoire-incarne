import { useEffect, useState } from "react";
import type { Lang } from "../types";

const STORAGE_KEY = "ti-lang";

export const useLang = () => {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "fr";
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "fr" || saved === "en") return saved;
    return "fr";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const toggle = () => setLang((l) => (l === "fr" ? "en" : "fr"));
  return { lang, setLang, toggle };
};
