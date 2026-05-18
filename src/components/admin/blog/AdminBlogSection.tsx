import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Pencil, Plus, Trash2, Eye, EyeOff, Save, Upload, Languages, Search, FileText,
} from "lucide-react";
import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, type Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { uploadMediaFile } from "../../../lib/storage";
import { BlockEditor } from "./BlockEditor";
import { NewsletterPublishModal } from "./NewsletterPublishModal";
import type { BlogPost, BlogPostLanguageContent } from "../../../types/blog";
import { emptyPost, slugify } from "../../../types/blog";
import { Card } from "../sections";

type Lang = "fr" | "en";
type EditorTab = "content" | "seo";

const fmtDate = (ts: Timestamp | null | undefined) => {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
};

const useBlogPosts = () => {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost)));
      setLoading(false);
    });
  }, []);
  return { items, loading };
};

export const AdminBlogSection = () => {
  const { items, loading } = useBlogPosts();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);

  const startEdit = (p: BlogPost) => {
    setCreating(false);
    setEditing(p);
  };
  const startCreate = () => {
    setEditing(null);
    setCreating(true);
  };
  const back = () => {
    setEditing(null);
    setCreating(false);
  };

  if (creating || editing) {
    return <PostEditor existing={editing} onClose={back} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm font-serif italic opacity-70">Vos écrits, brouillons et publications.</p>
        <button onClick={startCreate} className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors">
          <Plus size={14} /> Nouvel écrit
        </button>
      </div>

      {loading && <Card className="p-10 text-center italic opacity-60 font-serif">Chargement…</Card>}
      {!loading && items.length === 0 && (
        <Card className="p-10 text-center italic opacity-60 font-serif">Aucun écrit pour l'instant.</Card>
      )}

      <div className="space-y-3">
        {items.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-center gap-4">
              {p.heroImage && (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                  <img src={p.heroImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <p className="font-serif text-lg">{p.fr?.title || "(Sans titre)"}</p>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${p.published ? "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100" : "bg-ink/5 dark:bg-white/10 opacity-60"}`}>
                    {p.published ? "Publié" : "Brouillon"}
                  </span>
                  {p.en?.title && (
                    <span className="text-[10px] uppercase tracking-widest opacity-50">EN</span>
                  )}
                </div>
                <p className="text-xs opacity-60">
                  /ecrits/{p.slug} · {fmtDate(p.createdAt)}
                </p>
                {p.fr?.excerpt && (
                  <p className="text-sm font-serif italic opacity-70 line-clamp-2 mt-1">{p.fr.excerpt}</p>
                )}
              </div>
              <button onClick={() => startEdit(p)} className="p-2 rounded-full hover:bg-rust/15 hover:text-rust transition-colors" aria-label="Modifier">
                <Pencil size={14} />
              </button>
              <button
                onClick={async () => {
                  if (confirm(`Supprimer "${p.fr?.title}" ?`)) {
                    await deleteDoc(doc(db, "posts", p.id));
                  }
                }}
                className="p-2 rounded-full opacity-40 hover:opacity-100 hover:bg-rust/15 hover:text-rust"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface EditorProps {
  existing: BlogPost | null;
  onClose: () => void;
}

const PostEditor = ({ existing, onClose }: EditorProps) => {
  const [post, setPost] = useState<Omit<BlogPost, "id" | "createdAt" | "publishedAt" | "updatedAt">>(
    () => existing
      ? { slug: existing.slug, fr: existing.fr, en: existing.en, heroImage: existing.heroImage, seo: existing.seo ?? {}, published: existing.published }
      : emptyPost(),
  );
  const [tab, setTab] = useState<EditorTab>("content");
  const [editLang, setEditLang] = useState<Lang>("fr");
  const [enabledEn, setEnabledEn] = useState(!!existing?.en?.title);
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploading, setUploading] = useState(false);

  const slug = useMemo(() => existing?.slug ?? slugify(post.fr.title), [existing?.slug, post.fr.title]);

  const dirtyRef = useRef(false);
  const lastSavedRef = useRef<string>(JSON.stringify(post));

  // Mark dirty on any change (after first paint)
  const initial = useRef(true);
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    const current = JSON.stringify(post);
    if (current !== lastSavedRef.current) {
      dirtyRef.current = true;
    }
  }, [post]);

  // Autosave: debounce 1500ms
  useEffect(() => {
    if (initial.current) return;
    const id = setTimeout(async () => {
      if (!dirtyRef.current) return;
      if (!post.fr.title.trim()) return; // require title
      await save(false);
    }, 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

  const save = async (asPublishToggle: boolean): Promise<void> => {
    if (!post.fr.title.trim()) {
      alert("Un titre français est requis.");
      return;
    }
    setSavingState("saving");
    try {
      const id = existing?.id ?? (slug || slugify(post.fr.title));
      if (!id) throw new Error("Adresse d'article invalide");
      const ref = doc(db, "posts", id);
      const data: Partial<BlogPost> = {
        slug: id,
        fr: post.fr,
        en: enabledEn ? post.en : undefined,
        heroImage: post.heroImage,
        seo: post.seo,
        published: post.published,
        updatedAt: serverTimestamp() as never,
      };
      if (post.published && !existing?.publishedAt) {
        data.publishedAt = serverTimestamp() as never;
      }
      if (!existing) {
        data.createdAt = serverTimestamp() as never;
      }
      await setDoc(ref, data, { merge: true });
      lastSavedRef.current = JSON.stringify(post);
      dirtyRef.current = false;
      setSavingState("saved");
      void asPublishToggle;
      setTimeout(() => setSavingState("idle"), 2000);
    } catch (err) {
      console.error("Save failed:", err);
      setSavingState("error");
    }
  };

  const togglePublish = async () => {
    const wasPublished = post.published;
    if (!wasPublished) {
      // Publishing: open newsletter modal
      setShowNewsletter(true);
      return;
    }
    setPost({ ...post, published: false });
    await save(true);
  };

  const onPublishConfirmed = async (sendNewsletter: boolean) => {
    setPost({ ...post, published: true });
    setShowNewsletter(false);
    if (sendNewsletter) {
      try {
        await setDoc(doc(db, `notifications/newsletter_pending_${Date.now()}`), {
          type: "blog_publish",
          slug,
          title: post.fr.title,
          excerpt: post.fr.excerpt,
          heroImage: post.heroImage,
          createdAt: serverTimestamp(),
          status: "pending",
        });
      } catch (err) {
        console.error("Newsletter draft failed:", err);
      }
    }
    await save(true);
  };

  const onHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) {
      if (file) alert("Image trop volumineuse (max 10 MB)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMediaFile(file, "posts");
      setPost((p) => ({ ...p, heroImage: url }));
    } finally {
      setUploading(false);
    }
  };

  const setLangContent = (lang: Lang, patch: Partial<BlogPostLanguageContent>) => {
    setPost((p) => ({
      ...p,
      [lang]: { ...(p[lang] ?? { title: "", excerpt: "", content: "[]" }), ...patch },
    }));
  };

  const langContent: BlogPostLanguageContent = (post[editLang] as BlogPostLanguageContent) ?? { title: "", excerpt: "", content: "[]" };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {showNewsletter && (
        <NewsletterPublishModal
          post={{ fr: post.fr, heroImage: post.heroImage }}
          onCancel={() => setShowNewsletter(false)}
          onSkip={() => onPublishConfirmed(false)}
          onSend={() => onPublishConfirmed(true)}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onClose} className="flex items-center gap-2 text-sm font-sans uppercase tracking-widest opacity-60 hover:opacity-100">
          <ArrowLeft size={14} /> Retour
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-sans uppercase tracking-widest opacity-60">
            {savingState === "saving" ? "Enregistrement…" : savingState === "saved" ? "✓ Enregistré" : savingState === "error" ? "Erreur" : ""}
          </span>
          <button onClick={togglePublish} className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans transition-colors ${post.published ? "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100 hover:bg-forest/25" : "bg-ink/5 dark:bg-white/10 hover:bg-rust hover:text-paper"}`}>
            {post.published ? <Eye size={12} /> : <EyeOff size={12} />}
            {post.published ? "Publié" : "Brouillon"}
          </button>
          <button onClick={() => save(false)} className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors">
            <Save size={12} /> Enregistrer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ink/10 dark:border-white/10">
        <button onClick={() => setTab("content")} className={`px-5 py-2 text-xs font-sans uppercase tracking-widest transition-colors ${tab === "content" ? "text-rust border-b-2 border-rust -mb-px" : "opacity-60 hover:opacity-100"}`}>
          <FileText size={12} className="inline mr-2" /> Contenu
        </button>
        <button onClick={() => setTab("seo")} className={`px-5 py-2 text-xs font-sans uppercase tracking-widest transition-colors ${tab === "seo" ? "text-rust border-b-2 border-rust -mb-px" : "opacity-60 hover:opacity-100"}`}>
          <Search size={12} className="inline mr-2" /> Visibilité Google
        </button>
      </div>

      {tab === "content" && (
        <Card className="p-6 space-y-6">
          {/* Hero */}
          <div>
            <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 block mb-2">Image principale (16:9 recommandé)</label>
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-800 mb-3">
              {post.heroImage && <img src={post.heroImage} alt="" className="w-full h-full object-cover" />}
            </div>
            <label className="inline-flex items-center gap-2 bg-ink/5 dark:bg-white/10 px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans cursor-pointer hover:bg-rust hover:text-paper transition-colors">
              <Upload size={12} /> {uploading ? "Téléversement…" : post.heroImage ? "Remplacer" : "Téléverser"}
              <input type="file" accept="image/*" onChange={onHeroUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-ink/5 dark:border-white/5">
            <Languages size={14} className="opacity-60" />
            <button onClick={() => setEditLang("fr")} className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${editLang === "fr" ? "bg-ink text-paper dark:bg-stone-100 dark:text-forest" : "bg-ink/5 dark:bg-white/10"}`}>
              FR (requis)
            </button>
            <button onClick={() => { setEnabledEn(!enabledEn); setEditLang(enabledEn ? "fr" : "en"); }} className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${enabledEn ? "bg-ink text-paper dark:bg-stone-100 dark:text-forest" : "bg-ink/5 dark:bg-white/10 opacity-60"}`}>
              EN {enabledEn ? "✓" : "+"}
            </button>
            {enabledEn && (
              <button onClick={() => setEditLang("en")} className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${editLang === "en" ? "bg-ink text-paper dark:bg-stone-100 dark:text-forest" : "bg-ink/5 dark:bg-white/10"}`}>
                Éditer EN
              </button>
            )}
          </div>

          {/* Title + excerpt */}
          <input
            type="text"
            placeholder={editLang === "fr" ? "Titre de l'article…" : "English title…"}
            value={langContent.title}
            onChange={(e) => setLangContent(editLang, { title: e.target.value })}
            className="w-full bg-transparent text-3xl md:text-4xl font-serif font-light outline-none placeholder:opacity-30"
          />
          {existing && (
            <p className="text-xs opacity-50 font-mono">/ecrits/{slug}</p>
          )}
          <textarea
            placeholder={editLang === "fr" ? "Extrait (résumé court pour les cartes)…" : "Excerpt (short summary)…"}
            value={langContent.excerpt}
            onChange={(e) => setLangContent(editLang, { excerpt: e.target.value })}
            rows={2}
            className="w-full bg-transparent border-b border-stone-200 dark:border-white/10 pb-2 text-base font-serif italic opacity-80 outline-none resize-none"
          />

          {/* Block editor */}
          <BlockEditor
            value={langContent.content}
            onChange={(json) => setLangContent(editLang, { content: json })}
          />
        </Card>
      )}

      {tab === "seo" && (
        <Card className="p-6 space-y-6">
          <p className="text-sm font-serif italic opacity-70 leading-relaxed -mt-2">
            Ces réglages aident Google et les réseaux sociaux à bien présenter votre article.
            Tout est optionnel — si vide, on utilise le titre et l'extrait de l'article.
          </p>

          <div>
            <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 block mb-2">Adresse de l'article</label>
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="opacity-50">territoireincarne.ca/ecrits/</span>
              <input
                type="text"
                value={post.slug || slug}
                onChange={(e) => setPost({ ...post, slug: slugify(e.target.value) })}
                className="flex-1 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-1.5 outline-none focus:border-rust"
                placeholder={slug || "mon-article"}
              />
            </div>
            <p className="text-xs opacity-50 mt-1 italic font-serif">
              C'est la fin de l'adresse web. Court, sans accents, en minuscules.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 block mb-2">Titre affiché dans Google</label>
            <input
              type="text"
              value={post.seo?.metaTitle ?? ""}
              onChange={(e) => setPost({ ...post, seo: { ...post.seo, metaTitle: e.target.value } })}
              placeholder={post.fr.title}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust"
            />
            <p className="text-xs opacity-50 mt-1 italic font-serif">
              C'est le titre que les gens verront dans les résultats de recherche. Idéalement court (60 caractères).
            </p>
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 block mb-2">Petit aperçu sous le titre dans Google</label>
            <textarea
              value={post.seo?.metaDescription ?? ""}
              onChange={(e) => setPost({ ...post, seo: { ...post.seo, metaDescription: e.target.value } })}
              placeholder={post.fr.excerpt}
              rows={3}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust resize-none"
            />
            <p className="text-xs opacity-50 mt-1 italic font-serif">
              Le petit texte qui invite à cliquer. Une phrase ou deux (160 caractères).
            </p>
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 block mb-2">Image quand on partage sur les réseaux sociaux</label>
            <input
              type="text"
              value={post.seo?.ogImage ?? ""}
              onChange={(e) => setPost({ ...post, seo: { ...post.seo, ogImage: e.target.value } })}
              placeholder={post.heroImage || "(adresse de l'image)"}
              className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-mono outline-none focus:border-rust"
            />
            <p className="text-xs opacity-50 mt-1 italic font-serif">
              Quand quelqu'un partage votre article sur Facebook ou ailleurs, c'est cette image qui apparaît.
              Laissez vide pour utiliser l'image principale de l'article.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
