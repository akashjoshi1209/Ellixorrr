import Link from "next/link";
import { EyebrowRule } from "@/components/sections/SectionShell";
type PortalChromeProps = {
  eyebrow: string;
  title: string;
  description?: string;
  navLabel: string;
  nav: ReadonlyArray<{ href: string; label: string }>;
  current: string;
  children: React.ReactNode;
};

/** Shared shell for customer and admin route surfaces. */
export function PortalChrome({
  eyebrow,
  title,
  description,
  navLabel,
  nav,
  current,
  children,
}: PortalChromeProps) {
  return (
    <section className="relative overflow-hidden border-t border-rule bg-charcoal py-14 md:py-20">
      <div aria-hidden="true" className="grid-texture absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-gutter">
        <div className="border-b border-rule pb-8">
          <EyebrowRule eyebrow={eyebrow} />
          <h1 className="display-md mt-4 max-w-3xl">{title}</h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <nav aria-label={navLabel} className="lg:col-span-3">
            <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
              {nav.map((item) => {
                const active = item.href === current;
                return (
                  <li key={item.href} className="shrink-0 lg:w-full">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex w-full items-center justify-between gap-3 border px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                        active
                          ? "border-crimson bg-crimson/10 text-bone"
                          : "border-rule text-muted hover:border-bone/30 hover:text-bone"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span aria-hidden="true" className="font-mono text-[10px] opacity-60">↗</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="min-w-0 lg:col-span-9">{children}</div>
        </div>
      </div>
    </section>
  );
}

type PortalErrorProps = {
  heading: string;
  message: string;
};

/** Discard-safe fallback for Supabase read failures. */
export function PortalError({ heading, message }: PortalErrorProps) {
  return (
    <div role="alert" className="dossier-panel border border-crimson/30 p-6">
      <p className="eyebrow text-crimson-bright">!</p>
      <p className="mt-3 text-sm font-semibold text-bone">{heading}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
    </div>
  );
}
