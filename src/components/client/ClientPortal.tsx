import { ELISE_FIELD_IMG } from '../../assets/images';
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, MessageSquare, LogOut, Send, Video, Music, Moon, Sun, Camera, FolderHeart, Library, UserCircle2, ArrowRight } from "lucide-react";
import { ClientLogin } from "./ClientLogin";
import { ClientProfile } from "./ClientProfile";
import { ClientMeetingTab } from "./ClientMeetingTab";
import { ClientClassesTab } from "./ClientClassesTab";
import { ClientReservationsTab, useMyAppointments } from "./ClientReservationsTab";
import { DossierTab } from "./DossierTab";
import { RessourcesTab } from "./RessourcesTab";
import { Assistant } from "./Assistant";
import { ProblemeTechnique } from "./ProblemeTechnique";
import { Reveal } from "../motion/Reveal";
import { useClientAuth } from "../../hooks/useClientAuth";
import { useTheme } from "../../hooks/useTheme";
import { useChat } from "../../hooks/useChat";
import { uploadProfilPhoto } from "../../lib/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { consumeReturnTo } from "../../lib/requireAuth";
import { isAdminUser } from "../../lib/admins";
import { fmtDateLong, fmtTime as fmtHeureRdv } from "../../lib/datetime";

type TabId = "dossier" | "reservations" | "cours" | "messagerie" | "ressources" | "réunion" | "profil";

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "dossier",      label: "Mon dossier",   Icon: FolderHeart },
  { id: "reservations", label: "Rendez-vous",   Icon: CalendarDays },
  { id: "cours",        label: "Mes cours",     Icon: Music },
  { id: "messagerie",   label: "Messages",      Icon: MessageSquare },
  { id: "ressources",   label: "Ressources",    Icon: Library },
  { id: "réunion",      label: "Réunion",       Icon: Video },
  { id: "profil",       label: "Mon profil",    Icon: UserCircle2 },
];

