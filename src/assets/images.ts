const BASE = "https://storage.googleapis.com/salondesinconnus/territoireincarne";

// The source PNGs on GCS are raw exports (one is 37.5 MB) served into slots as
// small as 180px. Route them through the weserv proxy, resized + webp, so a
// homepage view pulls a few hundred KB instead of ~50 MB. Alpha is preserved.
const px = (url: string, w: number): string =>
  `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${w}&output=webp&q=75`;

export const ELISE_MAIN_IMG = px(`${BASE}/elise%20main.png`, 1200);
export const ELISE_FIELD_IMG = px(`${BASE}/Elise%20field.png`, 1200);
export const IMG_GLOBAL_BG = px(`${BASE}/Gemini_Generated_Image_7xqaqz7xqaqz7xqa.png`, 1600);
export const IMG_THERAPIE = px(`${BASE}/Gemini_Generated_Image_3kge2o3kge2o3kge.png`, 1200);
export const IMG_BOUTIQUE = px(`${BASE}/Gemini_Generated_Image_jm4kgyjm4kgyjm4k.png`, 1200);
export const IMG_WRITINGS = px(`${BASE}/Gemini_Generated_Image_1lmib01lmib01lmi.png`, 1200);
export const IMG_ZEN_STONE = px(`${BASE}/transparent%20rock.png`, 1000);
