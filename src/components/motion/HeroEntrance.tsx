"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import type { ReactNode } from "react";

type HeroEntranceProps = {
  children: ReactNode;
  className?: string;
  /** Stagger offset in seconds for this child within the hero sequence. */
  delay?: number;
};

/**
 * Hero entrance choreography: each child rises and settles once on load.
 * Transform + opacity only (no blur on text, no layout shift), and skipped
 * entirely when the user prefers reduced motion.
 */
export function HeroEntrance({ children, className, delay = 0 }: HeroEntranceProps) {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={`motion-reveal ${className ?? ""}`}
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
