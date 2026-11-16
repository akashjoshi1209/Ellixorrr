import en from "./locales/en";
import hi from "./locales/hi";
import mr from "./locales/mr";
import type { Locale } from "./config";
import type { Dictionary } from "./types";

export const dictionaries: Record<Locale, Dictionary> = { en, hi, mr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
