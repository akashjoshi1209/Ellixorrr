import Link from "next/link";
import { UserRound } from "lucide-react";
import { registerAction } from "@/actions/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { AuthShell } from "@/components/ui/AuthShell";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function RegisterPage({
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
      title={dict.auth.register}
      intro={dict.auth.registerIntro}
      icon={<UserRound aria-hidden="true" />}
    >
      <FeedbackBanner dict={dict} error={error} success={message} />

      <form action={registerAction} className="space-y-5">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label
            htmlFor="full_name"
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted"
          >
            {dict.auth.fullName}
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            className="w-full rounded border border-rule-strong bg-forest/40 px-3 py-2 text-sm transition-colors focus-visible:border-crimson-bright focus-visible:outline-none"
            placeholder={dict.auth.fullNamePlaceholder}
          />
        </div>
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
          {dict.auth.register}
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
