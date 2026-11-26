"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Locale } from "@/i18n/config";
import { createServerClient } from "@/lib/supabase/server";
import { feedbackPath } from "@/lib/feedback";
import { resolveLocale } from "@/lib/navigation";
import { requireAdmin } from "@/lib/profiles";
import {
  adminCreateProjectSchema,
  adminCreateProjectUpdateSchema,
  adminDeleteProjectSchema,
  adminEnquiryStatusSchema,
  adminUpdateProjectSchema,
} from "@/lib/validations";

/** ------------------------------------------------------------------------
 *  Helpers
 *
 *  Module-private on purpose: every export of a `"use server"` module is a
 *  publicly reachable Server Action, so only the mutations below may be
 *  exported. The read-only listings live in `src/lib/admin-data.ts`.
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

/** ------------------------------------------------------------------------
 *  Project management (admin)
 * ----------------------------------------------------------------------- */

export async function adminCreateProject(formData: FormData) {
  const locale = readLocale(formData);

  await requireAdmin(locale);

  const validated = adminCreateProjectSchema.safeParse({
    customer_id: readString(formData, "customer_id"),
    project_name: readString(formData, "project_name"),
    service_type: readString(formData, "service_type"),
    description: readString(formData, "description"),
    status: readString(formData, "status"),
    start_date: readString(formData, "start_date"),
    expected_completion_date: readString(formData, "expected_completion_date"),
  });
  if (!validated.success) {
    redirect(
      feedbackPath(locale, "/admin/projects", { error: "validation_failed" })
    );
  }

  const supabase = await createServerClient();

  const { error } = await supabase.from("projects").insert({
    customer_id: validated.data.customer_id,
    project_name: validated.data.project_name,
    service_type: validated.data.service_type,
    description: validated.data.description || null,
    status: validated.data.status ?? "enquiry",
    start_date: validated.data.start_date ?? null,
    expected_completion_date: validated.data.expected_completion_date ?? null,
  });

  if (error) {
    redirect(
      feedbackPath(locale, "/admin/projects", {
        error: "project_create_failed",
      })
    );
  }

  revalidatePath("/[locale]/admin/projects", "page");
  redirect(
    feedbackPath(locale, "/admin/projects", { success: "project_created" })
  );
}

export async function adminUpdateProject(formData: FormData) {
  const locale = readLocale(formData);

  await requireAdmin(locale);

  const validated = adminUpdateProjectSchema.safeParse({
    project_id: readString(formData, "project_id"),
    customer_id: readString(formData, "customer_id"),
    project_name: readString(formData, "project_name"),
    service_type: readString(formData, "service_type"),
    description: readString(formData, "description"),
    status: readString(formData, "status"),
    start_date: readString(formData, "start_date"),
    expected_completion_date: readString(formData, "expected_completion_date"),
  });
  if (!validated.success) {
    redirect(
      feedbackPath(locale, "/admin/projects", { error: "validation_failed" })
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("projects")
    .update({
      customer_id: validated.data.customer_id,
      project_name: validated.data.project_name,
      service_type: validated.data.service_type,
      description: validated.data.description || null,
      status: validated.data.status,
      start_date: validated.data.start_date ?? null,
      expected_completion_date: validated.data.expected_completion_date ?? null,
    })
    .eq("id", validated.data.project_id)
    .select("id");

  if (error) {
    redirect(
      feedbackPath(locale, "/admin/projects", {
        error: "project_update_failed",
      })
    );
  }

  // A successful update must affect exactly one row. Otherwise the project
  // was removed between load and submission and the stale form is rejected.
  if (!data || data.length === 0) {
    redirect(
      feedbackPath(locale, "/admin/projects", { error: "validation_failed" })
    );
  }

  revalidatePath("/[locale]/admin/projects", "page");
  redirect(
    feedbackPath(locale, "/admin/projects", { success: "project_updated" })
  );
}

export async function adminDeleteProject(formData: FormData) {
  const locale = readLocale(formData);

  await requireAdmin(locale);

  const validated = adminDeleteProjectSchema.safeParse({
    project_id: readString(formData, "project_id"),
  });
  if (!validated.success) {
    redirect(
      feedbackPath(locale, "/admin/projects", { error: "validation_failed" })
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", validated.data.project_id)
    .select("id");

  if (error) {
    redirect(
      feedbackPath(locale, "/admin/projects", {
        error: "project_delete_failed",
      })
    );
  }

  if (!data || data.length === 0) {
    redirect(
      feedbackPath(locale, "/admin/projects", { error: "validation_failed" })
    );
  }

  revalidatePath("/[locale]/admin/projects", "page");
  redirect(
    feedbackPath(locale, "/admin/projects", { success: "project_deleted" })
  );
}

/** ------------------------------------------------------------------------
 *  Enquiry management (admin)
 * ----------------------------------------------------------------------- */

export async function adminUpdateEnquiryStatus(formData: FormData) {
  const locale = readLocale(formData);

  await requireAdmin(locale);

  const validated = adminEnquiryStatusSchema.safeParse({
    enquiry_id: readString(formData, "enquiry_id"),
    status: readString(formData, "status"),
  });
  if (!validated.success) {
    redirect(
      feedbackPath(locale, "/admin/enquiries", { error: "validation_failed" })
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("enquiries")
    .update({ status: validated.data.status })
    .eq("id", validated.data.enquiry_id)
    .select("id");

  if (error) {
    redirect(
      feedbackPath(locale, "/admin/enquiries", {
        error: "enquiry_status_update_failed",
      })
    );
  }

  if (!data || data.length === 0) {
    redirect(
      feedbackPath(locale, "/admin/enquiries", { error: "validation_failed" })
    );
  }

  revalidatePath("/[locale]/admin/enquiries", "page");
  redirect(
    feedbackPath(locale, "/admin/enquiries", {
      success: "enquiry_status_updated",
    })
  );
}

/** ------------------------------------------------------------------------
 *  Project updates (admin)
 * ----------------------------------------------------------------------- */

export async function adminCreateProjectUpdate(formData: FormData) {
  const locale = readLocale(formData);

  // The author is taken from the verified admin profile, never from the form.
  const admin = await requireAdmin(locale);

  const validated = adminCreateProjectUpdateSchema.safeParse({
    project_id: readString(formData, "project_id"),
    title: readString(formData, "title"),
    description: readString(formData, "description"),
  });
  if (!validated.success) {
    redirect(
      feedbackPath(locale, "/admin/projects", { error: "validation_failed" })
    );
  }

  const supabase = await createServerClient();

  const { error } = await supabase.from("project_updates").insert({
    project_id: validated.data.project_id,
    author_id: admin.id,
    title: validated.data.title,
    description: validated.data.description || null,
  });

  if (error) {
    redirect(
      feedbackPath(locale, "/admin/projects", {
        error: "project_update_create_failed",
      })
    );
  }

  revalidatePath("/[locale]/admin/projects", "page");
  revalidatePath("/[locale]/dashboard/projects", "page");
  redirect(
    feedbackPath(locale, "/admin/projects", {
      success: "project_update_created",
    })
  );
}
