import type { ReactNode } from "react";
import { EyebrowRule } from "@/components/sections/SectionShell";

type AuthShellProps = {
  label: string;
  title: string;
  intro: string;
  icon?: ReactNode;
  children: ReactNode;
};

/**
 * Shared dossier-style shell for account routes. It fixes the missing page
 * heading on auth screens and keeps their visual language aligned with the
 * public Forest Ledger surface without introducing a new palette.
 */
export function AuthShell({
  label,
  title,
  intro,
  icon,
  children,
}: AuthShellProps) {
  return (
    <section className="relative flex min-h-svh flex-col justify-center overflow-hidden border-y border-rule bg-charcoal">
      <div aria-hidden="true" className="grid-texture absolute inset-0 opacity-70" />
      <div
        aria-hidden="true"
        className="forest-glow absolute inset-0 [--glow-x:82%] [--glow-y:0%]"
      />
      <div aria-hidden="true" className="ledger-grid absolute inset-x-0 bottom-0 h-1/2 opacity-40" />

      <div className="relative mx-auto w-full max-w-5xl px-gutter py-28 md:py-40">
        <div className="dossier-panel mx-auto max-w-md p-7 md:p-10">
          <div className="mb-8 border-b border-rule pb-8">
            <div className="flex items-center justify-between gap-4">
              <EyebrowRule eyebrow={label} />
              {icon ? (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rule-strong bg-crimson/10 text-crimson-bright [&>svg]:h-4 [&>svg]:w-4">
                  {icon}
                </span>
              ) : null}
            </div>
            <h1 className="display-md mt-5">{title}</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">{intro}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
