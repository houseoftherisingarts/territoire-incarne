import { motion } from "framer-motion";
import type { Content } from "../../i18n";
import type { CartItem, Lang, SectionId } from "../../types";
import { photoPourSection } from "../../assets/images";
import { GlossaryText } from "../common/GlossaryText";
import { BlogPostView } from "../blog/BlogPostView";
import { Reveal } from "../motion/Reveal";
import { EditableImage } from "../edit/EditableImage";

import {
  Apropos,
  Boutique,
  Connecter,
  Ateliers,
  ServicesParCategorie,
  Events,
  Mouvement,
  RendezVous,
  Ressources,
  Therapie,
  Writings,
} from "../../sections";

const photoPour = photoPourSection;

interface Props {
  id: SectionId;
  index: number;
  lang: Lang;
  t: Content;
  navTitle: string;
  onOpenPost?: (slug: string) => void;
  postSlug?: string | null;
  cart: CartItem[];
  subtotal: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
}

const EASE = [0.16, 0.8, 0.24, 1] as const;

/** Une page de section : la photo tient la colonne de gauche et reste collée pendant que le texte
 *  défile à droite, comme une double page de magazine. La boutique et un écrit ouvert prennent
 *  toute la largeur. */
export const DetailView = ({
  id,
  index,
  lang,
  t,
  navTitle,
  onOpenPost,
  postSlug,
  cart,
  subtotal,
  addToCart,
  removeFromCart,
}: Props) => {
  const photo = photoPour(id);
  const sectionContent = t.sections[id] as { title: string; intro?: string };
  const fullWidth = id === "boutique" || (id === "writings" && !!postSlug);
  const numero = index >= 0 ? `0${index + 1}` : "";

  return (
    <main id="contenu" className="w-full">
      <motion.article
        key={id + (postSlug ?? "")}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className={`w-full ${fullWidth ? "" : "grid grid-cols-1 lg:grid-cols-12"}`}
      >
        {!fullWidth && (
          <aside className="lg:col-span-5 relative h-[44dvh] lg:sticky lg:top-20 lg:self-start lg:h-[calc(100dvh-5rem)] overflow-hidden bg-stone-200 dark:bg-stone-900/40 lg:border-r border-ink/10 dark:border-white/10">
            {photo ? (
              <motion.div
                initial={{ scale: 1.06 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.4, ease: EASE }}
                className="absolute inset-0"
              >
                <EditableImage
                  contentKey={`section.${id}.photo`}
                  defaultUrl={photo}
                  alt={navTitle}
                  className={`w-full h-full object-cover ${id === "connecter" || id === "events" || id === "ressources" ? "opacity-80 mix-blend-multiply dark:mix-blend-overlay" : "grayscale-[10%]"}`}
                  loading="eager"
                />
              </motion.div>
            ) : null}
            <p className="hidden lg:block absolute left-8 bottom-8 ed-kicker text-paper drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{numero ? `${numero} · ` : ""}{navTitle}</p>
          </aside>
        )}

        <div className={`${fullWidth ? "w-full px-5 md:px-12 lg:px-16 pt-10 md:pt-16 pb-24" : "lg:col-span-7 px-5 md:px-12 lg:px-16 pt-10 md:pt-16 lg:pt-24 pb-24"}`}>
          <header className="mb-12 md:mb-16">
            <p className="ed-kicker ed-hairline inline-block border-b pb-1 mb-5">{numero ? `${numero} · ` : ""}{navTitle}</p>
            <h1 className="ed-display text-[clamp(2.6rem,6vw,5.5rem)] text-ink dark:text-stone-100">
              {sectionContent.title}
            </h1>
          </header>

          <Reveal className="mb-14 md:mb-20">
            {sectionContent.intro && (
              <p className="max-w-2xl font-serif text-2xl md:text-3xl font-light leading-snug text-ink/80 dark:text-stone-200">
                <GlossaryText content={sectionContent.intro} lang={lang} />
              </p>
            )}
            {id === "apropos" && <Apropos content={t.sections.apropos} lang={lang} />}
          </Reveal>

          <div className={fullWidth ? "" : "max-w-3xl"}>
            {id === "therapie" && <Therapie content={t.sections.therapie} />}
            {id === "rendezvous" && <RendezVous content={t.sections.rendezvous} general={t.general} />}
            {id === "mouvement" && <Mouvement content={t.sections.mouvement} />}
            {id === "massotherapie" && (
              <ServicesParCategorie
                intro={t.sections.massotherapie.intro}
                categorie="massotherapie"
                cleTexte="massotherapie.texte"
                texteParDefaut="Le toucher est le premier langage que le corps comprend. Les séances se donnent en personne, et la durée se choisit selon ce que la semaine a laissé dans les épaules."
                demande="therapie"
              />
            )}
            {id === "education" && (
              <ServicesParCategorie
                intro={t.sections.education.intro}
                categorie="sante-sexuelle"
                cleTexte="education.texte"
                texteParDefaut="Elise .G Lortie est éducatrice à la sexualité et thérapeute en intégration somatique. Elle reçoit en séance individuelle et anime des cercles et des formations, toujours dans un cadre sécuritaire, inclusif et non normatif."
                demande="education"
              />
            )}
            {id === "ateliers" && <Ateliers content={t.sections.ateliers} />}
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
          </div>
        </div>
      </motion.article>
    </main>
  );
};
