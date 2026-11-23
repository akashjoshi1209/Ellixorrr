"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";

type ResetPasswordSessionProps = {
  /**
   * Whether the server found recovery material in the request's query string.
   * The server never forwards the token values themselves — only this flag.
   */
  hasRecoveryParams: boolean;
  verifyingMessage: string;
  invalidMessage: string;
  requestNewLinkLabel: string;
  locale: Locale;
};

/**
 * Establishes the recovery session for a password reset.
 *
 * The recovery material (a PKCE `code`, a `token_hash`, or the implicit
 * flow's `access_token`/`refresh_token` pair) arrives in the URL. It is read
 * here, in the browser, for two reasons:
 *
 *  1. the implicit flow delivers its tokens in the URL fragment, which is
 *     never sent to the server and therefore cannot be read by a Server
 *     Component; and
 *  2. Next.js does not allow cookies to be written during a Server
 *     Component render, so only the browser client can persist the session
 *     that the new-password server action later relies on.
 *
 * The tokens are never forwarded anywhere and are removed from the address
 * bar and the session history as soon as they have been exchanged.
 */
export function ResetPasswordSession({
  hasRecoveryParams,
  verifyingMessage,
  invalidMessage,
  requestNewLinkLabel,
  locale,
}: ResetPasswordSessionProps) {
  const [invalid, setInvalid] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    // React's Strict Mode invokes effects twice in development, and a PKCE
    // code may only be redeemed once — so only ever start one exchange.
    if (startedRef.current) return;
    startedRef.current = true;

    async function establishRecoverySession() {
      const fragment = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );

      const code = hasRecoveryParams
        ? new URLSearchParams(window.location.search).get("code")
        : fragment.get("code");
      const tokenHash = hasRecoveryParams
        ? new URLSearchParams(window.location.search).get("token_hash")
        : fragment.get("token_hash");
      const accessToken = hasRecoveryParams
        ? new URLSearchParams(window.location.search).get("access_token")
        : fragment.get("access_token");
      const refreshToken = hasRecoveryParams
        ? new URLSearchParams(window.location.search).get("refresh_token")
        : fragment.get("refresh_token");

      if (!code && !tokenHash && !(accessToken && refreshToken)) {
        // Nothing usable in the URL — there is no recovery to establish.
        setInvalid(true);
        return;
      }

      const supabase = createBrowserClient();

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken as string,
            refresh_token: refreshToken as string,
          });
          if (error) throw error;
        }
      } catch {
        setInvalid(true);
        return;
      }

      // Drop the recovery material from the address bar and from the session
      // history, then reload so the server component re-renders for the now
      // authenticated user.
      window.location.replace(window.location.pathname);
    }

    establishRecoverySession();
  }, [hasRecoveryParams]);

  if (invalid) {
    return (
      <div className="mb-6 p-4 rounded border border-crimson/20 bg-crimson/10 text-sm text-crimson/70">
        <p>{invalidMessage}</p>
        <Link
          href={`/${locale}/auth/forgot-password`}
          className="mt-2 inline-block font-semibold text-bone underline transition-colors hover:text-crimson-bright"
        >
          {requestNewLinkLabel}
        </Link>
      </div>
    );
  }

  return (
    <p className="mb-6 p-4 rounded border border-bone/10 bg-charcoal/40 text-sm text-bone/60">
      {verifyingMessage}
    </p>
  );
}
