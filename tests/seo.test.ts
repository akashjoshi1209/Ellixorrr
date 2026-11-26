import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { locales } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { SERVICE_TYPES } from "@/lib/services";
import { absoluteRootUrl, absoluteUrl } from "@/lib/site-config";
import { buildGraph } from "@/lib/structured-data";

describe("SEO route configuration", () => {
  it("publishes only localized homepages with complete hreflang alternates", async () => {
    const entries = await sitemap();
    expect(entries).toHaveLength(locales.length);

    for (const locale of locales) {
      const expectedUrl = absoluteUrl(locale, "/");
      const entry = entries.find((candidate) => candidate.url === expectedUrl);
      expect(entry, `${locale} sitemap entry`).toBeDefined();
      expect(entry?.alternates?.languages).toEqual({
        ...Object.fromEntries(
          locales.map((alternate) => [alternate, absoluteUrl(alternate, "/")]),
        ),
        "x-default": absoluteUrl("en", "/"),
      });
    }
  });

  it("keeps private routes disallowed and declares the sitemap", async () => {
    const config = await robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const rule = rules[0];
    const disallow = Array.isArray(rule?.disallow)
      ? rule.disallow
      : rule?.disallow
        ? [rule.disallow]
        : [];

    expect(rule?.allow).toBe("/");
    for (const path of ["auth", "dashboard", "admin"]) {
      expect(disallow).toContain(`/${path}/`);
      for (const locale of locales) {
        expect(disallow).toContain(`/${locale}/${path}/`);
      }
    }
    expect(config.sitemap).toBe(absoluteRootUrl("/sitemap.xml"));
  });

  it.each(locales)(
    "%s structured services use localized copy with stable canonical values",
    (locale) => {
      const entities = buildGraph(locale, dictionaries[locale].meta.description);
      const services = entities.filter(
        (entity) => entity["@type"] === "Service"
      ) as Array<Record<string, unknown>>;

      expect(services).toHaveLength(SERVICE_TYPES.length);
      services.forEach((service, index) => {
        expect(service.serviceType).toBe(SERVICE_TYPES[index]);
        expect(service.name).toBe(dictionaries[locale].services.items[index].name);
        expect(service.description).toBe(
          dictionaries[locale].services.items[index].description
        );
        expect(service.inLanguage).toBe(locale);
      });
    },
  );
});
