export const dynamic = "force-dynamic";

import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion/Reveal";
import { requireCustomer } from "@/lib/profiles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { PortalChrome, PortalError } from "@/components/portals/PortalChrome";
import { portalLabels } from "@/lib/portal-labels";

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
  project_updates?: Array<{
    id: string;
    title: string;
    description: string | null;
    created_at: string;
  }> | null;
};

export default async function CustomerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);
  const supabase = await createServerClient();

  // Signed-out visitors are sent to the login page; admins are sent to the
  // admin dashboard (they are not customers).
  const profile = await requireCustomer(resolvedLocale);

  const current = `/${locale}/dashboard`;
  const portalNav = [
    { href: current, label: dict.nav.dashboard },
    { href: `/${locale}/dashboard/projects`, label: dict.auth.myProjects },
    { href: `/${locale}/dashboard/profile`, label: dict.auth.myProfile },
  ];

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, project_updates(*)")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <PortalChrome
        eyebrow={dict.auth.customerPortal}
        title={dict.auth.customerPortal}
        description={`${dict.auth.welcomeBack}${profile.full_name ? `, ${profile.full_name}` : ""}.`}
        navLabel={dict.nav.account}
        nav={portalNav}
        current={current}
      >
        <PortalError
          heading={dict.auth.loadFailedTitle}
          message={dict.auth.loadError}
        />
      </PortalChrome>
    );
  }

  const projectRows = (projects ?? []) as ProjectRow[];
  const activeProjects = projectRows.filter(
    (p) => p.status !== "completed" && p.status !== "on_hold"
  );
  const completedProjects = projectRows.filter(
    (p) => p.status === "completed"
  );
  const recentUpdates = projectRows
    .flatMap((p) =>
      (p.project_updates ?? []).map((update) => ({
        ...update,
        project_name: p.project_name,
      }))
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  return (
    <PortalChrome
      eyebrow={dict.auth.customerPortal}
      title={dict.auth.customerPortal}
      description={`${dict.auth.welcomeBack}${profile.full_name ? `, ${profile.full_name}` : ""}.`}
      navLabel={dict.nav.account}
      nav={portalNav}
      current={current}
    >
      <div>
        <Reveal delay={0.1}>
          <div className="grid gap-6 mb-14 md:grid-cols-3">
            <div className="p-6 border border-rule bg-forest/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {dict.auth.activeProjects}
              </p>
              <p className="mt-1 display-md text-bone">{activeProjects.length}</p>
            </div>
            <div className="p-6 border border-rule bg-forest/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {dict.auth.completedProjects}
              </p>
              <p className="mt-1 display-md text-bone">
                {completedProjects.length}
              </p>
            </div>
            <div className="p-6 border border-rule bg-forest/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {dict.auth.recentUpdates}
              </p>
              <p className="mt-1 display-md text-bone">{recentUpdates.length}</p>
            </div>
          </div>
        </Reveal>

        {activeProjects.length > 0 ? (
          <Reveal delay={0.2}>
            <div className="mb-14">
              <h3 className="display-md mb-6">{dict.auth.activeProjects}</h3>
              <ul className="grid gap-6 md:grid-cols-3">
                {activeProjects.map((project) => (
                  <li
                    key={project.id}
                    className="p-6 border border-rule bg-forest/40 rounded-md hover:border-rule-strong transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="display-md">{project.project_name}</h4>
                      <span className="shrink-0 px-2 py-0.5 rounded text-xs font-semibold tracking-wider text-crimson-bright bg-crimson/10 border border-crimson/30">
                        {portalLabels.projectStatus(dict.auth, project.status)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-3">
                      {portalLabels.service(dict.auth, project.service_type)}
                    </p>
                    <p className="text-sm text-muted mb-4">
                      {project.description || dict.auth.noDescriptionAvailable}
                    </p>
                    <Link
                      href={`/${locale}/dashboard/projects/${project.id}`}
                      className="text-xs font-semibold text-bone transition-colors hover:text-crimson-bright"
                    >
                      {dict.auth.viewDetails}
                      <span className="sr-only">: {project.project_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.2}>
            <div className="mb-14 p-8 border border-rule bg-forest/40 rounded-md text-center">
              <p className="text-sm text-muted">{dict.auth.emptyProjects}</p>
              <Link
                href={`/${locale}#contact`}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-crimson hover:text-bone"
              >
                {dict.auth.contactUs}
              </Link>
            </div>
          </Reveal>
        )}

        {recentUpdates.length > 0 ? (
          <Reveal delay={0.3}>
            <div className="mb-14">
              <h3 className="display-md mb-6">
                {dict.auth.recentUpdatesFromEllixorrr}
              </h3>
              <ul className="space-y-4">
                {recentUpdates.map((update) => (
                  <li
                    key={update.id}
                    className="p-4 border border-rule bg-forest/40 rounded-md"
                  >
                    <h4 className="display-md mb-1">{update.title}</h4>
                    <p className="text-sm text-muted">
                      {update.description || dict.auth.noDescription}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {update.project_name} ·{" "}
                      {portalLabels.date(
                        update.created_at,
                        resolvedLocale,
                        "short"
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.3}>
            <div className="mb-14 p-8 border border-rule bg-forest/40 rounded-md text-center">
              <p className="text-sm text-muted">{dict.auth.noUpdates}</p>
            </div>
          </Reveal>
        )}

        {completedProjects.length > 0 ? (
          <Reveal delay={0.4}>
            <div>
              <h3 className="display-md mb-6">{dict.auth.completedProjects}</h3>
              <ul className="grid gap-6 md:grid-cols-3">
                {completedProjects.map((project) => (
                  <li
                    key={project.id}
                    className="p-6 border border-rule bg-forest/40 rounded-md"
                  >
                    <h4 className="display-md mb-2">{project.project_name}</h4>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-3">
                      {portalLabels.service(dict.auth, project.service_type)}
                    </p>
                    <p className="text-sm text-muted">
                      {project.description || dict.auth.noDescriptionAvailable}
                    </p>
                    <Link
                      href={`/${locale}/dashboard/projects/${project.id}`}
                      className="mt-4 inline-block text-xs font-semibold text-bone transition-colors hover:text-crimson-bright"
                    >
                      {dict.auth.viewDetails}
                      <span className="sr-only">: {project.project_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ) : null}
      </div>
    </PortalChrome>
  );
}
