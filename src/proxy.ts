import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import {
  isLocale,
  negotiateLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";
import { createProxySupabaseClient } from "@/lib/supabase/proxy";
import {
  LOGIN_PATH,
  isAdminPath,
  isAuthPath,
  isCustomerPath,
  localizedPath,
  stripLocalePrefix,
} from "@/lib/navigation";

/**
 * Auth routes that stay reachable for signed-in users.
 *
 * `/auth/login` must remain reachable so a signed-in visitor can still be
 * redirected after a session change, and `/auth/reset-password` must remain
 * reachable so the password-recovery flow can complete.
 */
const AUTH_ROUTES_ALLOWED_WHEN_SIGNED_IN = new Set([
  LOGIN_PATH,
  "/auth/reset-password",
]);

/**
 * True when the request carries a Supabase auth cookie. Anonymous traffic
 * skips the session refresh entirely, which avoids a round trip to Supabase
 * on every public page view.
 */
function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("auth-token"));
}

/**
 * True when the request is a background fetch rather than a real page load.
 *
 * Next.js prefetches every route linked in the viewport. The language
 * switcher links to all three locale routes, so those prefetch requests
 * pass through the proxy. They must NOT update the locale preference
 * cookie: otherwise the last prefetch would overwrite the locale the
 * visitor is actually reading, and the remembered locale would drift away
 * from the page on screen.
 *
 * Next.js strips its own `RSC` and `Next-Router-Prefetch` headers before
 * the proxy runs, so the standard Fetch Metadata header is used instead:
 *
 *   sec-fetch-mode: navigate  -> a top-level browser navigation
 *   sec-fetch-mode: cors      -> the router's RSC prefetch / navigation
 *
 * A request with no `sec-fetch-mode` at all comes from a non-browser
 * client (curl, a bot, a server-side fetch). That is a direct request for
 * the page, so the preference is recorded as usual.
 */
function isBackgroundRequest(request: NextRequest): boolean {
  // Belt and braces: if a future Next.js version forwards the internal
  // prefetch header, honour it too.
  if (request.headers.get("next-router-prefetch") === "1") return true;

  const mode = request.headers.get("sec-fetch-mode");
  if (!mode) return false;

  return mode !== "navigate";
}

/**
 * Copies the cookies of one response onto another. Used when the proxy
 * redirects after refreshing the session: the refreshed auth cookies must
 * survive the redirect.
 */
function copyCookies(source: NextResponse, target: NextResponse): void {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie.name, cookie.value, cookie);
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const segment = pathname.split("/")[1];
  const hasLocalePrefix = isLocale(segment);

  // ------------------------------------------------------------------
  // 1. Locale negotiation.
  // ------------------------------------------------------------------
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale = hasLocalePrefix
    ? segment
    : cookieLocale && isLocale(cookieLocale)
      ? cookieLocale
      : negotiateLocale(request.headers.get("accept-language"));

  if (!hasLocalePrefix) {
    // Send the visitor to the localized equivalent of the current path.
    // 307 preserves the request method and body.
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // ------------------------------------------------------------------
  // 2. Supabase cookie/session refresh.
  //
  //    This MUST run for locale-prefixed routes as well — otherwise the
  //    auth cookies are never refreshed and the routes rendered below the
  //    proxy see a stale session. The proxy is the only place where the
  //    session cookie may be written (a Server Component render may not
  //    modify cookies).
  // ------------------------------------------------------------------
  let response = NextResponse.next({ request });
  let user: User | null = null;

  if (hasSupabaseAuthCookie(request)) {
    const proxyClient = createProxySupabaseClient(request);
    try {
      const {
        data: { user: currentUser },
      } = await proxyClient.client.auth.getUser();
      user = currentUser;
    } catch {
      // A failed refresh must not break the page: treat it as signed out.
      user = null;
    }
    response = proxyClient.getResponse();
  }

  // Remember the locale the visitor is browsing in.
  //
  // Background fetches are excluded: the router's prefetches are
  // speculative requests for other locales and must never overwrite the
  // current preference.
  if (!isBackgroundRequest(request)) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  // ------------------------------------------------------------------
  // 3. Optimistic redirects based on auth state only.
  //    Authorization itself is enforced independently in server-side
  //    handlers and by Supabase RLS — never here.
  // ------------------------------------------------------------------
  const barePath = stripLocalePrefix(pathname);

  if (method === "GET" || method === "HEAD") {
    // Redirect signed-in users away from the auth pages they no longer need.
    if (
      user &&
      isAuthPath(barePath) &&
      !AUTH_ROUTES_ALLOWED_WHEN_SIGNED_IN.has(barePath)
    ) {
      const redirectResponse = NextResponse.redirect(
        new URL(localizedPath(locale, "/dashboard"), request.url)
      );
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }

    // Redirect anonymous visitors away from the protected routes.
    if (!user && (isCustomerPath(barePath) || isAdminPath(barePath))) {
      const loginUrl = new URL(localizedPath(locale, LOGIN_PATH), request.url);
      loginUrl.searchParams.set("redirectTo", localizedPath(locale, barePath));
      const redirectResponse = NextResponse.redirect(loginUrl);
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  // Skip Next internals and any file with an extension (assets, images,
  // favicon, auth callbacks, etc.) so Supabase and static assets work.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
