export const dynamic = "force-dynamic";

import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion/Reveal";
import { requireCustomer } from "@/lib/profiles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";

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
  const dict = getDictionary(locale as Locale);
  const supabase = await createServerClient();

  // Signed-out visitors are sent to the login page; admins are sent to the
  // admin dashboard (they are not customers).
  const profile = await requireCustomer(locale as Locale);

  const { data: projects } = await supabase
    .from("projects")
    .select("*, project_updates(*)")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });

  const projectRows = (projects ?? []) as ProjectRow[];
  const activeProjects = projectRows.filter(
    (p) => p.status !== "completed" && p.status !== "on_hold"
  );
  const completedProjects = projectRows.filter(
    (p) => p.status === "completed"
  );
  const recentUpdates = projectRows
    .flatMap((p) =>
      (p.project_updates ?? []).map(
        (u: {
          id: string;
          title: string;
          description: string | null;
          created_at: string;
        }) => ({
          ...u,
          project_name: p.project_name,
        })
      )
    )
    .sort(
      (
        a: {
          id: string;
          title: string;
          description: string | null;
          created_at: string;
        },
        b: {
          id: string;
          title: string;
          description: string | null;
          created_at: string;
        },
      ) => b.created_at.localeCompare(a.created_at)
    )
    .slice(0, 5);

  return (
    <section className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal py-28 md:py-40">
      <div className="relative mx-auto max-w-7xl px-gutter">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-forest" aria-hidden="true" />
                <h2 className="display-lg">{dict.auth.customerPortal}</h2>
              </div>
              <p className="text-sm leading-relaxed text-bone/70">
                Welcome back,{profile.full_name ? ` ${profile.full_name}` : ""}.
              </p>
            </div>
            <Link
              href={`/${locale}/dashboard/profile`}
              className="inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-crimson hover:text-bone"
            >
              {dict.auth.myProfile}
              <span className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid gap-6 mb-14 md:grid-cols-3">
            <div className="p-6 border border-bone/10 bg-charcoal/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                Active projects
              </p>
              <p className="mt-1 display-md text-bone">
                {activeProjects.length}
              </p>
            </div>
            <div className="p-6 border border-bone/10 bg-charcoal/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                Completed projects
              </p>
              <p className="mt-1 display-md text-bone">
                {completedProjects.length}
              </p>
            </div>
            <div className="p-6 border border-bone/10 bg-charcoal/40 rounded-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                Recent updates
              </p>
              <p className="mt-1 display-md text-bone">
                {recentUpdates.length}
              </p>
            </div>
          </div>
        </Reveal>

        {activeProjects.length > 0 ? (
          <Reveal delay={0.2}>
            <div className="mb-14">
              <h3 className="display-md mb-6">Active projects</h3>
              <ul className="grid gap-6 md:grid-cols-3">
                {activeProjects.map((project: ProjectRow) => (
                  <li
                    key={project.id}
                    className="p-6 border border-bone/10 bg-charcoal/40 rounded-md hover:border-bone/25 transition-colors group"
                  >
                    <h4 className="display-md mb-2">{project.project_name}</h4>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-crimson/70 mb-3">
                      {project.service_type}
                    </p>
                    <p className="text-sm text-bone/60 mb-4">
                      {project.description || "No description available."}
                    </p>
                    <Link
                      href={`/${locale}/dashboard/projects/${project.id}`}
                      className="text-xs font-semibold text-bone transition-colors hover:text-crimson-bright"
                    >
                      View details
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.2}>
            <div className="mb-14 p-8 border border-bone/10 bg-charcoal/40 rounded-md text-center">
              <p className="text-sm text-bone/60">
                {dict.auth.emptyProjects}
              </p>
              <Link
                href={`/${locale}#contact`}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-crimson hover:text-bone"
              >
                {dict.auth.contactUs}
                <span className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        )}

        {recentUpdates.length > 0 ? (
          <Reveal delay={0.3}>
            <div className="mb-14">
              <h3 className="display-md mb-6">Recent updates from Ellixorrr</h3>
              <ul className="space-y-4">
                {recentUpdates.map((u: {
                  id: string;
                  title: string;
                  description: string | null;
                  created_at: string;
                  project_name: string;
                }) => (
                  <li
                    key={u.id}
                    className="p-4 border border-bone/10 bg-charcoal/40 rounded-md"
                  >
                    <h4 className="display-md mb-1">{u.title}</h4>
                    <p className="text-sm text-bone/60">
                      {u.description || "No description."}
                    </p>
                    <p className="mt-1 text-xs text-bone/40">
                      {u.project_name} · {new Date(
                        u.created_at
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.3}>
            <div className="mb-14 p-8 border border-bone/10 bg-charcoal/40 rounded-md text-center">
              <p className="text-sm text-bone/60">{dict.auth.noUpdates}</p>
            </div>
          </Reveal>
        )}

        {completedProjects.length > 0 ? (
          <Reveal delay={0.4}>
            <div>
              <h3 className="display-md mb-6">Completed projects</h3>
              <ul className="grid gap-6 md:grid-cols-3">
                {completedProjects.map((project: ProjectRow) => (
                  <li
                    key={project.id}
                    className="p-6 border border-bone/10 bg-charcoal/40 rounded-md"
                  >
                    <h4 className="display-md mb-2">{project.project_name}</h4>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-crimson/70 mb-3">
                      {project.service_type}
                    </p>
                    <p className="text-sm text-bone/60">
                      {project.description || "No description available."}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
