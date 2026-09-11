import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";

// Le bouton « Problème technique » de l'espace client et sa fenêtre.
//
// La cliente décrit ce qui cloche, capture l'écran tel qu'il est derrière la fenêtre
// (html2canvas, la fenêtre se cache le temps de la photo) ou téléverse une capture de son
// cru, puis envoie. Le rapport se range dans `bugs/{id}` et part en même temps à la porte
// du studio, recevoirDemande — même patron que chez Krystine.
//
// VEXEL_CLE est un espace réservé tant qu'Alex n'a pas émis une clé pour ce client côté
// vexel-integrations (voir docs/BRANCHEMENTS.md) : en attendant, l'envoi à la porte Vexel
// échoue silencieusement et le rapport se range quand même dans bugs/{id}, donc rien n'est
// perdu.
const VEXEL_PORTE = "https://us-central1-vexel-integrations.cloudfunctions.net/recevoirDemande";
const VEXEL_CLIENT = "territoire-incarne";
const VEXEL_CLE = "A_BRANCHER";
const TAILLE_MAX = 10 * 1024 * 1024;

interface Props {
  uid: string;
  nom: string;
  courriel: string;
}

/** L'écran visible, photographié derrière la fenêtre, en JPEG raisonnable. */
async function capturerEcran(): Promise<Blob> {
  const { default: html2canvas } = await import("html2canvas");
  const largeur = window.innerWidth;
  const hauteur = window.innerHeight;
  const canvas = await html2canvas(document.documentElement, {
    x: window.scrollX,
    y: window.scrollY,
    width: largeur,
    height: hauteur,
    scrollX: 0,
    scrollY: 0,
    windowWidth: largeur,
    windowHeight: hauteur,
    scale: Math.min(1.5, 2000 / largeur),
    useCORS: true,
    logging: false,
    backgroundColor: null,
    ignoreElements: (el) => el.hasAttribute("data-bug-ignore"),
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob a rendu null"))), "image/jpeg", 0.85);
  });
}

