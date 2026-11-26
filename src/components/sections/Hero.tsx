import { ArrowDown, ArrowUpRight } from "lucide-react";
import { HeroEntrance } from "@/components/motion/HeroEntrance";
import type { Dictionary } from "@/i18n/types";

type HeroProps = {
  dict: Dictionary;
};

/**
 * Hero — an asymmetric dossier cover. The oversized claim stays dominant,
 * while a restrained ledger panel gives the page a technical anchor without
 * inventing clients, metrics or endorsements. Decorative layers are
 * aria-hidden; no WebGL is mounted here.
 */
export function Hero({ dict }: HeroProps) {
  return (
    <section
      id="home"
      aria-label={dict.hero.eyebrow}
      className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden bg-charcoal"
    >
      <div aria-hidden="true" className="absolute inset-0 grid-texture" />
      <div
        aria-hidden="true"
        className="absolute inset-0 forest-glow [--glow-x:78%] [--glow-y:6%]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 ledger-grid opacity-50" />

      <div className="relative mx-auto w-full max-w-7xl px-gutter pb-12 pt-32 md:pb-16 md:pt-40">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <HeroEntrance delay={0}>
              <div className="flex items-center gap-4">
                <span aria-hidden="true" className="h-2 w-2 bg-crimson" />
                <p className="eyebrow">{dict.hero.eyebrow}</p>
                <span aria-hidden="true" className="h-px flex-1 bg-rule" />
              </div>
            </HeroEntrance>

            <h1 className="display-xl mt-7 max-w-4xl">
              <HeroEntrance delay={0.08}>
                <span className="block">{dict.hero.titleA}</span>
              </HeroEntrance>
              <HeroEntrance delay={0.18}>
                <span className="mt-1 block">{dict.hero.titleB}</span>
              </HeroEntrance>
            </h1>

            <HeroEntrance delay={0.26}>
              <span aria-hidden="true" className="mt-8 block h-px w-24 bg-crimson" />
            </HeroEntrance>

            <HeroEntrance delay={0.3}>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-muted md:text-lg">
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
                  className="inline-flex items-center gap-2 rounded-full border border-rule-strong px-6 py-3 text-sm font-semibold text-bone transition-colors duration-200 hover:border-bone focus-visible:border-bone"
                >
                  {dict.hero.ctaSecondary}
                </a>
              </div>
            </HeroEntrance>
          </div>

          <div className="lg:col-span-5">
            <HeroEntrance delay={0.34}>
              <div
                aria-hidden="true"
                className="dossier-panel relative flex min-h-72 flex-col overflow-hidden p-6 md:min-h-96 md:p-8"
              >
                <div className="flex items-start justify-between gap-6 border-b border-rule pb-5">
                  <div>
                    <p className="eyebrow">{dict.hero.capabilities}</p>
                    <p className="mt-2 font-display text-sm tracking-[0.18em] text-muted">
                      ELLIXORRR / 04
                    </p>
                  </div>
                  <p className="eyebrow">{dict.hero.index}</p>
                </div>

                <ul className="mt-2">
                  {dict.services.items.map((service, index) => (
                    <li
                      key={service.name}
                      className="flex items-baseline gap-4 border-b border-rule py-3 last:border-b-0"
                    >
                      <span className="font-display text-xs text-crimson-bright">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-sm text-bone md:text-base">
                        {service.name}
                      </span>
                      <span className="ms-auto hidden text-right text-xs uppercase tracking-[0.14em] text-muted sm:block">
                        {service.tagline}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-end justify-between gap-4 pt-10">
                  <span className="ghost-numeral text-[clamp(3rem,6vw,5rem)]">E</span>
                  <span className="h-8 w-8 border-b border-r border-rule-strong" />
                </div>
              </div>
            </HeroEntrance>
          </div>
        </div>

        <HeroEntrance delay={0.55}>
          <div className="mt-14 flex items-center justify-between border-t border-rule pt-5 md:mt-20">
            <p className="eyebrow flex items-center gap-2">
              <ArrowDown
                className="h-3.5 w-3.5 motion-reduce:animate-none"
                aria-hidden="true"
              />
              {dict.hero.scrollHint}
            </p>
            <p className="font-display text-xs tracking-[0.28em] text-muted">ELLIXORRR</p>
          </div>
        </HeroEntrance>
      </div>
    </section>
  );
}
