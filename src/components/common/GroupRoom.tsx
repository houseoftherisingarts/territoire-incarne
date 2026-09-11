import { useEffect, useMemo, useState } from "react";
import { Video, Mic, Clock, Loader2 } from "lucide-react";
import { VideoCallRoom } from "./VideoCallRoom";
import { createDailyToken } from "../../services/daily";
import {
  classeEnDirect,
  prochaineSeance,
  seanceEnCours,
  formatSeance,
  type Seance,
} from "../../lib/groupSchedule";

interface Props {
  format: "video" | "audio";
  seances: Seance[];
  roomUrl?: string;
  roomName?: string;
  /** Élise entre en hôtesse, les participantes en invitées. */
  isOwner?: boolean;
}

/* =========================================================================
   La salle d'un cours de groupe. Elle s'ouvre un quart d'heure avant la
   rencontre et se ferme a la fin. Rien ne s'enregistre, rien ne se
   transcrit : la salle est cree sans enregistrement du tout.
   ========================================================================= */
export const GroupRoom = ({ format, seances, roomUrl, roomName, isOwner = false }: Props) => {
  const [maintenant, setMaintenant] = useState(Date.now());
  const [token, setToken] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Une horloge qui bat toutes les trente secondes suffit pour ouvrir la
  // porte a l'heure dite sans faire travailler la page pour rien.
  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const enDirect = classeEnDirect(seances, maintenant);
  const suivante = useMemo(() => prochaineSeance(seances, maintenant), [seances, maintenant]);

  const entrer = async () => {
    if (!roomName) return;
    setChargement(true);
    setErreur(null);
    try {
      setToken(await createDailyToken(roomName, isOwner));
    } catch (e) {
      console.error("Jeton de salle:", e);
      setErreur("La salle n'a pas voulu s'ouvrir. Réessayez dans un instant.");
    } finally {
      setChargement(false);
    }
  };

  if (token && roomUrl) {
    return (
      <div className="space-y-3">
        <VideoCallRoom
          roomUrl={roomUrl}
          token={token}
          onEnd={() => setToken(null)}
          allowTranscript={false}
          endLabel="Quitter"
        />
        <p className="text-xs font-sans uppercase tracking-[0.2em] opacity-50">
          Rien n'est enregistré ni transcrit dans cette salle.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-ink/10 dark:border-white/10 rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
            enDirect ? "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100" : "bg-ink/5 dark:bg-white/10 opacity-70"
          }`}
        >
          {format === "audio" ? <Mic size={18} /> : <Video size={18} />}
        </div>

        <div className="flex-1 min-w-[180px]">
          {enDirect ? (
            <>
              <p className="text-xs font-sans uppercase tracking-[0.3em] text-forest dark:text-stone-100 font-bold">
                La rencontre est ouverte
              </p>
              <p className="font-serif italic opacity-70 text-sm mt-1">
                {format === "audio"
                  ? "Vous entrez en audio, la caméra fermée."
                  : "Votre micro et votre caméra restent fermés tant que vous ne les ouvrez pas."}
              </p>
            </>
          ) : suivante ? (
            <>
              <p className="text-xs font-sans uppercase tracking-[0.3em] opacity-60">Prochaine rencontre</p>
              <p className="font-serif text-lg capitalize">{formatSeance(suivante.debut)}</p>
              <p className="text-xs opacity-60 mt-0.5">
                {suivante.titre} · {suivante.duree} minutes · la porte s'ouvre 15 minutes avant
              </p>
            </>
          ) : (
            <p className="font-serif italic opacity-60">Aucune rencontre n'est encore au calendrier.</p>
          )}
        </div>

        {enDirect && roomUrl && roomName && (
          <button
            onClick={entrer}
            disabled={chargement}
            className="shrink-0 inline-flex items-center gap-2 bg-rust text-paper px-5 py-2.5 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50"
          >
            {chargement ? <Loader2 size={13} className="animate-spin" /> : <Video size={13} />}
            Entrer dans la salle
          </button>
        )}
        {enDirect && !roomUrl && (
          <p className="text-xs font-serif italic opacity-60 shrink-0">
            La salle n'est pas encore ouverte.
          </p>
        )}
      </div>

      {erreur && <p className="text-xs text-rust mt-3">{erreur}</p>}

      {seances.length > 1 && (
        <ul className="mt-5 pt-4 border-t border-ink/5 dark:border-white/5 space-y-1.5">
          {[...seances]
            .sort((a, b) => a.debut.localeCompare(b.debut))
            .map((s) => {
              const ouverte = seanceEnCours(s, maintenant);
              const passee = new Date(s.debut).getTime() + s.duree * 60000 < maintenant;
              return (
                <li
                  key={s.id}
                  className={`flex items-center gap-2 text-sm ${
                    ouverte ? "text-forest dark:text-stone-100 font-bold" : passee ? "opacity-40 line-through" : "opacity-80"
                  }`}
                >
                  <Clock size={12} className="shrink-0" />
                  <span className="capitalize">{formatSeance(s.debut)}</span>
                  <span className="opacity-60">· {s.titre}</span>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
};
