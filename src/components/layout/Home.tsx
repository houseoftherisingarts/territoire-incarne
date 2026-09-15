import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ELISE_HOME_BG, ELISE_FIELD_IMG, IMG_THERAPIE, photoPourSection } from "../../assets/images";
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
/** Le seul cadrage qui ne tombe pas juste au centre : la plante de la tablette vit à droite
 *  de sa photo, très panoramique, et disparaîtrait du cadre autrement. */
const CADRAGE: Partial<Record<SectionId, string>> = {
  boutique: "object-[76%_center]",
};

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
      {/* ── Hero : le papier, et le tirage posé au centre ───────────────────
          La photo d'Élise est une petite image d'origine (547 × 272). Elle est
          servie à sa taille exacte, jamais agrandie, posée au milieu de la page
          comme un tirage sur une table. Le texte l'encadre dans la grammaire
          éditoriale du site : kicker et titre au-dessus, filet, phrase et portes
          en dessous, tout aligné sur le bord gauche. */}
      <section className="relative w-full min-h-[100dvh] flex flex-col justify-center bg-paper dark:bg-forest px-5 md:px-12 lg:px-16 pt-24 pb-16 md:pt-28 md:pb-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="ed-kicker"
        >
          <EditableText as="span" contentKey="home.hero.kicker" defaultValue="Thérapie somatique, mouvement, éducation, retraites." />
        </motion.p>

        <h1 className="ed-display mt-5 text-[clamp(2.6rem,4.6vw,5rem)] text-ink dark:text-stone-100 leading-[1.0] tracking-[-0.02em]">
          <MotsQuiMontent texte="Territoire Incarné" delai={0.35} />
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.75, ease: EASE }}
          className="my-10 md:my-12 lg:my-14"
        >
          <EditableImage
            contentKey="home.hero.photo"
            defaultUrl={ELISE_HOME_BG}
            alt="Elise .G Lortie, assise au pied d'un arbre"
            className="block mx-auto w-auto h-auto max-w-full max-h-[32vh] ring-1 ring-ink/10 dark:ring-white/10"
            loading="eager"
          />
        </motion.div>

        <motion.span
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.7, delay: 1.05, ease: EASE }}
          className="block origin-left w-[74px] h-[2px] bg-rust/80 mb-7"
          aria-hidden="true"
        />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.15, ease: EASE }}
          className="max-w-2xl font-serif text-2xl md:text-3xl font-light leading-snug text-ink/85 dark:text-stone-200"
        >
          <EditableText as="span" contentKey="home.hero.lede" defaultValue={ledeApropos} />
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.25, ease: EASE }}
          className="ed-kicker mt-7"
        >
          <EditableText as="span" contentKey="home.hero.subtitle" defaultValue="par Elise .G Lortie" />
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.4, ease: EASE }}
          className="mt-9 flex flex-wrap items-center gap-4"
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
      </section>

      {/* ── Sommaire : la grille bento ─────────────────────────────────────
          Chaque section devient une tuile : sa photo tient le cadre, et son nom
          se pose en bas sur un verre dépoli qui laisse deviner l'image dessous.
          Les largeurs se comptent sur six colonnes, deux grandes tuiles puis des
          rangées de trois, et la dernière rangée se remplit toujours. */}
      <section className="w-full px-5 md:px-12 lg:px-16 py-20 md:py-28 border-t border-ink/10 dark:border-white/10" aria-label={t.general.sommaire}>
        <Reveal>
          <p className="ed-kicker mb-10">{t.general.sommaire}</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
          {visibles.map((id, i) => {
            const section = t.sections[id] as { title: string; intro?: string };
            const photo = photoPourSection(id);
            return (
              <Reveal key={id} delay={i * 0.05} className={LARGEURS[colonnes[i]] ?? "lg:col-span-2"}>
                <a
                  href={pathForSection(id)}
                  onClick={handleNav(id, onOpen)}
                  className="group relative block h-[22rem] md:h-[26rem] overflow-hidden rounded-[15px] ring-1 ring-ink/10 dark:ring-white/10 bg-clay/10 dark:bg-white/5"
                >
                  {photo && (
                    <img
                      src={photo}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={`absolute inset-0 w-full h-full object-cover ${CADRAGE[id] ?? ""} transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]`}
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-7 bg-paper/75 dark:bg-forest/75 backdrop-blur-xl border-t border-ink/10 dark:border-white/10">
                    <p className="ed-kicker">0{i + 1}</p>
                    <h3 className="mt-2 font-serif text-2xl md:text-3xl font-light leading-[1.1] text-ink dark:text-stone-100 group-hover:text-rust dark:group-hover:text-white transition-colors">
                      {t.nav[id]}
                    </h3>
                    {section.intro && (
                      <p className="mt-2 font-serif text-base md:text-lg leading-snug text-ink/65 dark:text-stone-300 line-clamp-2">
                        {section.intro}
                      </p>
                    )}
                  </div>
                  <span className="absolute top-5 right-5 w-11 h-11 rounded-full bg-paper/80 dark:bg-forest/80 backdrop-blur-md flex items-center justify-center text-rust opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={18} />
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
