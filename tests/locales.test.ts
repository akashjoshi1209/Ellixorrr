import { describe, expect, it } from "vitest";
import { locales } from "../src/i18n/config";
import { dictionaries } from "../src/i18n/dictionaries";

/** Recursively walks a value, yielding the "shape path" of every leaf. */
function leafPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => leafPaths(item, `${prefix}[${i}]`));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
    leafPaths(item, prefix ? `${prefix}.${key}` : key),
  );
}

describe("locale dictionaries", () => {
  it("every locale has the exact same content shape as English", () => {
    const reference = leafPaths(dictionaries.en).sort();
    for (const locale of locales) {
      const actual = leafPaths(dictionaries[locale]).sort();
      expect(actual, `locale "${locale}" content shape`).toEqual(reference);
    }
  });

  it("no translation is an empty string", () => {
    for (const locale of locales) {
      const leaves = leafPaths(dictionaries[locale]);
      const dict = dictionaries[locale] as unknown;
      for (const path of leaves) {
        const value = path
          .replace(/\[(\d+)\]/g, ".$1")
          .split(".")
          .reduce<unknown>(
            (acc, key) => (acc && typeof acc === "object" ? (acc as never)[key] : undefined),
            dict,
          );
        if (typeof value === "string") {
          expect(value.trim().length, `${locale}:${path}`).toBeGreaterThan(0);
        }
      }
    }
  });
});
