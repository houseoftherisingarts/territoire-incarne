export type Lang = "fr" | "en";
export type Theme = "light" | "dark";

export type SectionId =
  | "therapie"
  | "mouvement"
  | "events"
  | "ressources"
  | "connecter"
  | "apropos"
  | "boutique"
  | "writings";

export interface GlossaryTerm {
  fr: string;
  en: string;
  defFr: string;
  defEn: string;
}

export interface CartItem {
  name: string;
  price: number;
}

export const NAV_ORDER: SectionId[] = [
  "therapie",
  "education",
  "mouvement",
  "events",
  "ressources",
  "connecter",
  "apropos",
  "boutique",
  "writings",
];
