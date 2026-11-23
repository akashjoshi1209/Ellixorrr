import Link from "next/link";
import { notFound } from "next/navigation";
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

export default async function CustomerProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale as Locale);
  const supabase = await createServerClient();

  // Signed-out visitors are sent to the login page.
  const profile = await requireCustomer(locale as Locale);

  const { data: project, error } = await supabase
    .from("projects")
    .select("*, project_updates(id, created_at, title, description, author_id)")
    .eq("id", id)
    .eq("customer_id", profile.id)
    .single();

  if (error || !project) {
    notFound();
  }

  const projectRow = project as ProjectRow;
  const updates = (projectRow.project_updates ?? []).sort(
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
  );

  return (
    <section className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal py-28 md:py-40">
      <div className="relative mx-auto max-w-7xl px-gutter">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-forest" aria-hidden="true" />
                <h2 className="display-lg">{dict.auth.projectDetails}</h2>
              </div>
              <Link
                href={`/${locale}/dashboard/projects`}
                className="text-xs font-semibold text-bone transition-colors hover:text-crimson-bright"
              >
                Back to projects
                <span className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[0.65rem] font-semibold tracking-wider ${
                projectRow.status === "completed"
                  ? "text-forest bg-forest/10 border border-forest/20"
                  : projectRow.status === "on_hold"
                    ? "text-bone bg-bone/10 border border-bone/20"
                    : "text-crimson/60 bg-crimson/10 border border-crimson/20"
              }`}
            >
              {projectRow.status}
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-3">
              <div className="mb-8">
                <h3 className="display-md mb-3">{projectRow.project_name}</h3>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-2">
                  {projectRow.service_type}
                </p>
                <p className="text-sm leading-relaxed text-bone/70">
                  {projectRow.description || "No description available."}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-bone/10 bg-charcoal/40 rounded-md">
                  <span className="text-sm text-bone/60">Started</span>
                  <span className="text-sm text-bone">
                    {new Date(
                      projectRow.start_date || projectRow.created_at
                    ).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {projectRow.expected_completion_date && (
                  <div className="flex items-center justify-between p-4 border border-bone/10 bg-charcoal/40 rounded-md">
                    <span className="text-sm text-bone/60">
                      Expected completion
                    </span>
                    <span className="text-sm text-bone">
                      {new Date(
                        projectRow.expected_completion_date
                      ).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-1 flex flex-col gap-4">
              <div className="p-6 border border-bone/10 bg-charcoal/40 rounded-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-4">
                  Project ID
                </p>
                <p className="text-xs text-bone/40 truncate">{projectRow.id}</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Updates */}
        <Reveal delay={0.2}>
          <div className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <h3 className="display-md">Updates from Ellixorrr</h3>
            </div>
            {updates.length > 0 ? (
              <ul className="space-y-4">
                {updates.map((u: {
                  id: string;
                  title: string;
                  description: string | null;
                  created_at: string;
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
                      {projectRow.project_name} · {new Date(
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
            ) : (
              <p className="text-sm text-bone/60">{dict.auth.noUpdates}</p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
