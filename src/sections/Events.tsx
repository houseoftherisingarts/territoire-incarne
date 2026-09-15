import { useEffect, useState } from "react";
import { EditableText } from "../components/edit/EditableText";
import { History, MapPin, MessageSquare } from "lucide-react";
import { InterventionRequestModal } from "../components/widgets/InterventionRequestModal";
import { INTERVENTION_CONFIGS } from "../lib/interventionFields";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../firebase";
import { requireAuth } from "../lib/requireAuth";
import { startCheckout } from "../hooks/useCheckout";
import type { Content } from "../i18n";
import { locale, tx, useLangue } from "../i18n/tx";
import type { Lang } from "../types";
import type { AdminEvent } from "../components/admin/EventsAdminSection";

const fmtDate = (lang: Lang, iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale(lang), { day: "2-digit", month: "long", year: "numeric" });
};

const money = (lang: Lang, cents: number) =>
  cents === 0
    ? tx(lang, "Gratuit")
    : (cents / 100).toLocaleString(locale(lang), { style: "currency", currency: "CAD" });

const useEvents = () => {
  const [items, setItems] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "events"), where("published", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminEvent)));
      setLoading(false);
    });
    return unsub;
  }, []);
  return { items, loading };
};

export const Events = (_props: { content?: Content["sections"]["events"] }) => {
  const lang = useLangue();
  const { items: events, loading } = useEvents();
  const [user, setUser] = useState<User | null>(null);
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [showRequest, setShowRequest] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((e) => new Date(e.date) < now)
    .sort((a, b) => b.date.localeCompare(a.date));

  const [interacPour, setInteracPour] = useState<string | null>(null);

  // Virement Interac : la place est réservée en attente, Élise la marque payée quand le virement arrive.
  const signUpInterac = (ev: AdminEvent) =>
    requireAuth(user, async () => {
      setSigningUp(ev.id);
      try {
        await setDoc(doc(db, `events/${ev.id}/registrations/${user!.uid}`), {
          displayName: user!.displayName ?? "",
          email: user!.email ?? "",
          status: "pending",
          paiement: "interac",
          registeredAt: serverTimestamp(),
        }, { merge: true });
        setInteracPour(ev.id);
      } catch (err) {
        console.error("Inscription Interac :", err);
        alert(tx(lang, "La réservation n'a pas pu être enregistrée. Réessayez."));
      } finally {
        setSigningUp(null);
      }
    });

  const signUp = (ev: AdminEvent) =>
    requireAuth(user, async () => {
      setSigningUp(ev.id);
      try {
        if (ev.priceCents === 0) {
          // Free event : write registration directly
          await setDoc(doc(db, `events/${ev.id}/registrations/${user!.uid}`), {
            displayName: user!.displayName ?? "",
            email: user!.email ?? "",
            status: "confirmed",
            registeredAt: serverTimestamp(),
          });
          alert(tx(lang, "Inscription confirmée !"));
        } else {
          // Paid event : Stripe Checkout
          await startCheckout({
            purpose: "event",
            metadata: {
              eventId: ev.id,
              displayName: user!.displayName ?? "",
            },
            lineItems: [
              {
                name: ev.title,
                description: `${fmtDate(lang, ev.date)} · ${ev.location}`,
                amount: ev.priceCents,
                quantity: 1,
                image: ev.image,
              },
            ],
            successPath: "/evenements?paid=1",
            cancelPath: "/evenements",
          });
        }
      } catch (err) {
        console.error("Sign-up failed:", err);
        alert(tx(lang, "Le paiement n'est pas encore configuré. Réessayez plus tard."));
      } finally {
        setSigningUp(null);
      }
    });

  if (loading) return <p className="font-serif opacity-60 py-10 text-center"><EditableText as="span" contentKey="events.chargement" defaultValue={"Chargement…"} /></p>;

  const proposeBlock = (
    <div className="border border-ink/15 dark:border-white/15 bg-ink/[0.03] dark:bg-white/5 rounded-none p-8 md:p-10 text-center space-y-4">
      <MessageSquare className="mx-auto text-rust dark:text-stone-300" size={26} aria-hidden="true" />
      <h3 className="text-xl md:text-2xl font-light leading-tight">
        <EditableText as="span" contentKey="events.vous-portez-l-idee-d" defaultValue={"Vous portez l'idée d'un événement ?"} />
      </h3>
      <p className="font-serif text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
        <EditableText as="span" contentKey="events.atelier-retraite-ceremonie-festival-proposez" defaultValue={"Atelier, retraite, cérémonie, festival : proposez-moi votre vision et nous regarderons ensemble si c'est possible."} />
      </p>
      <button
        onClick={() => setShowRequest(true)}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink text-paper dark:bg-stone-100 dark:text-forest rounded-full text-xs uppercase tracking-[0.25em] font-bold font-sans hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
      >
        <EditableText as="span" contentKey="events.proposer-un-evenement" defaultValue={"Proposer un événement"} />
      </button>
    </div>
  );

  if (events.length === 0) {
    return (
      <div className="space-y-8 animate-[fadeIn_1s_ease-out]">
        {showRequest && (
          <InterventionRequestModal config={INTERVENTION_CONFIGS.events} onClose={() => setShowRequest(false)} />
        )}
        <p className="font-serif opacity-60 py-8 text-center">
          <EditableText as="span" contentKey="events.aucun-evenement-a-venir-pour" defaultValue={"Aucun événement à venir pour l'instant."} />
        </p>
        {proposeBlock}
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-[fadeIn_1s_ease-out]">
      {showRequest && (
        <InterventionRequestModal config={INTERVENTION_CONFIGS.events} onClose={() => setShowRequest(false)} />
      )}
      {upcoming.map((ev) => (
        <article
          key={ev.id}
          className="flex flex-col md:flex-row gap-5 p-6 border border-stone-300 dark:border-stone-700 rounded-none bg-white/40 dark:bg-white/5 group"
        >
          {ev.image && (
            <div className="w-full md:w-48 h-40 overflow-hidden shrink-0 bg-stone-200">
              <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start gap-4 mb-2">
              <div>
                <span className="block text-xs font-sans tracking-widest uppercase text-rust dark:text-stone-400">{fmtDate(lang, ev.date)}</span>
                <h3 className="text-2xl font-serif text-ink dark:text-stone-100 mb-1">{ev.title}</h3>
                <div className="flex items-center gap-2 text-sm opacity-70">
                  <MapPin size={12} /> {ev.location}
                </div>
              </div>
            </div>
            {ev.description && (
              <p className="text-sm font-serif text-stone-600 dark:text-stone-300 mb-4 leading-relaxed">
                {ev.description}
              </p>
            )}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-base font-sans text-rust dark:text-stone-300">{money(lang, ev.priceCents)}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => signUp(ev)}
                  disabled={signingUp === ev.id}
                  className="min-h-[44px] px-6 bg-ink text-paper dark:bg-stone-100 dark:text-forest rounded-full text-xs uppercase tracking-widest hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors disabled:opacity-50"
                >
                  {signingUp === ev.id ? "…" : ev.priceCents > 0 ? <EditableText contentKey="events.payer-par-carte" defaultValue="Payer par carte" /> : <EditableText contentKey="events.s-inscrire" defaultValue="S'inscrire" />}
                </button>
                {ev.priceCents > 0 && (
                  <button
                    onClick={() => signUpInterac(ev)}
                    disabled={signingUp === ev.id}
                    className="min-h-[44px] px-5 border border-rust/40 text-rust rounded-full text-xs uppercase tracking-widest hover:bg-rust hover:text-paper transition-colors disabled:opacity-50"
                  >
                    <EditableText as="span" contentKey="events.virement-interac" defaultValue={"Virement Interac"} />
                  </button>
                )}
              </div>
            </div>
            {interacPour === ev.id && (
              <p className="font-serif text-sm leading-relaxed opacity-80 pt-2">
                <EditableText as="span" contentKey="events.place-reservee-envoyez" defaultValue={"Place réservée. Envoyez"} /> {money(lang, ev.priceCents)} <EditableText as="span" contentKey="events.par-virement-interac-a" defaultValue={"par virement Interac à"} />{" "}
                <a href="mailto:territoireincarne@gmail.com" className="text-rust underline">territoireincarne@gmail.com</a>
                <EditableText as="span" contentKey="events.avec-votre-nom-et-le" defaultValue={", avec votre nom et le titre de l'événement en message. Elise confirme votre place dès réception."} />
              </p>
            )}
          </div>
        </article>
      ))}

      {past.length > 0 && (
        <div className="pt-12 border-t border-stone-300 dark:border-stone-700">
          <h3 className="text-2xl font-light mb-8 flex items-center gap-3 opacity-80">
            <History size={20} className="text-rust dark:text-stone-400" />
            <EditableText as="span" contentKey="events.evenements-passes" defaultValue={"Événements passés"} />
          </h3>
          <div className="space-y-4 opacity-60">
            {past.slice(0, 6).map((ev) => (
              <div key={ev.id} className="flex items-center gap-4 py-2">
                <span className="text-xs font-sans tracking-widest uppercase w-32 text-right text-stone-500 dark:text-stone-400">
                  {fmtDate(lang, ev.date)}
                </span>
                <div className="w-px h-8 bg-stone-300 dark:bg-stone-600" />
                <div>
                  <h4 className="text-lg font-serif">{ev.title}</h4>
                  <span className="text-xs opacity-70">{ev.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {proposeBlock}
    </div>
  );
};
