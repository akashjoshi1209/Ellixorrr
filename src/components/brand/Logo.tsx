type LogoMarkProps = {
  className?: string;
};

/**
 * ELLIXORRR emblem — the approved standalone logo artwork.
 * Served from /ellixorrr-emblem.svg (optimized from the approved source trace;
 * artwork, colors and shapes preserved verbatim). Colors are baked into the
 * artwork, so hover feedback is opacity-based rather than color-based.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG asset, intrinsic size known
    <img
      src="/ellixorrr-emblem.svg"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
    />
  );
}

type LogoProps = {
  href: string;
  linkLabel: string;
};

/** Emblem-only logo lockup (header). Links to the localized homepage. */
export function Logo({ href, linkLabel }: LogoProps) {
  return (
    <a
      href={href}
      className="group inline-flex min-h-11 min-w-11 items-center justify-center"
      aria-label={`ELLIXORRR — ${linkLabel}`}
    >
      <LogoMark className="h-8 w-auto shrink-0 transition-opacity duration-300 group-hover:opacity-80" />
    </a>
  );
}
