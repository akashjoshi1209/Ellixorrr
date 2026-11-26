/**
 * Fail-safe validation for the public Supabase configuration.
 *
 * Next.js inlines `NEXT_PUBLIC_*` values at build time. The previous code used
 * non-null assertions, so a missing deployment variable produced an opaque
 * runtime failure deep inside the Supabase client. This module keeps the same
 * build-time inlining behaviour but fails with a clear, value-free message.
 *
 * The service-role key is deliberately not read here: it must never enter a
 * browser bundle and is not used by the application.
 */

const MISSING_CONFIG_MESSAGE =
  "Supabase public environment variables are missing or invalid. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the build environment.";

export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
};

export function validateSupabasePublicEnv(
  url: string | undefined,
  publishableKey: string | undefined
): SupabasePublicEnv {
  const trimmedUrl = url?.trim() ?? "";
  const trimmedKey = publishableKey?.trim() ?? "";

  if (!trimmedUrl || !trimmedKey) {
    throw new Error(MISSING_CONFIG_MESSAGE);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new Error(MISSING_CONFIG_MESSAGE);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(MISSING_CONFIG_MESSAGE);
  }

  return { url: trimmedUrl, publishableKey: trimmedKey };
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return validateSupabasePublicEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
