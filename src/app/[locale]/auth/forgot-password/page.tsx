import Link from "next/link";
import { Mail } from "lucide-react";
import { forgotPasswordAction } from "@/actions/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { AuthShell } from "@/components/ui/AuthShell";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
    <AuthShell
      label={dict.auth.access}
      title={dict.auth.forgotPassword}
      intro={dict.auth.forgotPasswordIntro}
      icon={<Mail aria-hidden="true" />}
    >
      <FeedbackBanner dict={dict} error={error} success={message} />

      <form action={forgotPasswordAction} className="space-y-5">
        <input type="hidden" name="locale" value={locale} />
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
            required
            className="w-full rounded border border-rule-strong bg-forest/40 px-3 py-2 text-sm transition-colors focus-visible:border-crimson-bright focus-visible:outline-none"
            placeholder={dict.contact.email.address}
          />
        </div>
        <SubmitButton pendingLabel={dict.auth.sending}>
          {dict.auth.sendResetLink}
        </SubmitButton>
      </form>

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
