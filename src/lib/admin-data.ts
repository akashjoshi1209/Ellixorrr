/**
 * Read-only admin data access.
 *
 * These helpers are plain server-side functions — deliberately *not* exported
 * from a `"use server"` module, so they are not reachable as public Server
 * Actions. Every caller is a Server Component that has already passed
 * through `requireAdmin()`.
 *
 * Query failures are reported as a boolean flag rather than as the raw
 * Supabase/PostgREST message, so internal details can never reach the page.
 */
import { createServerClient } from "@/lib/supabase/server";

export type AdminCustomer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  created_at: string;
};

export type AdminProject = {
  id: string;
  customer_id: string;
  project_name: string;
  service_type: string;
  description: string | null;
  status: string;
  start_date: string | null;
  expected_completion_date: string | null;
  created_at: string;
  customer: { full_name: string | null; email: string | null } | null;
};

export type AdminEnquiry = {
  id: string;
  customer_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  service_type: string;
  project_description: string;
  status: string;
  created_at: string;
};

export type AdminDataResult<T> = {
  data: T[];
  failed: boolean;
};

/** All customer accounts, newest first. */
export async function adminListCustomers(): Promise<
  AdminDataResult<AdminCustomer>
> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .order("created_at", { ascending: false });

  if (error) return { data: [], failed: true };

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      created_at: row.created_at,
    })),
    failed: false,
  };
}

/** A single customer account. */
export async function adminGetCustomer(
  customerId: string
): Promise<AdminDataResult<AdminCustomer>> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .eq("id", customerId)
    .maybeSingle();

  if (error || !data) return { data: [], failed: true };

  return {
    data: [
      {
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        created_at: data.created_at,
      },
    ],
    failed: false,
  };
}

/** All projects, newest first, together with the owning customer. */
export async function adminListProjects(): Promise<
  AdminDataResult<AdminProject>
> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, customer_id, project_name, service_type, description, status, start_date, expected_completion_date, created_at, profiles!inner(full_name, email)"
    )
    .order("created_at", { ascending: false });

  if (error) return { data: [], failed: true };

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      customer_id: row.customer_id,
      project_name: row.project_name,
      service_type: row.service_type,
      description: row.description,
      status: row.status,
      start_date: row.start_date,
      expected_completion_date: row.expected_completion_date,
      created_at: row.created_at,
      customer: row.profiles
        ? { full_name: row.profiles.full_name, email: row.profiles.email }
        : null,
    })),
    failed: false,
  };
}

/** All enquiries, newest first. */
export async function adminListEnquiries(): Promise<
  AdminDataResult<AdminEnquiry>
> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("enquiries")
    .select(
      "id, customer_id, name, email, phone, business_name, service_type, project_description, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) return { data: [], failed: true };

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      customer_id: row.customer_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      business_name: row.business_name,
      service_type: row.service_type,
      project_description: row.project_description,
      status: row.status,
      created_at: row.created_at,
    })),
    failed: false,
  };
}
