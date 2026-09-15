import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Content } from "../../i18n";
import type { CartItem, Lang, SectionId } from "../../types";
import {
  photoPourSection,
  EDUCATION_VIDEO,
  EDUCATION_VIDEO_WEBM,
  EDUCATION_VIDEO_MOBILE,
  EDUCATION_POSTER,
} from "../../assets/images";
import { GlossaryText } from "../common/GlossaryText";
import { BlogPostView } from "../blog/BlogPostView";
import { Reveal, RevealPhoto } from "../motion/Reveal";
import { EditableImage } from "../edit/EditableImage";
import { EditableText } from "../edit/EditableText";
import { useSiteEdit } from "../../lib/siteEdit";
import { usePhotoPortrait } from "../../hooks/usePhotoPortrait";

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

const TEXTE_EDUCATION =
  "Elise .G Lortie est éducatrice à la sexualité et thérapeute en intégration somatique. Elle reçoit en séance individuelle et anime des cercles et des formations, toujours dans un cadre sécuritaire, inclusif et non normatif.";

/** L'ouverture de la page Éducation sexuelle : la vidéo d'Élise joue trois secondes, ralentit
 *  progressivement sur la fin (le ralenti est dans le fichier, pas dans le code), se fige sur sa
 *  dernière image, et son texte apparaît une seconde après l'arrêt. En format
 *  portrait (la vidéo vient d'un téléphone), elle tient la colonne de gauche et le texte
 *  vient se poser à droite, sur la même ligne de base. Sans mouvement demandé, l'affiche
 *  et le texte s'affichent tout de suite. */
const OuvertureEducation = ({ lang }: { lang: Lang }) => {
  const [montre, setMontre] = useState(false);
  const [grandEcran, setGrandEcran] = useState<boolean | null>(null);
  const minuterie = useRef<number | null>(null);

  useEffect(() => {
    setGrandEcran(window.matchMedia("(min-width: 768px)").matches);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setMontre(true); return; }
    // Filet de sécurité : si la lecture automatique est refusée, le texte vient quand même.
    const secours = window.setTimeout(() => setMontre(true), 6000);
    return () => { window.clearTimeout(secours); if (minuterie.current) window.clearTimeout(minuterie.current); };
  }, []);

  const figee = () => {
    if (minuterie.current) return;
    minuterie.current = window.setTimeout(() => setMontre(true), 1000);
  };

  return (
    <div className="w-full px-5 md:px-12 lg:px-16 mb-16 md:mb-24 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10 items-end">
      <RevealPhoto className="lg:col-span-5 w-full aspect-[9/16] max-h-[78vh] overflow-hidden bg-ink/5 dark:bg-white/5">
        {grandEcran !== null && (
          <video
            key={grandEcran ? "grand" : "petit"}
            className="w-full h-full object-cover object-[50%_30%] motion-reduce:hidden"
            poster={EDUCATION_POSTER}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={figee}
            onTimeUpdate={(e) => { const v = e.currentTarget; if (Number.isFinite(v.duration) && v.currentTime >= v.duration - 0.05) figee(); }}
            aria-hidden="true"
          >
            {grandEcran && <source src={EDUCATION_VIDEO_WEBM} type="video/webm" />}
            <source src={grandEcran ? EDUCATION_VIDEO : EDUCATION_VIDEO_MOBILE} type="video/mp4" />
          </video>
        )}
        <img src={EDUCATION_POSTER} alt="Elise .G Lortie" className="hidden motion-reduce:block w-full h-full object-cover object-[50%_30%]" />
      </RevealPhoto>

      <motion.div
        initial={false}
        animate={montre ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 1, ease: EASE }}
        className="lg:col-span-7 lg:pb-4"
        aria-hidden={!montre}
      >
        <p className="max-w-xl font-serif text-xl md:text-2xl font-light leading-snug text-ink/70 dark:text-stone-300">
          <EditableText i18n="sections.education.intro" multiline>{(x) => <GlossaryText content={x} lang={lang} />}</EditableText>
        </p>
        <div className="mt-8 max-w-2xl font-serif text-xl leading-relaxed text-ink/75 dark:text-stone-300">
          <EditableText as="p" contentKey="education.texte" defaultValue={TEXTE_EDUCATION} />
        </div>
      </motion.div>
    </div>
  );
};

/** La photo d'une section, mise en page selon son orientation. En largeur : un bandeau 21:9 sous
 *  l'ouverture. En hauteur : une double page, la photo dans une colonne (à gauche sur les sections
 *  paires, à droite sur les impaires) et le texte d'ouverture posé à côté, sur la même ligne de base.
 *  L'orientation se lit sur la photo qu'Élise a réellement choisie (crayon ou Recadrer les photos),
 *  donc changer de photo change la page. */
