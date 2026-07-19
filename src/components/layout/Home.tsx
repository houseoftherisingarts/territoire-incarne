import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ELISE_FIELD_IMG, ELISE_HOME_BG } from "../../assets/images";
import { NAV_ORDER, type SectionId } from "../../types";
import { pathForSection } from "../../routes";
import type { Content } from "../../i18n";
import { EditableText } from "../edit/EditableText";
import { EditableImage } from "../edit/EditableImage";

interface Props {
  t: Content;
  onOpen: (id: SectionId) => void;
}

const handleNav =
  (id: SectionId, onOpen: (id: SectionId) => void) =>
  (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onOpen(id);
  };

export const Home = ({ t, onOpen }: Props) => {
  // Pointer position over the portrait frame, normalized to -0.5..0.5, spring-smoothed so the
  // centered portrait gently floats toward the cursor instead of snapping.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 90, damping: 16, mass: 0.7 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);
  const floatX = useTransform(sx, (v) => v * 30);
  const floatY = useTransform(sy, (v) => v * 30);

  const trackPointer = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const resetPointer = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <main
      onPointerMove={trackPointer}
      onPointerLeave={resetPointer}
      className="h-full w-full flex flex-col relative transition-all duration-[2000ms] ease-in-out px-6 md:px-12 lg:px-16 pt-8 pb-8"
    >
      {/* Home feature background: Élise in nature (AI-upscaled), kept legible by a paper/forest gradient. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        <img
          src={ELISE_HOME_BG}
          alt=""
          className="w-full h-full object-cover opacity-[0.30] dark:opacity-[0.22] grayscale"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-paper via-paper/65 to-paper/25 dark:from-forest dark:via-forest/75 dark:to-forest/35" />
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start w-full z-10 h-full">
        <div className="w-full lg:w-1/2 pl-0 lg:pl-0 flex flex-col items-start mb-6 lg:mb-0 h-full">
          <div className="mb-2 pl-12 lg:pl-0 flex-shrink-0">
            <EditableText
              as="h1"
              contentKey="home.hero.title"
              defaultValue="Territoire Incarné"
              className="text-4xl md:text-5xl lg:text-7xl font-light tracking-tight text-ink dark:text-stone-100 mb-2 not-italic block"
            />
            <EditableText
              as="p"
              contentKey="home.hero.subtitle"
              defaultValue="par Elise .G Lortie"
              className="font-sans text-xs tracking-[0.25em] opacity-50 uppercase ml-1 border-l border-stone-400 dark:border-stone-500 pl-4 py-1 dark:text-stone-200 inline-block"
            />
          </div>

        </div>

        <nav
          aria-label="Sections"
          className="w-full lg:w-1/2 flex flex-col items-start lg:items-end space-y-2 lg:space-y-4 pt-0 lg:pt-16 h-full overflow-y-auto lg:overflow-visible"
        >
          {NAV_ORDER.map((key, i) => (
            <a
              key={key}
              href={pathForSection(key)}
              onClick={handleNav(key, onOpen)}
              className="group relative text-left lg:text-right transition-all duration-700 hover:opacity-70 flex-shrink-0"
            >
              <span className="absolute -left-6 top-2 text-[9px] font-serif text-rust dark:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden lg:block">
                0{i + 1}
              </span>
              <span className="text-xl md:text-2xl lg:text-3xl font-light text-ink dark:text-stone-100 opacity-90 group-hover:text-rust dark:group-hover:text-white transition-colors duration-500 block leading-tight">
                {t.nav[key]}
              </span>
            </a>
          ))}
        </nav>
      </div>

      {/* Single feature portrait, centered in the hero. The square frame stays fixed;
          the image inside drifts with the cursor (spring-smoothed) for a parallax feel,
          and warms to colour on direct hover. */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-36 sm:w-40 lg:w-48 aspect-square overflow-hidden shadow-lg group transition-shadow duration-700 ease-out hover:shadow-2xl">
        <motion.div style={{ x: floatX, y: floatY, scale: 1.18 }} className="w-full h-full">
          <EditableImage
            contentKey="home.portrait.field"
            defaultUrl={ELISE_FIELD_IMG}
            alt="Elise .G Lortie dans un champ"
            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-[filter] duration-1000 ease-out"
            loading="eager"
          />
        </motion.div>
      </div>
    </main>
  );
};
