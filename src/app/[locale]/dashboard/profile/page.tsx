export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import { updateProfileAction } from "@/actions/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { requireCustomer } from "@/lib/profiles";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PortalChrome, PortalError } from "@/components/portals/PortalChrome";

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

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("id", profile.id)
    .maybeSingle();

  // The login address belongs to Supabase Auth; the profile form only shows it.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authEmail = user?.email ?? profile.email ?? profileRow?.email ?? "";

  const current = `/${locale}/dashboard/profile`;
  const portalNav = [
    { href: `/${locale}/dashboard`, label: dict.nav.dashboard },
    { href: `/${locale}/dashboard/projects`, label: dict.auth.myProjects },
    { href: current, label: dict.auth.myProfile },
  ];

  if (profileError) {
    return (
      <PortalChrome
        eyebrow={dict.nav.account}
        title={dict.auth.myProfile}
        description={dict.auth.manageAccount}
        navLabel={dict.nav.account}
        nav={portalNav}
        current={current}
      >
        <PortalError
          heading={dict.auth.loadFailedTitle}
          message={dict.auth.loadError}
        />
      </PortalChrome>
    );
  }

  return (
    <PortalChrome
      eyebrow={dict.nav.account}
      title={dict.auth.myProfile}
      description={dict.auth.manageAccount}
      navLabel={dict.nav.account}
      nav={portalNav}
      current={current}
    >
      <div className="max-w-3xl">
        <FeedbackBanner dict={dict} error={error} success={message} />

        <form action={updateProfileAction} className="space-y-6">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="full_name"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1"
              >
                {dict.auth.fullName}
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                defaultValue={profileRow?.full_name ?? ""}
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-rule-strong"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1"
              >
                {dict.auth.email}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={authEmail}
                readOnly
                aria-describedby="email-readonly-note"
                className="w-full rounded border px-3 py-2 text-sm border-rule bg-charcoal/40 text-muted"
              />
              <p
                id="email-readonly-note"
                className="mt-1 text-xs leading-relaxed text-muted"
              >
                {dict.auth.emailReadOnlyNote}
              </p>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1"
              >
                {dict.auth.phone}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={profileRow?.phone ?? ""}
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-rule-strong"
              />
            </div>
          </div>

          <div className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-2">
              {dict.auth.role}
            </p>
            <p className="text-sm text-muted">{dict.auth.customerRole}</p>
            <p className="text-xs text-muted mt-1">
              {dict.auth.roleChangeNote}
            </p>
          </div>

          <SubmitButton pendingLabel={dict.auth.sending} className="w-auto">
            {dict.auth.saveChanges}
          </SubmitButton>
        </form>
      </div>
    </PortalChrome>
  );
}
