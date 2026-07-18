import { useState } from "react";
import { User, CheckCircle, Clock, XCircle, Edit2, Check, X, Mail, CalendarHeart } from "lucide-react";
import type { ClientProfile as ClientProfileData } from "../../hooks/useClientAuth";

const STATUS_CONFIG = {
  pending:  { label: "En attente",  Icon: Clock,         color: "text-amber-500 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20"  },
  accepted: { label: "Acceptée",    Icon: CheckCircle,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  refused:  { label: "Refusée",     Icon: XCircle,       color: "text-red-500 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-900/20"          },
};

interface ProfileCardProps {
  profile: ClientProfileData;
  onUpdateName: (name: string) => Promise<void>;
  onSetNewsletterOptIn: (value: boolean) => Promise<void>;
}

export const ClientProfile = ({ profile, onUpdateName, onSetNewsletterOptIn }: ProfileCardProps) => {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(profile.displayName);
  const [saving, setSaving] = useState(false);

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setSaving(true);
    await onUpdateName(nameVal.trim());
    setSaving(false);
    setEditingName(false);
  };

  const { label, Icon, color, bg } = STATUS_CONFIG[profile.status];

  return (
    <div className="space-y-8 animate-[fadeIn_0.6s_ease-out]">
      <div>
        <span className="block text-[10px] font-sans uppercase tracking-[0.3em] text-rust dark:text-stone-400 mb-1">
          Mon espace
        </span>
        <h2 className="text-3xl font-light">Bonjour{profile.displayName ? `, ${profile.displayName.split(" ")[0]}` : ""} 🌿</h2>
      </div>

      {/* Status card */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${bg} border-stone-200 dark:border-stone-700`}>
        <Icon size={20} className={color} />
        <div>
          <p className="font-sans text-[10px] uppercase tracking-widest opacity-60 mb-0.5">Statut du dossier</p>
          <p className={`font-serif text-lg ${color}`}>{label}</p>
        </div>
        {profile.status === "pending" && (
          <p className="ml-auto font-sans text-[10px] opacity-50 max-w-[180px] text-right leading-relaxed">
            Élise examinera votre demande sous peu.
          </p>
        )}
      </div>

      {/* Séances card — visible dès qu'Élise a défini un forfait */}
      {(typeof profile.seancesTotal === "number" || typeof profile.seancesRemaining === "number") && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border bg-rust/5 dark:bg-rust/10 border-stone-200 dark:border-stone-700">
          <CalendarHeart size={20} className="text-rust" />
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest opacity-60 mb-0.5">Séances restantes</p>
            <p className="font-serif text-lg">
              {profile.seancesRemaining ?? 0}
              {typeof profile.seancesTotal === "number" && (
                <span className="opacity-50 text-sm"> sur {profile.seancesTotal}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Profile card */}
      <div className="border border-stone-200 dark:border-stone-700 rounded-2xl p-6 space-y-5 bg-white/40 dark:bg-white/5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-stone-400" />
            )}
          </div>
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest opacity-50 mb-1">Profil</p>
            <p className="font-serif text-xl">{profile.displayName || "—"}</p>
          </div>
        </div>

        {/* Name edit */}
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-50 mb-2">Prénom et nom</p>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                className="flex-1 bg-transparent border-b border-stone-400 dark:border-stone-500 outline-none py-1 font-serif text-lg focus:border-rust transition-colors"
                autoFocus
              />
              <button onClick={saveName} disabled={saving} className="text-emerald-600 hover:text-emerald-700 transition-colors">
                <Check size={16} />
              </button>
              <button onClick={() => setEditingName(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <span className="font-serif text-lg">{profile.displayName || "—"}</span>
              <button
                onClick={() => { setNameVal(profile.displayName); setEditingName(true); }}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
              >
                <Edit2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-50 mb-1">Courriel</p>
          <p className="font-serif text-lg">{profile.email}</p>
        </div>

        {/* Newsletter */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.newsletterOptIn !== false}
              onChange={(e) => onSetNewsletterOptIn(e.target.checked)}
              className="accent-rust"
            />
            <Mail size={14} className="opacity-50 shrink-0" />
            <span className="font-serif text-sm">
              Recevoir l'infolettre
            </span>
          </label>
        </div>
      </div>

      {/* Coming soon tabs hint */}
      {profile.status === "accepted" && (
        <div className="border border-stone-200 dark:border-stone-700 rounded-2xl p-5 bg-white/20 dark:bg-white/5">
          <p className="font-sans text-[10px] uppercase tracking-widest opacity-50 mb-2">Prochainement disponible</p>
          <p className="font-serif text-stone-600 dark:text-stone-300 italic text-sm leading-relaxed">
            Messagerie, réservations et partage de documents seront bientôt accessibles depuis votre espace.
          </p>
        </div>
      )}
    </div>
  );
};
