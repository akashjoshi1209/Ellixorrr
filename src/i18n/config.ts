export const locales = ["en", "hi", "mr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "ellixorrr-locale";

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
};

export const localeShort: Record<Locale, string> = {
  en: "EN",
  hi: "हिं",
  mr: "मर",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Negotiates the best locale from an Accept-Language header. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const candidates = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of candidates) {
    if (tag.startsWith("mr")) return "mr";
    if (tag.startsWith("hi")) return "hi";
    if (tag.startsWith("en")) return "en";
  }
  return defaultLocale;
}
