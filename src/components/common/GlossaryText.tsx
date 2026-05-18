import { GLOSSARY } from "../../i18n/glossary";
import type { Lang, GlossaryTerm } from "../../types";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

const LOOKUP = new Map<string, GlossaryTerm>();
for (const term of Object.values(GLOSSARY)) {
  for (const variant of [term.fr, term.en]) {
    const k = normalize(variant);
    if (!k) continue;
    LOOKUP.set(k, term);
    LOOKUP.set(k.endsWith("s") ? k.slice(0, -1) : k + "s", term);
  }
}

const lookup = (raw: string): GlossaryTerm | undefined => {
  const hit = LOOKUP.get(normalize(raw));
  if (hit) return hit;
  const apIdx = raw.search(/['’]/);
  if (apIdx > 0 && apIdx < 3) {
    return LOOKUP.get(normalize(raw.slice(apIdx + 1)));
  }
  return undefined;
};

export const GlossaryText = ({ content, lang }: { content?: string; lang: Lang }) => {
  if (!content) return null;
  const tokens = content.split(/(\s+)/);
  return (
    <span>
      {tokens.map((tok, i) => {
        const term = /^\s+$/.test(tok) ? undefined : lookup(tok);
        if (!term) return <span key={i}>{tok}</span>;
        const def = lang === "fr" ? term.defFr : term.defEn;
        return (
          <span key={i} className="relative group inline-block">
            <span className="cursor-help border-b border-stone-400 dark:border-stone-400 border-dotted hover:border-solid transition-all text-ink dark:text-white">
              {tok}
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-6 text-sm bg-paper dark:bg-forest border border-stone-200 dark:border-stone-600 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none font-serif z-50 rounded-sm">
              <span className="block text-rust dark:text-white mb-2 italic">
                {lang === "fr" ? term.fr : term.en}
              </span>
              {def}
            </span>
          </span>
        );
      })}
    </span>
  );
};
