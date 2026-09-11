import { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Check, Copy, Unlink, Calendar } from "lucide-react";
import { app } from "../../../firebase";
import { Card } from "../sections";

const REGION = "us-central1";

interface Etat {
  disponible: boolean;
  connecte: boolean;
  email?: string;
  calendrierId?: string;
  derniereSync?: number | null;
  calendriers?: { id: string; nom: string }[];
}

/** Agenda › Google Agenda : deux chemins vers l'agenda d'Élise. Le flux iCal marche tout de suite
 *  (elle s'y abonne une fois, ses rendez-vous y apparaissent et s'y mettent à jour). La
 *  synchronisation OAuth (événements créés dans son agenda, créneaux Google qui bloquent le site)
 *  attend le client OAuth de la console, voir docs/BRANCHEMENTS.md. */
export const GoogleAgendaPanel = () => {
  const fns = getFunctions(app, REGION);
  const [etat, setEtat] = useState<Etat | "chargement" | "erreur">("chargement");
  const [busy, setBusy] = useState<string | null>(null);
  const [ics, setIcs] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);

  const rafraichir = async (calendrierId?: string) => {
    try {
      const r = await httpsCallable<{ calendrierId?: string }, Etat>(fns, "agendaGoogleEtat")({ calendrierId });
      setEtat(r.data);
    } catch (e) {
      console.warn("agendaGoogleEtat :", e);
      setEtat("erreur");
    }
  };

  useEffect(() => { void rafraichir(); }, []);

  const connecter = async () => {
    setBusy("connecter");
    try {
      const r = await httpsCallable<unknown, { url: string }>(fns, "agendaGoogleConnecter")({});
      window.location.href = r.data.url;
    } catch (e) {
      console.warn("agendaGoogleConnecter :", e);
      setBusy(null);
    }
  };

  const deconnecter = async () => {
    setBusy("deconnecter");
    try {
      await httpsCallable(fns, "agendaGoogleDeconnecter")({});
      await rafraichir();
    } finally {
      setBusy(null);
    }
  };

  const obtenirIcs = async (regenerer = false) => {
    setBusy("ics");
    try {
      const r = await httpsCallable<{ regenerer?: boolean }, { url: string }>(fns, "calendrierIcsLien")({ regenerer });
      setIcs(r.data.url);
    } catch (e) {
      console.warn("calendrierIcsLien :", e);
    } finally {
      setBusy(null);
    }
  };

  const copier = async () => {
    if (!ics) return;
    await navigator.clipboard.writeText(ics);
    setCopie(true);
    setTimeout(() => setCopie(false), 1800);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-rust" />
          <h3 className="font-serif text-2xl">Mon agenda dans Google Agenda</h3>
        </div>
        <p className="font-serif text-base opacity-80 leading-relaxed">
          Abonnez-vous une seule fois à ce lien dans Google Agenda (« Autres agendas », puis « À partir de l'URL »)
          ou dans Apple Calendrier. Vos rendez-vous confirmés et vos demandes en attente y apparaissent et se
          mettent à jour d'eux-mêmes. Le lien est secret : ne le partagez pas.
        </p>
        {ics ? (
          <div className="flex flex-wrap items-center gap-3">
            <code className="text-xs bg-ink/5 dark:bg-white/10 px-3 py-2 rounded break-all max-w-full">{ics}</code>
            <button onClick={copier} className="inline-flex items-center gap-2 border border-ink/10 dark:border-white/10 px-3 py-2 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:border-rust hover:text-rust transition-colors">
              {copie ? <Check size={12} /> : <Copy size={12} />} {copie ? "Copié" : "Copier"}
            </button>
            <button onClick={() => obtenirIcs(true)} disabled={busy === "ics"} className="font-sans text-xs uppercase tracking-[0.2em] opacity-50 hover:opacity-100">
              Régénérer le lien
            </button>
          </div>
        ) : (
          <button onClick={() => obtenirIcs(false)} disabled={busy === "ics"} className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50">
            {busy === "ics" ? "…" : "Obtenir mon lien d'abonnement"}
          </button>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-serif text-2xl">Synchronisation complète</h3>
        {etat === "chargement" && <p className="font-serif opacity-60">Chargement…</p>}
        {(etat === "erreur" || (etat !== "chargement" && !etat.disponible)) && (
          <p className="font-serif text-base opacity-80 leading-relaxed">
            La synchronisation complète (vos rendez-vous créés directement dans votre agenda Google, et vos plages
            déjà prises chez Google qui bloquent les créneaux du site) sera activée par Vexel. En attendant, le
            lien d'abonnement ci-dessus fait le travail.
          </p>
        )}
        {etat !== "chargement" && etat !== "erreur" && etat.disponible && !etat.connecte && (
          <>
            <p className="font-serif text-base opacity-80 leading-relaxed">
              Connectez votre compte Google : vos rendez-vous confirmés apparaissent dans votre agenda, et vos
              plages déjà occupées chez Google bloquent les nouveaux créneaux sur le site.
            </p>
            <button onClick={connecter} disabled={busy === "connecter"} className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50">
              {busy === "connecter" ? "Redirection…" : "Connecter mon Google Agenda"}
            </button>
          </>
        )}
        {etat !== "chargement" && etat !== "erreur" && etat.connecte && (
          <div className="space-y-4">
            <p className="font-serif text-base">
              Connecté à <span className="text-rust">{etat.email}</span>
              {etat.derniereSync ? ` · dernière synchronisation ${new Date(etat.derniereSync).toLocaleString("fr-CA")}` : " · pas encore synchronisé"}
            </p>
            {etat.calendriers && etat.calendriers.length > 0 && (
              <label className="block">
                <span className="block text-xs font-sans uppercase tracking-[0.25em] opacity-60 mb-2">Calendrier cible</span>
                <select
                  value={etat.calendrierId}
                  onChange={(e) => rafraichir(e.target.value)}
                  className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded px-3 py-2 font-serif"
                >
                  {etat.calendriers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </label>
            )}
            <button onClick={deconnecter} disabled={busy === "deconnecter"} className="inline-flex items-center gap-2 border border-rust/30 text-rust px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:bg-rust hover:text-paper transition-colors">
              <Unlink size={12} /> {busy === "deconnecter" ? "Déconnexion…" : "Déconnecter"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};
