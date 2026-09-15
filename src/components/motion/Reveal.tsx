import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

const EASE = [0.16, 0.8, 0.24, 1] as const;
const EASE_CSS = "cubic-bezier(0.16, 0.8, 0.24, 1)";

/** Fondu + montée au défilement, une seule fois. framer-motion respecte déjà
 *  prefers-reduced-motion (aucune branche séparée à écrire ici). */
export const Reveal = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

/** L'entrée d'une photo : un balayage qui part du centre et s'ouvre vers les deux bords,
 *  fondu compris (ordre d'Alex, 15 septembre 2026). Le cadre s'ouvre par `clip-path`, la
 *  photo à l'intérieur se resserre légèrement en même temps, pour que le mouvement respire.
 *  Le balayage passe par une transition CSS (le navigateur interpole `inset()` nativement),
 *  et framer-motion ne sert qu'à savoir quand le cadre entre dans l'écran. */
export const RevealPhoto = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div
      ref={ref}
      className={`motion-reduce:!opacity-100 motion-reduce:![clip-path:none] ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        clipPath: visible ? "inset(0% 0% 0% 0%)" : "inset(0% 50% 0% 50%)",
        transition: `clip-path 1.15s ${EASE_CSS} ${delay}s, opacity 1.15s ${EASE_CSS} ${delay}s`,
      }}
    >
      <div
        className="w-full h-full motion-reduce:!transform-none"
        style={{ transform: visible ? "scale(1)" : "scale(1.08)", transition: `transform 1.4s ${EASE_CSS} ${delay}s` }}
      >
        {children}
      </div>
    </div>
  );
};
