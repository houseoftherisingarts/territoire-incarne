import { useRef, useState } from "react";
import { User, CheckCircle, Clock, XCircle, Edit2, Check, X, Mail, CalendarHeart, Camera } from "lucide-react";
// La bannière se change depuis l'en-tête de ClientPortal (visible sur tous les onglets);
// cette page ne gère plus que l'avatar, le nom, la bio et les liens.
import type { ClientProfile as ClientProfileData } from "../../hooks/useClientAuth";
import { uploadProfilPhoto } from "../../lib/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

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
  const [bio, setBio] = useState(profile.bio ?? "");
  const [liens, setLiens] = useState(profile.liensUrl ?? "");
  const [savingBio, setSavingBio] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setSaving(true);
    await onUpdateName(nameVal.trim());
    setSaving(false);
    setEditingName(false);
  };

  const saveBio = async () => {
    setSavingBio(true);
    await updateDoc(doc(db, "users", profile.uid), { bio: bio.trim(), liensUrl: liens.trim() });
    setSavingBio(false);
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading("avatar");
    const url = await uploadProfilPhoto(profile.uid, file, "avatar");
    await updateDoc(doc(db, "users", profile.uid), { avatarUrl: url });
    setUploading(null);
  };

  const { label, Icon, color, bg } = STATUS_CONFIG[profile.status];

  return (
    <div className="space-y-8 animate-[fadeIn_0.6s_ease-out]">
      <div>
        <span className="block text-xs font-sans uppercase tracking-[0.3em] text-rust dark:text-stone-400 mb-1">
          Mon profil
        </span>
        <h2 className="text-3xl font-light">Bonjour{profile.displayName ? `, ${profile.displayName.split(" ")[0]}` : ""}</h2>
      </div>

      {/* Status card */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${bg} border-stone-200 dark:border-stone-700`}>
        <Icon size={20} className={color} />
        <div>
          <p className="font-sans text-xs uppercase tracking-widest opacity-60 mb-0.5">Statut du dossier</p>
          <p className={`font-serif text-lg ${color}`}>{label}</p>
        </div>
        {profile.status === "pending" && (
          <p className="ml-auto font-sans text-xs opacity-50 max-w-[180px] text-right leading-relaxed">
            Élise examinera votre demande sous peu.
          </p>
        )}
      </div>

      {/* Séances card — visible dès qu'Élise a défini un forfait */}
      {(typeof profile.seancesTotal === "number" || typeof profile.seancesRemaining === "number") && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border bg-rust/5 dark:bg-rust/10 border-stone-200 dark:border-stone-700">
          <CalendarHeart size={20} className="text-rust" />
          <div>
            <p className="font-sans text-xs uppercase tracking-widest opacity-60 mb-0.5">Séances restantes</p>
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
          <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
          <button
            onClick={() => avatarInput.current?.click()}
            className="relative w-16 h-16 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 group"
            aria-label="Changer la photo"
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-stone-400" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <Camera size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            {uploading === "avatar" && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white"><Camera size={12} className="animate-pulse text-white" /></span>}
          </button>
          <div>
            <p className="font-sans text-xs uppercase tracking-widest opacity-50 mb-1">Profil</p>
            <p className="font-serif text-xl">{profile.displayName || "—"}</p>
          </div>
        </div>

        {/* Name edit */}
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.25em] opacity-50 mb-2">Prénom et nom</p>
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
          <p className="font-sans text-xs uppercase tracking-[0.25em] opacity-50 mb-1">Courriel</p>
          <p className="font-serif text-lg">{profile.email}</p>
        </div>

        {/* Bio */}
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.25em] opacity-50 mb-2">Quelques mots sur toi</p>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ce que tu veux qu'Élise sache de toi, en dehors des séances."
            className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-rust font-serif resize-none"
          />
        </div>

        {/* Liens */}
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.25em] opacity-50 mb-2">Un lien (optionnel)</p>
          <input
            type="url"
            value={liens}
            onChange={(e) => setLiens(e.target.value)}
            placeholder="https://…"
            className="w-full bg-transparent border-b border-stone-400/50 dark:border-stone-500/50 focus:border-rust dark:focus:border-stone-100 outline-none py-2 font-serif text-sm transition-colors"
          />
        </div>

        <button
          onClick={saveBio}
          disabled={savingBio}
          className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-xs font-bold font-sans hover:bg-ink transition-colors disabled:opacity-50"
        >
          {savingBio ? "Enregistrement…" : "Enregistrer"}
        </button>

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
    </div>
  );
};
