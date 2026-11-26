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
};

export default async function CustomerProjectsPage({
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

  const current = `/${locale}/dashboard/projects`;
  const portalNav = [
    { href: `/${locale}/dashboard`, label: dict.nav.dashboard },
    { href: current, label: dict.auth.myProjects },
    { href: `/${locale}/dashboard/profile`, label: dict.auth.myProfile },
  ];

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      "id, customer_id, project_name, service_type, description, status, start_date, expected_completion_date, created_at"
    )
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <PortalChrome
        eyebrow={dict.auth.myProjects}
        title={dict.auth.myProjects}
        description={dict.auth.allYourProjects}
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

  return (
    <PortalChrome
      eyebrow={dict.auth.myProjects}
      title={dict.auth.myProjects}
      description={dict.auth.allYourProjects}
      navLabel={dict.nav.account}
      nav={portalNav}
      current={current}
    >
      <Reveal delay={0.1}>
        <div className="mb-10">
          <h3 className="display-md mb-6">{dict.auth.yourProjects}</h3>
          {projectRows.length > 0 ? (
            <ul className="grid gap-6 md:grid-cols-3">
              {projectRows.map((project) => (
                <li
                  key={project.id}
                  className="p-6 border border-rule bg-forest/40 rounded-md hover:border-rule-strong transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="display-md">{project.project_name}</h4>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold tracking-wider ${
                        project.status === "completed"
                          ? "text-forest bg-forest/10 border border-forest/20"
                          : project.status === "on_hold"
                            ? "text-bone bg-bone/10 border border-rule-strong"
                            : "text-crimson-bright bg-crimson/10 border border-crimson/30"
                      }`}
                    >
                      {portalLabels.projectStatus(dict.auth, project.status)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1">
                    {portalLabels.service(dict.auth, project.service_type)}
                  </p>
                  <p className="text-sm text-muted mb-4">
                    {project.description || dict.auth.noDescriptionAvailable}
                  </p>
                  <p className="text-xs text-muted mb-3">
                    {dict.auth.started}:{" "}
                    {portalLabels.date(
                      project.start_date || project.created_at,
                      resolvedLocale,
                      "long"
                    )}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/${locale}/dashboard/projects/${project.id}`}
                      className="text-xs font-semibold text-bone transition-colors hover:text-crimson-bright"
                    >
                      {dict.auth.viewDetails}
                      <span className="sr-only">: {project.project_name}</span>
                    </Link>
                    <p className="text-xs text-muted">
                      {portalLabels.date(project.created_at, resolvedLocale)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 border border-rule bg-forest/40 rounded-md text-center">
              <p className="text-sm text-muted">{dict.auth.emptyProjects}</p>
              <Link
                href={`/${locale}#contact`}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-crimson hover:text-bone"
              >
                {dict.auth.contactUs}
              </Link>
            </div>
          )}
        </div>
      </Reveal>
    </PortalChrome>
  );
}
