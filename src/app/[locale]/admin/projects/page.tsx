import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule } from "@/components/sections/SectionShell";
import { adminListProjects, adminCreateProject } from "@/actions/admin";
import { projectSchema, type ProjectInput } from "@/lib/validations";
import type { Dictionary } from "@/i18n/types";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

const SERVICES = ["Websites", "Applications", "Automations", "Custom Solutions"] as const;
const STATUSES = [
  "enquiry",
  "planning",
  "in_progress",
  "review",
  "completed",
  "on_hold",
] as const;

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
  profiles?: { full_name: string | null; email: string | null } | null;
};

export default async function AdminProjectsPage({
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
    redirect(`/${locale}/auth/login?redirectTo=/${locale}/admin/projects`);
  }

  const result = await adminListProjects();
  if ("error" in result) {
    notFound();
  }
  const projects = (result.projects ?? []) as ProjectRow[];

  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const error = searchParams.get("error") || undefined;

  return (
    <section className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal py-28 md:py-40">
      <div className="relative mx-auto max-w-7xl px-gutter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-forest" aria-hidden="true" />
              <h2 className="display-lg">Project management</h2>
            </div>
            <p className="text-sm leading-relaxed text-bone/70">
              Create, assign, and track all projects.
            </p>
          </div>
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-crimson hover:text-bone"
          >
            Back to admin
            <span className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded border border-crimson/20 bg-crimson/10 text-sm text-crimson/70">
            {decodeURIComponent(error)}
          </div>
        )}

        {/* Create project form */}
        <div className="mb-8 p-6 border border-bone/10 bg-charcoal/40 rounded-md">
          <h3 className="display-md mb-4">Create new project</h3>
          <form action={adminCreateProject} className="grid gap-4 md:grid-cols-2" noValidate>
            <div className="md:col-span-2">
              <label
                htmlFor="customer_id"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
              >
                Customer ID
              </label>
              <input
                id="customer_id"
                name="customer_id"
                type="text"
                required
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
                placeholder="Customer UUID"
              />
            </div>
            <div>
              <label
                htmlFor="project_name"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
              >
                Project name
              </label>
              <input
                id="project_name"
                name="project_name"
                type="text"
                required
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
              />
            </div>
            <div>
              <label
                htmlFor="service_type"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
              >
                Service type
              </label>
              <select
                id="service_type"
                name="service_type"
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20 bg-charcoal"
              >
                {SERVICES.map((s: string) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
              />
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20 bg-charcoal"
              >
                {STATUSES.map((s: string) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <SubmitButton>
                Create project
              </SubmitButton>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="display-md">All projects</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-bone/10">
                <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                  Project
                </th>
                <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                  Customer
                </th>
                <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                  Service
                </th>
                <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-bone/40">
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((project: ProjectRow) => (
                  <tr
                    key={project.id}
                    className="border-b border-bone/10 hover:bg-charcoal/20 transition-colors"
                  >
                    <td className="py-4">
                      <div className="font-medium text-bone">
                        {project.project_name}
                      </div>
                    </td>
                    <td className="py-4 text-bone/70">
                      {project.profiles?.full_name || "Unknown"}
                    </td>
                    <td className="py-4 text-bone/60">
                      {project.service_type}
                    </td>
                    <td className="py-4">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
