import { Mail, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { BlogPost } from "../../../types/blog";

interface Props {
  post: BlogPost | { fr: BlogPost["fr"]; heroImage: string };
  onCancel: () => void;
  onSkip: () => void;
  onSend: () => void;
}

export const NewsletterPublishModal = ({ post, onCancel, onSkip, onSend }: Props) => {
  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="bg-paper dark:bg-stone-900 max-w-lg w-full rounded-[30px] shadow-2xl relative animate-[fadeIn_0.3s_ease-out] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button onClick={onCancel} aria-label="Close" className="absolute top-4 right-4 z-10 bg-black/10 hover:bg-black/20 p-2 rounded-full">
          <X size={18} />
        </button>
        {post.heroImage && (
          <div className="h-40 w-full bg-stone-200">
            <img src={post.heroImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-8 space-y-5">
          <div className="flex items-center gap-3">
            <Mail size={24} className="text-rust" />
            <h3 className="font-serif text-2xl">Annoncer aux abonné·e·s ?</h3>
          </div>
          <p className="font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">
            Vous publiez "<span className="text-ink dark:text-stone-100">{post.fr.title}</span>". Voulez-vous notifier votre infolettre ?
          </p>
          <p className="text-xs font-sans uppercase tracking-widest opacity-50">
            (Le sender d'infolettre n'est pas encore branché — pour l'instant, ce bouton publie l'article et marque la notification comme à envoyer.)
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={onSend} className="flex-1 bg-rust text-paper py-3 rounded-[30px] uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:bg-ink transition-colors">
              Publier + Annoncer
            </button>
            <button onClick={onSkip} className="flex-1 border border-ink/10 dark:border-white/10 py-3 rounded-[30px] uppercase tracking-[0.25em] text-[11px] font-bold font-sans hover:border-rust hover:text-rust transition-colors">
              Publier sans annoncer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
