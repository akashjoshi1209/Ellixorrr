/**
 * Schema.org structured data builders for Ellixorrr.
 *
 * All entities use only factual information already supported by the
 * existing project. No invented addresses, ratings, awards, or business
 * claims.
 *
 * Service names and descriptions come from the active locale dictionary.
 * Canonical service values and stable @id values come from the unchanged
 * English service keys so stored data and entity references stay stable
 * across locales.
 */
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SERVICE_TYPES, type ServiceType } from "@/lib/services";
import {
  absoluteUrl,
  absoluteRootUrl,
  CONTACT,
  getSiteUrl,
} from "@/lib/site-config";

/** Stable organization identifier. */
const ORGANIZATION_ID = `${getSiteUrl()}/#organization`;

/** Stable website identifier. */
const WEBSITE_ID = `${getSiteUrl()}/#website`;

/** Stable service slugs, indexed by the canonical stored service value. */
const SERVICE_SLUGS: Record<ServiceType, string> = {
  Websites: "websites",
  Applications: "applications",
  Automations: "automations",
  "Custom Solutions": "custom-solutions",
};

function serviceId(service: ServiceType): string {
  return `${getSiteUrl()}/#service/${SERVICE_SLUGS[service]}`;
}

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
    email: CONTACT.email,
    telephone: CONTACT.phoneDial,
    inLanguage: locale,
    knowsAbout: [...SERVICE_TYPES],
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
 *
 * Dictionary order is enforced by tests/locales.test.ts, so index-based
 * mapping to canonical service values is stable.
 */
export function buildServices(locale: Locale) {
  const dict = getDictionary(locale);

  return dict.services.items.map((service, index) => {
    const canonical = SERVICE_TYPES[index];
    if (!canonical) {
      throw new Error(`Missing canonical service for index ${index}`);
    }

    return {
      "@id": serviceId(canonical),
      "@type": "Service",
      serviceType: canonical,
      name: service.name,
      description: service.description,
      url: absoluteRootUrl(`/#service/${SERVICE_SLUGS[canonical]}`),
      provider: {
        "@id": ORGANIZATION_ID,
      },
      inLanguage: locale,
    };
  });
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
    service: SERVICE_TYPES.map((service) => ({
      "@id": serviceId(service),
    })),
    inLanguage: locale,
    email: CONTACT.email,
    telephone: CONTACT.phoneDial,
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
