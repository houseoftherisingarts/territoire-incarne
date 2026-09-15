import { useEffect, useState } from "react";
import { Sparkles, UserPlus, MessageSquare } from "lucide-react";
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../firebase";
import { OrganicBullet } from "../components/decor/OrganicBullet";
import { LazyMount } from "../components/common/LazyMount";
import { InterventionRequestModal } from "../components/widgets/InterventionRequestModal";
import { INTERVENTION_CONFIGS } from "../lib/interventionFields";
import { requireAuth } from "../lib/requireAuth";
import { startCheckout } from "../hooks/useCheckout";
import type { Content } from "../i18n";
import type { DanceClass } from "../components/admin/ClassesAdminSection";
import { prochaineSeance, formatSeance } from "../lib/groupSchedule";

const COURRIEL_INTERAC = "territoireincarne@gmail.com";

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

  const [erreur, setErreur] = useState<string | null>(null);
  const [interacAnnonce, setInteracAnnonce] = useState(false);

  // Virement Interac : la place est réservée en attente, Élise la marque payée quand le virement arrive.
  const inscrireInterac = () =>
    requireAuth(user, async () => {
      setBusy(true);
      setErreur(null);
      try {
        await setDoc(doc(db, `classes/${cls.id}/requests/${user!.uid}`), {
          displayName: user!.displayName ?? "",
          email: user!.email ?? "",
          status: "pending",
          paiement: "interac",
          requestedAt: serverTimestamp(),
        }, { merge: true });
        setInteracAnnonce(true);
      } catch (err) {
        console.error("Inscription Interac :", err);
        setErreur("La réservation n'a pas pu être enregistrée. Réessayez.");
      } finally {
        setBusy(false);
      }
    });

  // Inscription directe : un cours gratuit ouvre tout de suite; un cours payant passe par la
  // caisse Stripe, et c'est le webhook qui marque la place payée.
  const inscrire = () =>
    requireAuth(user, async () => {
      setBusy(true);
      setErreur(null);
      try {
        const gratuit = cls.priceCents === 0;
        await setDoc(doc(db, `classes/${cls.id}/requests/${user!.uid}`), {
          displayName: user!.displayName ?? "",
          email: user!.email ?? "",
          status: gratuit ? "paid" : "pending",
          requestedAt: serverTimestamp(),
        }, { merge: true });
        if (!gratuit) {
          await startCheckout({
            purpose: "class",
            metadata: { classId: cls.id, displayName: user!.displayName ?? "" },
            successPath: "/client?onglet=cours&paid=1",
            cancelPath: "/mouvement",
          });
        }
      } catch (err) {
        console.error("Inscription au cours :", err);
        const code = (err as { code?: string })?.code ?? "";
        setErreur(
          code.endsWith("resource-exhausted") ? "Ce cours est complet." :
          code.endsWith("unauthenticated") ? "Connectez-vous pour vous inscrire." :
          "Le paiement n'est pas encore ouvert. Écrivez à Elise pour réserver votre place.",
        );
      } finally {
        setBusy(false);
      }
    });

  const payant = cls.priceCents > 0;
  const label = (() => {
    if (busy) return "…";
    if (status === "paid") return "✓ Inscrit·e";
    if (payant) return "Payer par carte";
    return "S'inscrire";
  })();

  const disabled = busy || status === "paid";

  return (
    <li className="flex flex-col md:flex-row md:items-center gap-4 py-4 border-b border-stone-200 dark:border-stone-700/50">
      <div className="flex-1">
        <p className="text-xl font-light text-ink dark:text-stone-100">{cls.title}</p>
        {cls.description && (
          <p className="text-sm font-serif opacity-70 mt-1">{cls.description}</p>
        )}
        <p className="text-xs opacity-60 mt-1">
          {money(cls.priceCents)}
          {cls.capacity ? ` · ${cls.capacity} places` : ""}
          {" · "}
          {(cls.format ?? "video") === "audio" ? "en audio" : "en vidéo"}
          {prochaineSeance(cls.seances ?? []) && (
            <span className="capitalize"> · {formatSeance(prochaineSeance(cls.seances ?? [])!.debut)}</span>
          )}
        </p>
      </div>
      {erreur && <p className="font-sans text-xs text-rust w-full md:w-auto">{erreur}</p>}
      <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={inscrire}
            disabled={disabled}
            className="min-h-[44px] px-5 text-xs uppercase tracking-widest border border-stone-300 hover:bg-ink hover:text-white dark:border-stone-600 dark:hover:bg-white dark:hover:text-forest rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {label}
          </button>
          {payant && status !== "paid" && (
            <button
              onClick={inscrireInterac}
              disabled={busy}
              className="min-h-[44px] px-5 text-xs uppercase tracking-widest border border-rust/40 text-rust hover:bg-rust hover:text-paper rounded-full transition-colors disabled:opacity-60"
            >
              Virement Interac
            </button>
          )}
        </div>
        {(interacAnnonce || (status === "pending" && payant)) && status !== "paid" && (
          <p className="font-serif text-sm leading-relaxed max-w-xs md:text-right opacity-80">
            Place réservée. Envoyez {money(cls.priceCents)} par virement Interac à{" "}
            <a href={`mailto:${COURRIEL_INTERAC}`} className="text-rust underline">{COURRIEL_INTERAC}</a>, avec votre nom et
            le titre du cours en message. Elise confirme votre place dès réception.
          </p>
        )}
      </div>
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
      {/* Le répertoire des pratiques et l'inscription aux cours restent dans la colonne éditoriale ;
          les deux blocs d'appel ci-dessous, eux, respirent sur toute la largeur de la page. */}
      <div className="max-w-4xl space-y-12">
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

        <div>
          <h3 className="text-2xl font-light mb-2">Cours à venir</h3>
          <p className="font-serif text-sm opacity-70 mb-4">
            Inscrivez-vous en un geste, par carte ou par virement Interac.
          </p>
          {loading && <p className="font-serif opacity-60 py-4">Chargement…</p>}
          {!loading && classes.length === 0 && (
            <p className="font-serif opacity-60 py-4">Aucun cours actif pour l'instant.</p>
          )}
          <ul>
            {classes.map((c) => (
              <ClassRow key={c.id} cls={c} user={user} />
            ))}
          </ul>
        </div>
      </div>

      <div className="border border-ink/15 dark:border-white/15 bg-ink/[0.03] dark:bg-white/5 rounded-none p-8 md:p-10 text-center space-y-4">
        <MessageSquare className="mx-auto text-rust dark:text-stone-300" size={26} aria-hidden="true" />
        <h3 className="text-xl md:text-2xl font-light leading-tight">
          Vous voulez organiser un cours dans votre région ?
        </h3>
        <p className="font-serif text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
          Cours de groupe (10 personnes et plus) ou suivi privé en forfait : écrivez-moi vos détails.
        </p>
        <button
          onClick={() => setShowRequest(true)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink text-paper dark:bg-stone-100 dark:text-forest rounded-full text-xs uppercase tracking-[0.25em] font-bold font-sans hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
        >
          Demander un cours
        </button>
      </div>

      <div className="bg-rust/5 dark:bg-white/5 p-8 border border-rust/20 dark:border-white/10 text-center space-y-6 rounded-none">
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
  <div className="relative z-20 w-full max-w-sm bg-white/60 dark:bg-black/30 backdrop-blur-sm p-8 rounded-none shadow-xl border border-white/20 overflow-y-auto max-h-full text-center space-y-5">
    <UserPlus className="mx-auto text-rust dark:text-stone-300 opacity-70" size={28} aria-hidden="true" />
    <h3 className="font-serif text-2xl text-ink dark:text-stone-100 leading-tight">
      Pour rejoindre un cours, créez votre espace
    </h3>
    <p className="font-serif text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
      Connectez-vous, demandez votre place, et chattez avec votre groupe.
    </p>
    <a
      href="/client"
      className="inline-flex items-center gap-2 px-8 py-3 bg-ink text-paper dark:bg-stone-100 dark:text-forest font-sans text-xs tracking-[0.25em] uppercase hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors rounded-none"
    >
      Créer un compte
    </a>
    <p className="font-sans text-xs uppercase tracking-[0.25em] opacity-50">
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
