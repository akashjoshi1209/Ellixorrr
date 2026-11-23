import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion/Reveal";
import { requireCustomer } from "@/lib/profiles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  customer_id: string;
  project_name: string;
  service_type: string;
  description: string | null;
  status: string;
  created_at: string;
};

export default async function CustomerProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale as Locale);
  const supabase = await createServerClient();

  // Signed-out visitors are sent to the login page.
  const profile = await requireCustomer(locale as Locale);

  const { data: projects } = await supabase
    .from("projects")
    .select("*, project_updates(created_at)")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });

  const projectRows = (projects ?? []) as ProjectRow[];

  return (
    <section className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal py-28 md:py-40">
      <div className="relative mx-auto max-w-7xl px-gutter">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-forest" aria-hidden="true" />
                <h2 className="display-lg">{dict.auth.myProjects}</h2>
              </div>
              <p className="text-sm leading-relaxed text-bone/70">
                All your projects with Ellixorrr.
              </p>
            </div>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-crimson hover:text-bone"
            >
              Back to dashboard
              <span className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mb-10">
            <h3 className="display-md mb-6">Your projects</h3>
            {projectRows.length > 0 ? (
              <ul className="grid gap-6 md:grid-cols-3">
                {projectRows.map((project: ProjectRow) => (
                  <li
                    key={project.id}
                    className="p-6 border border-bone/10 bg-charcoal/40 rounded-md hover:border-bone/25 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="display-md">{project.project_name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[0.65rem] font-semibold tracking-wider ${
                          project.status === "completed"
                            ? "text-forest bg-forest/10 border border-forest/20"
                            : project.status === "on_hold"
                              ? "text-bone bg-bone/10 border border-bone/20"
                              : "text-crimson/60 bg-crimson/10 border border-crimson/20"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1">
                      {project.service_type}
                    </p>
                    <p className="text-sm text-bone/60 mb-4">
                      {project.description || "No description available."}
                    </p>
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/${locale}/dashboard/projects/${project.id}`}
                        className="text-xs font-semibold text-bone transition-colors hover:text-crimson-bright"
                      >
                        View details
                      </Link>
                      <p className="text-xs text-bone/40">
                        {new Date(project.created_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 border border-bone/10 bg-charcoal/40 rounded-md text-center">
                <p className="text-sm text-bone/60">
                  {dict.auth.noProjects}
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
