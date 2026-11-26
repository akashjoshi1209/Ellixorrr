import {
  adminCreateProject,
  adminCreateProjectUpdate,
  adminDeleteProject,
  adminUpdateProject,
} from "@/actions/admin";
import {
  adminListCustomers,
  adminListProjects,
  type AdminCustomer,
  type AdminProject,
} from "@/lib/admin-data";
import { requireAdmin } from "@/lib/profiles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PortalChrome, PortalError } from "@/components/portals/PortalChrome";
import {
  PROJECT_STATUSES,
  portalLabels,
} from "@/lib/portal-labels";
import { SERVICE_TYPES } from "@/lib/services";
import type { Dictionary } from "@/i18n/types";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-rule-strong bg-charcoal";
const labelClass =
  "block text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1";

function CustomerOptions({
  customers,
  placeholder,
}: {
  customers: AdminCustomer[];
  placeholder: string;
}) {
  return (
    <>
      <option value="">{placeholder}</option>
      {customers.map((customer) => (
        <option key={customer.id} value={customer.id}>
          {customer.full_name || customer.email || customer.id}
        </option>
      ))}
    </>
  );
}

function ServiceOptions({ dict }: { dict: Dictionary }) {
  return (
    <>
      {SERVICE_TYPES.map((service) => (
        <option key={service} value={service}>
          {portalLabels.service(dict.auth, service)}
        </option>
      ))}
    </>
  );
}

function StatusOptions({ dict }: { dict: Dictionary }) {
  return (
    <>
      {PROJECT_STATUSES.map((status) => (
        <option key={status} value={status}>
          {portalLabels.projectStatus(dict.auth, status)}
        </option>
      ))}
    </>
  );
}

function EditProjectForm({
  project,
  customers,
  locale,
  dict,
}: {
  project: AdminProject;
  customers: AdminCustomer[];
  locale: Locale;
  dict: Dictionary;
}) {
  const prefix = `edit-${project.id}`;
  return (
    <form
      action={adminUpdateProject}
      aria-label={`${dict.auth.editProject}: ${project.project_name}`}
      className="grid gap-3 md:grid-cols-2"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="project_id" value={project.id} />
      <div className="md:col-span-2">
        <label htmlFor={`${prefix}-customer`} className={labelClass}>
          {dict.auth.assignToCustomer}
        </label>
        <select
          id={`${prefix}-customer`}
          name="customer_id"
          required
          defaultValue={project.customer_id}
          className={fieldClass}
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.full_name || customer.email || customer.id}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label htmlFor={`${prefix}-name`} className={labelClass}>
          {dict.auth.projectName}
        </label>
        <input
          id={`${prefix}-name`}
          name="project_name"
          type="text"
          required
          maxLength={160}
          defaultValue={project.project_name}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor={`${prefix}-service`} className={labelClass}>
          {dict.auth.serviceType}
        </label>
        <select
          id={`${prefix}-service`}
          name="service_type"
          defaultValue={project.service_type}
          className={fieldClass}
        >
          <ServiceOptions dict={dict} />
        </select>
      </div>
      <div>
        <label htmlFor={`${prefix}-status`} className={labelClass}>
          {dict.auth.status}
        </label>
        <select
          id={`${prefix}-status`}
          name="status"
          defaultValue={project.status}
          className={fieldClass}
        >
          <StatusOptions dict={dict} />
        </select>
      </div>
      <div>
        <label htmlFor={`${prefix}-start`} className={labelClass}>
          {dict.auth.startDate}
        </label>
        <input
          id={`${prefix}-start`}
          name="start_date"
          type="date"
          defaultValue={project.start_date ?? ""}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor={`${prefix}-expected`} className={labelClass}>
          {dict.auth.expectedCompletionDate}
        </label>
        <input
          id={`${prefix}-expected`}
          name="expected_completion_date"
          type="date"
          defaultValue={project.expected_completion_date ?? ""}
          className={fieldClass}
        />
      </div>
      <div className="md:col-span-2">
        <label htmlFor={`${prefix}-description`} className={labelClass}>
          {dict.auth.description}
        </label>
        <textarea
          id={`${prefix}-description`}
          name="description"
          rows={3}
          maxLength={5000}
          defaultValue={project.description ?? ""}
          className={fieldClass}
        />
      </div>
      <div className="md:col-span-2">
        <SubmitButton
          pendingLabel={dict.auth.sending}
          ariaLabel={`${dict.auth.saveChanges}: ${project.project_name}`}
          className="w-auto"
        >
          {dict.auth.saveChanges}
        </SubmitButton>
      </div>
    </form>
  );
}

