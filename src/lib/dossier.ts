import { useMemo } from "react";
import { useDocument } from "../hooks/useDocument";
import type { DossierConfig, EtapeDef, PieceDef, PieceDeposee, RevuePiece, DossierNote } from "../types/dossier";

/**
 * Le contrat du dossier client, partagé par l'espace client (onglet Mon dossier) et le
 * back-office (l'onglet Dossier de la fiche cliente). Patron porté du module client de
 * Xena Horizon (2026-09-11) : les listes ci-dessous sont sauvegardées dans Firestore
 * (settings/dossier) pour qu'Élise puisse les modifier depuis Paramètres. Les valeurs
 * ci-dessous sont le repli tant qu'elle n'a rien changé — à confirmer avec elle avant
 * le lancement, comme pour Laurie chez Xena.
 */

// Le motif de consultation est un champ écrit (voir ProjetDossier), pas une pièce à déposer :
// les pièces ci-dessous sont uniquement des documents à téléverser.
export const PIECES_PAR_DEFAUT: PieceDef[] = [
  { id: "historique", cat: "Pour commencer", nom: "Ton historique pertinent", aide: "Un diagnostic, un suivi antérieur, tout ce qui te semble utile qu'Élise connaisse avant la première séance.", option: true },
  { id: "consentement", cat: "Documents", nom: "Le consentement éclairé signé", aide: "Élise te l'envoie après le premier échange. Dépose-le ici une fois signé.", option: true },
  { id: "assurance", cat: "Documents", nom: "Une pièce pour ton assureur", aide: "Si ta compagnie d'assurance demande un document précis, dépose-le ici.", option: true },
];

export const ETAPES_PAR_DEFAUT: EtapeDef[] = [
  { id: "contact", titre: "Premier contact", sous: "Tu écris à Élise, elle répond et vous voyez ensemble si c'est le bon moment." },
  { id: "accueil", titre: "Séance d'accueil", sous: "Une première rencontre pour nommer ce qui t'amène et sentir si le lien est là." },
  { id: "accompagnement", titre: "Accompagnement", sous: "Les séances se suivent, au rythme qui te convient." },
  { id: "suivi", titre: "Suivi", sous: "Un point sur le chemin parcouru, et ce qui reste à explorer." },
];

export const CONFIG_PAR_DEFAUT: DossierConfig = { pieces: PIECES_PAR_DEFAUT, etapes: ETAPES_PAR_DEFAUT };

/** Chemin du document de configuration éditable par Élise. */
export const CONFIG_PATH = "settings/dossier";

/** Lecture en direct du catalogue de pièces et d'étapes, avec repli sur les valeurs par défaut. */
export function useDossierConfig(): DossierConfig {
  const { data } = useDocument<Partial<DossierConfig>>(CONFIG_PATH);
  return useMemo(
    () => ({
      pieces: data?.pieces && data.pieces.length > 0 ? data.pieces : PIECES_PAR_DEFAUT,
      etapes: data?.etapes && data.etapes.length > 0 ? data.etapes : ETAPES_PAR_DEFAUT,
    }),
    [data],
  );
}

/** Types de fichiers acceptés au dépôt et plafond par fichier (25 Mo, aligné sur storage.rules). */
export const TYPES_ACCEPTES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];
export const TAILLE_MAX = 25 * 1024 * 1024;

export const cheminPiece = (uid: string, pieceId: string, nomFichier: string): string => {
  const propre = nomFichier.replace(/[^\w.-]+/g, "_").slice(0, 80);
  return `dossiers/${uid}/${pieceId}/${Date.now()}-${propre}`;
};

/** Pourcentage de pièces obligatoires reçues (les pièces optionnelles ne comptent pas). */
export const avancement = (pieces: Record<string, PieceDeposee> | undefined, config: PieceDef[]): number => {
  const requises = config.filter((p) => !p.option);
  if (requises.length === 0) return 100;
  const recues = requises.filter((p) => !!pieces?.[p.id]).length;
  return Math.round((recues / requises.length) * 100);
};

export const piecesManquantes = (pieces: Record<string, PieceDeposee> | undefined, config: PieceDef[]): PieceDef[] =>
  config.filter((p) => !p.option && !pieces?.[p.id]);

export const piecesParCategorie = (pieces: PieceDef[]): { cat: string; pieces: PieceDef[] }[] => {
  const cats: Record<string, PieceDef[]> = {};
  pieces.forEach((p) => {
    (cats[p.cat] = cats[p.cat] || []).push(p);
  });
  return Object.entries(cats).map(([cat, list]) => ({ cat, pieces: list }));
};

export type EtatPiece = "manquante" | "deposee" | "valide" | "a_refaire" | "redeposee";

const versLeMillis = (ts: any): number => {
  if (!ts) return Date.now();
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  return 0;
};

/**
 * L'état affiché d'une pièce : croise le dépôt de la cliente avec le jugement d'Élise
 * (revue), jamais l'inverse — la cliente n'a pas le droit d'écrire `revue` (firestore.rules).
 * Un fichier redéposé après une revue « à refaire » repart en attente : Élise doit rejuger.
 */
