import { ArrowDown, ArrowUpRight } from "lucide-react";
import { HeroEntrance } from "@/components/motion/HeroEntrance";
import { ParallaxLayer } from "@/components/motion/ParallaxLayer";
import { EmeraldHorizonField } from "@/components/threeui/EmeraldHorizonField";
import type { Dictionary } from "@/i18n/types";

type HeroProps = {
  dict: Dictionary;
};

/**
 * Hero — business-outcome headline, supporting description and the two CTAs.
 * Decorative layers (grid texture, forest glow, offset panels) are
 * presentation-only and aria-hidden; the single GSAP effect drives their
 * scroll parallax on capable desktop devices only.
 */
export function Hero({ dict }: HeroProps) {
  return (
    <section
      id="home"
      aria-label={dict.hero.eyebrow}
      className="relative flex min-h-svh flex-col justify-end overflow-hidden bg-charcoal"
    >
      {/* Decorative layer: fine grid + forest atmosphere */}
      <div aria-hidden="true" className="absolute inset-0 grid-texture" />
      <div
        aria-hidden="true"
        className="absolute inset-0 forest-glow [--glow-x:78%] [--glow-y:8%]"
      />

      {/* Decorative offset panels (parallax depth) */}
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[46%] md:block">
        {/* Animated emerald field behind the panels — subtle, headline-supporting. */}
        <EmeraldHorizonField className="absolute inset-0 h-full w-full" />
        <ParallaxLayer strength={14} className="absolute right-[10%] top-[14%] h-[55%] w-[62%]">
          <div className="h-full w-full border border-bone/10 bg-forest/80" />
        </ParallaxLayer>
        <ParallaxLayer strength={-9} className="absolute right-[24%] top-[30%] h-[52%] w-[58%]">
          <div className="h-full w-full border border-bone/10 bg-forest/50" />
        </ParallaxLayer>
        <ParallaxLayer strength={6} className="absolute right-[4%] top-[46%] h-[40%] w-[40%]">
          <div className="flex h-full w-full items-end p-6">
            <span className="ghost-numeral text-[clamp(4rem,7vw,8rem)]">E</span>
          </div>
        </ParallaxLayer>
      </div>

      {/* Content */}
      <div className="relative mx-auto w-full max-w-7xl px-gutter pb-16 pt-40 md:pb-24 md:pt-48">
        <HeroEntrance delay={0}>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-2 w-2 bg-crimson" />
            <p className="eyebrow">{dict.hero.eyebrow}</p>
          </div>
        </HeroEntrance>

        <h1 className="display-xl mt-8 max-w-5xl">
          <HeroEntrance delay={0.08}>
            <span className="block">{dict.hero.titleA}</span>
          </HeroEntrance>
          <HeroEntrance delay={0.18}>
            <span className="mt-1 block">
              {dict.hero.titleB}
              <span
                aria-hidden="true"
                className="ms-3 inline-block h-[0.09em] w-[1.6em] translate-y-[-0.28em] bg-crimson"
              />
            </span>
          </HeroEntrance>
        </h1>

        <HeroEntrance delay={0.3}>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-bone/70 md:text-lg">
            {dict.hero.description}
          </p>
        </HeroEntrance>

        <HeroEntrance delay={0.42}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full bg-bone px-6 py-3 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone"
            >
              {dict.hero.ctaPrimary}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-full border border-bone/20 px-6 py-3 text-sm font-semibold text-bone transition-colors duration-200 hover:border-bone/50 focus-visible:border-bone/50"
            >
              {dict.hero.ctaSecondary}
            </a>
          </div>
        </HeroEntrance>

        {/* Bottom strip */}
        <HeroEntrance delay={0.55}>
          <div className="mt-16 flex items-center justify-between border-t border-bone/10 pt-5 md:mt-24">
            <p className="eyebrow flex items-center gap-2">
              <ArrowDown
                className="h-3.5 w-3.5 animate-bounce motion-reduce:animate-none"
                aria-hidden="true"
              />
            </p>
            <p className="font-display text-xs tracking-[0.28em] text-bone/40">ELLIXORRR</p>
          </div>
        </HeroEntrance>
      </div>
    </section>
  );
}
