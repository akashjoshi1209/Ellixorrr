import { AppWindow, ArrowUpRight, Blocks, Globe, Workflow } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule, SectionShell } from "@/components/sections/SectionShell";
import type { Dictionary } from "@/i18n/types";

type ServicesProps = {
  dict: Dictionary;
};

const icons = [Globe, AppWindow, Workflow, Blocks];

/** The four core services as an editorial index — no fifth service exists. */
export function Services({ dict }: ServicesProps) {
  return (
    <SectionShell id="services" index="02" aria-label={dict.services.eyebrow}>
      <Reveal>
        <EyebrowRule eyebrow={dict.services.eyebrow} />
        <h2 className="display-lg mt-6 max-w-3xl">{dict.services.title}</h2>
      </Reveal>

      <ul className="mt-14 border-t border-bone/10">
        {dict.services.items.map((service, index) => {
          const Icon = icons[index];
          return (
            <li key={service.name} className="border-b border-bone/10">
              <Reveal delay={0.05 * index} y={16}>
                <div className="group relative">
                  <div className="grid items-start gap-4 px-2 py-10 transition-colors duration-300 group-hover:bg-bone/[0.03] md:grid-cols-12 md:gap-6 md:px-4">
                    <div className="flex items-center gap-4 md:col-span-4">
                      <span
                        aria-hidden="true"
                        className="font-display text-sm font-semibold text-bone/40 transition-colors duration-300 group-hover:text-crimson-bright"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon
                        className="h-5 w-5 text-bone/50 transition-colors duration-300 group-hover:text-bone"
                        aria-hidden="true"
                      />
                      <h3 className="display-md">{service.name}</h3>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 md:col-span-3">
                      {service.tagline}
                    </p>
                    <p className="text-sm leading-relaxed text-bone/70 md:col-span-4">
                      {service.description}
                    </p>
                    <div className="hidden justify-end md:col-span-1 md:flex">
                      <ArrowUpRight
                        className="h-5 w-5 text-bone/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-crimson-bright"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}
