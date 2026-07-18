import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  CalendarClock,
  Mail,
  ShoppingBag,
  Sparkles,
  PenLine,
  Users,
  Settings,
  LogOut,
  Menu,
  ExternalLink,
  Tags,
  Music,
  Library,
  UserPlus,
  Inbox,
  Pencil,
  Moon,
  Sun,
} from "lucide-react";
import { ELISE_AVATAR_IMG } from "../../assets/images";
import { useTheme } from "../../hooks/useTheme";

export type AdminSectionId =
  | "dashboard"
  | "clients"
  | "prospects"
  | "interventions"
  | "tarifs"
  | "calendar"
  | "finances"
  | "bookings"
  | "messages"
  | "boutique"
  | "events"
  | "cours"
  | "ressources"
  | "writings"
  | "newsletter"
  | "settings";

interface NavItem {
  id: AdminSectionId;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV: NavItem[] = [
  { id: "dashboard",  label: "Tableau de bord",      Icon: LayoutDashboard },
  { id: "clients",    label: "Clientes",             Icon: Users },
  { id: "prospects",  label: "Prospects",            Icon: UserPlus },
  { id: "interventions", label: "Demandes",          Icon: Inbox },
  { id: "tarifs",     label: "Consultations",        Icon: Tags },
  { id: "calendar",   label: "Calendrier",           Icon: CalendarDays },
  { id: "finances",   label: "Finances",             Icon: Wallet },
  { id: "bookings",   label: "Rendez-vous",          Icon: CalendarClock },
  { id: "messages",   label: "Messages",             Icon: Mail },
  { id: "boutique",   label: "Boutique",             Icon: ShoppingBag },
  { id: "events",     label: "Événements",           Icon: Sparkles },
  { id: "cours",      label: "Cours de danse",       Icon: Music },
  { id: "ressources", label: "Ressources",           Icon: Library },
  { id: "writings",   label: "Écrits",               Icon: PenLine },
  { id: "newsletter", label: "Infolettre",           Icon: Users },
  { id: "settings",   label: "Paramètres",           Icon: Settings },
];

interface Props {
  section: AdminSectionId;
  onSectionChange: (s: AdminSectionId) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminShell = ({ section, onSectionChange, onLogout, children }: Props) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = NAV.find((n) => n.id === section);

  return (
    <div className="min-h-screen w-full flex bg-paper dark:bg-forest text-ink dark:text-stone-100 transition-colors duration-1000">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-ink dark:bg-charcoal text-stone-100 flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-0`}
      >
        <div className="px-6 pt-8 pb-6 border-b border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-rust/40 shrink-0">
            <img src={ELISE_AVATAR_IMG} alt="Elise" className="w-full h-full object-cover grayscale-[20%]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-rust">Territoire Incarné</p>
            <p className="text-sm font-serif italic text-stone-100/80 mt-0.5 truncate">Elise G. Lortie</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.map(({ id, label, Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                onClick={() => {
                  onSectionChange(id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors border-l-2 ${
                  active
                    ? "bg-white/5 border-rust text-rust"
                    : "border-transparent text-stone-100/70 hover:text-stone-100 hover:bg-white/5"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="font-sans uppercase tracking-[0.2em] text-[11px] font-semibold">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10 text-xs text-stone-100/60 space-y-3">
          <a
            href="/?edit=1"
            className="flex items-center gap-2 font-sans uppercase tracking-[0.2em] text-[10px] text-rust hover:text-paper transition-colors"
          >
            <Pencil size={12} /> Modifier le site
          </a>
          <a
            href="/"
            className="flex items-center gap-2 font-sans uppercase tracking-[0.2em] text-[10px] hover:text-rust transition-colors"
          >
            <ExternalLink size={12} /> Voir le site
          </a>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 font-sans uppercase tracking-[0.2em] text-[10px] text-stone-100/60 hover:text-rust transition-colors"
          >
            <LogOut size={12} /> Déconnexion
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
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-sans uppercase tracking-[0.3em] opacity-50">Tableau de bord</p>
            <h1 className="text-2xl md:text-3xl font-light leading-tight">{current?.label}</h1>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
};

export const ADMIN_NAV = NAV;
