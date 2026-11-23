/**
 * Locale-aware path helpers.
 *
 * Every user-visible redirect in the application is built here so that a
 * single set of rules applies:
 *
 *  - paths are always locale-prefixed (`/en/...`, `/hi/...`, `/mr/...`);
 *  - a redirect target supplied by a user (for example `?redirectTo=`) must
 *    be same-origin, locale-prefixed, free of traversal segments and must
 *    not point back at the authentication routes (which would loop).
 *
 * These helpers are pure and are safe to import from both Server and Client
 * Components.
 */
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

export const AUTH_PREFIX = "/auth";
export const DASHBOARD_PREFIX = "/dashboard";
export const ADMIN_PREFIX = "/admin";
export const LOGIN_PATH = "/auth/login";

/** Longest accepted redirect target. Anything longer is rejected. */
const MAX_REDIRECT_LENGTH = 512;

/**
 * Characters that must never appear in a redirect target: C0 control
 * characters, space and backslash. Backslashes are rejected because some
 * browsers normalise `\` to `/`, which could turn a relative path into a
 * protocol-relative one.
 */
const UNSAFE_PATH_CHARACTERS = /[\u0000-\u0020\\]/;

/**
 * Resolves an untrusted value (a form field, a query parameter) to a known
 * locale. Anything unrecognised falls back to the default locale.
 */
export function resolveLocale(value: unknown): Locale {
  if (typeof value === "string" && isLocale(value)) return value;
  return defaultLocale;
}

/**
 * Builds a locale-prefixed path. `localizedPath("en", "/dashboard")` returns
 * `/en/dashboard`; the root path returns `/en`.
 */
export function localizedPath(locale: Locale, path = "/"): string {
  if (!path) return `/${locale}`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

/**
 * Removes a leading locale segment from a pathname.
 * `/en/dashboard` becomes `/dashboard`, `/en` becomes `/`.
 */
export function stripLocalePrefix(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (isLocale(segment)) {
    return pathname.slice(segment.length + 1) || "/";
  }
  return pathname;
}

/** True for `/auth` and everything below it. */
export function isAuthPath(barePath: string): boolean {
  return barePath === AUTH_PREFIX || barePath.startsWith(`${AUTH_PREFIX}/`);
}

/** True for `/dashboard` and everything below it. */
export function isCustomerPath(barePath: string): boolean {
  return (
    barePath === DASHBOARD_PREFIX || barePath.startsWith(`${DASHBOARD_PREFIX}/`)
  );
}

/** True for `/admin` and everything below it. */
export function isAdminPath(barePath: string): boolean {
  return barePath === ADMIN_PREFIX || barePath.startsWith(`${ADMIN_PREFIX}/`);
}

/**
 * Validates an untrusted redirect target.
 *
 * Returns the safe, locale-prefixed path, or `null` when the value is not a
 * safe destination. The returned value can only ever point at a route of
 * this application — it is never an absolute URL, never protocol-relative,
 * and never an authentication route.
 */
export function safeRedirectPath(candidate: unknown): string | null {
  if (typeof candidate !== "string") return null;
  if (candidate.length === 0 || candidate.length > MAX_REDIRECT_LENGTH) {
    return null;
  }
  // Reject control characters, whitespace and backslashes.
  if (UNSAFE_PATH_CHARACTERS.test(candidate)) return null;
  // Must be an absolute, same-site path.
  if (!candidate.startsWith("/")) return null;
  // `//host` is protocol-relative and would leave the site.
  if (candidate.startsWith("//")) return null;
  // Query strings and fragments are not part of a redirect target.
  if (candidate.includes("?") || candidate.includes("#")) return null;
  // Percent-encoding could smuggle a traversal segment past the checks below.
  if (candidate.includes("%")) return null;

  const segments = candidate.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return null;
  }

  const localeSegment = segments[1];
  if (!localeSegment || !isLocale(localeSegment)) return null;

  const bare = `/${segments.slice(2).join("/")}`;
  if (bare.includes("//")) return null;
  // Never send the visitor back to the authentication routes — that loops.
  if (isAuthPath(bare)) return null;

  return bare === "/" ? `/${localeSegment}` : `/${localeSegment}${bare}`;
}
