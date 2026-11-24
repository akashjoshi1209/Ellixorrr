"use server";

import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { createServerClient } from "@/lib/supabase/server";
import {
  createEnquiryFetchProbe,
  logEnquiryInsertError,
} from "@/lib/supabase/enquiry-diagnostics";
import {
  feedbackPath,
  mapAuthError,
  type ErrorCode,
} from "@/lib/feedback";
import {
  localizedPath,
  resolveLocale,
  safeRedirectPath,
  getAppOrigin,
} from "@/lib/navigation";
import { getCurrentProfile } from "@/lib/profiles";
import {
  enquirySchema,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations";

/** ------------------------------------------------------------------------
 *  Helpers
 *
 *  These are module-private: every export of a `"use server"` module is a
 *  publicly reachable Server Action, so only the mutations below may be
 *  exported.
 * ----------------------------------------------------------------------- */

/** Reads a form field as a plain string (never a File). */
function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Reads the locale that the page submitted with the form. */
function readLocale(formData: FormData): Locale {
  return resolveLocale(readString(formData, "locale"));
}

/**
 * Maps a Zod failure onto an allowlisted error code. A confirmation-field
 * mismatch gets its own code; everything else is a generic validation
 * failure. The raw validation messages are never exposed.
 */
function validationErrorCode(
  issues: readonly { path: PropertyKey[] }[],
  mismatchCode: ErrorCode
): ErrorCode {
  const mismatch = issues.some((issue) => issue.path[0] === "confirm_password");
  return mismatch ? mismatchCode : "validation_failed";
}

/** ------------------------------------------------------------------------
 *  Authentication server actions
 * ----------------------------------------------------------------------- */

export async function loginAction(formData: FormData) {
  const locale = readLocale(formData);
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const redirectTo = readString(formData, "redirectTo");

  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    redirect(
      feedbackPath(locale, "/auth/login", { error: "invalid_credentials" })
    );
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    // The raw Supabase message is never echoed back: it can reveal whether
    // an account exists for a given address.
    redirect(
      feedbackPath(locale, "/auth/login", { error: "invalid_credentials" })
    );
  }

  // Honour the (validated) destination the visitor came from.
  const safeTarget = safeRedirectPath(redirectTo);
  if (safeTarget) redirect(safeTarget);

  // Otherwise route by role.
  const profile = await getCurrentProfile();
  if (profile?.role === "admin") {
    redirect(localizedPath(locale, "/admin"));
  }
  redirect(localizedPath(locale, "/dashboard"));
}

export async function registerAction(formData: FormData) {
  const locale = readLocale(formData);

  const validated = registerSchema.safeParse({
    full_name: readString(formData, "full_name"),
    email: readString(formData, "email"),
    password: readString(formData, "password"),
    confirm_password: readString(formData, "confirm_password"),
  });
  if (!validated.success) {
    redirect(
      feedbackPath(locale, "/auth/register", {
        error: validationErrorCode(
          validated.error.issues,
          "passwords_dont_match"
        ),
      })
    );
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: { full_name: validated.data.full_name },
    },
  });

  if (error) {
    redirect(
      feedbackPath(locale, "/auth/register", { error: mapAuthError(error) })
    );
  }

  redirect(feedbackPath(locale, "/auth/login", { success: "registered" }));
}

export async function logoutAction(input?: string | FormData) {
  const locale = resolveLocale(
    typeof input === "string" ? input : input?.get("locale")
  );

  const supabase = await createServerClient();
  await supabase.auth.signOut();

  redirect(localizedPath(locale, "/"));
}

export async function forgotPasswordAction(formData: FormData) {
  const locale = readLocale(formData);

  const validated = forgotPasswordSchema.safeParse({
    email: readString(formData, "email"),
  });
  if (!validated.success) {
    redirect(
      feedbackPath(locale, "/auth/forgot-password", { error: "invalid_email" })
    );
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    validated.data.email,
    {
      // Build the reset-password redirect from the application's own origin,
      // not from Supabase. The locale prefix is preserved so the visitor
      // lands on the correct localized page after clicking the reset link.
      redirectTo: `${getAppOrigin()}/${locale}/auth/reset-password`,
    }
  );

  if (error) {
    redirect(
      feedbackPath(locale, "/auth/forgot-password", {
        error: mapAuthError(error),
      })
    );
  }

  redirect(
    feedbackPath(locale, "/auth/login", { success: "reset_link_sent" })
  );
}

export async function resetPasswordAction(formData: FormData) {
  const locale = readLocale(formData);

  const validated = resetPasswordSchema.safeParse({
    password: readString(formData, "password"),
    confirm_password: readString(formData, "confirm_password"),
  });
  if (!validated.success) {
    redirect(
      feedbackPath(locale, "/auth/reset-password", {
        error: validationErrorCode(
          validated.error.issues,
          "passwords_dont_match"
        ),
      })
    );
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  });

  if (error) {
    redirect(
      feedbackPath(locale, "/auth/reset-password", { error: mapAuthError(error) })
    );
  }

  redirect(
    feedbackPath(locale, "/auth/login", { success: "password_reset" })
  );
}

/** ------------------------------------------------------------------------
 *  Public enquiry (homepage contact form)
 * ----------------------------------------------------------------------- */

export async function submitEnquiryAction(formData: FormData) {
  const validated = enquirySchema.safeParse({
    name: readString(formData, "name"),
    email: readString(formData, "email"),
    phone: readString(formData, "phone"),
    business_name: readString(formData, "business_name"),
    service_type: readString(formData, "service_type"),
    project_description: readString(formData, "project_description"),
  });
  if (!validated.success) {
    return { error: "validation_failed" };
  }

  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const probe = createEnquiryFetchProbe();
  const { error, status } = await supabase
    .from("enquiries", { fetch: probe.fetch })
    .insert({
      customer_id: user?.id ?? null,
      name: validated.data.name,
      email: validated.data.email,
      phone: validated.data.phone || null,
      business_name: validated.data.business_name || null,
      service_type: validated.data.service_type,
      project_description: validated.data.project_description,
      status: "new",
    });

  if (error) {
    logEnquiryInsertError(error, status, probe.getTransport());
    return { error: "enquiry_failed" };
  }

  return { success: "enquiry_submitted" };
}

/** ------------------------------------------------------------------------
 *  Customer profile
 * ----------------------------------------------------------------------- */

export async function updateProfileAction(formData: FormData) {
  const locale = readLocale(formData);

  const validated = profileSchema.safeParse({
    full_name: readString(formData, "full_name"),
    email: readString(formData, "email"),
    phone: readString(formData, "phone"),
  });
  if (!validated.success) {
    redirect(
      feedbackPath(locale, "/dashboard/profile", { error: "validation_failed" })
    );
  }

  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `${localizedPath(locale, "/auth/login")}?redirectTo=${encodeURIComponent(
        localizedPath(locale, "/dashboard/profile")
      )}`
    );
  }

  // `role` is intentionally absent: a customer can never promote themselves.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: validated.data.full_name || null,
      email: validated.data.email || null,
      phone: validated.data.phone || null,
    })
    .eq("id", user.id);

  if (error) {
    redirect(
      feedbackPath(locale, "/dashboard/profile", {
        error: "profile_update_failed",
      })
    );
  }

  redirect(
    feedbackPath(locale, "/dashboard/profile", { success: "profile_updated" })
  );
}
