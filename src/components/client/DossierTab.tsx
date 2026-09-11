import { useRef, useState } from "react";
import { CheckCircle2, Circle, FileWarning, Loader2, Trash2, Upload } from "lucide-react";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc, deleteField, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../../firebase";
import type { ClientProfile } from "../../hooks/useClientAuth";
import {
  useDossierConfig,
  cheminPiece,
  TYPES_ACCEPTES,
  TAILLE_MAX,
  avancement,
  piecesParCategorie,
  etatPiece,
  indexEtape,
} from "../../lib/dossier";

const ETAT_LABEL: Record<string, string> = {
  manquante: "À déposer",
  deposee: "Déposée, en attente d'Élise",
  valide: "Validée",
  a_refaire: "À refaire",
  redeposee: "Nouveau dépôt, en attente",
};

const formatTaille = (o: number) => (o < 1024 * 1024 ? `${Math.round(o / 1024)} Ko` : `${(o / (1024 * 1024)).toFixed(1)} Mo`);

interface Props {
  uid: string;
  profile: ClientProfile;
}

export const DossierTab = ({ uid, profile }: Props) => {
  const config = useDossierConfig();
  const [motif, setMotif] = useState(profile.projet?.titre ?? "");
  const [description, setDescription] = useState(profile.projet?.description ?? "");
  const [savingProjet, setSavingProjet] = useState(false);
  const [enCours, setEnCours] = useState<Record<string, number>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const saveProjet = async () => {
    setSavingProjet(true);
    await updateDoc(doc(db, "users", uid), {
      projet: { titre: motif.trim(), description: description.trim(), objectif: profile.projet?.objectif ?? "" },
      derniereActiviteClient: serverTimestamp(),
    });
    setSavingProjet(false);
  };

  const deposer = (pieceId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!TYPES_ACCEPTES.includes(file.type)) {
      window.alert("Ce type de fichier n'est pas accepté. PDF, image, Word, Excel ou texte.");
      return;
    }
    if (file.size > TAILLE_MAX) {
      window.alert("Le fichier dépasse 25 Mo.");
      return;
    }
    const chemin = cheminPiece(uid, pieceId, file.name);
    const task = uploadBytesResumable(storageRef(storage, chemin), file, { contentType: file.type });
    setEnCours((s) => ({ ...s, [pieceId]: 0 }));
    task.on(
      "state_changed",
      (snap) => setEnCours((s) => ({ ...s, [pieceId]: Math.round((snap.bytesTransferred / snap.totalBytes) * 100) })),
      () => setEnCours((s) => { const n = { ...s }; delete n[pieceId]; return n; }),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await updateDoc(doc(db, "users", uid), {
          [`pieces.${pieceId}`]: { nom: file.name, url, chemin, taille: file.size, type: file.type, deposeLe: serverTimestamp() },
          derniereActiviteClient: serverTimestamp(),
          nonLusAdmin: (profile.nonLusAdmin ?? 0) + 1,
        });
        setEnCours((s) => { const n = { ...s }; delete n[pieceId]; return n; });
      },
    );
  };

  const retirer = async (pieceId: string) => {
    const p = profile.pieces?.[pieceId];
    if (!p) return;
    if (!window.confirm(`Retirer « ${p.nom} » ?`)) return;
    await deleteObject(storageRef(storage, p.chemin)).catch(() => {});
    await updateDoc(doc(db, "users", uid), {
      [`pieces.${pieceId}`]: deleteField(),
    });
  };

  const pct = avancement(profile.pieces, config.pieces);
  const etapeIndex = indexEtape(config.etapes, profile.etape || config.etapes[0]?.id);

  return (
    <div className="space-y-10 animate-[fadeIn_0.6s_ease-out]">
      {/* Motif de consultation */}
      <div className="space-y-3">
        <h2 className="font-serif text-xl">Le motif de ta consultation</h2>
        <p className="font-sans text-sm opacity-60">Ce qui t'amène, avec tes mots. Tu peux le préciser ou le changer à tout moment.</p>
        <input
          type="text"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          placeholder="En une phrase"
          className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust dark:focus:border-stone-100 outline-none py-2 font-serif text-lg transition-colors"
        />
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ce que tu veux nommer, si tu en as envie."
          className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-rust font-serif resize-none"
        />
        <button
          onClick={saveProjet}
          disabled={savingProjet}
          className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50"
        >
          {savingProjet ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {/* Parcours */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl">Ton parcours</h2>
          <span className="font-sans text-[11px] uppercase tracking-widest opacity-50">{pct}% des pièces reçues</span>
        </div>
        <ol className="space-y-0">
          {config.etapes.map((etape, i) => {
            const passee = i < etapeIndex;
            const active = i === etapeIndex;
            return (
              <li key={etape.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {passee || active ? (
                    <CheckCircle2 size={18} className={active ? "text-rust" : "text-rust/60"} />
                  ) : (
                    <Circle size={18} className="opacity-30" />
                  )}
                  {i < config.etapes.length - 1 && (
                    <div className={`w-px flex-1 my-1 ${passee ? "bg-rust/60" : "bg-ink/10 dark:bg-white/10"}`} />
                  )}
                </div>
                <div className={`pb-6 ${active ? "" : "opacity-60"}`}>
                  <p className="font-serif text-base">{etape.titre}</p>
                  {etape.sous && <p className="font-sans text-xs opacity-60 mt-0.5">{etape.sous}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Pièces */}
      <div className="space-y-6">
        <h2 className="font-serif text-xl">Tes pièces</h2>
        {piecesParCategorie(config.pieces).map(({ cat, pieces }) => (
          <div key={cat} className="space-y-3">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-50">{cat}</p>
            <div className="space-y-3">
              {pieces.map((p) => {
                const etat = etatPiece(profile.pieces, profile.revue, p.id);
                const deposee = profile.pieces?.[p.id];
                const progres = enCours[p.id];
                const note = etat === "a_refaire" ? profile.revue?.[p.id]?.note : undefined;
                return (
                  <div key={p.id} className="p-4 border border-ink/10 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-serif text-base">
                          {p.nom} {p.option && <span className="font-sans text-[10px] opacity-50 uppercase tracking-widest">(optionnel)</span>}
                        </p>
                        {p.aide && <p className="font-sans text-xs opacity-60 mt-0.5">{p.aide}</p>}
                        <p
                          className={`font-sans text-[10px] uppercase tracking-widest mt-1.5 font-bold ${
                            etat === "valide" ? "text-emerald-600 dark:text-emerald-400" : etat === "a_refaire" ? "text-rust" : "opacity-50"
                          }`}
                        >
                          {ETAT_LABEL[etat]}
                        </p>
                        {note && (
                          <p className="font-serif text-sm mt-1.5 flex items-start gap-1.5">
                            <FileWarning size={14} className="shrink-0 mt-0.5 text-rust" /> {note}
                          </p>
                        )}
                        {deposee && (
                          <a href={deposee.url} target="_blank" rel="noopener noreferrer" className="inline-block font-sans text-[11px] text-rust hover:underline mt-1.5">
                            {deposee.nom} · {formatTaille(deposee.taille)}
                          </a>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {progres !== undefined ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-sans opacity-60">
                            <Loader2 size={14} className="animate-spin" /> {progres}%
                          </span>
                        ) : (
                          <>
                            <input
                              ref={(el) => { fileRefs.current[p.id] = el; }}
                              type="file"
                              accept={TYPES_ACCEPTES.join(",")}
                              onChange={deposer(p.id, p.nom)}
                              className="hidden"
                            />
                            <button
                              onClick={() => fileRefs.current[p.id]?.click()}
                              aria-label={deposee ? "Remplacer" : "Déposer"}
                              className="p-2.5 rounded-full border border-ink/10 dark:border-white/10 hover:border-rust hover:text-rust transition-colors"
                            >
                              <Upload size={15} />
                            </button>
                            {deposee && (
                              <button
                                onClick={() => retirer(p.id)}
                                aria-label="Retirer"
                                className="p-2.5 rounded-full border border-ink/10 dark:border-white/10 hover:border-rust hover:text-rust transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
