import { useEffect, useState } from "react";
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
import type { AdminEvent } from "../components/admin/EventsAdminSection";

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-CA", { day: "2-digit", month: "long", year: "numeric" });
};

const money = (cents: number) =>
  cents === 0
    ? "Gratuit"
    : (cents / 100).toLocaleString("fr-CA", { style: "currency", currency: "CAD" });

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

  const signUp = (ev: AdminEvent) =>
    requireAuth(user, async () => {
      setSigningUp(ev.id);
      try {
        if (ev.priceCents === 0) {
          // Free event — write registration directly
          await setDoc(doc(db, `events/${ev.id}/registrations/${user!.uid}`), {
            displayName: user!.displayName ?? "",
            email: user!.email ?? "",
            status: "confirmed",
            registeredAt: serverTimestamp(),
          });
          alert("Inscription confirmée !");
        } else {
          // Paid event — Stripe Checkout
          await startCheckout({
            purpose: "event",
            metadata: {
              eventId: ev.id,
              displayName: user!.displayName ?? "",
            },
            lineItems: [
              {
                name: ev.title,
                description: `${fmtDate(ev.date)} · ${ev.location}`,
                amount: ev.priceCents,
                quantity: 1,
                image: ev.image,
              },
            ],
            successPath: "/events?paid=1",
            cancelPath: "/events",
          });
        }
      } catch (err) {
        console.error("Sign-up failed:", err);
        alert("Le paiement n'est pas encore configuré. Réessayez plus tard.");
      } finally {
        setSigningUp(null);
      }
    });

  if (loading) return <p className="font-serif italic opacity-60 py-10 text-center">Chargement…</p>;

  const proposeBlock = (
    <div className="border border-rose-300/40 dark:border-rose-400/20 bg-rose-50/40 dark:bg-rose-900/10 rounded-[30px] p-8 md:p-10 text-center space-y-4">
      <MessageSquare className="mx-auto text-rose-700/70 dark:text-rose-300" size={26} aria-hidden="true" />
      <h3 className="text-xl md:text-2xl font-light leading-tight">
        Vous portez l'idée d'un événement ?
      </h3>
      <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
        Atelier, retraite, cérémonie, festival : proposez-moi votre vision et nous regarderons ensemble si c'est possible.
      </p>
      <button
        onClick={() => setShowRequest(true)}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink text-paper dark:bg-stone-100 dark:text-forest rounded-full text-xs uppercase tracking-[0.25em] font-bold font-sans hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
      >
        Proposer un événement
      </button>
    </div>
  );

  if (events.length === 0) {
    return (
      <div className="space-y-8 animate-[fadeIn_1s_ease-out]">
        {showRequest && (
          <InterventionRequestModal config={INTERVENTION_CONFIGS.events} onClose={() => setShowRequest(false)} />
        )}
        <p className="font-serif italic opacity-60 py-8 text-center">
          Aucun événement à venir pour l'instant.
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
          className="flex flex-col md:flex-row gap-5 p-6 border border-stone-300 dark:border-stone-700 rounded-[30px] bg-white/40 dark:bg-white/5 group"
        >
          {ev.image && (
            <div className="w-full md:w-48 h-40 rounded-2xl overflow-hidden shrink-0 bg-stone-200">
              <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start gap-4 mb-2">
              <div>
                <span className="block text-xs font-sans tracking-widest uppercase text-rust dark:text-stone-400">{fmtDate(ev.date)}</span>
                <h3 className="text-2xl font-serif text-ink dark:text-stone-100 mb-1">{ev.title}</h3>
                <div className="flex items-center gap-2 text-sm opacity-70">
                  <MapPin size={12} /> {ev.location}
                </div>
              </div>
            </div>
            {ev.description && (
              <p className="text-sm font-serif italic text-stone-600 dark:text-stone-300 mb-4 leading-relaxed">
                {ev.description}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
              <span className="text-base font-sans text-rust dark:text-stone-300">{money(ev.priceCents)}</span>
              <button
                onClick={() => signUp(ev)}
                disabled={signingUp === ev.id}
                className="px-6 py-2 bg-ink text-paper dark:bg-stone-100 dark:text-forest rounded-full text-xs uppercase tracking-widest hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors disabled:opacity-50"
              >
                {signingUp === ev.id ? "…" : "S'inscrire"}
              </button>
            </div>
          </div>
        </article>
      ))}

      {past.length > 0 && (
        <div className="pt-12 border-t border-stone-300 dark:border-stone-700">
          <h3 className="text-2xl font-light mb-8 flex items-center gap-3 opacity-80">
            <History size={20} className="text-rust dark:text-stone-400" />
            Événements passés
          </h3>
          <div className="space-y-4 opacity-60">
            {past.slice(0, 6).map((ev) => (
              <div key={ev.id} className="flex items-center gap-4 py-2">
                <span className="text-xs font-sans tracking-widest uppercase w-32 text-right text-stone-500 dark:text-stone-400">
                  {fmtDate(ev.date)}
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
