/**
 * Allowlisted user feedback (error / success) codes.
 *
 * Server actions never put raw Supabase, database or internal error text
 * into a URL. Instead they redirect with one of the stable codes declared
 * below, and the page resolves the code to a localized message from the
 * dictionary (`dict.feedback.errors` / `dict.feedback.success`).
 *
 * Anything that is not on the allowlist is discarded, so a crafted query
 * string can never make the application render attacker-controlled text.
 *
 * This module is pure — it is safe to import from Server and Client
 * Components alike.
 */
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { localizedPath } from "@/lib/navigation";

/** Stable error codes. Every code has a matching dictionary entry. */
export const ERROR_CODES = [
  "generic_error",
  "invalid_credentials",
  "invalid_email",
  "email_already_exists",
  "email_not_confirmed",
  "weak_password",
  "passwords_dont_match",
  "validation_failed",
  "registration_failed",
  "reset_request_failed",
  "reset_failed",
  "not_authenticated",
  "admin_access_required",
  "enquiry_failed",
  "profile_update_failed",
  "project_create_failed",
  "project_update_failed",
  "project_delete_failed",
  "enquiry_status_update_failed",
  "project_update_create_failed",
  "rate_limited",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Stable success codes. Every code has a matching dictionary entry. */
export const SUCCESS_CODES = [
  "registered",
  "reset_link_sent",
  "password_reset",
  "enquiry_submitted",
  "profile_updated",
  "project_created",
  "project_updated",
  "project_deleted",
  "enquiry_status_updated",
  "project_update_created",
] as const;

export type SuccessCode = (typeof SUCCESS_CODES)[number];

const ERROR_CODE_SET: ReadonlySet<string> = new Set<string>(ERROR_CODES);
const SUCCESS_CODE_SET: ReadonlySet<string> = new Set<string>(SUCCESS_CODES);

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && ERROR_CODE_SET.has(value);
}

export function isSuccessCode(value: unknown): value is SuccessCode {
  return typeof value === "string" && SUCCESS_CODE_SET.has(value);
}

/**
 * Maps a Supabase Auth error onto an allowlisted code.
 *
 * The raw message is never returned — it may contain internal details and
 * may differ between Supabase versions. Unknown errors collapse into
 * `generic_error`.
 */
export function mapAuthError(
  error:
    | { message?: string | null; code?: string | null; status?: number | null }
    | null
    | undefined
): ErrorCode {
  const message = (error?.message ?? "").toLowerCase();

  if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("email address is already") ||
    error?.code === "user_already_exists"
  ) {
    return "email_already_exists";
  }
  if (message.includes("email not confirmed")) {
    return "email_not_confirmed";
  }
  if (
    message.includes("password should be") ||
    message.includes("password is too weak") ||
    error?.code === "weak_password"
  ) {
    return "weak_password";
  }
  if (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    error?.status === 429
  ) {
    return "rate_limited";
  }
  if (
    message.includes("invalid email") ||
    message.includes("unable to validate email") ||
    message.includes("email address") && message.includes("invalid")
  ) {
    return "invalid_email";
  }
  if (message.includes("password")) {
    return "weak_password";
  }

  return "generic_error";
}

/** The set of feedback that can travel through a URL. */
export type Feedback = {
  error?: ErrorCode;
  success?: SuccessCode;
};

/** Builds the query string carrying the feedback codes. */
export function feedbackQuery(feedback: Feedback): string {
  const params = new URLSearchParams();
  if (feedback.error) params.set("error", feedback.error);
  if (feedback.success) params.set("message", feedback.success);
  return params.toString();
}

/**
 * Builds a localized path that carries the feedback codes, optionally
 * pointing at an anchor on the page (for example the contact section).
 */
export function feedbackPath(
  locale: Locale,
  path: string,
  feedback: Feedback,
  hash?: string
): string {
  const base = localizedPath(locale, path);
  const query = feedbackQuery(feedback);
  const suffix = query ? `?${query}` : "";
  const anchor = hash ? `#${hash}` : "";
  return `${base}${suffix}${anchor}`;
}

/**
 * Resolves an error code to its localized message. Returns `null` for codes
 * that are not on the allowlist — unknown input is never rendered.
 */
export function getErrorMessage(dict: Dictionary, code: unknown): string | null {
  if (!isErrorCode(code)) return null;
  return dict.feedback.errors[code];
}

/**
 * Resolves a success code to its localized message. Returns `null` for
 * codes that are not on the allowlist — unknown input is never rendered.
 */
export function getSuccessMessage(
  dict: Dictionary,
  code: unknown
): string | null {
  if (!isSuccessCode(code)) return null;
  return dict.feedback.success[code];
}
