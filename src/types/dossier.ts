/** Le dossier client : motif de consultation, pièces déposées, parcours en étapes.
 *  Porté du module client de Xena Horizon (2026-09-11), greffé sur `users/{uid}`
 *  plutôt que sur une collection `dossiers` séparée : Territoire Incarné centre déjà
 *  l'identité cliente sur `users/{uid}` (voir useClientAuth.ts), donc les champs du
 *  dossier vivent directement dessus. */

export interface PieceDef {
  id: string;
  cat: string;
  nom: string;
  aide?: string;
  /** Pièce facultative : ne compte pas dans l'avancement ni dans les pièces manquantes. */
  option?: boolean;
}

export interface EtapeDef {
  id: string;
  titre: string;
  sous?: string;
}

export interface PieceDeposee {
  nom: string;
  url: string;
  chemin: string;
  taille: number;
  type: string;
  deposeLe: unknown;
}

export type EtatRevue = "valide" | "a_refaire";

export interface RevuePiece {
  etat: EtatRevue;
  note?: string;
  revueLe: unknown;
}

export interface ProjetDossier {
  titre: string;
  description: string;
  objectif: string;
}

export interface DossierConfig {
  pieces: PieceDef[];
  etapes: EtapeDef[];
}

/** Note privée d'Élise sur une cliente, jamais lisible par elle (sous-collection users/{uid}/notes). */
export interface DossierNote {
  id: string;
  texte: string;
  createdAt: unknown;
}
