"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger offset in seconds. */
  delay?: number;
  /** Travel distance in px. Opacity + transform only — never layout-shifting. */
  y?: number;
};

/**
 * Scroll-triggered entrance for section content.
 * - Fires once; content is never skipped during fast scrolling.
 * - With reduced motion, content is shown immediately without animation.
 * - Animates opacity/transform only, so no layout shift (CLS-safe).
 */
export function Reveal({ children, className, delay = 0, y = 28 }: RevealProps) {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return <div className={`motion-reveal ${className ?? ""}`}>{children}</div>;
  }

  return (
    <motion.div
      className={`motion-reveal ${className ?? ""}`}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
