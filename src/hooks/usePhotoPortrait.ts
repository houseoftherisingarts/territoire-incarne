import { useEffect, useState } from "react";

const memoire = new Map<string, boolean>();

/** Dit si une photo est en hauteur (plus haute que large), pour que la page se mette en page
 *  selon la photo qu'Élise lui a donnée : en hauteur, la photo tient une colonne et le texte
 *  vient à côté; en largeur, elle fait un bandeau. `null` tant que la photo n'a pas répondu. */
export const usePhotoPortrait = (url: string): boolean | null => {
  const [portrait, setPortrait] = useState<boolean | null>(() => memoire.get(url) ?? null);
  useEffect(() => {
    if (memoire.has(url)) { setPortrait(memoire.get(url)!); return; }
    let vivant = true;
    const img = new Image();
    img.onload = () => {
      const p = img.naturalHeight > img.naturalWidth;
      memoire.set(url, p);
      if (vivant) setPortrait(p);
    };
    img.onerror = () => { if (vivant) setPortrait(false); };
    img.src = url;
    return () => { vivant = false; };
  }, [url]);
  return portrait;
};
