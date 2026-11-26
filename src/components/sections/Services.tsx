import { AppWindow, ArrowUpRight, Blocks, Globe, Workflow } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule, SectionShell } from "@/components/sections/SectionShell";
import type { Dictionary } from "@/i18n/types";

type ServicesProps = {
  dict: Dictionary;
};

const icons = [Globe, AppWindow, Workflow, Blocks];

/** The four core services as a strict technical index — no fifth service. */
export function Services({ dict }: ServicesProps) {
  return (
    <SectionShell id="services" index="02" aria-label={dict.services.eyebrow}>
      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-7">
          <Reveal>
            <EyebrowRule eyebrow={dict.services.eyebrow} />
            <h2 className="display-lg mt-6 max-w-3xl">{dict.services.title}</h2>
          </Reveal>
        </div>
        <div className="flex items-end md:col-span-5 md:justify-end">
          <p aria-hidden="true" className="eyebrow border-t border-rule pt-4">04</p>
        </div>
      </div>

      <ul className="mt-14 border-t border-rule-strong">
        {dict.services.items.map((service, index) => {
          const Icon = icons[index];
          return (
            <li key={service.name} className="border-b border-rule">
              <Reveal delay={0.05 * index} y={16}>
                <a
                  href="#contact"
                  aria-label={`${dict.services.discuss}: ${service.name}`}
                  className="group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-bright"
                >
                  <div className="grid items-start gap-4 px-2 py-10 transition-colors duration-300 group-hover:bg-forest/50 md:grid-cols-12 md:gap-6 md:px-4">
                    <div className="flex items-center gap-4 md:col-span-4">
                      <span
                        aria-hidden="true"
                        className="font-display text-sm font-semibold text-crimson-bright"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon
                        className="h-5 w-5 text-muted transition-colors duration-300 group-hover:text-bone"
                        aria-hidden="true"
                      />
                      <h3 className="display-md">{service.name}</h3>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted md:col-span-3">
                      {service.tagline}
                    </p>
                    <p className="text-sm leading-relaxed text-muted md:col-span-4">
                      {service.description}
                    </p>
                    <div className="hidden justify-end md:col-span-1 md:flex">
                      <ArrowUpRight
                        className="h-5 w-5 text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-crimson-bright"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </a>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}
