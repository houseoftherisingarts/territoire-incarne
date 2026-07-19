import type { SectionId } from "./types";

export const SECTION_TO_PATH: Record<SectionId, string> = {
  apropos: "/a-propos",
  therapie: "/therapie",
  mouvement: "/mouvement",
  events: "/evenements",
  ressources: "/ressources",
  connecter: "/connecter",
  boutique: "/boutique",
  writings: "/ecrits",
};

export const PATH_TO_SECTION: Record<string, SectionId> = Object.fromEntries(
  Object.entries(SECTION_TO_PATH).map(([id, path]) => [path, id as SectionId])
) as Record<string, SectionId>;

export const pathForSection = (id: SectionId) => SECTION_TO_PATH[id];

export const sectionForPath = (pathname: string): SectionId | null => {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/" || normalized === "") return null;
  // /ecrits/<slug> → "writings" (slug parsed separately by slugForPath)
  if (normalized.startsWith("/ecrits/")) return "writings";
  return PATH_TO_SECTION[normalized] ?? null;
};

/** Returns the post slug for /ecrits/<slug>, or null otherwise. */
export const slugForPath = (pathname: string): string | null => {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (!normalized.startsWith("/ecrits/")) return null;
  const slug = normalized.slice("/ecrits/".length);
  return slug || null;
};

export const pathForPost = (slug: string) => `/ecrits/${slug}`;
