"use client";

import Link from "next/link";
import { locales, localeNames, localeShort, type Locale } from "@/i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
};

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
