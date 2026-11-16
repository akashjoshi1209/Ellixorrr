"use server";

import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  enquirySchema,
} from "@/lib/validations";

/** ------------------------------------------------------------------------
 *  Authentication server actions
 * ----------------------------------------------------------------------- */

export async function loginAction(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    redirect("/auth/login?error=Invalid email or password.");
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent("Invalid email or password.")}`);
  }

  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  "use server";
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirm_password = formData.get("confirm_password") as string;

  const validated = registerSchema.safeParse({ full_name, email, password, confirm_password });
  if (!validated.success) {
    redirect("/auth/register?error=Invalid registration data.");
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  });

  if (error) {
    redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/login?message=registered");
}

export async function logoutAction() {
  "use server";
  const supabase = await createServerClient();

  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;

  const validated = forgotPasswordSchema.safeParse({ email });
  if (!validated.success) {
    redirect("/auth/forgot-password?error=Invalid email address.");
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/reset-password`,
  });

  if (error) {
    redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/login?message=reset-link-sent");
}

export async function resetPasswordAction(formData: FormData) {
  "use server";
  const password = formData.get("password") as string;
  const confirm_password = formData.get("confirm_password") as string;

  const validated = resetPasswordSchema.safeParse({ password, confirm_password });
  if (!validated.success) {
    redirect("/auth/reset-password?error=Invalid reset data.");
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/login?message=password-reset");
}

export async function submitEnquiryAction(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const business_name = formData.get("business_name") as string;
  const service_type = formData.get("service_type") as string;
  const project_description = formData.get("project_description") as string;

  const validated = enquirySchema.safeParse({
    name,
    email,
    phone,
    business_name,
    service_type,
    project_description,
  });
  if (!validated.success) {
    redirect("/contact?error=Invalid enquiry data.");
  }

  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Supabase client types don't match our custom Database type; using any here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("enquiries").insert({
    customer_id: user?.id ?? null,
    name,
    email,
    phone: phone || null,
    business_name: business_name || null,
    service_type,
    project_description,
    status: "new",
  });

  if (error) {
    redirect(`/contact?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/contact?message=submitted");
}

export async function getCurrentProfile(): Promise<{ profile: { id: string; email: string; role: string; full_name: string | null } | null; error: string | null }> {
  "use server";
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { profile: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return { profile: null, error: error.message };
  return { profile: data, error: null };
}

export async function updateProfileAction(formData: FormData) {
  "use server";
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const business_name = formData.get("business_name") as string;

  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/profile");
  }

  // Supabase client types don't match our custom Database type; using any here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      full_name: full_name || undefined,
      email: email || undefined,
      phone: phone || undefined,
      business_name: business_name || undefined,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/profile?message=updated");
}
