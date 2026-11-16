"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";

/**
 * Vendored ThreeUI component, client-only so it never blocks hero LCP.
 */
const EmeraldHorizonBackground = dynamic(
  () => import("./EmeraldHorizonBackground").then((m) => m.EmeraldHorizonBackground),
  { ssr: false }
);

/**
 * Hero right-side animated field.
 *
 * Vendored ThreeUI `EmeraldHorizonBackground` (SHA-256 66211b279456), mounted
 * only on capable desktop clients. Behaviour contract:
 * - Dynamically imported (`ssr: false`) — zero impact on hero LCP.
 * - `prefers-reduced-motion` → renders nothing; the page's existing static
 *   `forest-glow` layer provides the identical look without animation.
 * - No WebGL context → renders nothing (static fallback).
 * - `aria-hidden` decorative — no text, no focusable controls.
 * - Pauses off-screen and on tab-hide, disposes WebGL on unmount (implemented
 *   in the vendored component).
 *
 * Hydration safety: the first client render returns `null` (matching SSR),
 * then mounts via effect after WebGL/reduced-motion is settled — so there is
 * no initial-UI mismatch against the server.
 *
 * Removable: deleting this file and its single Hero.tsx line restores today's
 * hero exactly.
 */
export function EmeraldHorizonField({ className }: { className?: string }) {
  const reduceMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    const webgl = !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
    // Intentional: first client render must return null (matching SSR); mount
    // only after the WebGL probe settles to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(webgl && !reduceMotion);
  }, [reduceMotion]);

  // Render nothing under reduced motion, no WebGL, or before mount settles —
  // the page's existing static `forest-glow` layer covers the look.
  if (!mounted) return null;

  return (
    <div aria-hidden="true" className={className}>
      <EmeraldHorizonBackground
        speed={1}
        waveScale={0.3}
        variation={1}
        glow={0.3}
        vignette={1}
        hue={0}
      />
      {/* Soft bottom fade so the field integrates behind the offset panels
          without a concentrated bright block along the lower edge. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/30 to-transparent pointer-events-none"
      />
    </div>
  );
}