export const ProblemeTechnique = ({ uid, nom, courriel }: Props) => {
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState("");
  const [image, setImage] = useState<Blob | null>(null);
  const [apercu, setApercu] = useState("");
  const [etat, setEtat] = useState<"repos" | "capture" | "envoi" | "envoye">("repos");
  const [erreur, setErreur] = useState("");
  const fichierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!image) { setApercu(""); return; }
    const url = URL.createObjectURL(image);
    setApercu(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert]);

  const fermer = () => {
    setOuvert(false);
    if (etat === "envoye") { setTexte(""); setImage(null); setEtat("repos"); }
    setErreur("");
  };

  const capturer = async () => {
    setErreur("");
    setEtat("capture");
    try {
      await new Promise((r) => setTimeout(r, 80));
      setImage(await capturerEcran());
    } catch (e) {
      console.warn("[bug] capture ratée", e);
      setErreur("La capture automatique n'a pas fonctionné sur cette page. Téléversez une capture de votre écran.");
    } finally {
      setEtat("repos");
    }
  };

  const choisir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) { setErreur("Le fichier doit être une image."); return; }
    if (f.size > TAILLE_MAX) { setErreur("La capture dépasse 10 Mo."); return; }
    setErreur("");
    setImage(f);
  };

  const envoyer = async () => {
    if (!texte.trim() || etat !== "repos") return;
    setEtat("envoi");
    setErreur("");
    const page = window.location.pathname + window.location.search;
    const ecran = `${window.innerWidth}×${window.innerHeight}`;
    try {
      let capture = "";
      let capturePath = "";
      if (image) {
        const ext = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
        capturePath = `bugs/${uid}/${Date.now()}.${ext}`;
        const r = ref(storage, capturePath);
        await uploadBytes(r, image, { contentType: image.type || "image/jpeg" });
        capture = await getDownloadURL(r);
      }

      let vexel: "transmis" | "echec" = "echec";
      try {
        const rep = await fetch(VEXEL_PORTE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: VEXEL_CLIENT,
            cle: VEXEL_CLE,
            type: "bug",
            auteurNom: nom,
            auteurCourriel: courriel,
            texte: texte.trim(),
            page: `https://territoireincarne.com${page}`,
            capture,
            agent: navigator.userAgent,
            ecran,
          }),
        });
        if (rep.ok) vexel = "transmis";
      } catch (e) {
        console.warn("[bug] porte Vexel injoignable", e);
      }

      await addDoc(collection(db, "bugs"), {
        uid,
        nom,
        courriel,
        texte: texte.trim().slice(0, 4000),
        page,
        capture,
        capturePath,
        agent: navigator.userAgent.slice(0, 300),
        ecran,
        statut: "nouveau",
        vexel,
        cree: serverTimestamp(),
      });
      setEtat("envoye");
    } catch (e) {
      console.error("[bug] envoi raté", e);
      setErreur("L'envoi n'a pas fonctionné. Réessayez dans un instant.");
      setEtat("repos");
    }
  };

  const enCapture = etat === "capture";

  return (
    <>
      <button
        type="button"
        data-bug-ignore
        onClick={() => setOuvert(true)}
        className="fixed bottom-6 left-6 z-[120] flex items-center gap-2 rounded-full border border-ink/10 dark:border-white/15 bg-paper/90 dark:bg-charcoal/90 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-rust shadow-xl backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-paper dark:hover:bg-charcoal"
      >
        <AlertTriangle size={14} /> Problème technique
      </button>

      {ouvert && (
        <div
          data-bug-ignore
          className="fixed inset-0 z-[700] bg-ink/70 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) fermer(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Signaler un problème technique"
        >
          <div className="w-full max-w-lg bg-paper dark:bg-charcoal rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <h3 className="font-serif text-2xl">Signaler un problème technique</h3>
              <button type="button" onClick={fermer} aria-label="Fermer" className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-stone-500 hover:text-ink dark:hover:text-white shrink-0">
                <X size={20} />
              </button>
            </div>

            {etat === "envoye" ? (
              <div className="px-6 pb-8 pt-4">
                <p className="font-serif text-base">Merci. Le rapport est parti; Élise et le studio le voient dès maintenant.</p>
                <button onClick={fermer} className="mt-5 inline-flex items-center justify-center rounded-full bg-ink dark:bg-stone-100 text-paper dark:text-forest font-sans text-sm font-bold min-h-[44px] px-6">
                  Fermer
                </button>
              </div>
            ) : (
              <div className="px-6 pb-6 pt-4 space-y-4">
                <p className="font-serif text-sm opacity-70">Dites-nous ce qui cloche. Une capture d'écran nous aide à retrouver l'endroit exact.</p>
                <textarea
                  rows={4}
                  value={texte}
                  onChange={(e) => setTexte(e.target.value)}
                  placeholder="Ce qui s'est passé, et ce que vous attendiez à la place."
                  className="w-full bg-white/40 dark:bg-white/5 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-rust font-serif resize-none"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={capturer}
                    disabled={enCapture}
                    className="px-4 py-2 border border-ink/10 dark:border-white/10 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:border-rust hover:text-rust transition-colors disabled:opacity-50"
                  >
                    {enCapture ? "Capture en cours…" : "Capturer l'écran"}
                  </button>
                  <input ref={fichierRef} type="file" accept="image/*" onChange={choisir} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fichierRef.current?.click()}
                    className="px-4 py-2 border border-ink/10 dark:border-white/10 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:border-rust hover:text-rust transition-colors"
                  >
                    Téléverser une capture
                  </button>
                </div>

                {apercu && (
                  <div className="relative inline-block">
                    <img src={apercu} alt="" className="max-h-40 rounded-lg border border-ink/10 dark:border-white/10" />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink text-paper flex items-center justify-center"
                      aria-label="Retirer la capture"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {erreur && <p className="font-sans text-xs uppercase tracking-widest text-rust">{erreur}</p>}

                <button
                  type="button"
                  onClick={envoyer}
                  disabled={!texte.trim() || etat === "envoi"}
                  className="w-full inline-flex items-center justify-center gap-2 bg-rust text-paper py-3 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:bg-ink transition-colors disabled:opacity-40"
                >
                  {etat === "envoi" ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
