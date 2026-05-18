import { useEffect, useRef, useState } from "react";
import { Home, CalendarDays, MessageSquare, FolderOpen, LogOut, Menu, X, Send, ExternalLink, Video, Music } from "lucide-react";
import { ClientLogin } from "./ClientLogin";
import { ClientProfile } from "./ClientProfile";
import { ClientMeetingTab } from "./ClientMeetingTab";
import { ClientClassesTab } from "./ClientClassesTab";
import { ClientReservationsTab } from "./ClientReservationsTab";
import { useClientAuth } from "../../hooks/useClientAuth";
import { useChat } from "../../hooks/useChat";
import { useClientDocs } from "../../hooks/useClientDocs";
import { consumeReturnTo } from "../../lib/requireAuth";
import { isAdmin } from "../../lib/admins";

type TabId = "profil" | "reservations" | "cours" | "messagerie" | "documents" | "réunion";

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "profil",       label: "Mon espace",   Icon: Home },
  { id: "reservations", label: "Réservations", Icon: CalendarDays },
  { id: "cours",        label: "Mes cours",    Icon: Music },
  { id: "messagerie",   label: "Messagerie",   Icon: MessageSquare },
  { id: "documents",    label: "Documents",    Icon: FolderOpen },
  { id: "réunion",      label: "Réunion",      Icon: Video },
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
          <p className="font-serif italic text-stone-400 text-center py-10">
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

const DocumentsTab = ({ uid }: { uid: string }) => {
  const { docs, loading } = useClientDocs(uid);

  if (loading) return <p className="font-sans text-sm opacity-50 py-10 text-center">Chargement…</p>;

  return (
    <div className="space-y-4 animate-[fadeIn_0.6s_ease-out]">
      {docs.length === 0 ? (
        <p className="font-serif italic text-stone-400 text-center py-10">
          Aucun document partagé pour l'instant.
        </p>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <div
              key={d.id}
              className="flex items-start gap-3 p-4 border border-stone-200 dark:border-stone-700 rounded-2xl bg-white/40 dark:bg-white/5"
            >
              <FolderOpen size={16} className="shrink-0 mt-0.5 text-rust opacity-70" />
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base">{d.name}</p>
                {d.description && (
                  <p className="font-serif italic text-sm opacity-70 mt-0.5">{d.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-rust text-[11px] font-sans uppercase tracking-widest hover:underline"
                    >
                      <ExternalLink size={11} /> Ouvrir
                    </a>
                  )}
                  <span className="text-[10px] opacity-40 font-sans">{fmtDate(d.addedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ClientPortal = () => {
  const { user, profile, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, updateDisplayName, setNewsletterOptIn, logout } = useClientAuth();
  const [tab, setTab] = useState<TabId>("profil");
  const [mobileOpen, setMobileOpen] = useState(false);

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
        error={error}
      />
    );
  }

  const adminMode = isAdmin(user.uid);

  return (
    <div className="min-h-screen w-full flex bg-paper dark:bg-forest text-ink dark:text-stone-100 transition-colors duration-1000">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-ink dark:bg-charcoal text-stone-100 flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-0`}
      >
        <div className="px-6 pt-8 pb-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-600 shrink-0 flex items-center justify-center">
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <span className="font-serif text-lg">{(profile.displayName || profile.email)[0].toUpperCase()}</span>
            }
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-sans uppercase tracking-[0.25em] text-rust">Territoire Incarné</p>
            <p className="text-sm font-serif italic text-stone-100/80 truncate mt-0.5">
              {profile.displayName || profile.email}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => { setTab(id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors border-l-2 ${
                  active
                    ? "bg-white/5 border-rust text-rust"
                    : "border-transparent text-stone-100/70 hover:text-stone-100 hover:bg-white/5"
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="font-sans uppercase tracking-[0.2em] text-[11px] font-semibold">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10 space-y-3">
          {adminMode && (
            <a
              href="/admin"
              className="flex items-center gap-2 font-sans uppercase tracking-[0.2em] text-[10px] text-stone-100/60 hover:text-rust transition-colors"
            >
              → Tableau de bord admin
            </a>
          )}
          <a
            href="/"
            className="flex items-center gap-2 font-sans uppercase tracking-[0.2em] text-[10px] text-stone-100/60 hover:text-rust transition-colors"
          >
            ← Retour au site
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-2 font-sans uppercase tracking-[0.2em] text-[10px] text-stone-100/60 hover:text-rust transition-colors"
          >
            <LogOut size={11} /> Déconnexion
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-ink/10 dark:border-white/10 px-6 md:px-10 py-5 flex items-center gap-4 sticky top-0 z-20 bg-paper/90 dark:bg-forest/90 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <p className="text-[10px] font-sans uppercase tracking-[0.3em] opacity-50">Espace client</p>
            <h1 className="text-2xl font-light">{TABS.find((t) => t.id === tab)?.label}</h1>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-3xl mx-auto w-full">
          {tab === "profil"       && <ClientProfile profile={profile} onUpdateName={updateDisplayName} onSetNewsletterOptIn={setNewsletterOptIn} />}
          {tab === "reservations" && (
            <ClientReservationsTab
              uid={user.uid}
              email={user.email ?? ""}
              displayName={profile.displayName || user.email || ""}
              onOpenMessagerie={() => setTab("messagerie")}
            />
          )}
          {tab === "cours"        && <ClientClassesTab uid={user.uid} displayName={profile.displayName || user.email || ""} />}
          {tab === "messagerie"   && <MessagerieTab uid={user.uid} />}
          {tab === "documents"    && <DocumentsTab uid={user.uid} />}
          {tab === "réunion"      && <ClientMeetingTab clientUid={user.uid} />}
        </div>
      </main>
    </div>
  );
};