function AddProjectUpdateForm({
  project,
  locale,
  dict,
}: {
  project: AdminProject;
  locale: Locale;
  dict: Dictionary;
}) {
  const prefix = `update-${project.id}`;
  return (
    <form
      action={adminCreateProjectUpdate}
      aria-label={`${dict.auth.addUpdate}: ${project.project_name}`}
      className="grid gap-3"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="project_id" value={project.id} />
      <div>
        <label htmlFor={`${prefix}-title`} className={labelClass}>
          {dict.auth.updateTitle}
        </label>
        <input
          id={`${prefix}-title`}
          name="title"
          type="text"
          required
          maxLength={160}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor={`${prefix}-description`} className={labelClass}>
          {dict.auth.description}
        </label>
        <textarea
          id={`${prefix}-description`}
          name="description"
          rows={3}
          maxLength={5000}
          className={fieldClass}
        />
      </div>
      <SubmitButton
        pendingLabel={dict.auth.sending}
        ariaLabel={`${dict.auth.addUpdate}: ${project.project_name}`}
        className="w-auto"
      >
        {dict.auth.addUpdate}
      </SubmitButton>
    </form>
  );
}

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

  const [projectsResult, customersResult] = await Promise.all([
    adminListProjects(),
    adminListCustomers(),
  ]);
  const projects = projectsResult.data;
  const customers = customersResult.data.filter(
    (customer) => customer.role === "customer"
  );
  const hasLoadFailure = projectsResult.failed || customersResult.failed;
  const canManageProjects = !customersResult.failed && customers.length > 0;

  const current = `/${locale}/admin/projects`;
  const portalNav = [
    { href: `/${locale}/admin`, label: dict.nav.dashboard },
    { href: `/${locale}/admin/customers`, label: dict.nav.customers },
    { href: current, label: dict.nav.adminProjects },
    { href: `/${locale}/admin/enquiries`, label: dict.auth.enquiries },
  ];

  return (
    <PortalChrome
      eyebrow={dict.nav.adminProjects}
      title={dict.auth.projectManagement}
      description={dict.auth.manageProjectsDescription}
      navLabel={dict.nav.account}
      nav={portalNav}
      current={current}
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

        <FeedbackBanner dict={dict} error={error} success={message} />

        {canManageProjects ? (
          <div className="mb-8 p-6 border border-rule bg-forest/40 rounded-md">
            <h3 className="display-md mb-4">{dict.auth.newProject}</h3>
            <form
              action={adminCreateProject}
              className="grid gap-4 md:grid-cols-2"
            >
              <input type="hidden" name="locale" value={locale} />
              <div>
                <label htmlFor="create-customer" className={labelClass}>
                  {dict.auth.assignToCustomer}
                </label>
                <select
                  id="create-customer"
                  name="customer_id"
                  required
                  className={fieldClass}
                >
                  <CustomerOptions
                    customers={customers}
                    placeholder={dict.auth.selectCustomer}
                  />
                </select>
              </div>
              <div>
                <label htmlFor="create-name" className={labelClass}>
                  {dict.auth.projectName}
                </label>
                <input
                  id="create-name"
                  name="project_name"
                  type="text"
                  required
                  maxLength={160}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="create-service" className={labelClass}>
                  {dict.auth.serviceType}
                </label>
                <select
                  id="create-service"
                  name="service_type"
                  className={fieldClass}
                >
                  <ServiceOptions dict={dict} />
                </select>
              </div>
              <div>
                <label htmlFor="create-status" className={labelClass}>
                  {dict.auth.status}
                </label>
                <select id="create-status" name="status" className={fieldClass}>
                  <StatusOptions dict={dict} />
                </select>
              </div>
              <div>
                <label htmlFor="create-start" className={labelClass}>
                  {dict.auth.startDate}
                </label>
                <input
                  id="create-start"
                  name="start_date"
                  type="date"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="create-expected" className={labelClass}>
                  {dict.auth.expectedCompletionDate}
                </label>
                <input
                  id="create-expected"
                  name="expected_completion_date"
                  type="date"
                  className={fieldClass}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="create-description" className={labelClass}>
                  {dict.auth.description}
                </label>
                <textarea
                  id="create-description"
                  name="description"
                  rows={3}
                  maxLength={5000}
                  className={fieldClass}
                />
              </div>
              <div className="md:col-span-2">
                <SubmitButton pendingLabel={dict.auth.sending} className="w-auto">
                  {dict.auth.createProject}
                </SubmitButton>
              </div>
            </form>
          </div>
        ) : !customersResult.failed ? (
          <div className="mb-8 p-6 border border-rule bg-forest/40 rounded-md text-sm text-muted">
            {dict.auth.noAvailableCustomers}
          </div>
        ) : null}

        {!projectsResult.failed ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="display-md">{dict.auth.allProjects}</h3>
            </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-rule">
                <th
                  scope="col"
                  className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  {dict.auth.projectName}
                </th>
                <th
                  scope="col"
                  className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  {dict.auth.customer}
                </th>
                <th
                  scope="col"
                  className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  {dict.auth.service}
                </th>
                <th
                  scope="col"
                  className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  {dict.auth.status}
                </th>
                <th
                  scope="col"
                  className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  {dict.auth.details}
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    {dict.auth.noProjectsFound}
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-rule hover:bg-charcoal/20 transition-colors align-top"
                  >
                    <td className="py-4">
                      <div className="font-medium text-bone">
                        {project.project_name}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {portalLabels.date(project.created_at, resolvedLocale)}
                      </div>
                    </td>
                    <td className="py-4 text-muted">
                      {project.customer?.full_name ||
                        project.customer?.email ||
                        dict.auth.unknown}
                    </td>
                    <td className="py-4 text-muted">
                      {portalLabels.service(dict.auth, project.service_type)}
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wider ${
                          project.status === "completed"
                            ? "text-forest bg-forest/10 border border-forest/20"
                            : project.status === "on_hold"
                              ? "text-bone bg-bone/10 border border-rule-strong"
                              : "text-crimson-bright bg-crimson/10 border border-crimson/30"
                        }`}
                      >
                        {portalLabels.projectStatus(dict.auth, project.status)}
                      </span>
                    </td>
                    <td className="py-4 min-w-[22rem]">
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-bone hover:text-crimson-bright">
                          {dict.auth.details}
                        </summary>
                        <div className="mt-4 space-y-6">
                          {canManageProjects ? (
                            <>
                              <div>
                                <h4 className="mb-3 text-sm font-semibold text-bone">
                                  {dict.auth.editProject}: {project.project_name}
                                </h4>
                                <EditProjectForm
                                  project={project}
                                  customers={customers}
                                  locale={resolvedLocale}
                                  dict={dict}
                                />
                              </div>
                              <div className="border-t border-rule pt-4">
                                <h4 className="mb-3 text-sm font-semibold text-bone">
                                  {dict.auth.projectUpdates}
                                </h4>
                                <AddProjectUpdateForm
                                  project={project}
                                  locale={resolvedLocale}
                                  dict={dict}
                                />
                              </div>
                            </>
                          ) : null}
                          <form
                            action={adminDeleteProject}
                            className="border-t border-rule pt-4"
                          >
                            <input type="hidden" name="locale" value={locale} />
                            <input
                              type="hidden"
                              name="project_id"
                              value={project.id}
                            />
                            <SubmitButton
                              pendingLabel={dict.auth.sending}
                              confirmMessage={dict.auth.deleteProjectConfirm}
                              ariaLabel={`${dict.auth.deleteProject}: ${project.project_name}`}
                              className="w-auto bg-transparent text-crimson-bright hover:bg-crimson hover:text-bone"
                            >
                              {dict.auth.deleteProject}
                            </SubmitButton>
                          </form>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </>
        ) : null}
      </div>
    </PortalChrome>
  );
}
