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
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">{dict.work.notice}</p>
        <div className="mt-8 max-w-xl border-l border-rule pl-5">
          <p className="eyebrow text-crimson-bright">{dict.work.criteriaTitle}</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            {dict.work.criteria.map((criterion) => (
              <li key={criterion} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-crimson-bright"
                />
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <ul className="mt-14 grid gap-6 md:grid-cols-3">
        {dict.work.placeholders.map((project, index) => {
          const isDemo = index === 2;
          return (
            <li key={project.kind}>
              <Reveal delay={0.08 * index}>
                <article className="group flex h-full flex-col border border-rule bg-forest/40 transition-colors duration-300 hover:border-rule-strong">
                  {/* Purposeful placeholder canvas — depth without invented work. */}
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-rule bg-forest">
                    <div aria-hidden="true" className="absolute inset-0 grid-texture" />
                    <div aria-hidden="true" className="absolute inset-0 ledger-grid opacity-50" />
                    <Plus
                      aria-hidden="true"
                      className="h-10 w-10 text-muted transition-all duration-500 group-hover:rotate-90 group-hover:text-crimson-bright motion-reduce:transition-none"
                    />
                    {/* Corner marker: demo tiles are visually distinct from client work. */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-4 top-4 h-2 w-2 rounded-full ${
                        isDemo ? "bg-crimson" : "bg-rule-strong"
                      }`}
                    />
                    {isDemo && (
                      <span className="absolute right-4 top-4 rounded border border-crimson/30 bg-crimson/10 px-2 py-0.5 text-xs font-semibold tracking-wider text-crimson-bright">
                        {dict.work.demoBadge}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      {project.kind}
                    </p>
                    <p className="text-xs text-muted">{project.status}</p>
                    <h3 className="display-md">{project.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{project.note}</p>
                    <p className="mt-auto pt-3 text-xs italic text-muted">{dict.work.tileNote}</p>
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
