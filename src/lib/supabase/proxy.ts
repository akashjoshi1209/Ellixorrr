/**
 * Supabase client for the Next.js proxy (formerly middleware).
 *
 * The proxy is the authoritative writer of Supabase auth cookies: a Server
 * Component render is not allowed to mutate cookies, so the session refresh
 * has to happen here, before the route is rendered.
 *
 * The client is wired to the incoming `NextRequest` for reads and to a
 * freshly created `NextResponse` for writes. When Supabase refreshes the
 * session, the refreshed cookies are written to the outgoing response *and*
 * to the forwarded request headers, so the route below the proxy sees the
 * up-to-date session.
 */
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

export type ProxySupabaseClient = {
  client: SupabaseClient<Database>;
  /** The response that currently carries the refreshed cookies. */
  getResponse: () => NextResponse;
};

export function createProxySupabaseClient(
  request: NextRequest
): ProxySupabaseClient {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicEnv();

  const client = createSupabaseServerClient<Database>(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update the request so the refreshed token is visible to the
          // route rendered below the proxy.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return {
    client,
    getResponse: () => response,
  };
}
