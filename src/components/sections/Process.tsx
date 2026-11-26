import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule, SectionShell } from "@/components/sections/SectionShell";
import type { Dictionary } from "@/i18n/types";

type ProcessProps = {
  dict: Dictionary;
};

/** Five-step working process as a numbered editorial ledger. */
export function Process({ dict }: ProcessProps) {
  return (
    <SectionShell id="process" index="04" aria-label={dict.process.eyebrow}>
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4">
          <Reveal>
            <EyebrowRule eyebrow={dict.process.eyebrow} />
            <h2 className="display-lg mt-6">{dict.process.title}</h2>
          </Reveal>
        </div>

        <ol className="border-b border-rule md:col-span-8">
          {dict.process.steps.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={0.05 * index} y={16}>
                <div className="flex gap-6 border-t border-rule py-8 md:gap-10 md:py-10">
                  <span
                    aria-hidden="true"
                    className="ghost-numeral shrink-0 text-[clamp(2.5rem,5vw,4.5rem)]"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="display-md">{step.title}</h3>
                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </SectionShell>
  );
}
