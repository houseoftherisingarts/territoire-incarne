import { useEffect, useState } from "react";
import { Sparkles, UserPlus, MessageSquare } from "lucide-react";
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../firebase";
import { OrganicBullet } from "../components/decor/OrganicBullet";
import { LazyMount } from "../components/common/LazyMount";
import { InterventionRequestModal } from "../components/widgets/InterventionRequestModal";
import { INTERVENTION_CONFIGS } from "../lib/interventionFields";
import { ELISE_FIELD_IMG } from "../assets/images";
import { requireAuth } from "../lib/requireAuth";
import type { Content } from "../i18n";
import type { DanceClass } from "../components/admin/ClassesAdminSection";

const money = (cents: number) =>
  cents === 0 ? "Gratuit" : (cents / 100).toLocaleString("fr-CA", { style: "currency", currency: "CAD" });

const useClasses = () => {
  const [items, setItems] = useState<DanceClass[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "classes"), where("active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DanceClass)));
      setLoading(false);
    });
    return unsub;
  }, []);
  return { items, loading };
};

const useUserRequest = (classId: string, uid: string | undefined) => {
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    if (!uid) {
      setStatus(null);
      return;
    }
    const ref = doc(db, `classes/${classId}/requests/${uid}`);
    return onSnapshot(ref, (snap) => {
      setStatus(snap.exists() ? (snap.data().status as string) : null);
    });
  }, [classId, uid]);
  return status;
};

const ClassRow = ({ cls, user }: { cls: DanceClass; user: User | null }) => {
  const status = useUserRequest(cls.id, user?.uid);
  const [busy, setBusy] = useState(false);

  const request = () =>
    requireAuth(user, async () => {
      setBusy(true);
      try {
        await setDoc(doc(db, `classes/${cls.id}/requests/${user!.uid}`), {
          displayName: user!.displayName ?? "",
          email: user!.email ?? "",
          status: "pending",
          requestedAt: serverTimestamp(),
        });
      } finally {
        setBusy(false);
      }
    });

  const label = (() => {
    if (busy) return "…";
    if (!user) return "Demander à rejoindre";
    if (!status) return "Demander à rejoindre";
    if (status === "pending") return "✓ En attente d'approbation";
    if (status === "approved") return "Approuvé · payer dans mon espace";
    if (status === "paid") return "✓ Membre";
    if (status === "rejected") return "Refusé";
    return "Demander à rejoindre";
  })();

  const disabled = busy || (!!status && status !== "rejected");

  return (
    <li className="flex flex-col md:flex-row md:items-center gap-4 py-4 border-b border-stone-200 dark:border-stone-700/50">
      <div className="flex-1">
        <p className="text-xl font-light text-ink dark:text-stone-100">{cls.title}</p>
        {cls.description && (
          <p className="text-sm font-serif italic opacity-70 mt-1">{cls.description}</p>
        )}
        <p className="text-xs opacity-60 mt-1">{money(cls.priceCents)}</p>
      </div>
      <button
        onClick={request}
        disabled={disabled}
        className="px-5 py-2 text-[11px] uppercase tracking-widest border border-stone-300 hover:bg-ink hover:text-white dark:border-stone-600 dark:hover:bg-white dark:hover:text-forest rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
      >
        {label}
      </button>
    </li>
  );
};

