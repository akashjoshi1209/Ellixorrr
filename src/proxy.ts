import { NextResponse, type NextRequest } from "next/server";
import { isLocale, negotiateLocale, LOCALE_COOKIE } from "@/i18n/config";
import { createServerClient } from "@/lib/supabase/server";

const AUTH_PREFIX = "/auth";
const DASHBOARD_PREFIX = "/dashboard";
const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/auth/login";

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith(AUTH_PREFIX);
}

function isCustomerRoute(pathname: string): boolean {
  return pathname.startsWith(DASHBOARD_PREFIX);
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith(ADMIN_PREFIX);
}

function stripLocale(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (isLocale(segment)) {
    return pathname.slice(segment.length + 1) || "/";
  }
  return pathname;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ------------------------------------------------------------------
  // 1. Preserve existing locale negotiation (unchanged behavior).
  // ------------------------------------------------------------------
  const segment = pathname.split("/")[1];
  if (isLocale(segment)) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, segment, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    cookieLocale && isLocale(cookieLocale)
      ? cookieLocale
      : negotiateLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  // ------------------------------------------------------------------
  // 2. Supabase cookie/session refresh.
  //    Required by @supabase/ssr so that auth cookies are read and
  //    refreshed on every server-rendered request. This is a read-only
  //    operation against the anon key; it does not perform authorization.
  // ------------------------------------------------------------------
  const supabase = await createServerClient();
  await supabase.auth.getUser();

  // ------------------------------------------------------------------
  // 3. Optimistic redirects based on auth state only.
  //    Authorization itself is enforced independently in server-side
  //    handlers and by Supabase RLS — never here.
  // ------------------------------------------------------------------
  const { data: { user } } = await supabase.auth.getUser();
  const barePath = stripLocale(pathname);

  // Redirect authenticated users away from auth pages.
  if (user && isAuthRoute(barePath) && barePath !== LOGIN_PATH) {
    const redirectTo = `/${locale}${barePath.replace(AUTH_PREFIX, DASHBOARD_PREFIX)}`;
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Redirect unauthenticated users away from protected routes.
  if (!user && (isCustomerRoute(barePath) || isAdminRoute(barePath))) {
    const loginUrl = new URL(`/${locale}${LOGIN_PATH}`, request.url);
    loginUrl.searchParams.set("redirectTo", barePath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals and any file with an extension (assets, images,
  // favicon, auth callbacks, etc.) so Supabase and static assets work.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
