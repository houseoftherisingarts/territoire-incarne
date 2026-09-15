import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 0.8, 0.24, 1] as const;

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
 *  photo à l'intérieur se resserre légèrement en même temps, pour que le mouvement respire. */
export const RevealPhoto = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, clipPath: "inset(0% 50% 0% 50%)" }}
    whileInView={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 1.15, delay, ease: EASE }}
    className={className}
  >
    <motion.div
      initial={{ scale: 1.08 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.4, delay, ease: EASE }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  </motion.div>
);
