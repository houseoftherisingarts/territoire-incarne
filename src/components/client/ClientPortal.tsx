import { useEffect, useRef, useState } from "react";
import { CalendarDays, MessageSquare, LogOut, Send, Video, Music, Moon, Sun, Camera, FolderHeart, Library, UserCircle2 } from "lucide-react";
import { ClientLogin } from "./ClientLogin";
import { ClientProfile } from "./ClientProfile";
import { ClientMeetingTab } from "./ClientMeetingTab";
import { ClientClassesTab } from "./ClientClassesTab";
import { ClientReservationsTab } from "./ClientReservationsTab";
import { DossierTab } from "./DossierTab";
import { RessourcesTab } from "./RessourcesTab";
import { Assistant } from "./Assistant";
import { ProblemeTechnique } from "./ProblemeTechnique";
import { useClientAuth } from "../../hooks/useClientAuth";
import { useTheme } from "../../hooks/useTheme";
import { useChat } from "../../hooks/useChat";
import { uploadProfilPhoto } from "../../lib/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { consumeReturnTo } from "../../lib/requireAuth";
import { isAdmin } from "../../lib/admins";

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
                <p className={`text-[10px] opacity-40 mt-1 font-sans ${isMe ? "text-right" : "text-left"}`}>
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
          className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors disabled:opacity-40"
        >
          <Send size={12} /> Envoyer
        </button>
      </form>
    </div>
  );
};

export const ClientPortal = () => {
  const { user, profile, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, updateDisplayName, setNewsletterOptIn, resetPassword, logout } = useClientAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [tab, setTab] = useState<TabId>("dossier");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const target = consumeReturnTo();
    if (target) window.location.replace(target);
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

  const adminMode = isAdmin(user.uid);

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
        <div className="flex items-center gap-4 font-sans text-[10px] uppercase tracking-[0.2em] opacity-60">
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
          {profile.bannerUrl && <img src={profile.bannerUrl} alt="" className="w-full h-full object-cover" />}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          {uploadingBanner && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-sans">Envoi…</span>}
        </button>

        <div className="px-6 md:px-10">
          <div className="relative -mt-10 md:-mt-12 flex items-end gap-4 pb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-paper dark:border-forest bg-stone-300 dark:bg-stone-600 shrink-0 flex items-center justify-center shadow-lg">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-2xl">{(profile.displayName || profile.email)[0].toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 pb-1">
              <p className="ed-kicker text-[10px] font-sans uppercase tracking-[0.3em] text-rust">Espace personnel</p>
              <h1 className="ed-display font-serif text-2xl md:text-3xl truncate">{profile.displayName || profile.email}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets pleine largeur */}
      <nav className="border-b border-ink/10 dark:border-white/10 px-6 md:px-10 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 pb-3 pt-4 font-sans text-[11px] uppercase tracking-[0.2em] font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${
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
