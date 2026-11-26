import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule, SectionShell } from "@/components/sections/SectionShell";
import type { Dictionary } from "@/i18n/types";

type BrandIntroProps = {
  dict: Dictionary;
};

/** Brand introduction as a two-column dossier entry on the forest surface. */
export function BrandIntro({ dict }: BrandIntroProps) {
  return (
    <SectionShell id="about" index="01" surface="forest" aria-label={dict.intro.eyebrow}>
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-7">
          <Reveal>
            <EyebrowRule eyebrow={dict.intro.eyebrow} />
            <h2 className="display-lg mt-6 max-w-3xl">{dict.intro.title}</h2>
            <span aria-hidden="true" className="mt-10 block h-px w-full max-w-sm bg-rule-strong" />
          </Reveal>
        </div>
        <div className="md:col-span-5 md:pt-2">
          {dict.intro.paragraphs.map((paragraph, index) => (
            <Reveal key={index} delay={0.08 * (index + 1)}>
              <p className="mb-6 border-l border-rule pl-5 text-sm leading-relaxed text-muted">
                {paragraph}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
