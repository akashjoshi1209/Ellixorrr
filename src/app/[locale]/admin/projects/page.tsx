import Link from "next/link";
import { adminListProjects } from "@/lib/admin-data";
import { adminCreateProject } from "@/actions/admin";
import { requireAdmin } from "@/lib/profiles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
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

export default async function AdminProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale as Locale);
  const resolvedLocale = locale as Locale;

  // Server-side authorization: only admins may access admin routes.
  await requireAdmin(resolvedLocale);

  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;
  const message =
    typeof resolvedSearchParams.message === "string"
      ? resolvedSearchParams.message
      : undefined;

  const result = await adminListProjects();
  const projects = result.data;

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

        <FeedbackBanner dict={dict} error={error} success={message} />

        {/* Create project form */}
        <div className="mb-8 p-6 border border-bone/10 bg-charcoal/40 rounded-md">
          <h3 className="display-md mb-4">Create new project</h3>
          <form action={adminCreateProject} className="grid gap-4 md:grid-cols-2" noValidate>
            <input type="hidden" name="locale" value={locale} />
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
                projects.map((project) => (
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
                      {project.customer?.full_name || "Unknown"}
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
