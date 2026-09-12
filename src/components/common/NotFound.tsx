import { motion } from "framer-motion";
import type { Content } from "../../i18n";
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
 *  sienne en repère, deux lignes sobres, une seule porte de retour. */
export const NotFound = ({ t, onHome }: Props) => {
  const nf = t.notFound;
  return (
    <div className="relative min-h-[100dvh] w-full flex items-center overflow-hidden bg-paper dark:bg-forest text-ink dark:text-stone-100">
      <SomaticCurves className="text-rust/40 dark:text-stone-300/20" />
      <LinenPattern />

      <div className="relative z-10 w-full px-6 md:px-16 lg:px-24 py-20">
        <div className="max-w-2xl">
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
    </div>
  );
};
