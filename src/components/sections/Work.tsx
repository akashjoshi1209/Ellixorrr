import { Plus } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule, SectionShell } from "@/components/sections/SectionShell";
import type { Dictionary } from "@/i18n/types";

type WorkProps = {
  dict: Dictionary;
};

/**
 * Selected-work showcase. Deliberately contains NO fabricated projects,
 * clients or testimonials — three clearly-labelled placeholder tiles wait
 * for real work, distinguished by kind (client / personal / demo).
 */
export function Work({ dict }: WorkProps) {
  return (
    <SectionShell id="work" index="05" surface="forest" aria-label={dict.work.eyebrow}>
      <Reveal>
        <EyebrowRule eyebrow={dict.work.eyebrow} />
        <h2 className="display-lg mt-6 max-w-3xl">{dict.work.title}</h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-bone/60">{dict.work.notice}</p>
      </Reveal>

      <ul className="mt-14 grid gap-6 md:grid-cols-3">
        {dict.work.placeholders.map((project, index) => {
          const isDemo = project.kind === dict.work.placeholders[2].kind;
          return (
            <li key={project.kind}>
              <Reveal delay={0.08 * index}>
                <article className="group flex h-full flex-col border border-bone/10 bg-charcoal/40 transition-colors duration-300 hover:border-bone/25">
                  {/* Purposeful placeholder canvas — depth without invented work. */}
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-bone/10 bg-forest">
                    <div aria-hidden="true" className="absolute inset-0 grid-texture" />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(10 34 24 / 0.45)_0%,transparent_70%)]"
                    />
                    <Plus
                      aria-hidden="true"
                      className="h-10 w-10 text-bone/30 transition-all duration-500 group-hover:rotate-90 group-hover:text-crimson-bright motion-reduce:transition-none"
                    />
                    {/* Corner marker: demo tiles are visually distinct from client work. */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-4 top-4 h-2 w-2 rounded-full ${
                        isDemo ? "bg-crimson" : "bg-forest"
                      }`}
                    />
                    {isDemo && (
                      <span
                        aria-hidden="true"
                        className="absolute right-4 top-4 px-2 py-0.5 rounded text-[0.55rem] font-semibold tracking-wider text-crimson/60 bg-crimson/10 border border-crimson/20"
                      >
                        {dict.work.demoBadge}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                      {project.kind}
                    </p>
                    <p className="text-xs text-bone/40">{project.status}</p>
                    <h3 className="display-md">{project.title}</h3>
                    <p className="text-sm leading-relaxed text-bone/60">{project.note}</p>
                    <p className="mt-auto pt-3 text-xs italic text-bone/35">{dict.work.tileNote}</p>
                  </div>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}
