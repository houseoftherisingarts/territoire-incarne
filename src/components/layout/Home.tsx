import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ELISE_HOME_BG, ELISE_FIELD_IMG, IMG_THERAPIE } from "../../assets/images";
import type { SectionId } from "../../types";
import { pathForSection } from "../../routes";
import { useSections } from "../../hooks/useSections";
import type { Content } from "../../i18n";
import { EditableText } from "../edit/EditableText";
import { EditableImage } from "../edit/EditableImage";
import { Reveal } from "../motion/Reveal";

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
  <span className="inline-block">
    {texte.split(" ").map((mot, i) => (
      <span key={i} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-baseline">
        <motion.span
          className="inline-block"
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, delay: delai + i * 0.12, ease: EASE }}
        >
          {mot}
          {i < texte.split(" ").length - 1 ? " " : ""}
        </motion.span>
      </span>
    ))}
  </span>
);

/** L'accueil : une double page de magazine. Le titre et la phrase d'Élise à gauche, sa photo qui
 *  fuit vers le bord droit, puis le sommaire numéroté, puis les deux portes principales (la
 *  thérapie et les cours de danse). Rien n'est centré, tout tient sur des filets. */
export const Home = ({ t, onOpen }: Props) => {
  const { visibles, estVisible } = useSections();
  const ledeApropos = t.sections.apropos.intro.split(". ")[0] + ".";

  return (
    <main id="contenu" className="w-full">
      {/* ── Hero : double page ─────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[100dvh] grid grid-cols-1 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-end px-5 md:px-12 lg:px-16 pt-10 pb-14 lg:pb-20 lg:pt-32">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="ed-kicker mb-6"
          >
            <EditableText as="span" contentKey="home.hero.kicker" defaultValue="Thérapie somatique, mouvement, éducation, retraites." />
          </motion.p>

          <h1 className="ed-display text-[clamp(3.4rem,10vw,9rem)] text-ink dark:text-stone-100 leading-[0.95] tracking-[-0.02em]">
            <MotsQuiMontent texte="Territoire Incarné" delai={0.35} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: EASE }}
            className="ed-kicker mt-6 border-l border-rust/60 pl-4 py-1"
          >
            <EditableText as="span" contentKey="home.hero.subtitle" defaultValue="par Elise .G Lortie" />
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.05, ease: EASE }}
            className="mt-10 max-w-xl font-serif text-2xl md:text-3xl font-light leading-snug text-ink/85 dark:text-stone-200"
          >
            <EditableText as="span" contentKey="home.hero.lede" defaultValue={ledeApropos} />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.2, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            {estVisible("rendezvous") && (
              <a
                href={pathForSection("rendezvous")}
                onClick={handleNav("rendezvous", onOpen)}
                className="inline-flex items-center gap-3 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] pl-7 pr-2 rounded-full hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
              >
                {t.general.prendreRdv}
                <span className="w-9 h-9 rounded-full bg-paper/15 flex items-center justify-center"><ArrowUpRight size={16} /></span>
              </a>
            )}
            {estVisible("mouvement") && (
              <a
                href={pathForSection("mouvement")}
                onClick={handleNav("mouvement", onOpen)}
                className="inline-flex items-center gap-3 border border-ink/30 dark:border-stone-300/40 font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] px-7 rounded-full hover:bg-ink hover:text-paper dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
              >
                {t.general.coursDanse}
              </a>
            )}
          </motion.div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5 relative h-[52dvh] lg:h-auto lg:min-h-[100dvh] overflow-hidden lg:border-l border-ink/10 dark:border-white/10">
          <motion.div
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease: EASE }}
            className="absolute inset-0"
          >
            <EditableImage
              contentKey="home.hero.photo"
              defaultUrl={ELISE_HOME_BG}
              alt="Elise .G Lortie, assise dans un champ"
              className="w-full h-full object-cover object-[35%_center] grayscale-[10%]"
              loading="eager"
            />
          </motion.div>
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-paper/70 dark:from-forest/70 to-transparent lg:hidden" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/45 to-transparent lg:hidden" />
          <p className="absolute left-5 bottom-5 lg:left-8 lg:bottom-8 ed-kicker text-paper drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Elise .G Lortie</p>
        </div>
      </section>

      {/* ── Sommaire ──────────────────────────────────────────────────────── */}
      <section className="w-full px-5 md:px-12 lg:px-16 py-20 md:py-28 border-t border-ink/10 dark:border-white/10" aria-label={t.general.sommaire}>
        <Reveal>
          <p className="ed-kicker mb-10">{t.general.sommaire}</p>
        </Reveal>
        <ol>
          {visibles.map((id, i) => {
            const section = t.sections[id] as { title: string; intro?: string };
            return (
              <Reveal key={id} delay={i * 0.04}>
                <li className="border-b border-ink/10 dark:border-white/10">
                  <a
                    href={pathForSection(id)}
                    onClick={handleNav(id, onOpen)}
                    className="group grid grid-cols-12 gap-x-4 md:gap-x-8 items-baseline py-6 md:py-8 transition-colors"
                  >
                    <span className="ed-index col-span-2 md:col-span-1 font-serif text-base text-rust">0{i + 1}</span>
                    <span className="col-span-10 md:col-span-5 font-serif text-3xl md:text-5xl font-light leading-[1.05] text-ink dark:text-stone-100 group-hover:text-rust dark:group-hover:text-white transition-colors">
                      {t.nav[id]}
                    </span>
                    <span className="col-span-10 col-start-3 md:col-span-5 md:col-start-7 mt-3 md:mt-0 font-serif text-lg md:text-xl leading-snug text-ink/60 dark:text-stone-400">
                      {section.intro}
                    </span>
                    <span className="hidden md:flex md:col-span-1 justify-end text-rust opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={20} />
                    </span>
                  </a>
                </li>
              </Reveal>
            );
          })}
        </ol>
      </section>

      {/* ── Deux portes : la thérapie et les cours de danse ───────────────── */}
      {(estVisible("therapie") || estVisible("mouvement")) && (
        <section className="w-full grid grid-cols-1 lg:grid-cols-2 border-t border-ink/10 dark:border-white/10">
          {estVisible("therapie") && (
            <Reveal className="relative">
              <a href={pathForSection("therapie")} onClick={handleNav("therapie", onOpen)} className="group block">
                <div className="aspect-[4/3] lg:aspect-[5/4] overflow-hidden">
                  <EditableImage
                    contentKey="home.porte.therapie"
                    defaultUrl={IMG_THERAPIE}
                    alt=""
                    className="w-full h-full object-cover grayscale-[25%] group-hover:grayscale-0 transition-[filter,transform] duration-1000 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-5 md:px-12 lg:px-16 py-10 md:py-14">
                  <p className="ed-kicker mb-4">0{visibles.indexOf("therapie") + 1} · {t.nav.therapie}</p>
                  <h2 className="ed-display text-4xl md:text-5xl text-ink dark:text-stone-100">{t.sections.therapie.title}</h2>
                  <p className="mt-5 max-w-lg font-serif text-xl leading-relaxed text-ink/70 dark:text-stone-300">{t.sections.therapie.intro}</p>
                  <span className="mt-6 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.22em] text-rust">
                    {t.general.prendreRdv} <ArrowUpRight size={14} />
                  </span>
                </div>
              </a>
            </Reveal>
          )}
          {estVisible("mouvement") && (
            <Reveal delay={0.1} className="relative lg:border-l border-ink/10 dark:border-white/10">
              <a href={pathForSection("mouvement")} onClick={handleNav("mouvement", onOpen)} className="group block">
                <div className="aspect-[4/3] lg:aspect-[5/4] overflow-hidden">
                  <EditableImage
                    contentKey="home.porte.mouvement"
                    defaultUrl={ELISE_FIELD_IMG}
                    alt=""
                    className="w-full h-full object-cover grayscale-[25%] group-hover:grayscale-0 transition-[filter,transform] duration-1000 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-5 md:px-12 lg:px-16 py-10 md:py-14">
                  <p className="ed-kicker mb-4">0{visibles.indexOf("mouvement") + 1} · {t.nav.mouvement}</p>
                  <h2 className="ed-display text-4xl md:text-5xl text-ink dark:text-stone-100">{t.sections.mouvement.title}</h2>
                  <p className="mt-5 max-w-lg font-serif text-xl leading-relaxed text-ink/70 dark:text-stone-300">{t.sections.mouvement.intro}</p>
                  <span className="mt-6 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.22em] text-rust">
                    {t.sections.mouvement.cta} <ArrowUpRight size={14} />
                  </span>
                </div>
              </a>
            </Reveal>
          )}
        </section>
      )}
    </main>
  );
};
