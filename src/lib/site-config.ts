/**
 * Centralized site configuration for Ellixorrr.
 *
 * Reads NEXT_PUBLIC_SITE_URL from the environment, normalizes it, and
 * provides consistent absolute URL helpers for SEO-critical metadata:
 * canonical URLs, sitemap entries, robots.txt declarations, Open Graph
 * URLs, Twitter metadata, and JSON-LD identifiers.
 *
 * Production fallback: https://ellixorrr.dpdns.org
 *
 * Future domain migration requires only changing the environment variable;
 * no source code edits are needed.
 */
import { type Locale } from "@/i18n/config";

/** Production fallback site URL. Never hardcode this elsewhere. */
const FALLBACK_SITE_URL = "https://ellixorrr.dpdns.org";

/**
 * Real contact channels used by public pages, structured data, and tests.
 * Localized dictionaries own the visible labels and message copy; the
 * destinations themselves live here so they cannot drift between surfaces.
 */
export const CONTACT = {
  email: "ellixorrr@gmail.com",
  phoneDisplay: "+91 94040 44607",
  phoneDial: "+919404044607",
  whatsappNumber: "919404044607",
} as const;

/** Builds the WhatsApp deep link for a localized message. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Builds the email deep link for a localized subject. */
export function mailtoUrl(subject: string): string {
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;
}

/**
 * Reads and normalizes the configured site URL.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL when set (trailing slash stripped);
 *  2. https://ellixorrr.dpdns.org fallback.
 *
 * Returns null when the value is present but not a valid absolute
 * HTTP/HTTPS URL.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    const normalized = configured.replace(/\/$/, "");
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return normalized;
      }
    } catch {
      // Invalid URL — fall through to the fallback below.
    }
  }
  return FALLBACK_SITE_URL;
}

/**
 * Builds an absolute URL for a locale-prefixed path.
 *
 * Example: absoluteUrl("en", "/") -> "https://ellixorrr.dpdns.org/en"
 * Example: absoluteUrl("hi", "/dashboard") -> "https://ellixorrr.dpdns.org/hi/dashboard"
 */
export function absoluteUrl(locale: Locale, path = "/"): string {
  const siteUrl = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
}

/**
 * Builds an absolute URL for a non-locale path (e.g. /sitemap.xml).
 */
export function absoluteRootUrl(path = "/"): string {
  const siteUrl = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}
