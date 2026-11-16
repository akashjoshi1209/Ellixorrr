"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";

type SubmitButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export function SubmitButton({
  children,
  disabled = false,
  className = "",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`w-full inline-flex items-center justify-center gap-2 rounded-full bg-bone px-6 py-3 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {pending ? (
        <>
          <ArrowRight className="h-4 w-4 animate-spin" aria-hidden="true" />
          Sending…
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
