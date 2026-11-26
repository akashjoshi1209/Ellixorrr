import { Suspense } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { resetPasswordAction } from "@/actions/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { createServerClient } from "@/lib/supabase/server";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { AuthShell } from "@/components/ui/AuthShell";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ResetPasswordSession } from "./ResetPasswordSession";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale as Locale);

  // Server-side search parameters. Only the *presence* of recovery material
  // is used — the token values themselves are never read into the
  // server-rendered HTML, and are exchanged by <ResetPasswordSession /> in
  // the browser.
  const resolvedSearchParams = await searchParams;
  const hasRecoveryParams =
    typeof resolvedSearchParams.code === "string" ||
    typeof resolvedSearchParams.token_hash === "string" ||
    (typeof resolvedSearchParams.access_token === "string" &&
      typeof resolvedSearchParams.refresh_token === "string");

  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;
  const message =
    typeof resolvedSearchParams.message === "string"
      ? resolvedSearchParams.message
      : undefined;

  // A new password can only be set once a recovery session exists. The
  // session is established from the recovery material in the URL by
  // <ResetPasswordSession />, because Next.js does not allow cookies to be
  // written during a Server Component render.
  const supabase = await createServerClient();
  let hasRecoverySession = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasRecoverySession = Boolean(user);
  } catch {
    // Reading the user can require a token refresh, and a refresh cannot
    // persist its cookies during a Server Component render. Fall back to the
    // recovery-link flow so the visitor can still reset their password.
    hasRecoverySession = false;
  }

  return (
    <AuthShell
      label={dict.auth.access}
      title={dict.auth.resetPassword}
      intro={dict.auth.resetPasswordIntro}
      icon={<LockKeyhole aria-hidden="true" />}
    >
      <FeedbackBanner dict={dict} error={error} success={message} />

      {!hasRecoverySession && (
        <Suspense
          fallback={
            <p
              role="status"
              className="mb-6 rounded border border-rule bg-forest/40 p-4 text-sm text-muted"
            >
              {dict.auth.verifyingResetLink}
            </p>
          }
        >
          <ResetPasswordSession
            hasRecoveryParams={hasRecoveryParams}
            verifyingMessage={dict.auth.verifyingResetLink}
            invalidMessage={dict.auth.invalidResetLink}
            requestNewLinkLabel={dict.auth.requestNewResetLink}
            locale={locale as Locale}
          />
        </Suspense>
      )}

      {hasRecoverySession && (
        <form action={resetPasswordAction} className="space-y-5">
          <input type="hidden" name="locale" value={locale} />
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
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded border border-rule-strong bg-forest/40 px-3 py-2 text-sm transition-colors focus-visible:border-crimson-bright focus-visible:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="confirm_password"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted"
            >
              {dict.auth.confirmPassword}
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded border border-rule-strong bg-forest/40 px-3 py-2 text-sm transition-colors focus-visible:border-crimson-bright focus-visible:outline-none"
            />
          </div>
          <SubmitButton pendingLabel={dict.auth.sending}>
            {dict.auth.setNewPassword}
          </SubmitButton>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        {dict.auth.haveAccount}{" "}
        <Link
          href={`/${locale}/auth/login`}
          prefetch={false}
          className="font-semibold text-bone transition-colors hover:text-crimson-bright focus-visible:text-crimson-bright"
        >
          {dict.auth.login}
        </Link>
      </p>
    </AuthShell>
  );
}
