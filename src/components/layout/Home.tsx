import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ELISE_FIELD_HERO, ELISE_FIELD_IMG, IMG_THERAPIE } from "../../assets/images";
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

/** Les largeurs possibles d'une tuile du sommaire, écrites en toutes lettres pour que
 *  Tailwind les voie passer. */
const LARGEURS: Record<number, string> = {
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  6: "lg:col-span-6",
};

/** La grille bento du sommaire : une rangée de deux grandes tuiles, une rangée de trois,
 *  et ainsi de suite, la fin s'ajustant pour qu'aucune rangée ne reste à moitié vide. */
const colonnesBento = (n: number): number[] => {
  const out: number[] = [];
  let reste = n;
  let rangee = 0;
  while (reste > 0) {
    if (reste === 1) { out.push(6); reste = 0; }
    else if (reste === 2 || reste === 4) { out.push(3, 3); reste -= 2; }
    else if (reste === 3) { out.push(2, 2, 2); reste -= 3; }
    else if (rangee % 2 === 0) { out.push(3, 3); reste -= 2; }
    else { out.push(2, 2, 2); reste -= 3; }
    rangee += 1;
  }
  return out;
};

/** L'accueil : une double page de magazine. Le titre et la phrase d'Élise à gauche, sa photo qui
 *  fuit vers le bord droit, puis le sommaire numéroté, puis les deux portes principales (la
 *  thérapie et les cours de danse). Rien n'est centré, tout tient sur des filets. */
export const Home = ({ t, onOpen }: Props) => {
  const { visibles, estVisible } = useSections();
  const ledeApropos = t.sections.apropos.intro.split(". ")[0] + ".";
  const colonnes = colonnesBento(visibles.length);

  return (
    <main id="contenu" className="w-full">
      {/* ── Hero : la photo tient tout le cadre, le texte se pose à côté ───── */}
      <section className="relative w-full min-h-[100dvh] overflow-hidden bg-paper dark:bg-forest">
        <motion.div
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: EASE }}
          className="absolute inset-x-0 top-0 h-[54dvh] lg:inset-0 lg:h-full overflow-hidden"
        >
          <EditableImage
            contentKey="home.hero.photo"
            defaultUrl={ELISE_FIELD_HERO}
            alt="Elise .G Lortie, dans un champ en hiver"
            className="w-full h-full object-cover object-[46%_center] lg:object-[38%_center]"
            loading="eager"
          />
          {/* Le voile de papier, qui s'éteint en courbe douce sur la photo :
              il monte du bas sur téléphone, il vient de la droite sur grand écran. */}
          <div className="ed-voile" aria-hidden="true" />
        </motion.div>

        <div className="relative min-h-[100dvh] flex flex-col justify-end lg:justify-center lg:ml-auto lg:w-[66%] px-5 pt-[46dvh] pb-14 md:px-12 md:pb-16 lg:pt-24 lg:pb-24 lg:pl-[24%] lg:pr-[6%]">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="ed-kicker"
          >
            <EditableText as="span" contentKey="home.hero.kicker" defaultValue="Thérapie somatique, mouvement, éducation, retraites." />
          </motion.p>

          <h1 className="ed-display mt-6 text-[clamp(2.9rem,5.6vw,6rem)] text-ink dark:text-stone-100 leading-[0.98] tracking-[-0.02em]">
            <MotsQuiMontent texte="Territoire Incarné" delai={0.35} />
          </h1>

          <motion.span
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.95, ease: EASE }}
            className="block origin-left w-[74px] h-[2px] bg-rust/80 mt-8 mb-7"
            aria-hidden="true"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.05, ease: EASE }}
            className="max-w-xl font-serif text-2xl md:text-3xl font-light leading-snug text-ink/85 dark:text-stone-200"
          >
            <EditableText as="span" contentKey="home.hero.lede" defaultValue={ledeApropos} />
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.15, ease: EASE }}
            className="ed-kicker mt-8"
          >
            <EditableText as="span" contentKey="home.hero.subtitle" defaultValue="par Elise .G Lortie" />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.3, ease: EASE }}
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
      </section>

      {/* ── Sommaire : la grille bento ─────────────────────────────────────
          Chaque section devient une tuile de texte, son nom en grand comme un titre
          et sa phrase juste en dessous, sans photo.
          Les largeurs se comptent sur six colonnes, deux grandes tuiles puis des
          rangées de trois, et la dernière rangée se remplit toujours. */}
      <section className="w-full px-5 md:px-12 lg:px-16 py-20 md:py-28 border-t border-ink/10 dark:border-white/10" aria-label={t.general.sommaire}>
        <Reveal>
          <p className="ed-kicker mb-10">{t.general.sommaire}</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
          {visibles.map((id, i) => {
            const section = t.sections[id] as { title: string; intro?: string };
            return (
              <Reveal key={id} delay={i * 0.05} className={LARGEURS[colonnes[i]] ?? "lg:col-span-2"}>
                <a
                  href={pathForSection(id)}
                  onClick={handleNav(id, onOpen)}
                  className="group relative flex h-full min-h-[15rem] md:min-h-[17rem] flex-col justify-between overflow-hidden rounded-[15px] ring-1 ring-ink/10 dark:ring-white/10 bg-white/60 dark:bg-white/[0.05] p-6 md:p-8 hover:bg-white dark:hover:bg-white/[0.09] transition-colors"
                >
                  <p className="ed-kicker">0{i + 1}</p>
                  <div className="mt-8">
                    <h3 className="ed-display text-[clamp(1.9rem,2.8vw,3rem)] text-ink dark:text-stone-100 group-hover:text-rust dark:group-hover:text-white transition-colors">
                      {t.nav[id]}
                    </h3>
                    {section.intro && (
                      <p className="mt-3 max-w-md font-serif text-base md:text-lg leading-snug text-ink/65 dark:text-stone-300">
                        {section.intro}
                      </p>
                    )}
                  </div>
                  <span className="absolute top-6 right-6 text-rust opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={20} />
                  </span>
                </a>
              </Reveal>
            );
          })}
        </div>
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