export const Mouvement = ({ content }: { content: Content["sections"]["mouvement"] }) => {
  const { items: classes, loading } = useClasses();
  const [user, setUser] = useState<User | null>(null);
  const [showRequest, setShowRequest] = useState(false);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return (
    <div className="space-y-12 animate-[fadeIn_1s_ease-out]">
      {showRequest && (
        <InterventionRequestModal
          config={INTERVENTION_CONFIGS.danse}
          onClose={() => setShowRequest(false)}
        />
      )}
      {content.practices && content.practices.length > 0 && (
        <ul className="grid grid-cols-1 gap-4">
          {content.practices.map((item, i) => (
            <li key={i} className="flex items-center gap-4 py-3 border-b border-stone-200 dark:border-stone-700/50">
              <span className="text-rust dark:text-stone-400 opacity-60">
                <OrganicBullet index={i} />
              </span>
              <span className="text-xl font-light text-ink dark:text-stone-200">{item}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="-mx-8 md:-mx-16 lg:-mx-24 mt-12 mb-12 overflow-hidden shadow-xl border-t border-stone-200 dark:border-stone-700">
        <img
          src={ELISE_FIELD_IMG}
          className="w-full aspect-[16/9] object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-1000"
          alt="Elise dans un champ"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div>
        <h3 className="text-2xl font-light mb-2">Cours à venir</h3>
        <p className="font-serif italic text-sm opacity-70 mb-4">
          Demandez à rejoindre — Elise vous recontacte pour confirmer.
        </p>
        {loading && <p className="font-serif italic opacity-60 py-4">Chargement…</p>}
        {!loading && classes.length === 0 && (
          <p className="font-serif italic opacity-60 py-4">Aucun cours actif pour l'instant.</p>
        )}
        <ul>
          {classes.map((c) => (
            <ClassRow key={c.id} cls={c} user={user} />
          ))}
        </ul>
      </div>

      <div className="border border-orange-300/40 dark:border-orange-400/20 bg-orange-50/40 dark:bg-orange-900/10 rounded-[30px] p-8 md:p-10 text-center space-y-4">
        <MessageSquare className="mx-auto text-orange-700/70 dark:text-orange-300" size={26} aria-hidden="true" />
        <h3 className="text-xl md:text-2xl font-light leading-tight">
          Vous voulez organiser un cours dans votre région ?
        </h3>
        <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
          Cours de groupe (10+ personnes) ou suivi privé en forfait — écrivez-moi vos détails.
        </p>
        <button
          onClick={() => setShowRequest(true)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink text-paper dark:bg-stone-100 dark:text-forest rounded-full text-xs uppercase tracking-[0.25em] font-bold font-sans hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
        >
          Demander un cours
        </button>
      </div>

      <div className="bg-rust/5 dark:bg-white/5 p-8 border border-rust/20 dark:border-white/10 text-center space-y-6 rounded-[30px]">
        <Sparkles className="mx-auto text-rust dark:text-stone-300 mb-2" aria-hidden="true" />
        <p className="text-sm font-sans tracking-widest uppercase opacity-60 text-ink dark:text-stone-300 mb-4">
          {content.extra}
        </p>
        <div className="w-full flex justify-center">
          <LazyMount className="w-full max-w-[300px] h-[152px]" placeholder={<div className="w-full h-full" aria-hidden="true" />}>
            <iframe
              title="Spotify playlist"
              style={{ borderRadius: "12px" }}
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DXdbkmlag2h7b?utm_source=generator&theme=0"
              width="100%"
              height="152"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </LazyMount>
        </div>
      </div>
    </div>
  );
};

export const MouvementSidebarForm = ({ content }: { content: Content["sections"]["mouvement"] }) => (
  <div className="relative z-20 w-full max-w-sm bg-white/60 dark:bg-black/30 backdrop-blur-sm p-8 rounded-[30px] shadow-xl border border-white/20 overflow-y-auto max-h-full text-center space-y-5">
    <UserPlus className="mx-auto text-rust dark:text-stone-300 opacity-70" size={28} aria-hidden="true" />
    <h3 className="font-serif text-2xl text-ink dark:text-stone-100 leading-tight">
      Pour rejoindre un cours, créez votre espace
    </h3>
    <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
      Connectez-vous, demandez votre place, et chattez avec votre groupe.
    </p>
    <a
      href="/client"
      className="inline-flex items-center gap-2 px-8 py-3 bg-ink text-paper dark:bg-stone-100 dark:text-forest font-sans text-xs tracking-[0.25em] uppercase hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors rounded-[30px]"
    >
      Créer un compte
    </a>
    <p className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-50">
      Connexion Google ou courriel
    </p>
    <div className="pt-6 border-t border-stone-300 dark:border-stone-600/30">
      <h4 className="font-serif text-base mb-1">{content.groupTitle}</h4>
      <p className="text-xs opacity-70 mb-4">{content.groupText}</p>
      <a
        href="mailto:fruitdelaterre@gmail.com"
        className="inline-block px-6 py-2 border border-stone-400 dark:border-stone-500 rounded-full text-xs uppercase tracking-widest hover:bg-white/50 transition-colors"
      >
        {content.groupBtn}
      </a>
    </div>
  </div>
);
