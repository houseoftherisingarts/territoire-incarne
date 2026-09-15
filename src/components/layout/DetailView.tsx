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
  Consentement,
  Ateliers,
  ServicesParCategorie,
  Events,
  Mouvement,
  RendezVous,
  Ressources,
  Therapie,
  Writings,
  Multimedias,
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
  const fullWidth = id === "boutique" || id === "mouvement" || (id === "writings" && !!postSlug);
  const numero = index >= 0 ? String(index + 1).padStart(2, "0") : "";

  return (
    <main id="contenu" className="w-full">
      <motion.article
        key={id + (postSlug ?? "")}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="w-full"
      >
        {/* L'ouverture : un kicker, le titre en grand, la phrase d'intro à droite, et de l'air
            partout. La barre est fixe, d'où le grand dégagement du haut. */}
        <header className="w-full px-5 md:px-12 lg:px-16 pt-32 md:pt-44 pb-16 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10 items-end">
          <div className="lg:col-span-7">
            <p className="ed-kicker mb-8">{numero ? `${numero} · ` : ""}{navTitle}</p>
            <h1 className="ed-display [text-wrap:balance] text-[clamp(2.6rem,5.6vw,5.4rem)] text-ink dark:text-stone-100">
              {sectionContent.title}
            </h1>
          </div>
          {sectionContent.intro && (
            <p className="lg:col-span-5 lg:pb-3 max-w-xl font-serif text-xl md:text-2xl font-light leading-snug text-ink/70 dark:text-stone-300">
              <GlossaryText content={sectionContent.intro} lang={lang} />
            </p>
          )}
        </header>

        {photo && id !== "rendezvous" && (
          <Reveal className="w-full px-5 md:px-12 lg:px-16 mb-16 md:mb-24">
            <div className="w-full aspect-[21/9] max-h-[46vh] overflow-hidden">
              <EditableImage
                contentKey={`section.${id}.photo`}
                defaultUrl={photo}
                alt={navTitle}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </Reveal>
        )}

        <div className={`w-full px-5 md:px-12 lg:px-16 pb-28 md:pb-40 ${fullWidth ? "" : ""}`}>
          {id === "apropos" && (
            <Reveal className="mb-14 md:mb-20">
              <Apropos content={t.sections.apropos} lang={lang} />
            </Reveal>
          )}

          <div className={fullWidth ? "" : "max-w-4xl"}>
            {id === "therapie" && <Therapie content={t.sections.therapie} />}
            {id === "rendezvous" && <RendezVous content={t.sections.rendezvous} general={t.general} />}
            {id === "mouvement" && <Mouvement content={t.sections.mouvement} />}
            {id === "massotherapie" && (
              <ServicesParCategorie
                categorie="massotherapie"
                cleTexte="massotherapie.texte"
                texteParDefaut="Le toucher est le premier langage que le corps comprend. Les séances se donnent en personne, et la durée se choisit selon ce que la semaine a laissé dans les épaules."
                demande="therapie"
              />
            )}
            {id === "education" && (
              <ServicesParCategorie
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
            {id === "multimedias" && <Multimedias content={t.sections.multimedias} />}
            {id === "connecter" && <Connecter content={t.sections.connecter} />}
            {id === "consentement" && <Consentement content={t.sections.consentement} />}
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
