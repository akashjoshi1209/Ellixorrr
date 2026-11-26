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
import { PortalChrome, PortalError } from "@/components/portals/PortalChrome";

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
  const hasLoadFailure =
    customersResult.failed || projectsResult.failed || enquiriesResult.failed;

  const portalNav = [
    { href: `/${locale}/admin`, label: dict.nav.dashboard },
    { href: `/${locale}/admin/customers`, label: dict.nav.customers },
    { href: `/${locale}/admin/projects`, label: dict.nav.adminProjects },
    { href: `/${locale}/admin/enquiries`, label: dict.auth.enquiries },
  ];

  return (
    <PortalChrome
      eyebrow={dict.auth.adminDashboard}
      title={dict.auth.adminDashboard}
      navLabel={dict.nav.account}
      nav={portalNav}
      current={`/${locale}/admin`}
    >
      <div>
        {hasLoadFailure ? (
          <div className="mb-10">
            <PortalError
              heading={dict.auth.loadFailedTitle}
              message={dict.auth.loadError}
            />
          </div>
        ) : null}

        {/* Stats are hidden on partial failure so no zeroed count is presented
            as a complete result while any query is unavailable. */}
        {!hasLoadFailure ? (
          <Reveal delay={0.1}>
            <div className="grid gap-6 mb-14 md:grid-cols-3 lg:grid-cols-5">
              <div className="p-6 border border-rule bg-forest/40 rounded-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {dict.auth.totalCustomers}
                </p>
                <p className="mt-1 display-md text-bone">{totalCustomers}</p>
              </div>
              <div className="p-6 border border-rule bg-forest/40 rounded-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {dict.auth.totalProjects}
                </p>
                <p className="mt-1 display-md text-bone">{totalProjects}</p>
              </div>
              <div className="p-6 border border-rule bg-forest/40 rounded-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {dict.auth.activeProjects}
                </p>
                <p className="mt-1 display-md text-bone">{activeProjects}</p>
              </div>
              <div className="p-6 border border-rule bg-forest/40 rounded-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {dict.auth.completedProjects}
                </p>
                <p className="mt-1 display-md text-bone">{completedProjects}</p>
              </div>
              <div className="p-6 border border-rule bg-forest/40 rounded-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {dict.auth.newEnquiries}
                </p>
                <p className="mt-1 display-md text-crimson-bright">
                  {newEnquiries}
                </p>
              </div>
            </div>
          </Reveal>
        ) : null}

        {/* Quick actions */}
        <Reveal delay={0.2}>
          <div className="grid gap-4 mb-14 md:grid-cols-3">
            <Link
              href={`/${locale}/admin/customers`}
              className="p-6 border border-rule bg-forest/40 rounded-md hover:border-rule-strong transition-colors"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1">
                {dict.auth.manageCustomers}
              </p>
              <p className="text-sm text-muted">
                {dict.auth.manageCustomersDescription}
              </p>
            </Link>
            <Link
              href={`/${locale}/admin/projects`}
              className="p-6 border border-rule bg-forest/40 rounded-md hover:border-rule-strong transition-colors"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1">
                {dict.auth.manageProjects}
              </p>
              <p className="text-sm text-muted">
                {dict.auth.manageProjectsDescription}
              </p>
            </Link>
            <Link
              href={`/${locale}/admin/enquiries`}
              className="p-6 border border-rule bg-forest/40 rounded-md hover:border-rule-strong transition-colors"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1">
                {dict.auth.manageEnquiries}
              </p>
              <p className="text-sm text-muted">
                {dict.auth.manageEnquiriesDescription}
              </p>
            </Link>
          </div>
        </Reveal>
      </div>
    </PortalChrome>
  );
}
