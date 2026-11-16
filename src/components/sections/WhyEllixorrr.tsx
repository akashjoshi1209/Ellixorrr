import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule, SectionShell } from "@/components/sections/SectionShell";
import type { Dictionary } from "@/i18n/types";

type WhyEllixorrrProps = {
  dict: Dictionary;
};

/** Four differentiators in a restrained 2×2 hairline grid. */
export function WhyEllixorrr({ dict }: WhyEllixorrrProps) {
  return (
    <SectionShell id="why" index="03" surface="forest" aria-label={dict.why.eyebrow}>
      <Reveal>
        <EyebrowRule eyebrow={dict.why.eyebrow} />
        <h2 className="display-lg mt-6 max-w-3xl">{dict.why.title}</h2>
      </Reveal>

      <ul className="mt-14 grid gap-px overflow-hidden border border-bone/10 bg-bone/10 sm:grid-cols-2">
        {dict.why.items.map((item, index) => (
          <li key={item.title} className="bg-forest">
            <Reveal delay={0.05 * index} y={16}>
              <div className="flex h-full flex-col gap-3 p-8 transition-colors duration-300 hover:bg-bone/[0.03] md:p-10">
                <span
                  aria-hidden="true"
                  className="font-display text-sm font-semibold text-crimson-bright"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="display-md max-w-xs">{item.title}</h3>
                <p className="text-sm leading-relaxed text-bone/70">{item.description}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
