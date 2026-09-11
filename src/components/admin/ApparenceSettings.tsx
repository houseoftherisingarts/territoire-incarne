import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Card, SectionTitle } from "./sections";
import { useDossierConfig, CONFIG_PATH, PIECES_PAR_DEFAUT, ETAPES_PAR_DEFAUT } from "../../lib/dossier";
import type { PieceDef, EtapeDef } from "../../types/dossier";

const uid = () => Math.random().toString(36).slice(2, 8);

/** Réglages › Dossier : le catalogue des pièces et des étapes du dossier client, éditable par Élise. */
export const ApparenceSettings = () => {
  const config = useDossierConfig();
  const [pieces, setPieces] = useState<PieceDef[] | null>(null);
  const [etapes, setEtapes] = useState<EtapeDef[] | null>(null);
  const [saving, setSaving] = useState(false);

  const p = pieces ?? config.pieces;
  const e = etapes ?? config.etapes;

  const majPiece = (i: number, patch: Partial<PieceDef>) => setPieces(p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const ajouterPiece = () => setPieces([...p, { id: uid(), cat: "Pour commencer", nom: "", option: true }]);
  const retirerPiece = (i: number) => setPieces(p.filter((_, j) => j !== i));

  const majEtape = (i: number, patch: Partial<EtapeDef>) => setEtapes(e.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const ajouterEtape = () => setEtapes([...e, { id: uid(), titre: "", sous: "" }]);
  const retirerEtape = (i: number) => setEtapes(e.filter((_, j) => j !== i));

  const enregistrer = async () => {
    setSaving(true);
    await setDoc(doc(db, CONFIG_PATH), { pieces: p, etapes: e }, { merge: true });
    setSaving(false);
  };

  const reinitialiser = () => {
    setPieces(PIECES_PAR_DEFAUT);
    setEtapes(ETAPES_PAR_DEFAUT);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionTitle>Les pièces demandées dans « Mon dossier »</SectionTitle>
        <div className="space-y-3">
          {p.map((piece, i) => (
            <div key={piece.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
              <input value={piece.cat} onChange={(ev) => majPiece(i, { cat: ev.target.value })} placeholder="Catégorie" className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-2 py-1.5 text-sm" />
              <input value={piece.nom} onChange={(ev) => majPiece(i, { nom: ev.target.value })} placeholder="Nom de la pièce" className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-2 py-1.5 text-sm" />
              <label className="flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest opacity-60">
                <input type="checkbox" checked={!!piece.option} onChange={(ev) => majPiece(i, { option: ev.target.checked })} className="accent-rust" /> Optionnelle
              </label>
              <button onClick={() => retirerPiece(i)} aria-label="Retirer" className="p-1.5 rounded-full opacity-40 hover:opacity-100 hover:text-rust"><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={ajouterPiece} className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-rust"><Plus size={13} /> Ajouter une pièce</button>
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle>Les étapes du parcours</SectionTitle>
        <div className="space-y-3">
          {e.map((etape, i) => (
            <div key={etape.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <input value={etape.titre} onChange={(ev) => majEtape(i, { titre: ev.target.value })} placeholder="Titre de l'étape" className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-2 py-1.5 text-sm" />
              <input value={etape.sous ?? ""} onChange={(ev) => majEtape(i, { sous: ev.target.value })} placeholder="Description" className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-2 py-1.5 text-sm" />
              <button onClick={() => retirerEtape(i)} aria-label="Retirer" className="p-1.5 rounded-full opacity-40 hover:opacity-100 hover:text-rust"><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={ajouterEtape} className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-rust"><Plus size={13} /> Ajouter une étape</button>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={enregistrer} disabled={saving} className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50">
            {saving ? "Enregistrement…" : "Enregistrer le catalogue"}
          </button>
          <button onClick={reinitialiser} className="px-5 py-2 border border-ink/10 dark:border-white/10 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:border-rust hover:text-rust transition-colors">
            Revenir aux valeurs de départ
          </button>
        </div>
      </Card>
    </div>
  );
};
