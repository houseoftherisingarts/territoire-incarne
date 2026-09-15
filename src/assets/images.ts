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
    case "apropos": return ELISE_MAIN_IMG;
    case "therapie": return IMG_THERAPIE;
    case "massotherapie": return IMG_THERAPIE;
    case "education": return IMG_BOUTIQUE;
    case "rendezvous": return IMG_THERAPIE;
    case "mouvement": return ELISE_FIELD_IMG;
    case "writings": return IMG_WRITINGS;
    case "ateliers": return IMG_DANSE_FORET;
    case "events": return IMG_ZEN_STONE;
    case "ressources": return IMG_WRITINGS;
    case "connecter": return IMG_BOUTIQUE;
    case "boutique": return IMG_TABLETTE;
    default: return null;
  }
};
