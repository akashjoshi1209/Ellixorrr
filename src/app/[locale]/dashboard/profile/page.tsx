export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { updateProfileAction } from "@/actions/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

export default async function CustomerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale as Locale);
  const searchParamsResolved = await searchParams;
  const error =
    (typeof searchParamsResolved["error"] === "string"
      ? searchParamsResolved["error"]
      : undefined) || undefined;
  const message =
    (typeof searchParamsResolved["message"] === "string"
      ? searchParamsResolved["message"]
      : undefined) || undefined;

  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirectTo=/${locale}/dashboard/profile`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileResult = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileResult.error) {
    redirect(
      `/${locale}/dashboard/profile?error=${encodeURIComponent(profileResult.error.message)}`
    );
  }

  const profile = profileResult.data;

  return (
    <section className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal py-28 md:py-40">
      <div className="relative mx-auto max-w-3xl px-gutter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-crimson/10 flex items-center justify-center text-crimson font-bold">🏢</span>
              <h2 className="display-lg">{dict.auth.myProfile}</h2>
            </div>
            <p className="text-sm leading-relaxed text-bone/70">
              Manage your account information.
            </p>
          </div>
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-crimson hover:text-bone"
          >
            Back to dashboard
            <span className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded border border-crimson/20 bg-crimson/10 text-sm text-crimson/70">
            {decodeURIComponent(error)}
          </div>
        )}
        {message === "updated" && (
          <div className="mb-6 p-4 rounded border border-bone/10 bg-bone/5 text-sm text-bone/70">
            Profile updated successfully.
          </div>
        )}

        <form action={updateProfileAction} className="space-y-6" noValidate>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="full_name"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
              >
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                defaultValue={profile?.full_name ?? ""}
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={profile?.email ?? ""}
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
              >
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={profile?.phone ?? ""}
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
              />
            </div>
            <div>
              <label
                htmlFor="business_name"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
              >
                Business name
              </label>
              <input
                id="business_name"
                name="business_name"
                type="text"
                autoComplete="organization"
                defaultValue={profile?.business_name ?? ""}
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
              />
            </div>
          </div>

          <div className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-2">
              Role
            </p>
            <p className="text-sm text-bone/60">Customer</p>
            <p className="text-xs text-bone/40 mt-1">
              Role changes must be requested through Ellixorrr administration.
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-bone px-6 py-3 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone"
          >
            Save changes
          </button>
        </form>
      </div>
    </section>
  );
}
