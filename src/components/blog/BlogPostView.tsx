import { useEffect, useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { BlockRenderer } from "./BlockRenderer";
import type { BlogPost } from "../../types/blog";
import type { Lang } from "../../types";

interface Props {
  slug: string;
  lang: Lang;
  onBack: () => void;
}

const fmtDate = (ts: BlogPost["publishedAt"]) => {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("fr-CA", { day: "2-digit", month: "long", year: "numeric" });
};

export const BlogPostView = ({ slug, lang, onBack }: Props) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "posts", slug), (snap) => {
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() } as BlogPost);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
    return unsub;
  }, [slug]);

  // Update document title for sharing/SEO
  useEffect(() => {
    if (!post) return;
    const t = post.seo?.metaTitle || (lang === "en" ? post.en?.title : post.fr.title) || "Territoire Incarné";
    document.title = `${t} · Territoire Incarné`;
    return () => {
      document.title = "Territoire Incarné | Elise .G Lortie";
    };
  }, [post, lang]);

  if (loading) {
    return <p className="font-serif italic opacity-60 py-20 text-center">Chargement…</p>;
  }
  if (notFound || !post) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="font-serif italic opacity-60">Article introuvable.</p>
        <button onClick={onBack} className="text-xs font-sans uppercase tracking-widest hover:text-rust">
          ← Retour aux écrits
        </button>
      </div>
    );
  }

  // Pick language with fallback
  const content = lang === "en" && post.en?.title ? { ...post.fr, ...post.en } : post.fr;

  return (
    <article className="animate-[fadeIn_0.7s_ease-out]">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest opacity-60 hover:opacity-100 mb-8">
        <ArrowLeft size={12} /> Retour aux écrits
      </button>

      {post.heroImage && (
        <img
          src={post.heroImage}
          alt={content.title}
          className="w-full aspect-[16/9] object-cover rounded-2xl shadow-xl mb-8"
          loading="eager"
          decoding="async"
        />
      )}

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-ink dark:text-stone-100 mb-4">
        {content.title}
      </h1>

      {post.publishedAt && (
        <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest opacity-50 mb-10">
          <Calendar size={12} /> {fmtDate(post.publishedAt)}
        </div>
      )}

      {content.excerpt && (
        <p className="text-xl md:text-2xl font-serif italic font-light text-stone-600 dark:text-stone-300 leading-relaxed mb-12 border-l-2 border-rust/40 pl-6">
          {content.excerpt}
        </p>
      )}

      <div className="space-y-6">
        <BlockRenderer content={content.content} />
      </div>
    </article>
  );
};
