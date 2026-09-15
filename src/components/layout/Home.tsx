import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { HERO_VIDEO, HERO_VIDEO_WEBM, HERO_VIDEO_MOBILE, HERO_POSTER, ELISE_PORTRAIT } from "../../assets/images";
import { SOMMAIRE_ORDER, type SectionId } from "../../types";
import { pathForSection } from "../../routes";
import { useSections } from "../../hooks/useSections";
import { CONTENT, type Content } from "../../i18n";
import { tx, useLangue } from "../../i18n/tx";
import { EditableText } from "../edit/EditableText";
import { EditableImage } from "../edit/EditableImage";
import { Reveal, RevealPhoto } from "../motion/Reveal";

interface Props {
  t: Content;
  onOpen: (id: SectionId) => void;
}

const EASE = [0.16, 0.8, 0.24, 1] as const;

const handleNav =
  (id: SectionId, onOpen: (id: SectionId) => void) =>
  (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onOpen(id);
  };

/** Les mots d'un titre montent un à un, comme une lettre qui se compose. */
const MotsQuiMontent = ({ texte, delai = 0 }: { texte: string; delai?: number }) => (
  <span className="inline-flex flex-wrap justify-center gap-x-[0.28em]">
    {texte.split(" ").map((mot, i) => (
      <span key={i} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-baseline">
        <motion.span
          className="inline-block"
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, delay: delai + i * 0.12, ease: EASE }}
        >
          {mot}
        </motion.span>
      </span>
    ))}
  </span>
);

/** L'accueil : la route animée en hero, le titre au centre, puis « Qui est Élise » en double
 *  page (son portrait à gauche, ses mots à droite), puis le sommaire en tuiles de texte. */
