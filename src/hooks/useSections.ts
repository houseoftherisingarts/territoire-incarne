import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { NAV_ORDER, type SectionId } from "../types";
import { useDocument } from "./useDocument";

const PATH = "settings/sections";

interface SectionsDoc {
  /** Les sections éteintes par Élise. Tout ce qui n'est pas ici est visible. */
  hidden?: SectionId[];
}

/** Les sections visibles du site, dans l'ordre du sommaire, et l'état de chacune. Lu partout
 *  (accueil, en-tête, pied de page, routes) pour qu'une section éteinte disparaisse d'un bloc. */
export const useSections = () => {
  const { data, loading } = useDocument<SectionsDoc>(PATH);
  const hidden = new Set<SectionId>(data?.hidden ?? []);
  const visibles = NAV_ORDER.filter((id) => !hidden.has(id));
  const estVisible = (id: SectionId) => !hidden.has(id);
  return { visibles, hidden, estVisible, loading };
};

export const setSectionHidden = async (id: SectionId, cachee: boolean, actuelles: Set<SectionId>) => {
  const next = new Set(actuelles);
  if (cachee) next.add(id);
  else next.delete(id);
  await setDoc(doc(db, PATH), { hidden: Array.from(next) }, { merge: true });
};
