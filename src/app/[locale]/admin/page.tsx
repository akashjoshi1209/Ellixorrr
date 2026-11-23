import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import {
  adminListCustomers,
  adminListEnquiries,
  adminListProjects,
} from "@/lib/admin-data";
import { requireAdmin } from "@/lib/profiles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale as Locale);
  const resolvedLocale = locale as Locale;

  // Server-side authorization: only admins may access admin routes.
  await requireAdmin(resolvedLocale);

  const [customersResult, projectsResult, enquiriesResult] = await Promise.all([
    adminListCustomers(),
    adminListProjects(),
    adminListEnquiries(),
  ]);

  const customers = customersResult.data;
  const projects = projectsResult.data;
  const enquiries = enquiriesResult.data;

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