export const Home = ({ t, onOpen }: Props) => {
  const { visibles, estVisible } = useSections();
  const lang = useLangue();
  const tuiles = SOMMAIRE_ORDER.filter((id) => visibles.includes(id));
  const ledeApropos = t.sections.apropos.intro.split(". ")[0] + ".";
  /** La boucle vidéo se choisit une fois, selon la largeur : la version 960 px sur téléphone. */
  const [grandEcran, setGrandEcran] = useState<boolean | null>(null);
  useEffect(() => { setGrandEcran(window.matchMedia("(min-width: 768px)").matches); }, []);

  return (
    <main id="contenu" className="w-full">
      {/* ── Hero : la route, en 2.35:1, animée d'une brise dans les herbes ─────
          Caméra verrouillée, aucun mouvement : seule l'herbe bouge, et la boucle se
          referme sur sa première image. La vidéo est silencieuse; l'image fixe la
          remplace tant qu'elle charge, ou quand la personne a demandé moins de mouvement. */}
      <section className="relative w-full min-h-[100dvh] lg:min-h-0 lg:mt-[4.5rem] lg:aspect-[2.35/1] overflow-hidden bg-charcoal text-paper">
        <motion.div
          initial={{ scale: 1.04, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: EASE }}
          className="absolute inset-0"
        >
          {grandEcran !== null && (
            <video
              key={grandEcran ? "grand" : "petit"}
              className="w-full h-full object-cover object-[50%_60%] motion-reduce:hidden"
              poster={HERO_POSTER}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            >
              {grandEcran && <source src={HERO_VIDEO_WEBM} type="video/webm" />}
              <source src={grandEcran ? HERO_VIDEO : HERO_VIDEO_MOBILE} type="video/mp4" />
            </video>
          )}
          <img src={HERO_POSTER} alt="" className="hidden motion-reduce:block w-full h-full object-cover object-[50%_60%]" />
          {/* Une vignette douce, pour que le titre reste lisible sans écraser l'image. */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.42)_100%)]" aria-hidden="true" />
        </motion.div>

        <div className="relative min-h-[100dvh] lg:min-h-0 lg:absolute lg:inset-0 flex flex-col items-center justify-center text-center px-6 pt-28 pb-16 lg:py-0">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="ed-kicker !text-paper/85"
          >
            <EditableText as="span" contentKey="home.hero.kicker" defaultValue="Thérapie somatique, mouvement, éducation, retraites." />
          </motion.p>

          <h1 className="ed-display mt-6 text-[clamp(3rem,7.5vw,8rem)] text-paper leading-[0.98] tracking-[-0.02em] drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)]">
            <MotsQuiMontent texte="Territoire Incarné" delai={0.4} />
          </h1>

          <motion.span
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, delay: 1, ease: EASE }}
            className="block w-[74px] h-[2px] bg-paper/80 mt-8 mb-7"
            aria-hidden="true"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
            className="max-w-2xl font-serif text-xl md:text-2xl font-light leading-snug text-paper/90"
          >
            <EditableText
              as="span"
              contentKey="home.hero.lede"
              defaultValue={CONTENT.fr.sections.apropos.intro.split(". ")[0] + "."}
              defaultValueEn={CONTENT.en.sections.apropos.intro.split(". ")[0] + "."}
            />
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
            className="ed-kicker !text-paper/70 mt-7"
          >
            <EditableText as="span" contentKey="home.hero.subtitle" defaultValue="par Elise .G Lortie" />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.35, ease: EASE }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            {estVisible("rendezvous") && (
              <a
                href={pathForSection("rendezvous")}
                onClick={handleNav("rendezvous", onOpen)}
                className="inline-flex items-center gap-3 bg-paper text-ink font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] pl-7 pr-2 rounded-full hover:bg-rust hover:text-paper transition-colors"
              >
                {t.general.prendreRdv}
                <span className="w-9 h-9 rounded-full bg-ink/10 flex items-center justify-center"><ArrowUpRight size={16} /></span>
              </a>
            )}
            {estVisible("mouvement") && (
              <a
                href={pathForSection("mouvement")}
                onClick={handleNav("mouvement", onOpen)}
                className="inline-flex items-center gap-3 border border-paper/50 text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] px-7 rounded-full hover:bg-paper hover:text-ink transition-colors"
              >
                {t.general.coursDanse}
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Qui est Élise : une double page. Son portrait en hauteur à gauche, qui s'ouvre
          du centre vers les bords, et ses mots à droite, posés sur un filet. ─────── */}
      {estVisible("apropos") && (
        <section className="w-full px-5 md:px-12 lg:px-16 py-20 md:py-28 border-t border-ink/10 dark:border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-12 items-center" aria-label={tx(lang, "Qui est Élise")}>
          <RevealPhoto className="lg:col-span-5 w-full aspect-[3/4] max-h-[80vh] overflow-hidden bg-ink/5 dark:bg-white/5">
            <EditableImage
              contentKey="home.elise.photo"
              defaultUrl={ELISE_PORTRAIT}
              alt="Elise .G Lortie"
              className="w-full h-full object-cover object-[50%_20%]"
              loading="lazy"
            />
          </RevealPhoto>
          <div className="lg:col-span-7 lg:pl-8">
            <Reveal>
              <p className="ed-kicker mb-8">{tx(lang, "Qui est Élise")}</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="ed-display [text-wrap:balance] text-[clamp(2.4rem,4.8vw,4.6rem)] text-ink dark:text-stone-100">
                <EditableText as="span" contentKey="home.elise.titre" defaultValue="Elise .G Lortie" defaultValueEn="Elise .G Lortie" />
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-8 max-w-2xl font-serif text-xl md:text-2xl font-light leading-snug text-ink/80 dark:text-stone-200">
                <EditableText
                  as="span"
                  contentKey="home.elise.lede"
                  defaultValue={CONTENT.fr.sections.apropos.longText.split(". ")[0] + "."}
                  defaultValueEn={CONTENT.en.sections.apropos.longText.split(". ")[0] + "."}
                />
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink/65 dark:text-stone-300">
                <EditableText
                  as="span"
                  contentKey="home.elise.texte"
                  multiline
                  defaultValue={CONTENT.fr.sections.apropos.longText.split(". ").slice(1).join(". ")}
                  defaultValueEn={CONTENT.en.sections.apropos.longText.split(". ").slice(1).join(". ")}
                />
              </p>
            </Reveal>
            <Reveal delay={0.32}>
              <a
                href={pathForSection("apropos")}
                onClick={handleNav("apropos", onOpen)}
                className="mt-10 inline-flex items-center gap-3 border border-ink/25 dark:border-white/25 text-ink dark:text-stone-100 font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] pl-7 pr-2 rounded-full hover:bg-rust hover:border-rust hover:text-paper transition-colors"
              >
                {tx(lang, "Lire son parcours")}
                <span className="w-9 h-9 rounded-full bg-ink/10 dark:bg-white/10 flex items-center justify-center"><ArrowUpRight size={16} /></span>
              </a>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Sommaire : la grille bento ─────────────────────────────────────
          Chaque section devient une tuile de texte, son nom en grand comme un titre
          et sa phrase juste en dessous, sans photo.
          Les largeurs se comptent sur six colonnes, deux grandes tuiles puis des
          rangées de trois, et la dernière rangée se remplit toujours. */}
      <section className="w-full px-5 md:px-12 lg:px-16 py-20 md:py-28 border-t border-ink/10 dark:border-white/10" aria-label={t.general.sommaire}>
        <Reveal>
          <p className="ed-kicker mb-10">{t.general.sommaire}</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 dark:bg-white/10">
          {tuiles.map((id, i) => {
            const section = t.sections[id] as { title: string; intro?: string };
            return (
              <Reveal key={id} delay={i * 0.04} className={i === tuiles.length - 1 && tuiles.length % 3 === 1 ? "lg:col-span-3" : ""}>
                <a
                  href={pathForSection(id)}
                  onClick={handleNav(id, onOpen)}
                  className="group relative flex h-full min-h-[15rem] md:min-h-[17rem] flex-col justify-between text-center bg-white/60 dark:bg-white/[0.05] p-6 md:p-8 hover:bg-white dark:hover:bg-white/[0.09] transition-colors"
                >
                  <h3 className="ed-display text-[clamp(1.9rem,2.6vw,2.9rem)] text-ink dark:text-stone-100 group-hover:text-rust dark:group-hover:text-white transition-colors">
                    {t.nav[id]}
                  </h3>
                  {section.intro && (
                    <p className="mt-6 max-w-md mx-auto font-serif text-base md:text-lg leading-snug text-ink/65 dark:text-stone-300">
                      {section.intro}
                    </p>
                  )}
                  <span className="absolute top-6 right-6 text-rust opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={20} />
                  </span>
                </a>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ledeApropos garde la phrase d'ouverture sous la main pour le SEO et l'affiche. */}
      <span className="sr-only">{ledeApropos}</span>
    </main>
  );
};