const fmtDate = (d: Date | null) => {
  if (!d) return "";
  return d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtTime = (d: Date | null) => {
  if (!d) return "";
  return d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
};

const MessagerieTab = ({ uid }: { uid: string }) => {
  const { messages, loading, send } = useChat(uid, uid);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await send(text);
    setText("");
  };

  if (loading) return <p className="font-sans text-sm opacity-50 py-10 text-center">Chargement…</p>;

  return (
    <div className="flex flex-col h-[60vh] animate-[fadeIn_0.6s_ease-out]">
      <div className="flex-1 overflow-y-auto space-y-3 px-1 py-2">
        {messages.length === 0 && (
          <p className="font-serif text-stone-400 text-center py-10">
            Aucun message pour l'instant. Élise vous répondra sous peu.
          </p>
        )}
        {messages.map((m) => {
          const isMe = m.senderUid === uid;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                <div
                  className={`px-4 py-2.5 text-sm leading-relaxed font-serif ${
                    isMe
                      ? "bg-ink text-stone-100 dark:bg-stone-700 rounded-2xl rounded-br-sm"
                      : "bg-stone-100 dark:bg-white/10 rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
                <p className={`text-xs opacity-40 mt-1 font-sans ${isMe ? "text-right" : "text-left"}`}>
                  {fmtDate(m.sentAt)} {fmtTime(m.sentAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 pt-3 border-t border-ink/10 dark:border-white/10">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Votre message…"
          className="flex-1 bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust dark:focus:border-stone-100 outline-none py-2 font-serif text-sm transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:bg-ink transition-colors disabled:opacity-40"
        >
          <Send size={12} /> Envoyer
        </button>
      </form>
    </div>
  );
};

/** Premier mot du nom affiché, ou ce qui précède le @ à défaut. */
const firstName = (displayName: string, email: string) =>
  (displayName.trim() || email.split("@")[0]).split(" ")[0];

/** Le geste le plus utile en un coup d'œil : le prochain rendez-vous s'il y en
 *  a un, sinon l'invitation à en prendre un. Réutilise la même requête que
 *  l'onglet Rendez-vous (useMyAppointments), jamais une deuxième lecture. */
const ProchainRendezVous = ({ uid, onVoir, onReserver }: { uid: string; onVoir: () => void; onReserver: () => void }) => {
  const { items, loading } = useMyAppointments(uid);
  const prochain = useMemo(
    () => items.find((a) => a.end.toDate() >= new Date() && a.status !== "cancelled") ?? null,
    [items],
  );

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-2xl bg-white/40 dark:bg-white/5 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <CalendarDays size={14} className="text-rust opacity-70 shrink-0" />
        <h2 className="font-sans text-xs uppercase tracking-[0.25em] opacity-60">Votre prochain rendez-vous</h2>
      </div>

      {loading ? (
        <p className="font-serif italic opacity-50 text-sm">Chargement…</p>
      ) : prochain ? (
        <>
          <div>
            <span className={`inline-block text-xs uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
              prochain.status === "requested"
                ? "bg-amber-200 text-amber-800 dark:bg-amber-700/30 dark:text-amber-200"
                : "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100"
            }`}>
              {prochain.status === "requested" ? "En attente d'approbation" : "Confirmé"}
            </span>
            <p className="font-serif text-xl mt-2">{fmtDateLong(prochain.start.toDate())}</p>
            <p className="font-mono text-sm opacity-70 mt-1">
              {fmtHeureRdv(prochain.start.toDate())} – {fmtHeureRdv(prochain.end.toDate())} · {prochain.type ?? "Consultation"}
            </p>
          </div>
          <button
            onClick={onVoir}
            className="self-start inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest font-bold text-rust hover:text-ink dark:hover:text-stone-100 transition-colors"
          >
            Voir mes rendez-vous <ArrowRight size={13} />
          </button>
        </>
      ) : (
        <>
          <p className="font-serif opacity-70 text-sm">Aucun rendez-vous à l'agenda pour l'instant.</p>
          <button
            onClick={onReserver}
            className="self-start inline-flex items-center gap-2 bg-rust text-paper px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-ink transition-colors"
          >
            Prendre rendez-vous <ArrowRight size={13} />
          </button>
        </>
      )}
    </div>
  );
};

/** Le geste jumeau du rendez-vous : écrire à Élise, sans quitter l'accueil pour le trouver. */
const EcrireAElise = ({ onEcrire }: { onEcrire: () => void }) => (
  <div className="border border-stone-200 dark:border-stone-700 rounded-2xl bg-white/40 dark:bg-white/5 p-6 flex flex-col gap-4">
    <div className="flex items-center gap-2">
      <MessageSquare size={14} className="text-rust opacity-70 shrink-0" />
      <h2 className="font-sans text-xs uppercase tracking-[0.25em] opacity-60">Une question, un mot</h2>
    </div>
    <p className="font-serif opacity-70 text-sm">Élise vous répondra directement dans vos messages.</p>
    <button
      onClick={onEcrire}
      className="self-start inline-flex items-center gap-2 border border-ink/15 dark:border-white/15 px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-bold hover:border-rust hover:text-rust transition-colors"
    >
      Écrire à Élise <ArrowRight size={13} />
    </button>
  </div>
);

export const ClientPortal = () => {
  const { user, profile, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, updateDisplayName, setNewsletterOptIn, resetPassword, logout } = useClientAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [tab, setTab] = useState<TabId>(() => {
    const voulu = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("onglet") : null;
    return voulu && TABS.some((t) => t.id === voulu) ? (voulu as TabId) : "dossier";
  });
  const [uploadingBanner, setUploadingBanner] = useState(false);
  /** Le compte vient d'être créé : on la remercie une fois, puis le mot s'efface. */
  const [bienvenue, setBienvenue] = useState(false);
  /** Onglet ouvert quand le mot d'accueil envoie vers Rendez-vous : direct sur "book" en un clic. */
  const [reservationsSubTab, setReservationsSubTab] = useState<"mine" | "book">("mine");
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const target = consumeReturnTo();
    if (target) window.location.replace(target);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const cree = user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
    if (cree && Date.now() - cree < 5 * 60_000 && !sessionStorage.getItem("ti-merci")) {
      sessionStorage.setItem("ti-merci", "1");
      setBienvenue(true);
    }
  }, [user]);

  if (loading) return null;

  if (!user || !profile) {
    return (
      <ClientLogin
        onSignInGoogle={signInWithGoogle}
        onSignInEmail={signInWithEmail}
        onSignUpEmail={signUpWithEmail}
        onResetPassword={resetPassword}
        error={error}
      />
    );
  }

  const adminMode = isAdminUser(user);

  const uploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingBanner(true);
    const url = await uploadProfilPhoto(user.uid, file, "banniere");
    await updateDoc(doc(db, "users", user.uid), { bannerUrl: url });
    setUploadingBanner(false);
  };

  return (
    <div className="min-h-screen w-full bg-paper dark:bg-forest text-ink dark:text-stone-100 transition-colors duration-1000">
      {/* Utility bar */}
      <header className="flex items-center justify-between gap-4 px-6 md:px-10 py-4 border-b border-ink/10 dark:border-white/10">
        <a href="/" className="font-serif text-lg tracking-wide">Territoire Incarné</a>
        <div className="flex items-center gap-4 font-sans text-xs uppercase tracking-[0.2em] opacity-60">
          {adminMode && (
            <a href="/admin" className="hover:text-rust transition-colors">Tableau de bord</a>
          )}
          <a href="/" className="hover:text-rust transition-colors">Retour au site</a>
          <button onClick={toggleTheme} aria-label={theme === "light" ? "Passer au mode sombre" : "Passer au mode clair"} className="hover:text-rust transition-colors">
            {theme === "light" ? <Moon size={13} /> : <Sun size={13} />}
          </button>
          <button onClick={logout} aria-label="Déconnexion" className="hover:text-rust transition-colors">
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* Bannière + avatar qui chevauche */}
      <div className="relative">
        <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={uploadBanner} />
        <button
          onClick={() => bannerInput.current?.click()}
          aria-label="Changer la bannière"
          className="relative w-full aspect-[3/1] md:aspect-[4/1] bg-stone-200 dark:bg-stone-800 overflow-hidden group block"
        >
          <img src={profile.bannerUrl || ELISE_FIELD_IMG} alt="" className="w-full h-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/40 to-transparent pointer-events-none" aria-hidden="true" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          {uploadingBanner && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-sans">Envoi…</span>}
        </button>

        <div className="px-6 md:px-10">
          <div className="relative -mt-10 md:-mt-12 flex items-end gap-4 pb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-paper dark:border-forest bg-stone-300 dark:bg-stone-600 shrink-0 flex items-center justify-center shadow-lg">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span className="font-serif text-2xl">{(profile.displayName || profile.email)[0].toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 pb-1">
              <p className="ed-kicker text-xs font-sans uppercase tracking-[0.3em] text-rust">Espace personnel</p>
              <h1 className="ed-display font-serif text-2xl md:text-3xl truncate">{profile.displayName || profile.email}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Le mot d'accueil, pleine largeur : le prénom d'abord, puis le geste
          le plus utile — un rendez-vous ou une question pour Élise — avant
          même d'ouvrir un onglet. */}
      <Reveal className="px-6 md:px-10 py-8 md:py-10 border-b border-ink/10 dark:border-white/10">
        <p className="ed-kicker text-xs font-sans uppercase tracking-[0.3em] text-rust mb-2">
          {bienvenue ? "Bienvenue" : "Votre espace"}
        </p>
        <h2 className="ed-display font-serif text-3xl md:text-4xl max-w-2xl">
          {bienvenue ? "Merci de prendre soin de toi." : `Bonjour, ${firstName(profile.displayName, profile.email)}.`}
        </h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-3xl">
          <ProchainRendezVous
            uid={user.uid}
            onVoir={() => { setReservationsSubTab("mine"); setTab("reservations"); }}
            onReserver={() => { setReservationsSubTab("book"); setTab("reservations"); }}
          />
          <EcrireAElise onEcrire={() => setTab("messagerie")} />
        </div>
      </Reveal>

      {/* Onglets pleine largeur */}
      <nav className="border-b border-ink/10 dark:border-white/10 px-6 md:px-10 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 pb-3 pt-4 font-sans text-xs uppercase tracking-[0.2em] font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  active ? "border-rust text-rust" : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Panneau pleine largeur */}
      <main className="px-6 md:px-10 py-10 max-w-4xl">
        {tab === "dossier"      && <DossierTab uid={user.uid} profile={profile} />}
        {tab === "reservations" && (
          <ClientReservationsTab
            uid={user.uid}
            email={user.email ?? ""}
            displayName={profile.displayName || user.email || ""}
            onOpenMessagerie={() => setTab("messagerie")}
            initialSubTab={reservationsSubTab}
          />
        )}
        {tab === "cours"      && <ClientClassesTab uid={user.uid} displayName={profile.displayName || user.email || ""} />}
        {tab === "messagerie" && <MessagerieTab uid={user.uid} />}
        {tab === "ressources" && <RessourcesTab uid={user.uid} />}
        {tab === "réunion"    && <ClientMeetingTab clientUid={user.uid} />}
        {tab === "profil"     && <ClientProfile profile={profile} onUpdateName={updateDisplayName} onSetNewsletterOptIn={setNewsletterOptIn} />}
      </main>

      <Assistant uid={user.uid} profile={profile} />
      <ProblemeTechnique uid={user.uid} nom={profile.displayName || profile.email} courriel={profile.email} />
    </div>
  );
};