const PhotoDeSection = ({ id, index, photo, navTitle, intro, lang, texte, portrait }: {
  id: SectionId; index: number; photo: string; navTitle: string; intro?: string; lang: Lang; texte?: React.ReactNode; portrait: boolean | null;
}) => {
  if (portrait === null) return <div className="w-full min-h-[40vh]" aria-hidden="true" />;

  if (!portrait) {
    return (
      <>
        <RevealPhoto className="w-full px-5 md:px-12 lg:px-16 mb-16 md:mb-24">
          <div className="w-full overflow-hidden aspect-[21/9] max-h-[46vh]">
            <EditableImage contentKey={`section.${id}.photo`} defaultUrl={photo} alt={navTitle} className="w-full h-full object-cover" loading="eager" />
          </div>
        </RevealPhoto>
        {texte && <div className="w-full px-5 md:px-12 lg:px-16 mb-14 md:mb-20">{texte}</div>}
      </>
    );
  }

  const aDroite = index % 2 === 1;
  return (
    <div className="w-full px-5 md:px-12 lg:px-16 mb-16 md:mb-24 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10 items-end">
      <RevealPhoto className={`lg:col-span-5 w-full aspect-[3/4] max-h-[78vh] overflow-hidden bg-ink/5 dark:bg-white/5 ${aDroite ? "lg:order-2" : ""}`}>
        <EditableImage contentKey={`section.${id}.photo`} defaultUrl={photo} alt={navTitle} className="w-full h-full object-cover object-[50%_20%]" loading="eager" />
      </RevealPhoto>
      <div className={`lg:col-span-7 lg:pb-4 ${aDroite ? "lg:order-1 lg:pr-8" : "lg:pl-8"}`}>
        {intro && (
          <Reveal>
            <p className="max-w-xl font-serif text-xl md:text-2xl font-light leading-snug text-ink/70 dark:text-stone-300">
              <EditableText i18n={`sections.${id}.intro`} multiline>{(x) => <GlossaryText content={x} lang={lang} />}</EditableText>
            </p>
          </Reveal>
        )}
        {texte && <Reveal delay={0.1}><div className={intro ? "mt-8" : ""}>{texte}</div></Reveal>}
      </div>
    </div>
  );
};

/** Une page de section : une ouverture éditoriale (kicker, titre en grand, intro), un bandeau
 *  photo qui s'ouvre du centre vers les bords, puis le contenu de la section. La boutique et
 *  un écrit ouvert prennent toute la largeur. */
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
  const ouvertureVideo = id === "education";
  const { read } = useSiteEdit();
  const aPhoto = !!photo && !ouvertureVideo && id !== "rendezvous";
  /** L'orientation de la photo réellement choisie décide de la page : en hauteur, elle prend une
   *  colonne et l'intro vient à côté; en largeur, l'intro reste dans l'en-tête et la photo fait un bandeau. */
  const portrait = usePhotoPortrait(aPhoto ? read(`section.${id}.photo`, photo!) : "");
  const introDansEntete = !ouvertureVideo && !(aPhoto && portrait !== false);

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
            <p className="ed-kicker mb-8">{numero ? `${numero} · ` : ""}<EditableText i18n={id === "rendezvous" ? "general.prendreRdv" : `nav.${id}`} /></p>
            <h1 className="ed-display [text-wrap:balance] text-[clamp(2.6rem,5.6vw,5.4rem)] text-ink dark:text-stone-100">
              <EditableText i18n={`sections.${id}.title`} />
            </h1>
          </div>
          {sectionContent.intro && introDansEntete && (
            <p className="lg:col-span-5 lg:pb-3 max-w-xl font-serif text-xl md:text-2xl font-light leading-snug text-ink/70 dark:text-stone-300">
              <EditableText i18n={`sections.${id}.intro`} multiline>{(x) => <GlossaryText content={x} lang={lang} />}</EditableText>
            </p>
          )}
        </header>

        {ouvertureVideo && <OuvertureEducation lang={lang} />}

        {aPhoto && photo && (
          <PhotoDeSection
            id={id}
            index={index}
            photo={photo}
            navTitle={navTitle}
            intro={sectionContent.intro}
            lang={lang}
            portrait={portrait}
            texte={id === "apropos" ? <Apropos content={t.sections.apropos} lang={lang} /> : undefined}
          />
        )}

        <div className="w-full px-5 md:px-12 lg:px-16 pb-28 md:pb-40">

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
                texteParDefaut={TEXTE_EDUCATION}
                demande="education"
                sansTexte
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
