"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LOCALE_COOKIE,
  locales,
  localeNames,
  localeShort,
  type Locale,
} from "@/i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
};

type LocaleLinkProps = {
  locale: Locale;
  children: ReactNode;
  className?: string;
  current?: boolean;
  onClick?: () => void;
};

const localePrefix = /^\/(?:en|hi|mr)(?=\/|$)/;

/**
 * Persists the chosen locale in the preference cookie.
 *
 * The proxy normally writes this cookie while serving a locale-prefixed
 * page. A client-side navigation, however, can be served entirely from the
 * Next.js router cache, in which case no request reaches the proxy at all.
 * Writing the cookie here guarantees the preference always follows the
 * language the visitor actually selected.
 *
 * This is a plain, non-HttpOnly preference cookie. It carries no
 * credentials and is validated against the known locale list before use.
 */
function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Locale link that preserves the visitor's current route instead of always
 * dropping them on the homepage. `usePathname` is a Client Component hook;
 * all locale segments are known at build time via generateStaticParams.
 */
export function LocaleLink({
  locale,
  children,
  className,
  current = false,
  onClick,
}: LocaleLinkProps) {
  const pathname = usePathname() || "";
  const suffix = pathname.replace(localePrefix, "");
  const href = `/${locale}${suffix}`;

  return (
    <Link
      href={href}
      hrefLang={locale}
      prefetch={false}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
      className={className}
    >
      {children}
    </Link>
  );
}

/**
 * Segmented control of the three locale routes. Each destination is a real,
 * server-rendered page; the middleware writes the preference cookie on visit,
 * so the choice persists without any client state.
 */
export function LanguageSwitcher({ locale, label }: LanguageSwitcherProps) {
  return (
    <nav
      aria-label={label}
      className="inline-flex items-center rounded-full border border-rule bg-forest/60 p-0.5"
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <LocaleLink
            key={l}
            locale={l}
            current={active}
            onClick={() => persistLocale(l)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors duration-200 ${
              active
                ? "bg-bone text-charcoal"
                : "text-muted hover:text-bone focus-visible:text-bone"
            }`}
          >
            <span aria-hidden="true">{localeShort[l]}</span>
            <span className="sr-only">{localeNames[l]}</span>
          </LocaleLink>
        );
      })}
    </nav>
  );
}
