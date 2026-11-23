import Link from "next/link";
import { forgotPasswordAction } from "@/actions/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";

export default async function ForgotPasswordPage({
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

  return (
    <section className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal min-h-svh flex flex-col justify-center py-28 md:py-40">
      <div className="relative mx-auto max-w-xl px-gutter">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-crimson/10 flex items-center justify-center text-crimson font-bold">📧</span>
              <h2 className="display-md">{dict.auth.forgotPassword}</h2>
            </div>
            <p className="text-sm leading-relaxed text-bone/70">
              Enter your email and we&rsquo;ll send you a link to reset your password.
            </p>
          </div>

          <FeedbackBanner dict={dict} error={error} success={message} />

          <form action={forgotPasswordAction} className="space-y-5" noValidate>
            <input type="hidden" name="locale" value={locale} />
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
              >
                {dict.auth.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
                placeholder={dict.contact.email.address}
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-bone px-6 py-3 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone"
            >
              {dict.auth.sendResetLink}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-bone/60">
            {dict.auth.haveAccount}{" "}
            <Link
              href={`/${locale}/auth/login`}
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
