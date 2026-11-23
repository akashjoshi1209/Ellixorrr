import { getErrorMessage, getSuccessMessage } from "@/lib/feedback";
import type { Dictionary } from "@/i18n/types";

type FeedbackBannerProps = {
  dict: Dictionary;
  /** Raw code from the query string — only allowlisted codes are rendered. */
  error?: string | null;
  success?: string | null;
};

/**
 * Renders the localized feedback for an allowlisted error/success code.
 *
 * Unknown codes render nothing at all, so a crafted query string can never
 * make the application display attacker-controlled text.
 */
export function FeedbackBanner({ dict, error, success }: FeedbackBannerProps) {
  const errorMessage = getErrorMessage(dict, error);
  const successMessage = getSuccessMessage(dict, success);

  if (!errorMessage && !successMessage) return null;

  return (
    <>
      {errorMessage ? (
        <div
          role="alert"
          className="mb-6 p-4 rounded border border-crimson/20 bg-crimson/10 text-sm text-crimson/70"
        >
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div
          role="status"
          className="mb-6 p-4 rounded border border-bone/10 bg-bone/5 text-sm text-bone/70"
        >
          {successMessage}
        </div>
      ) : null}
    </>
  );
}
