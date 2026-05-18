import { useEffect, useState } from "react";
import { ArrowUpRight, Calendar } from "lucide-react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { pathForPost } from "../routes";
import type { BlogPost } from "../types/blog";
import type { Lang } from "../types";
import type { Content } from "../i18n";

interface Props {
  content?: Content["sections"]["writings"];
  lang?: Lang;
  onOpenPost?: (slug: string) => void;
}

const fmtDate = (ts: BlogPost["publishedAt"]) => {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("fr-CA", { day: "2-digit", month: "long", year: "numeric" });
};

const usePosts = () => {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("published", "==", true),
      orderBy("publishedAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);
  return { items, loading };
};

export const Writings = ({ lang = "fr", onOpenPost }: Props) => {
  const { items: posts, loading } = usePosts();

  const handleClick = (slug: string) => (e: React.MouseEvent) => {
    if (onOpenPost) {
      e.preventDefault();
      onOpenPost(slug);
    }
  };

  if (loading) return <p className="font-serif italic opacity-60 py-10 text-center">Chargement…</p>;

  if (posts.length === 0) {
    return (
      <p className="font-serif italic opacity-60 py-12 text-center">
        Les premiers écrits arrivent bientôt.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 animate-[fadeIn_1s_ease-out]">
      {posts.map((post) => {
        const c = lang === "en" && post.en?.title ? { ...post.fr, ...post.en } : post.fr;
        return (
          <a
            key={post.id}
            href={pathForPost(post.slug)}
            onClick={handleClick(post.slug)}
            className="group flex flex-col bg-white/40 dark:bg-white/5 border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden hover:border-rust dark:hover:border-stone-400 transition-colors"
          >
            {post.heroImage && (
              <div className="aspect-[16/9] overflow-hidden bg-stone-200">
                <img src={post.heroImage} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" decoding="async" />
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              {post.publishedAt && (
                <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-rust dark:text-stone-400 mb-2">
                  <Calendar size={11} /> {fmtDate(post.publishedAt)}
                </div>
              )}
              <h3 className="font-serif text-xl md:text-2xl leading-tight text-ink dark:text-stone-100 group-hover:text-rust dark:group-hover:text-white transition-colors mb-3">
                {c.title}
              </h3>
              {c.excerpt && (
                <p className="text-sm font-serif italic opacity-70 leading-relaxed flex-1">{c.excerpt}</p>
              )}
              <span className="mt-4 self-start text-[10px] font-sans uppercase tracking-widest text-rust dark:text-stone-300 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Lire l'article <ArrowUpRight size={11} />
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
};
