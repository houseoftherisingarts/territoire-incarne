import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Download, Globe, Lock, PhoneCall } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../firebase";
import { requireAuth } from "../lib/requireAuth";
import type { Content } from "../i18n";
import type { Resource } from "../components/admin/ResourcesSection";

const iconFor = (name: string) => {
  switch (name) {
    case "Download":
      return Download;
    case "Phone":
      return PhoneCall;
    case "Book":
      return BookOpen;
    default:
      return Globe;
  }
};

const useResources = () => {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "resources"), where("active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Resource)));
      setLoading(false);
    });
    return unsub;
  }, []);
  return { items, loading };
};

export const Ressources = (_props: { content?: Content["sections"]["ressources"] }) => {
  const { items, loading } = useResources();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Group by category
  const grouped = items.reduce<Record<string, Resource[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  if (loading) return <p className="font-serif italic opacity-60 py-10 text-center">Chargement…</p>;

  if (items.length === 0) {
    return (
      <p className="font-serif italic opacity-60 py-12 text-center">
        Les ressources arrivent bientôt.
      </p>
    );
  }

  const handleClick = (r: Resource) => (e: React.MouseEvent) => {
    if (!r.requiresAuth) return;
    e.preventDefault();
    requireAuth(user, () => {
      window.open(r.link, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <div className="space-y-12 animate-[fadeIn_1s_ease-out]">
      {Object.entries(grouped).map(([category, list]) => {
        const Icon = iconFor(list[0]?.icon ?? "Globe");
        return (
          <div key={category} className="border-b border-stone-300 dark:border-stone-700 pb-8 last:border-0">
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-rust/10 dark:bg-white/10 rounded-full text-rust dark:text-white">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="text-2xl font-light">{category}</h3>
            </div>
            <ul className="space-y-4">
              {list.map((r) => {
                const isExternal = !r.requiresAuth && /^https?:/.test(r.link);
                return (
                  <li key={r.id} className="flex items-start gap-3 group">
                    <ArrowRight size={16} className="mt-1 text-rust dark:text-stone-400 opacity-60 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    <a
                      href={r.link}
                      onClick={handleClick(r)}
                      className="text-lg font-light border-b border-transparent hover:border-rust dark:hover:border-white transition-colors flex items-center gap-2"
                      target={isExternal || (r.requiresAuth && user) ? "_blank" : "_self"}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                    >
                      {r.label}
                      {r.requiresAuth && (
                        <Lock size={11} className="opacity-40" aria-label="Connexion requise" />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};
