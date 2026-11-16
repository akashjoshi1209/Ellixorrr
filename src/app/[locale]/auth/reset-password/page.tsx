import { Suspense } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { createServerClient } from "@/lib/supabase/server";
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
    <section className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal min-h-svh flex flex-col justify-center py-28 md:py-40">
      <div className="relative mx-auto max-w-xl px-gutter">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-crimson/10 flex items-center justify-center text-crimson font-bold">🔒</span>
              <h2 className="display-md">{dict.auth.resetPassword}</h2>
            </div>
            <p className="text-sm leading-relaxed text-bone/70">
              Set a new password for your Ellixorrr account.
            </p>
          </div>

          {!hasRecoverySession && (
            <Suspense
              fallback={
                <p className="mb-6 p-4 rounded border border-bone/10 bg-charcoal/40 text-sm text-bone/60">
                  {dict.auth.verifyingResetLink}
                </p>
              }
            >
              <ResetPasswordSession
                hasRecoveryParams={hasRecoveryParams}
                verifyingMessage={dict.auth.verifyingResetLink}
                invalidMessage={dict.auth.invalidResetLink}
                requestNewLinkLabel={dict.auth.requestNewResetLink}
              />
            </Suspense>
          )}

          {hasRecoverySession && (
            <form action={resetPasswordAction} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
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
                  className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
                />
              </div>
              <div>
                <label
                  htmlFor="confirm_password"
                  className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
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
                  className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-bone px-6 py-3 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone"
              >
                {dict.auth.setNewPassword}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-bone/60">
            {dict.auth.haveAccount}{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-bone transition-colors hover:text-crimson-bright"
            >
              {dict.auth.login}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
