import { useMemo, useState } from "react";
import { MessageCircleQuestion, X } from "lucide-react";
import type { ClientProfile } from "../../hooks/useClientAuth";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import type { Appointment } from "../../types/calendar";
import { useDossierConfig, piecesManquantes, avancement, indexEtape } from "../../lib/dossier";

/** Bulle flottante à règles : répond avec ce que le site sait déjà (dossier, rendez-vous,
 *  séances), sans clé ni appel à un modèle de langage. Porté du patron Assistant.tsx de Xena. */
export const Assistant = ({ uid, profile }: { uid: string; profile: ClientProfile }) => {
  const [ouvert, setOuvert] = useState(false);
  const [reponse, setReponse] = useState<string | null>(null);
  const config = useDossierConfig();
  const { items: rdv } = useFirestoreCollection<Appointment>(
    "appointments",
    useMemo(() => ({ where: [["clientUid", "==", uid]] as const, orderField: "start", orderDirection: "asc" as const }), [uid]),
  );

  const prochain = rdv.find((a) => a.status !== "annulé" && a.status !== "complété" && a.start.toDate() > new Date());
  const manquantes = piecesManquantes(profile.pieces, config.pieces);

  const questions: { q: string; reponse: () => string }[] = [
    {
      q: "Où en est mon dossier ?",
      reponse: () => {
        const etape = config.etapes[indexEtape(config.etapes, profile.etape || config.etapes[0]?.id)];
        return `Vous êtes à l'étape « ${etape?.titre ?? "premier contact"} », avec ${avancement(profile.pieces, config.pieces)}% des pièces obligatoires reçues.`;
      },
    },
    {
      q: "Qu'est-ce qu'il me manque ?",
      reponse: () =>
        manquantes.length === 0
          ? "Rien : toutes les pièces obligatoires ont été reçues."
          : `Il manque : ${manquantes.map((p) => p.nom).join(", ")}. Vous pouvez les déposer dans l'onglet Mon dossier.`,
    },
    {
      q: "Quand est mon prochain rendez-vous ?",
      reponse: () =>
        prochain
          ? `Votre prochain rendez-vous est le ${prochain.start.toDate().toLocaleDateString("fr-CA", { day: "2-digit", month: "long", year: "numeric" })} à ${prochain.start.toDate().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}.`
          : "Aucun rendez-vous à venir. Vous pouvez en demander un dans l'onglet Rendez-vous.",
    },
    {
      q: "Combien de séances me reste-t-il ?",
      reponse: () =>
        typeof profile.seancesTotal === "number"
          ? `Il vous reste ${profile.seancesRemaining ?? 0} séance(s) sur votre forfait de ${profile.seancesTotal}.`
          : "Élise ne vous a pas encore attribué de forfait de séances.",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[120]">
      {ouvert && (
        <div className="mb-3 w-80 max-w-[calc(100vw-3rem)] bg-paper dark:bg-charcoal border border-ink/10 dark:border-white/10 rounded-2xl shadow-2xl p-4 origin-bottom-right">
          <div className="flex items-center justify-between mb-3">
            <p className="font-serif text-base">Une question ?</p>
            <button onClick={() => { setOuvert(false); setReponse(null); }} aria-label="Fermer" className="p-1 opacity-50 hover:opacity-100">
              <X size={15} />
            </button>
          </div>
          {reponse ? (
            <div>
              <p className="font-serif text-sm leading-relaxed mb-3">{reponse}</p>
              <button onClick={() => setReponse(null)} className="font-sans text-[10px] uppercase tracking-widest text-rust hover:underline">
                ← Une autre question
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {questions.map(({ q, reponse: r }) => (
                <button
                  key={q}
                  onClick={() => setReponse(r())}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-serif hover:bg-rust/10 hover:text-rust transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-label="Ouvrir l'assistant"
        className="w-14 h-14 rounded-full bg-ink dark:bg-stone-100 text-paper dark:text-forest shadow-xl flex items-center justify-center hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
      >
        <MessageCircleQuestion size={22} />
      </button>
    </div>
  );
};
