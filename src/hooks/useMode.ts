import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useDocument } from "./useDocument";

export type SiteMode = "actuel" | "editorial";

const PATH = "settings/apparence";

/** Le mode d'apparence du site (data-mode sur <html>) : Firestore d'abord, réglé par Élise
 *  depuis Paramètres › Apparence. `?mode=editorial` dans l'adresse permet à Alex de montrer
 *  l'autre peau sans toucher au réglage — il ne change rien pour les autres visiteurs. */
export const useMode = (): SiteMode => {
  const { data } = useDocument<{ mode?: SiteMode }>(PATH);
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const force = params?.get("mode");
  const mode: SiteMode = force === "editorial" || force === "actuel" ? force : data?.mode === "editorial" ? "editorial" : "actuel";

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  return mode;
};

export const setSiteMode = (mode: SiteMode) => setDoc(doc(db, PATH), { mode }, { merge: true });
