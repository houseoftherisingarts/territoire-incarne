import { useState } from "react";
import { CheckCircle2, Download, FileWarning, Printer, Trash2 } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import type { ClientProfile } from "../../hooks/useClientAuth";
import { useDossierNotes } from "../../hooks/useDossierNotes";
import {
  useDossierConfig,
  piecesParCategorie,
  etatPiece,
  avancement,
  dossierMarkdown,
  telecharger,
} from "../../lib/dossier";
import { Card } from "./sections";

const formatTaille = (o: number) => (o < 1024 * 1024 ? `${Math.round(o / 1024)} Ko` : `${(o / (1024 * 1024)).toFixed(1)} Mo`);

const dateCourte = (ts: any): string => {
  try {
    const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
    return d ? d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" }) : "";
  } catch {
    return "";
  }
};

export const DossierAdminTab = ({ client }: { client: ClientProfile }) => {
  const config = useDossierConfig();
  const { notes, add, remove } = useDossierNotes(client.uid);
  const [noteTexte, setNoteTexte] = useState("");
  const [refaireOuvert, setRefaireOuvert] = useState<string | null>(null);
  const [refaireTexte, setRefaireTexte] = useState("");

  const valider = async (pieceId: string) => {
    await updateDoc(doc(db, "users", client.uid), {
      [`revue.${pieceId}`]: { etat: "valide", revueLe: serverTimestamp() },
      nonLusClient: (client.nonLusClient ?? 0) + 1,
    });
  };

  const demanderRefaire = async (pieceId: string) => {
    if (!refaireTexte.trim()) return;
    await updateDoc(doc(db, "users", client.uid), {
      [`revue.${pieceId}`]: { etat: "a_refaire", note: refaireTexte.trim(), revueLe: serverTimestamp() },
      nonLusClient: (client.nonLusClient ?? 0) + 1,
    });
    setRefaireOuvert(null);
    setRefaireTexte("");
  };

  const changerEtape = async (etapeId: string) => {
    await updateDoc(doc(db, "users", client.uid), { etape: etapeId });
  };

  const ajouterNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTexte.trim()) return;
    await add(noteTexte.trim());
    setNoteTexte("");
  };

  const exporterMarkdown = () => {
    telecharger(`dossier-${(client.displayName || client.email).replace(/\s+/g, "-")}.md`, dossierMarkdown(client, config, notes));
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="font-sans text-[11px] uppercase tracking-widest opacity-60">
          {avancement(client.pieces, config.pieces)}% des pièces obligatoires reçues
        </p>
        <div className="flex gap-2">
          <button onClick={exporterMarkdown} className="inline-flex items-center gap-1.5 px-3 py-2 border border-ink/10 dark:border-white/10 rounded-sm text-[10px] font-sans uppercase tracking-widest hover:border-rust hover:text-rust transition-colors">
            <Download size={12} /> Markdown
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-2 border border-ink/10 dark:border-white/10 rounded-sm text-[10px] font-sans uppercase tracking-widest hover:border-rust hover:text-rust transition-colors">
            <Printer size={12} /> Imprimer
          </button>
        </div>
      </div>

      {/* Parcours */}
      <Card className="p-5 print:border-0 print:shadow-none">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-50 mb-3">Étape du parcours</p>
        <div className="flex flex-wrap gap-2">
          {config.etapes.map((e) => (
            <button
              key={e.id}
              onClick={() => changerEtape(e.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-sans uppercase tracking-widest border transition-colors ${
                client.etape === e.id ? "bg-rust text-paper border-rust" : "border-ink/10 dark:border-white/10 hover:border-rust hover:text-rust"
              }`}
            >
              {e.titre}
            </button>
          ))}
        </div>
      </Card>

      {/* Pièces */}
      <div className="space-y-5">
        {piecesParCategorie(config.pieces).map(({ cat, pieces }) => (
          <div key={cat} className="space-y-3">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-50">{cat}</p>
            {pieces.map((p) => {
              const etat = etatPiece(client.pieces, client.revue, p.id);
              const deposee = client.pieces?.[p.id];
              return (
                <Card key={p.id} className="p-4 print:border-0 print:shadow-none">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-serif text-base">{p.nom}{p.option && <span className="font-sans text-[10px] opacity-50 uppercase tracking-widest ml-2">optionnelle</span>}</p>
                      {deposee ? (
                        <a href={deposee.url} target="_blank" rel="noopener noreferrer" className="font-sans text-[11px] text-rust hover:underline">
                          {deposee.nom} · {formatTaille(deposee.taille)} · déposée le {dateCourte(deposee.deposeLe)}
                        </a>
                      ) : (
                        <p className="font-sans text-[11px] opacity-40">Pas encore déposée</p>
                      )}
                      {etat === "a_refaire" && client.revue?.[p.id]?.note && (
                        <p className="font-serif text-sm mt-1 flex items-start gap-1.5"><FileWarning size={13} className="text-rust shrink-0 mt-0.5" /> {client.revue[p.id].note}</p>
                      )}
                    </div>
                    {deposee && (
                      <div className="flex items-center gap-2 shrink-0 print:hidden">
                        <span className={`text-[10px] font-sans uppercase tracking-widest font-bold ${etat === "valide" ? "text-emerald-600" : etat === "a_refaire" ? "text-rust" : "opacity-60"}`}>
                          {etat === "valide" ? "Validée" : etat === "a_refaire" ? "À refaire" : etat === "redeposee" ? "Nouveau dépôt" : "En attente"}
                        </span>
                        {etat !== "valide" && (
                          <button onClick={() => valider(p.id)} aria-label="Valider" className="p-2 rounded-full border border-ink/10 dark:border-white/10 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button onClick={() => setRefaireOuvert(refaireOuvert === p.id ? null : p.id)} aria-label="Demander de refaire" className="p-2 rounded-full border border-ink/10 dark:border-white/10 hover:border-rust hover:text-rust transition-colors">
                          <FileWarning size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {refaireOuvert === p.id && (
                    <div className="mt-3 flex gap-2 print:hidden">
                      <input
                        value={refaireTexte}
                        onChange={(e) => setRefaireTexte(e.target.value)}
                        placeholder="Ce qui manque ou ce qu'il faut corriger"
                        className="flex-1 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
                      />
                      <button onClick={() => demanderRefaire(p.id)} className="px-3 py-2 bg-rust text-paper rounded-sm text-[11px] font-sans uppercase tracking-widest">Envoyer</button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ))}
      </div>

      {/* Notes privées */}
      <div className="space-y-3 print:hidden">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-50">Notes privées (jamais visibles de la cliente)</p>
        <form onSubmit={ajouterNote} className="flex gap-2">
          <input
            value={noteTexte}
            onChange={(e) => setNoteTexte(e.target.value)}
            placeholder="Une note pour toi"
            className="flex-1 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust font-serif"
          />
          <button type="submit" className="px-4 py-2 bg-rust text-paper rounded-sm text-[11px] font-sans uppercase tracking-widest">Ajouter</button>
        </form>
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-3 p-3 border border-ink/10 dark:border-white/10 rounded-sm bg-white/40 dark:bg-white/5">
              <div>
                <p className="font-serif text-sm">{n.texte}</p>
                <p className="font-sans text-[10px] opacity-40 mt-0.5">{dateCourte(n.createdAt)}</p>
              </div>
              <button onClick={() => remove(n.id)} aria-label="Supprimer" className="p-1.5 rounded-full opacity-30 hover:opacity-100 hover:text-rust transition-all shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
