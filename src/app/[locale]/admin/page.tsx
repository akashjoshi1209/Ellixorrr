import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule } from "@/components/sections/SectionShell";
import { adminListCustomers, adminListProjects, adminListEnquiries } from "@/actions/admin";
import type { Dictionary } from "@/i18n/types";

export const dynamic = "force-dynamic";

type ProjectRow = {
  status: string;
};

export default async function AdminDashboardPage({
  params,
  dict,
}: {
  params: Promise<{ locale: string }>;
  dict: Dictionary;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirectTo=/${locale}/admin`);
  }

  // Server-side authorization: only admins may access admin routes.
  const adminResult = await adminListCustomers();
  if ("error" in adminResult) {
    redirect(`/${locale}/dashboard`);
  }

  const [customersResult, projectsResult, enquiriesResult] = await Promise.all([
    adminListCustomers(),
    adminListProjects(),
    adminListEnquiries(),
  ]);

  const customers =
    "customers" in customersResult
      ? (customersResult.customers ?? [])
      : [];
  const projects =
    "projects" in projectsResult ? (projectsResult.projects ?? []) : [];
  const enquiries =
    "enquiries" in enquiriesResult ? (enquiriesResult.enquiries ?? []) : [];

  const totalCustomers = customers.length;
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status !== "completed" && p.status !== "on_hold"
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === "completed"
  ).length;
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;

  return (
    <section className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal py-28 md:py-40">
      <div className="relative mx-auto max-w-7xl px-gutter">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-crimson" aria-hidden="true" />
                <h2 className="display-lg">{dict.auth.adminDashboard}</h2>
              </div>
              <p className="text-sm leading-relaxed text-bone/70">
                Manage customers, projects, and enquiries.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Stats cards */}
        <Reveal delay={0.1}>
          <div className="grid gap-6 mb-14 md:grid-cols-3 lg:grid-cols-5">
            <div className="p-6 border border-bone/10 bg-charcoal/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                Total customers
              </p>
              <p className="mt-1 display-md text-bone">{totalCustomers}</p>
            </div>
            <div className="p-6 border border-bone/10 bg-charcoal/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                Total projects
              </p>
              <p className="mt-1 display-md text-bone">{totalProjects}</p>
            </div>
            <div className="p-6 border border-bone/10 bg-charcoal/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                Active projects
              </p>
              <p className="mt-1 display-md text-bone">{activeProjects}</p>
            </div>
            <div className="p-6 border border-bone/10 bg-charcoal/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                Completed projects
              </p>
              <p className="mt-1 display-md text-bone">{completedProjects}</p>
            </div>
            <div className="p-6 border border-bone/10 bg-charcoal/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                New enquiries
              </p>
              <p className="mt-1 display-md text-crimson">{newEnquiries}</p>
            </div>
          </div>
        </Reveal>

        {/* Quick actions */}
        <Reveal delay={0.2}>
          <div className="grid gap-4 mb-14 md:grid-cols-3">
            <Link
              href={`/${locale}/admin/customers`}
              className="p-6 border border-bone/10 bg-charcoal/40 rounded-md hover:border-bone/25 transition-colors"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1">
                Manage customers
              </p>
              <p className="text-sm text-bone/70">
                View and manage all customer accounts.
              </p>
            </Link>
            <Link
              href={`/${locale}/admin/projects`}
              className="p-6 border border-bone/10 bg-charcoal/40 rounded-md hover:border-bone/25 transition-colors"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1">
                Manage projects
              </p>
              <p className="text-sm text-bone/70">
                Create, assign, and track all projects.
              </p>
            </Link>
            <Link
              href={`/${locale}/admin/enquiries`}
              className="p-6 border border-bone/10 bg-charcoal/40 rounded-md hover:border-bone/25 transition-colors"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1">
                Manage enquiries
              </p>
              <p className="text-sm text-bone/70">
                Review and respond to new enquiries.
              </p>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
