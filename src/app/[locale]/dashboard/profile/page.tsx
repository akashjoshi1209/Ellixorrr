export const dynamic = "force-dynamic";

import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { updateProfileAction } from "@/actions/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { requireCustomer } from "@/lib/profiles";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";

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
  const resolvedLocale = locale as Locale;

  const searchParamsResolved = await searchParams;
  const error =
    typeof searchParamsResolved["error"] === "string"
      ? searchParamsResolved["error"]
      : undefined;
  const message =
    typeof searchParamsResolved["message"] === "string"
      ? searchParamsResolved["message"]
      : undefined;

  const supabase = await createServerClient();

  // Signed-out visitors are sent to the login page.
  const profile = await requireCustomer(resolvedLocale);

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("id", profile.id)
    .maybeSingle();

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

        <FeedbackBanner dict={dict} error={error} success={message} />

        <form action={updateProfileAction} className="space-y-6" noValidate>
          <input type="hidden" name="locale" value={locale} />
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
                defaultValue={profileRow?.full_name ?? ""}
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
                defaultValue={profileRow?.email ?? ""}
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
                defaultValue={profileRow?.phone ?? ""}
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
