"use client";

import Link from "next/link";
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
 * Segmented control of the three locale routes. Each destination is a real,
 * server-rendered page; the middleware writes the preference cookie on visit,
 * so the choice persists without any client state.
 */
export function LanguageSwitcher({ locale, label }: LanguageSwitcherProps) {
  return (
    <nav
      aria-label={label}
      className="inline-flex items-center rounded-full border border-bone/10 bg-forest/60 p-0.5"
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={`/${l}`}
            hrefLang={l}
            aria-current={active ? "true" : undefined}
            onClick={() => persistLocale(l)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors duration-200 ${
              active
                ? "bg-bone text-charcoal"
                : "text-bone/60 hover:text-bone focus-visible:text-bone"
            }`}
          >
            <span aria-hidden="true">{localeShort[l]}</span>
            <span className="sr-only">{localeNames[l]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
