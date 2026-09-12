import { motion } from "framer-motion";
import type { Content } from "../../i18n";
import { ELISE_FIELD_IMG } from "../../assets/images";
import { LinenPattern } from "../decor/LinenPattern";
import { SomaticCurves } from "../decor/SomaticCurves";
import { OrganicBullet } from "../decor/OrganicBullet";

interface Props {
  t: Content;
  onHome: () => void;
}

const EASE = [0.16, 0.8, 0.24, 1] as const;

/** Page 404 : le chemin ne correspond à aucune section, aucun écrit, aucune vue admin ou client.
 *  Une scène dans l'univers d'Elise, celui du chemin qui se perd et qui revient : une phrase déjà
 *  sienne en repère, deux lignes sobres, une seule porte de retour. Double page comme les sections
 *  (photo collée en colonne), reprise à droite pour laisser le texte à sa place habituelle. */
export const NotFound = ({ t, onHome }: Props) => {
  const nf = t.notFound;
  return (
    <div className="relative min-h-[100dvh] w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-paper dark:bg-forest text-ink dark:text-stone-100">
      <div className="relative lg:col-span-7 flex items-center overflow-hidden px-6 md:px-16 lg:px-20 py-20">
        <SomaticCurves className="text-rust/40 dark:text-stone-300/20" />
        <LinenPattern />

        <div className="relative z-10 max-w-2xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="ed-kicker mb-6 flex items-center gap-3"
          >
            <OrganicBullet index={2} />
            {nf.kicker}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
            className="ed-display text-[clamp(2.8rem,8vw,6.5rem)] text-ink dark:text-stone-100"
          >
            {nf.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
            className="mt-8 max-w-xl border-l border-rust/60 pl-5 font-serif text-xl md:text-2xl font-light leading-snug text-ink/85 dark:text-stone-200"
          >
            « {nf.quote} »
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease: EASE }}
            className="mt-8 max-w-xl space-y-2 font-sans text-sm text-ink/70 dark:text-stone-300/80"
          >
            <p>{nf.line1}</p>
            <p>{nf.line2}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.95, ease: EASE }}
            className="mt-10"
          >
            <button
              onClick={onHome}
              className="inline-flex items-center gap-3 bg-rust text-paper font-sans text-xs font-semibold uppercase tracking-[0.22em] min-h-[52px] px-7 rounded-full transition-colors hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest"
            >
              {nf.cta}
            </button>
          </motion.div>
        </div>
      </div>

      <div className="relative h-[42dvh] lg:h-auto lg:col-span-5 overflow-hidden bg-stone-200 dark:bg-stone-900/40 lg:border-l border-ink/10 dark:border-white/10">
        <motion.div
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
          className="absolute inset-0"
        >
          <img
            src={ELISE_FIELD_IMG}
            alt={nf.imageAlt}
            className="w-full h-full object-cover grayscale-[10%]"
            loading="eager"
          />
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-paper/70 dark:from-forest/70 to-transparent lg:hidden" />
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-ink/10 dark:from-black/20 to-transparent" />
      </div>
    </div>
  );
};
