"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe reduced-motion detection. Unlike motion/react's useReducedMotion
 * outside a MotionConfig, this always observes the live media query.
 * Returns false during SSR/first render (motion components render, then
 * swap to static markup when the preference is detected).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduce;
}
