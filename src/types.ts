export type Lang = "fr" | "en";
export type Theme = "light" | "dark";

export type SectionId =
  | "therapie"
  | "massotherapie"
  | "education"
  | "consentement"
  | "mouvement"
  | "ateliers"
  | "events"
  | "ressources"
  | "connecter"
  | "apropos"
  | "boutique"
  | "writings"
  | "rendezvous";

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

/** L'ordre du sommaire : la thérapie et les cours de danse en tête (ordre d'Alex, 11 sept 2026),
 *  la prise de rendez-vous vit en bouton d'appel plutôt que dans cette liste. */
export const NAV_ORDER: SectionId[] = [
  "therapie",
  "massotherapie",
  "education",
  "consentement",
  "mouvement",
  "ateliers",
  "events",
  "apropos",
  "writings",
  "ressources",
  "boutique",
  "connecter",
];

/** Les sections qu'Élise peut éteindre depuis Paramètres › Sections du site. */
export const SECTIONS_ETEIGNABLES: SectionId[] = [
  "therapie", "massotherapie", "education", "consentement", "mouvement", "ateliers", "events", "apropos", "writings", "ressources", "boutique", "connecter", "rendezvous",
];

/** L'ordre des tuiles du sommaire de l'accueil, posé par Alex le 15 septembre 2026.
 *  Il diffère du menu : « À propos » et « Connecter » vivent dans l'en-tête et le pied de
 *  page, jamais dans la grille. */
export const SOMMAIRE_ORDER: SectionId[] = [
  "therapie",
  "massotherapie",
  "education",
  "events",
  "ateliers",
  "boutique",
  "writings",
  "ressources",
  "mouvement",
  "consentement",
];
