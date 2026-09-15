import type { SectionId } from "../types";

const BASE = "https://storage.googleapis.com/salondesinconnus/territoireincarne";

// The source PNGs on GCS are raw exports (one is 37.5 MB) served into slots as
// small as 180px. Route them through the weserv proxy, resized + webp, so a
// homepage view pulls a few hundred KB instead of ~50 MB. Alpha is preserved.
const px = (url: string, w: number): string =>
  `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${w}&output=webp&q=75`;

export const ELISE_MAIN_IMG = px(`${BASE}/elise%20main.png`, 1200);
/** Small variant of the portrait for avatar slots (sidebar, login), ~48-64px. */
export const ELISE_AVATAR_IMG = px(`${BASE}/elise%20main.png`, 128);
export const ELISE_FIELD_IMG = px(`${BASE}/Elise%20field.png`, 1200);
/** La même photo en taille hero : elle tient toute la largeur de l'écran, et elle vient
 *  du fichier d'origine de 36 Mo, jamais d'un agrandissement. */
export const ELISE_FIELD_HERO = "/media/elise-champ-2400.webp";
/** La photo de secours du site : quand une photo choisie a disparu de la médiathèque et que
 *  la photo d'origine manque aussi, c'est elle qui prend le cadre. Jamais de trou. */
export const PHOTO_DE_SECOURS = ELISE_FIELD_HERO;
/** Le hero : la route, recadrée en 2.35:1 depuis la photo d'origine, et sa boucle animée
 *  (caméra verrouillée, une brise dans les herbes, première et dernière image identiques)
 *  rendue par MiniMax H3 sur Higgsfield le 15 septembre 2026. */
export const HERO_POSTER = "/media/elise-route-235.jpg";
export const HERO_VIDEO = "/media/elise-route-235.mp4";
export const HERO_VIDEO_WEBM = "/media/elise-route-235.webm";
/** La même boucle en 960 px pour les téléphones, cinq fois plus légère. */
export const HERO_VIDEO_MOBILE = "/media/elise-route-235-mobile.mp4";
/** Le portrait d'Élise du 21 février 2026 (PXL_20260221_205401589), en hauteur : la photo
 *  du module « Qui est Élise » de l'accueil et de la page À propos. */
export const ELISE_PORTRAIT = "/media/elise-portrait-2026.webp";
export const ELISE_PORTRAIT_1200 = "/media/elise-portrait-2026-1200.webp";
/** La photo de la massothérapie (Massage.png, 15 septembre 2026). */
export const IMG_MASSAGE = "/media/massage-1920.webp";
/** Éducation sexuelle : la vidéo d'Élise du 4 mars 2026, coupée à trois secondes, qui se fige
 *  sur sa dernière image; l'affiche est cette image-là. */
export const EDUCATION_VIDEO = "/media/education-elise-3s.mp4";
export const EDUCATION_VIDEO_WEBM = "/media/education-elise-3s.webm";
export const EDUCATION_VIDEO_MOBILE = "/media/education-elise-3s-mobile.mp4";
export const EDUCATION_POSTER = "/media/education-elise-3s.webp";
// Global atmospheric texture (path through a field) + home feature background
// (Élise in nature, AI-upscaled). Served locally from public/media, so no proxy.
export const IMG_GLOBAL_BG = "/media/elise-road.webp";
// La photo d'Élise assise n'existe qu'en 547 x 272 (elle vient de Facebook). Elle est servie
// telle quelle, sans agrandissement, et ne peut donc pas tenir un cadre plein écran.
export const ELISE_HOME_BG = "/media/elise-assise-547.webp";
export const IMG_THERAPIE = px(`${BASE}/Gemini_Generated_Image_3kge2o3kge2o3kge.png`, 1200);
export const IMG_BOUTIQUE = px(`${BASE}/Gemini_Generated_Image_jm4kgyjm4kgyjm4k.png`, 1200);
export const IMG_WRITINGS = px(`${BASE}/Gemini_Generated_Image_1lmib01lmib01lmi.png`, 1200);
export const IMG_ZEN_STONE = px(`${BASE}/transparent%20rock.png`, 1000);
// Deux photos qui dormaient sur le bucket, réveillées pour que le sommaire ne montre
// jamais deux fois la même image : Élise qui danse en forêt, et la tablette à la plante.
export const IMG_DANSE_FORET = px(`${BASE}/Gemini_Generated_Image_hc3xiuhc3xiuhc3x.png`, 1200);
export const IMG_TABLETTE = px(`${BASE}/Gemini_Generated_Image_7xqaqz7xqaqz7xqa.png`, 1200);

/** La photo qui porte une section, lue par la vue détaillée et par le sommaire de l'accueil. */
export const photoPourSection = (id: SectionId): string | null => {
  switch (id) {
    case "apropos": return ELISE_PORTRAIT;
    case "therapie": return IMG_THERAPIE;
    case "massotherapie": return IMG_MASSAGE;
    case "education": return EDUCATION_POSTER;
    case "consentement": return IMG_DANSE_FORET;
    case "rendezvous": return IMG_THERAPIE;
    case "mouvement": return ELISE_FIELD_IMG;
    case "writings": return IMG_WRITINGS;
    case "multimedias": return IMG_WRITINGS;
    case "ateliers": return IMG_DANSE_FORET;
    case "events": return IMG_ZEN_STONE;
    case "ressources": return IMG_WRITINGS;
    case "connecter": return IMG_BOUTIQUE;
    case "boutique": return IMG_TABLETTE;
    default: return null;
  }
};

/** Le format d'un cadre photo, tel qu'il se rend sur le site, pour que l'admin Recadrer les
 *  photos montre exactement ce que la page montrera. */
export interface PhotoDuSite {
  cle: string;
  libelle: string;
  defaut: string;
  /** Largeur / hauteur du cadre, tel que rendu. */
  ratio: number;
  page: string;
}

const SECTIONS_AVEC_PHOTO: [SectionId, string, string][] = [
  ["therapie", "Pair-aidance", "/therapie"],
  ["massotherapie", "Massothérapie", "/massotherapie"],
  ["consentement", "Consultante en consentement", "/consentement"],
  ["mouvement", "Mouvement", "/mouvement"],
  ["ateliers", "Cours à la carte", "/ateliers"],
  ["events", "Formations à venir", "/evenements"],
  ["writings", "Blog", "/ecrits"],
  ["multimedias", "Multimédias", "/multimedias"],
  ["ressources", "Ressources", "/ressources"],
  ["connecter", "Connecter", "/connecter"],
  ["boutique", "Boutique", "/boutique"],
];

/** Toutes les photos du site que l'admin peut recadrer, avec leur vrai format. */
export const PHOTOS_DU_SITE: PhotoDuSite[] = [
  { cle: "home.elise.photo", libelle: "Qui est Élise (accueil)", defaut: ELISE_PORTRAIT, ratio: 3 / 4, page: "/" },
  { cle: "section.apropos.photo", libelle: "À propos", defaut: ELISE_PORTRAIT, ratio: 21 / 9, page: "/a-propos" },
  ...SECTIONS_AVEC_PHOTO.map(([id, libelle, page]) => ({
    cle: `section.${id}.photo`,
    libelle,
    defaut: photoPourSection(id) ?? PHOTO_DE_SECOURS,
    ratio: 21 / 9,
    page,
  })),
];
