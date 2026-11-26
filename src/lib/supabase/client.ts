/**
 * Supabase browser client.
 *
 * Used in Client Components and event handlers. Reads/writes auth
 * cookies via @supabase/ssr's createBrowserClient. Never uses the
 * service role key — only the publishable (anon) key, which is safe
 * to expose to the browser.
 *
 * Session persistence is handled entirely by cookies; no tokens are
 * stored in localStorage or exposed in URLs.
 */
"use client";

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

export function createBrowserClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  return createSupabaseBrowserClient<Database>(url, publishableKey);
}
