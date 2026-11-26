import type { ReactNode } from "react";

type SectionShellProps = {
  id: string;
  /** Decorative label shown behind the section (e.g. "01 — SERVICES"). */
  index?: string;
  surface?: "charcoal" | "forest";
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

/**
 * Consistent section container: rhythm, hairline transitions and the
 * charcoal/forest layered-surface system. The oversized index numeral is
 * decorative and kept on the left edge so it cannot cause right-side
 * horizontal overflow at tablet widths.
 */
export function SectionShell({
  id,
  index,
  surface = "charcoal",
  className = "",
  children,
  "aria-label": ariaLabel,
}: SectionShellProps) {
  const background =
    surface === "forest" ? "bg-forest border-y border-rule" : "bg-charcoal";

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={`relative overflow-hidden ${background} ${className}`}
    >
      {index ? (
        <span
          aria-hidden="true"
          className="ghost-numeral pointer-events-none absolute left-4 top-8 hidden text-[clamp(6rem,11vw,11rem)] opacity-70 md:block lg:left-16"
        >
          {index}
        </span>
      ) : null}
      <div className="relative mx-auto max-w-7xl px-gutter py-24 md:py-32">
        {children}
      </div>
    </section>
  );
}

type EyebrowRuleProps = {
  eyebrow: string;
  className?: string;
};

/** Crimson hairline + uppercase label; the section title renders separately. */
export function EyebrowRule({ eyebrow, className = "" }: EyebrowRuleProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span aria-hidden="true" className="h-px w-10 bg-crimson" />
      <p className="eyebrow">{eyebrow}</p>
    </div>
  );
}
