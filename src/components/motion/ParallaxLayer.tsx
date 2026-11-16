"use client";

import { useEffect, useRef } from "react";

type ParallaxLayerProps = {
  children: React.ReactNode;
  /** Positive values move the layer slower than scroll (depth behind). */
  strength: number;
  className?: string;
};

/**
 * The one controlled GSAP use on the homepage: a scrub-linked parallax on the
 * hero's decorative background layers. Deliberately disabled for:
 * - prefers-reduced-motion users,
 * - coarse pointers / small screens (mobile performance),
 * - and it animates transform only, so it can never cause layout shift.
 */
export function ParallaxLayer({ children, strength, className }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 768px) and (pointer: fine)").matches) return;

    let cleanup = () => {};
    let cancelled = false;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      gsap.to(el, {
        yPercent: strength,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      cleanup = () => {
        ScrollTrigger.getAll().forEach((t) => {
          if (t.trigger === el.parentElement) t.kill();
        });
        gsap.killTweensOf(el);
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
