"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/auth";
import { createBrowserClient } from "@/lib/supabase/client";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale as Locale);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Exchange Supabase reset tokens for a session
  const access_token = searchParams.get("access_token");
  const refresh_token = searchParams.get("refresh_token");

  useEffect(() => {
    if (access_token && refresh_token) {
      const supabase = createBrowserClient();
      supabase.auth.setSession({ access_token, refresh_token }).then(() => {
        window.location.href = window.location.pathname;
      });
    }
  }, [access_token, refresh_token, router]);

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
