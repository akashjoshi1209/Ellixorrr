/**
 * Schema.org structured data builders for Ellixorrr.
 *
 * All entities use only factual information already supported by the
 * existing project. No invented addresses, ratings, awards, or business
 * claims.
 *
 * Stable @id values are based on the configured site URL so entity
 * references remain consistent across locales.
 */
import { type Locale } from "@/i18n/config";
import { absoluteUrl, absoluteRootUrl, getSiteUrl } from "@/lib/site-config";

/** Stable organization identifier. */
const ORGANIZATION_ID = `${getSiteUrl()}/#organization`;

/** Stable website identifier. */
const WEBSITE_ID = `${getSiteUrl()}/#website`;

/** Service identifiers. */
const SERVICE_IDS: Record<string, string> = {
  Websites: `${getSiteUrl()}/#service/websites`,
  Applications: `${getSiteUrl()}/#service/applications`,
  Automations: `${getSiteUrl()}/#service/automations`,
  "Custom Solutions": `${getSiteUrl()}/#service/custom-solutions`,
};

/** The four factual service offerings from the existing project. */
const SERVICES = [
  {
    name: "Websites",
    description:
      "Fast, well-structured websites and online stores that load quickly, rank properly and turn visitors into enquiries and orders.",
    url: `${getSiteUrl()}/#service/websites`,
  },
  {
    name: "Applications",
    description:
      "Applications shaped around your operations — portals, dashboards and internal tools — instead of forcing your process into someone else's box.",
    url: `${getSiteUrl()}/#service/applications`,
  },
  {
    name: "Automations",
    description:
      "Workflow automation and AI agents that quietly take over repetitive work — follow-ups, data entry, reporting — so your team can focus on customers.",
    url: `${getSiteUrl()}/#service/automations`,
  },
  {
    name: "Custom Solutions",
    description:
      "When one tool isn't enough, we combine websites, applications and automations into a single system built around your exact requirements.",
    url: `${getSiteUrl()}/#service/custom-solutions`,
  },
] as const;

/**
 * Builds an Organization entity.
 *
 * Uses only factual information: name, URL, logo, contact email, phone.
 * No address, opening hours, rating, or geographical coordinates are
 * invented.
 */
export function buildOrganization(locale: Locale) {
  return {
    "@id": ORGANIZATION_ID,
    "@type": "Organization",
    name: "ELLIXORRR",
    url: absoluteRootUrl("/"),
    logo: absoluteRootUrl("/ellixorrr-emblem.svg"),
    email: "ellixorrr@gmail.com",
    telephone: "+919404044607",
    inLanguage: locale,
    knowsAbout: SERVICES.map((s) => s.name),
  };
}

/**
 * Builds a WebSite entity.
 *
 * No SearchAction is added because the website does not expose a public
 * search feature.
 */
export function buildWebSite(locale: Locale) {
  return {
    "@id": WEBSITE_ID,
    "@type": "WebSite",
    name: "ELLIXORRR",
    url: absoluteRootUrl("/"),
    inLanguage: locale,
  };
}

/**
 * Builds Service entities for the four actual offerings.
 */
export function buildServices(locale: Locale) {
  return SERVICES.map((service) => ({
    "@id": SERVICE_IDS[service.name],
    "@type": "Service",
    serviceType: service.name,
    name: service.name,
    description: service.description,
    url: service.url,
    provider: {
      "@id": ORGANIZATION_ID,
    },
    inLanguage: locale,
  }));
}

/**
 * Builds a ProfessionalService entity.
 *
 * Preserves accurate existing information. No address, rating, price, or
 * geographical coordinates are invented.
 */
export function buildProfessionalService(locale: Locale) {
  return {
    "@id": `${getSiteUrl()}/#professionalservice`,
    "@type": "ProfessionalService",
    name: "ELLIXORRR",
    url: absoluteUrl(locale, "/"),
    provider: {
      "@id": ORGANIZATION_ID,
    },
    service: SERVICES.map((s) => ({
      "@id": SERVICE_IDS[s.name],
    })),
    inLanguage: locale,
    email: "ellixorrr@gmail.com",
    telephone: "+919404044607",
  };
}

/**
 * Builds all structured data entities as a JSON-LD @graph.
 *
 * Returns an array of entities ready for
 * JSON.stringify({ "@context": "https://schema.org", "@graph": entities }).
 */
export function buildGraph(locale: Locale, metaDescription: string) {
  const org = buildOrganization(locale);
  const website = buildWebSite(locale);
  const services = buildServices(locale);
  const professionalService = {
    ...buildProfessionalService(locale),
    description: metaDescription,
  };

  return [org, website, ...services, professionalService].map(
    (entity) => ({
      ...entity,
      "@context": "https://schema.org",
    })
  );
}