export const etatPiece = (
  pieces: Record<string, PieceDeposee> | undefined,
  revue: Record<string, RevuePiece> | undefined,
  pieceId: string,
): EtatPiece => {
  const deposee = pieces?.[pieceId];
  if (!deposee) return "manquante";
  const r = revue?.[pieceId];
  if (!r) return "deposee";
  return versLeMillis(deposee.deposeLe) > versLeMillis(r.revueLe) ? "redeposee" : r.etat;
};

export const indexEtape = (etapes: EtapeDef[], etapeId: string): number =>
  Math.max(0, etapes.findIndex((e) => e.id === etapeId));

export const etapeSuivante = (etapes: EtapeDef[], etapeId: string): EtapeDef | null => {
  const i = indexEtape(etapes, etapeId);
  return i < etapes.length - 1 ? etapes[i + 1] : null;
};

const dateCourte = (ts: any): string => {
  try {
    const d: Date | null = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
    return d ? d.toLocaleDateString("fr-CA") : "";
  } catch {
    return "";
  }
};

const etiquetteEtat = (etat: EtatPiece): string =>
  etat === "valide" ? "validée" : etat === "a_refaire" ? "à refaire" : etat === "redeposee" ? "nouveau dépôt, en attente d'Élise" : "déposée";

interface DossierPourExport {
  displayName: string;
  email: string;
  projet?: { titre?: string; description?: string; objectif?: string };
  etape?: string;
  pieces?: Record<string, PieceDeposee>;
  revue?: Record<string, RevuePiece>;
  createdAt?: unknown;
}

/** Fiche complète en Markdown, taillée pour être collée dans un assistant IA (porté de Xena). */
export function dossierMarkdown(
  client: DossierPourExport,
  config: DossierConfig,
  notes: DossierNote[] = [],
): string {
  const { pieces: catalogue, etapes } = config;
  const etape = etapes.find((e) => e.id === client.etape);
  const lignes: string[] = [];
  lignes.push(`# Dossier de ${client.displayName || client.email}`);
  lignes.push("");
  lignes.push(`- Courriel : ${client.email}`);
  lignes.push(`- Étape du parcours : ${etape ? `${indexEtape(etapes, client.etape || "")+ 1}. ${etape.titre}` : client.etape || "—"}`);
  lignes.push(`- Avancement des pièces : ${avancement(client.pieces, catalogue)} %`);
  if (client.createdAt) lignes.push(`- Dossier ouvert le ${dateCourte(client.createdAt)}`);
  lignes.push("");
  if (client.projet?.titre || client.projet?.description) {
    lignes.push("## Le motif");
    lignes.push("");
    if (client.projet?.titre) lignes.push(`**${client.projet.titre}**`);
    if (client.projet?.description) lignes.push("", client.projet.description);
    if (client.projet?.objectif) lignes.push("", `Objectif : ${client.projet.objectif}`);
    lignes.push("");
  }
  lignes.push("## Les pièces");
  lignes.push("");
  piecesParCategorie(catalogue).forEach(({ cat, pieces: list }) => {
    lignes.push(`### ${cat}`);
    list.forEach((p) => {
      const d = client.pieces?.[p.id];
      const etat = etatPiece(client.pieces, client.revue, p.id);
      const note = etat === "a_refaire" ? client.revue?.[p.id]?.note : undefined;
      const statut = d ? `${etiquetteEtat(etat)} le ${dateCourte(d.deposeLe)} (${d.nom})` : p.option ? "non fournie (optionnelle)" : "MANQUANTE";
      lignes.push(`- ${p.nom} : ${statut}${note ? ` — remarque : ${note}` : ""}`);
    });
    lignes.push("");
  });
  const manque = piecesManquantes(client.pieces, catalogue);
  lignes.push("## Ce qui manque");
  lignes.push("");
  lignes.push(manque.length ? manque.map((p) => `- ${p.nom}`).join("\n") : "Rien : toutes les pièces obligatoires sont reçues.");
  lignes.push("");
  if (notes.length) {
    lignes.push("## Notes d'Élise (privées)");
    lignes.push("");
    notes.forEach((n) => lignes.push(`- ${dateCourte(n.createdAt)} : ${n.texte}`));
    lignes.push("");
  }
  return lignes.join("\n");
}

/** Déclenche le téléchargement d'un texte (Markdown, CSV) depuis le navigateur. */
export function telecharger(nom: string, contenu: string, type = "text/markdown;charset=utf-8"): void {
  const blob = new Blob([contenu], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export CSV de la liste des clientes (BOM UTF-8 pour Excel). */
export function clientesCsv(clientes: DossierPourExport[], config: DossierConfig): string {
  const entete = ["Nom", "Courriel", "Étape", "Avancement", "Ouvert le"];
  const lignes = clientes.map((c) => [
    c.displayName,
    c.email,
    config.etapes.find((e) => e.id === c.etape)?.titre ?? c.etape ?? "",
    `${avancement(c.pieces, config.pieces)} %`,
    dateCourte(c.createdAt),
  ]);
  const cellule = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return "﻿" + [entete, ...lignes].map((l) => l.map(cellule).join(";")).join("\n");
}
