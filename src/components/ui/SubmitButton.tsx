"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";

type SubmitButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  isSubmitting?: boolean;
  pendingLabel?: string;
  confirmMessage?: string;
  ariaLabel?: string;
  className?: string;
};

export function SubmitButton({
  children,
  disabled = false,
  isSubmitting = false,
  pendingLabel = "Sending…",
  confirmMessage,
  ariaLabel,
  className = "",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isPending = pending || isSubmitting;
  return (
    <button
      type="submit"
      disabled={disabled || isPending}
      aria-busy={isPending}
      aria-label={ariaLabel}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={`w-full inline-flex items-center justify-center gap-2 rounded-full bg-bone px-6 py-3 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isPending ? (
        <>
          <LoaderCircle
            className="h-4 w-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          {pendingLabel}
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </>
      )}
    </button>
  );
}
