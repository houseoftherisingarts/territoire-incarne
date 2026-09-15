import { useEffect } from "react";
import type { Content } from "../i18n";
import type { SectionId } from "../types";
import { pathForSection } from "../routes";

const ORIGINE = "https://territoireincarne.com";
const DESCRIPTION_ACCUEIL =
  "Elise .G Lortie, éducatrice à la sexualité et thérapeute en intégration somatique. Thérapie somatique, mouvement, éducation, retraites.";

const poserMeta = (selecteur: string, valeur: string) => {
  const el = document.head.querySelector<HTMLMetaElement>(selecteur);
  if (el) el.setAttribute("content", valeur);
};

/** Titre, description, canonique et Open Graph suivent la page courante quand la navigation se
 *  fait sans rechargement. Le prérendu (scripts/prerender-meta.mjs) pose les mêmes valeurs dans
 *  le HTML servi, pour les moteurs et les partages. */
export const useSeo = (view: SectionId | null, t: Content, notFound: boolean) => {
  useEffect(() => {
    const section = view ? (t.sections[view] as { title: string; intro?: string }) : null;
    const titre = notFound
      ? "Page introuvable | Territoire Incarné"
      : section
        ? `${section.title} | Territoire Incarné`
        : "Territoire Incarné | Elise .G Lortie";
    const description = section?.intro ?? DESCRIPTION_ACCUEIL;
    const url = `${ORIGINE}${view ? pathForSection(view) : "/"}`;
    document.title = titre;
    poserMeta('meta[name="description"]', description);
    poserMeta('meta[property="og:title"]', titre);
    poserMeta('meta[property="og:description"]', description);
    poserMeta('meta[property="og:url"]', url);
    poserMeta('meta[name="twitter:title"]', titre);
    poserMeta('meta[name="twitter:description"]', description);
    const canonique = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonique) canonique.href = url;
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (notFound) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex";
    } else if (robots) {
      robots.remove();
    }
  }, [view, t, notFound]);
};
