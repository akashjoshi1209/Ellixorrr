import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion/Reveal";
import { requireCustomer } from "@/lib/profiles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { PortalChrome, PortalError } from "@/components/portals/PortalChrome";
import { portalLabels } from "@/lib/portal-labels";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProjectUpdateRow = {
  id: string;
  title: string;
  description: string | null;
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
  project_updates?: ProjectUpdateRow[] | null;
};

export default async function CustomerProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) return null;
  if (!UUID_PATTERN.test(id)) notFound();

  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);
  const supabase = await createServerClient();

  // Signed-out visitors are sent to the login page; admins are sent to the
  // admin dashboard (they are not customers).
  const profile = await requireCustomer(resolvedLocale);

  const projectsHref = `/${locale}/dashboard/projects`;
  const portalNav = [
    { href: `/${locale}/dashboard`, label: dict.nav.dashboard },
    { href: projectsHref, label: dict.auth.myProjects },
    { href: `/${locale}/dashboard/profile`, label: dict.auth.myProfile },
  ];

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id, customer_id, project_name, service_type, description, status, start_date, expected_completion_date, created_at, project_updates(id, title, description, created_at)"
    )
    .eq("id", id)
    .eq("customer_id", profile.id)
    .maybeSingle();

  // A missing/foreign project is a 404. A backend failure is not: presenting
  // it as "not found" would hide outages and mislead the customer.
  if (error) {
    return (
      <PortalChrome
        eyebrow={dict.auth.myProjects}
        title={dict.auth.projectDetails}
        navLabel={dict.nav.account}
        nav={portalNav}
        current={projectsHref}
      >
        <PortalError
          heading={dict.auth.loadFailedTitle}
          message={dict.auth.loadError}
        />
      </PortalChrome>
    );
  }

  if (!project) notFound();

  const projectRow = project as ProjectRow;
  const updates = [...(projectRow.project_updates ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );

  return (
    <PortalChrome
      eyebrow={dict.auth.myProjects}
      title={dict.auth.projectDetails}
      description={projectRow.project_name}
      navLabel={dict.nav.account}
      nav={portalNav}
      current={projectsHref}
    >
      <div>
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <Link
                href={projectsHref}
                className="text-xs font-semibold text-bone transition-colors hover:text-crimson-bright"
              >
                {dict.auth.backToProjects}
                <span className="sr-only">: {projectRow.project_name}</span>
              </Link>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wider ${
                projectRow.status === "completed"
                  ? "text-forest bg-forest/10 border border-forest/20"
                  : projectRow.status === "on_hold"
                    ? "text-bone bg-bone/10 border border-rule-strong"
                    : "text-crimson-bright bg-crimson/10 border border-crimson/30"
              }`}
            >
              {portalLabels.projectStatus(dict.auth, projectRow.status)}
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-3">
              <div className="mb-8">
                <h3 className="display-md mb-3">{projectRow.project_name}</h3>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-2">
                  {portalLabels.service(dict.auth, projectRow.service_type)}
                </p>
                <p className="text-sm leading-relaxed text-muted">
                  {projectRow.description || dict.auth.noDescriptionAvailable}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-4 border border-rule bg-forest/40 rounded-md">
                  <span className="text-sm text-muted">{dict.auth.started}</span>
                  <span className="text-sm text-bone">
                    {portalLabels.date(
                      projectRow.start_date || projectRow.created_at,
                      resolvedLocale,
                      "long"
                    )}
                  </span>
                </div>
                {projectRow.expected_completion_date ? (
                  <div className="flex items-center justify-between gap-4 p-4 border border-rule bg-forest/40 rounded-md">
                    <span className="text-sm text-muted">
                      {dict.auth.expectedCompletion}
                    </span>
                    <span className="text-sm text-bone">
                      {portalLabels.date(
                        projectRow.expected_completion_date,
                        resolvedLocale,
                        "long"
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="md:col-span-1 flex flex-col gap-4">
              <div className="p-6 border border-rule bg-forest/40 rounded-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-4">
                  {dict.auth.projectId}
                </p>
                <p className="text-xs text-muted break-all">{projectRow.id}</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-14">
            <h3 className="display-md mb-6">
              {dict.auth.updatesFromEllixorrr}
            </h3>
            {updates.length > 0 ? (
              <ul className="space-y-4">
                {updates.map((update) => (
                  <li
                    key={update.id}
                    className="p-4 border border-rule bg-forest/40 rounded-md"
                  >
                    <h4 className="display-md mb-1">{update.title}</h4>
                    <p className="text-sm text-muted">
                      {update.description || dict.auth.noDescription}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {projectRow.project_name} ·{" "}
                      {portalLabels.date(update.created_at, resolvedLocale)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{dict.auth.noUpdates}</p>
            )}
          </div>
        </Reveal>
      </div>
    </PortalChrome>
  );
}
