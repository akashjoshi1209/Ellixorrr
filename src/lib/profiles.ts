/**
 * Profile data-access layer.
 *
 * These helpers are plain server-side functions — deliberately *not* exported
 * from a `"use server"` module, so they are not reachable as public Server
 * Actions. Only the mutation actions in `src/actions/*` are externally
 * callable, and each of those performs its own authorization check.
 *
 * Authorization is always derived from the authenticated Supabase user and
 * the `profiles.role` column. The role is never read from client input, so a
 * customer can never promote themselves to admin.
 */
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { createServerClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/supabase/types";
import { localizedPath } from "@/lib/navigation";

export type CurrentProfile = {
  id: string;
  email: string | null;
  role: Role;
  full_name: string | null;
};

/**
 * Returns the profile of the currently authenticated user, or `null` when
 * there is no session or no matching profile row.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    full_name: data.full_name,
  };
}

/**
 * Returns the current profile only when it has the admin role, otherwise
 * `null`.
 */
export async function getAdminProfile(): Promise<CurrentProfile | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return null;
  return profile;
}

/**
 * Gate for admin pages and admin Server Actions.
 *
 * Unauthenticated visitors are sent to the login page; authenticated users
 * without the admin role are sent to the customer dashboard.
 */
export async function requireAdmin(locale: Locale): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(
      `${localizedPath(locale, "/auth/login")}?redirectTo=${encodeURIComponent(
        localizedPath(locale, "/admin")
      )}`
    );
  }

  if (profile.role !== "admin") {
    redirect(localizedPath(locale, "/dashboard"));
  }

  return profile;
}

/**
 * Gate for customer pages and customer Server Actions.
 *
 * Admins are sent to the admin dashboard rather than being bounced back to
 * the login page (which previously produced an endless redirect loop).
 */
export async function requireCustomer(locale: Locale): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(
      `${localizedPath(locale, "/auth/login")}?redirectTo=${encodeURIComponent(
        localizedPath(locale, "/dashboard")
      )}`
    );
  }

  if (profile.role === "admin") {
    redirect(localizedPath(locale, "/admin"));
  }

  return profile;
}
