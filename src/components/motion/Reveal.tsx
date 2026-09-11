import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Fondu + montée au défilement, une seule fois. framer-motion respecte déjà
 *  prefers-reduced-motion (aucune branche séparée à écrire ici). Réservé au mode éditorial. */
export const Reveal = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: [0.16, 0.8, 0.24, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);
