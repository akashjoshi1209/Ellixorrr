import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { safeRedirectPath } from "@/lib/navigation";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { AuthShell } from "@/components/ui/AuthShell";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale as Locale);

  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;
  const message =
    typeof resolvedSearchParams.message === "string"
      ? resolvedSearchParams.message
      : undefined;
  // Only the identifier is restored after a failed login; the submitted
  // password is always discarded.
  const email =
    typeof resolvedSearchParams.email === "string"
      ? resolvedSearchParams.email.slice(0, 254)
      : "";

  // Only a validated, same-origin, locale-prefixed path may be carried into
  // the form. Anything else is dropped and the visitor is routed by role.
  const redirectTo = safeRedirectPath(resolvedSearchParams.redirectTo);

  return (
    <AuthShell
      label={dict.auth.access}
      title={dict.auth.login}
      intro={dict.auth.loginIntro}
      icon={<LockKeyhole aria-hidden="true" />}
    >
      <FeedbackBanner dict={dict} error={error} success={message} />

      <form action={loginAction} className="space-y-5">
        <input type="hidden" name="locale" value={locale} />
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted"
          >
            {dict.auth.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
            required
            className="w-full rounded border border-rule-strong bg-forest/40 px-3 py-2 text-sm transition-colors focus-visible:border-crimson-bright focus-visible:outline-none"
            placeholder={dict.contact.email.address}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted"
          >
            {dict.auth.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded border border-rule-strong bg-forest/40 px-3 py-2 text-sm transition-colors focus-visible:border-crimson-bright focus-visible:outline-none"
          />
        </div>
        <SubmitButton pendingLabel={dict.auth.sending}>
          {dict.auth.login}
        </SubmitButton>
      </form>

      <div className="mt-4 text-right">
        <Link
          href={`/${locale}/auth/forgot-password`}
          prefetch={false}
          className="text-sm text-crimson-bright transition-colors hover:text-bone focus-visible:text-bone"
        >
          {dict.auth.forgotPassword}
        </Link>
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        {dict.auth.noAccount}{" "}
        <Link
          href={`/${locale}/auth/register`}
          prefetch={false}
          className="font-semibold text-bone transition-colors hover:text-crimson-bright focus-visible:text-crimson-bright"
        >
          {dict.auth.register}
        </Link>
      </p>
    </AuthShell>
  );
}
