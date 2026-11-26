/**
 * Supabase server client.
 *
 * Used in Server Components, Route Handlers, and Server Actions.
 * Reads/writes auth cookies via @supabase/ssr's createServerClient.
 *
 * The service role key is NEVER passed to this client — it is server-only
 * and is reserved for trusted administrative operations that bypass RLS
 * (if ever needed). All application reads/writes go through the anon key
 * and are enforced by Row Level Security.
 *
 * Authorization is performed independently in each server-side handler
 * by inspecting the authenticated user's claims and role, never by trusting
 * client-provided role values.
 *
 * The `getAll`/`setAll` cookie adapter is used because `get`/`set`/`remove`
 * are deprecated in @supabase/ssr and are removed in the next major version.
 *
 * Cookie writes are best-effort: the proxy owns the session refresh, and
 * Next.js forbids cookie mutation during a Server Component render. A
 * swallowed write therefore never loses a session — it only means the
 * refreshed token is persisted by the proxy on the next request instead.
 */
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

export async function createServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicEnv();

  return createSupabaseServerClient<Database>(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookies cannot be modified during a Server Component render.
            // The proxy refreshes and persists the session instead.
          }
        },
      },
    }
  );
}
