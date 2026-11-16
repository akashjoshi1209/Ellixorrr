"use server";

import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type CustomerRow = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
};

type EnquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  service_type: string;
  project_description: string;
  status: string;
  created_at: string;
};

type ProjectRow = {
  id: string;
  customer_id: string;
  project_name: string;
  service_type: string;
  description: string | null;
  status: string;
  start_date: string | null;
  expected_completion_date: string | null;
  created_at: string;
};

/** ------------------------------------------------------------------------
 *  Authorization helper
 * ----------------------------------------------------------------------- */

async function getCurrentProfile(): Promise<{ id: string; email: string; role: string; full_name: string | null } | null> {
  const cookieStore = await cookies();
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, role, full_name")
    .eq("id", user.id)
    .single();

  return data;
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated" };
  if (profile.role !== "admin") return { error: "Admin access required" };
  return { profile };
}

/** ------------------------------------------------------------------------
 *  Customer management (admin)
 * ----------------------------------------------------------------------- */

export async function adminListCustomers() {
  "use server";
  const auth = await requireAdmin();
  if ("error" in auth) return redirect("/auth/login");

  const supabase = await createServerClient();

  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { customers: data as CustomerRow[] };
}

export async function adminGetCustomer(customerId: string) {
  "use server";
  const auth = await requireAdmin();
  if ("error" in auth) return redirect("/auth/login");

  const supabase = await createServerClient();

  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .eq("id", customerId)
    .single();

  if (error) return { error: error.message };
  return { customer: data };
}

/** ------------------------------------------------------------------------
 *  Project management (admin)
 * ----------------------------------------------------------------------- */

export async function adminListProjects() {
  "use server";
  const auth = await requireAdmin();
  if ("error" in auth) return redirect("/auth/login");

  const supabase = await createServerClient();

  const { data, error } = await (supabase as any)
    .from("projects")
    .select("*, profiles!inner(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { projects: data as ProjectRow[] };
}

export async function adminCreateProject(formData: FormData) {
  "use server";
  const auth = await requireAdmin();
  if ("error" in auth) return redirect("/auth/login");

  const customer_id = formData.get("customer_id") as string;
  const project_name = formData.get("project_name") as string;
  const service_type = formData.get("service_type") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;

  const supabase = await createServerClient();

  const { error } = await (supabase as any).from("projects").insert({
    customer_id,
    project_name,
    service_type,
    description,
    status,
  });

  if (error) {
    return redirect(`/admin/projects?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/projects", "layout");
  return redirect("/admin/projects?message=created");
}

export async function adminUpdateProject(formData: FormData) {
  "use server";
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const projectId = formData.get("project_id") as string;
  const project_name = formData.get("project_name") as string;
  const service_type = formData.get("service_type") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;

  const supabase = await createServerClient();

  const { error } = await (supabase as any)
    .from("projects")
    .update({ project_name, service_type, description, status })
    .eq("id", projectId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/projects", "layout");
  return { success: true };
}

export async function adminDeleteProject(formData: FormData) {
  "use server";
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const projectId = formData.get("project_id") as string;

  const supabase = await createServerClient();

  const { error } = await (supabase as any).from("projects").delete().eq("id", projectId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/projects", "layout");
  return { success: true };
}

/** ------------------------------------------------------------------------
 *  Enquiry management (admin)
 * ----------------------------------------------------------------------- */

export async function adminListEnquiries() {
  "use server";
  const auth = await requireAdmin();
  if ("error" in auth) return redirect("/auth/login");

  const supabase = await createServerClient();

  const { data, error } = await (supabase as any)
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { enquiries: data as EnquiryRow[] };
}

export async function adminUpdateEnquiryStatus(formData: FormData) {
  "use server";
  const auth = await requireAdmin();
  if ("error" in auth) return redirect("/auth/login");

  const enquiryId = formData.get("enquiry_id") as string;
  const status = formData.get("status") as string;

  const supabase = await createServerClient();

  const { error } = await (supabase as any)
    .from("enquiries")
    .update({ status })
    .eq("id", enquiryId);

  if (error) {
    return redirect(`/admin/enquiries?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/enquiries", "layout");
  return redirect("/admin/enquiries?message=updated");
}