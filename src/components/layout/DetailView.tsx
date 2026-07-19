import { X } from "lucide-react";
import type { Content } from "../../i18n";
import type { CartItem, Lang, SectionId } from "../../types";
import {
  ELISE_MAIN_IMG,
  IMG_BOUTIQUE,
  IMG_THERAPIE,
  IMG_WRITINGS,
  IMG_ZEN_STONE,
} from "../../assets/images";
import { LinenPattern } from "../decor/LinenPattern";
import { SomaticCurves } from "../decor/SomaticCurves";
import { GlossaryText } from "../common/GlossaryText";
import { BlogPostView } from "../blog/BlogPostView";

import {
  Apropos,
  Boutique,
  Connecter,
  Events,
  Mouvement,
  MouvementSidebarForm,
  Ressources,
  Therapie,
  Writings,
} from "../../sections";

interface SidebarConfig {
  image: string | null;
  imageScaleClass: string;
}

const sidebarFor = (id: SectionId): SidebarConfig => {
  switch (id) {
    case "apropos":
      return { image: ELISE_MAIN_IMG, imageScaleClass: "scale-100" };
    case "therapie":
      return { image: IMG_THERAPIE, imageScaleClass: "scale-110" };
    case "writings":
      return { image: IMG_WRITINGS, imageScaleClass: "scale-100" };
    case "events":
      return { image: IMG_ZEN_STONE, imageScaleClass: "scale-100" };
    case "ressources":
      return { image: IMG_ZEN_STONE, imageScaleClass: "scale-100" };
    default:
      return { image: null, imageScaleClass: "scale-100" };
  }
};

interface Props {
  id: SectionId;
  lang: Lang;
  t: Content;
  navTitle: string;
  closeText: string;
  onClose: () => void;
  onOpenPost?: (slug: string) => void;
  postSlug?: string | null;
  cart: CartItem[];
  subtotal: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
}

export const DetailView = ({
  id,
  lang,
  t,
  navTitle,
  closeText,
  onClose,
  onOpenPost,
  postSlug,
  cart,
  subtotal,
  addToCart,
  removeFromCart,
}: Props) => {
  const sidebar = sidebarFor(id);
  const sectionContent = t.sections[id];
  const fullWidth = id === "boutique" || (id === "writings" && !!postSlug);

  return (
    <div className="fixed inset-0 z-50 bg-paper dark:bg-forest animate-[fadeIn_0.7s_ease-out] flex flex-col md:flex-row overflow-hidden text-ink dark:text-stone-100">
      <div
        className={`${fullWidth ? "hidden" : "w-full md:w-1/2 h-[30vh] md:h-full"} relative overflow-hidden bg-stone-200 dark:bg-stone-900/40 flex-shrink-0 flex items-center justify-center p-6 md:p-12 transition-colors duration-500 ${
          id === "connecter" ? "p-0" : ""
        }`}
      >
        <SomaticCurves className="z-10 text-white/40 absolute inset-0" />
        <div className="absolute inset-0 bg-stone-500/5 dark:bg-black/40 mix-blend-multiply dark:mix-blend-overlay" />

        {id === "mouvement" ? (
          <MouvementSidebarForm content={t.sections.mouvement} />
        ) : id === "connecter" ? (
          <div className="absolute inset-0 w-full h-full z-0">
            <img
              src={IMG_ZEN_STONE}
              className="w-full h-full object-cover opacity-80 mix-blend-multiply dark:mix-blend-overlay"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : sidebar.image ? (
          <div className="relative z-20 w-full max-w-lg aspect-[3/4] shadow-2xl rotate-1 transition-transform duration-[2s] hover:rotate-0 rounded-[30px] overflow-hidden">
            <div className="w-full h-full overflow-hidden flex items-center justify-center">
              <img
                src={sidebar.image}
                className={`w-full h-full object-cover grayscale-[20%] opacity-90 dark:opacity-80 transition-transform duration-1000 ${sidebar.imageScaleClass} rounded-[30px]`}
                alt={navTitle}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        ) : null}

        <button
          onClick={onClose}
          className="absolute top-8 left-8 z-50 group flex items-center gap-3 text-sm font-sans tracking-widest uppercase text-ink dark:text-stone-100 hover:opacity-70 transition-opacity bg-white/10 p-2 rounded-sm backdrop-blur-sm"
          aria-label={closeText}
        >
          <X size={16} className="group-hover:rotate-90 transition-transform duration-700" />
          <span>{closeText}</span>
        </button>
      </div>

      <div className={`${fullWidth ? "w-full" : "w-full md:w-1/2"} h-full relative overflow-y-auto bg-paper dark:bg-forest transition-colors duration-500`}>
        <SomaticCurves className="text-stone-400/20 dark:text-white/5 absolute inset-0 z-0 pointer-events-none" />

        {fullWidth && (
          <button
            onClick={onClose}
            className="absolute top-8 left-8 z-50 group flex items-center gap-3 text-sm font-sans tracking-widest uppercase text-ink dark:text-stone-100 hover:opacity-70 transition-opacity"
            aria-label={closeText}
          >
            <X size={16} className="group-hover:rotate-90 transition-transform duration-700" />
            <span>{closeText}</span>
          </button>
        )}

        <div className={`${fullWidth ? "p-8 md:p-16 lg:px-24 lg:pt-24 lg:pb-16 max-w-7xl" : "p-8 md:p-16 lg:p-24 max-w-3xl xl:max-w-4xl"} mx-auto min-h-full flex flex-col relative z-10`}>
          <div className="mb-12 pt-8 md:pt-0">
            <span className="block text-xs font-sans tracking-widest opacity-60 dark:opacity-50 mb-4 uppercase border-b border-stone-300 dark:border-stone-500 inline-block pb-1 text-ink dark:text-stone-300">
              {navTitle}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-none text-ink dark:text-stone-100">
              {sectionContent.title}
            </h2>
          </div>

          <div className="mb-12 relative">
            <LinenPattern className="w-full h-32 top-0" />
            {"intro" in sectionContent && sectionContent.intro && (
              <p className="text-xl md:text-2xl leading-relaxed font-light text-stone-600 dark:text-stone-200 font-serif">
                <GlossaryText content={sectionContent.intro} lang={lang} />
              </p>
            )}
            {id === "apropos" && (
              <Apropos content={t.sections.apropos} lang={lang} />
            )}
          </div>

          {id === "therapie" && <Therapie content={t.sections.therapie} />}
          {id === "education" && <Education content={t.sections.education} />}
          {id === "mouvement" && <Mouvement content={t.sections.mouvement} />}
          {id === "events" && <Events content={t.sections.events} />}
          {id === "ressources" && <Ressources content={t.sections.ressources} />}
          {id === "writings" && !postSlug && (
            <Writings content={t.sections.writings} lang={lang} onOpenPost={onOpenPost} />
          )}
          {id === "writings" && postSlug && (
            <BlogPostView slug={postSlug} lang={lang} onBack={() => onOpenPost && history.back()} />
          )}
          {id === "connecter" && <Connecter content={t.sections.connecter} />}
          {id === "boutique" && (
            <Boutique
              content={t.sections.boutique}
              t={t.general}
              cart={cart}
              subtotal={subtotal}
              onAdd={addToCart}
              onRemove={removeFromCart}
            />
          )}

          <div className="h-24" />
        </div>
      </div>
    </div>
  );
};
