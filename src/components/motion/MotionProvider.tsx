"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Global Motion configuration: honor the OS reduced-motion preference for
 * every Motion-driven animation on the page (belt and braces — the Reveal /
 * HeroEntrance components already swap to static markup themselves).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
