import { ELISE_MAIN_IMG, ELISE_FIELD_IMG, IMG_THERAPIE, ELISE_HOME_BG } from "../../assets/images";
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

export const Home = ({ t, onOpen }: Props) => (
  <main className="h-full w-full flex flex-col relative transition-all duration-[2000ms] ease-in-out px-6 md:px-12 lg:px-16 pt-8 pb-8">
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
            defaultValue="par Elise G. Lortie"
            className="font-sans text-xs tracking-[0.25em] opacity-50 uppercase ml-1 border-l border-stone-400 dark:border-stone-500 pl-4 py-1 dark:text-stone-200 inline-block"
          />
        </div>

        <div className="mt-12 flex flex-col gap-4 w-full max-w-[140px] md:max-w-[160px] lg:max-w-[180px] overflow-hidden flex-shrink-0 pl-12 lg:pl-0">
          {[
            { key: "home.portrait.main",  src: ELISE_MAIN_IMG,  alt: "Portrait d'Elise G. Lortie", priority: true },
            { key: "home.portrait.soin",  src: IMG_THERAPIE,    alt: "Soin somatique",             priority: false },
            { key: "home.portrait.field", src: ELISE_FIELD_IMG, alt: "Elise dans un champ",        priority: false },
          ].map((img) => (
            <div
              key={img.key}
              className="relative group w-full aspect-square overflow-hidden shadow-lg transition-transform duration-700 hover:scale-[1.02]"
            >
              <EditableImage
                contentKey={img.key}
                defaultUrl={img.src}
                alt={img.alt}
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000"
                loading={img.priority ? "eager" : "lazy"}
              />
            </div>
          ))}
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
  </main>
);
