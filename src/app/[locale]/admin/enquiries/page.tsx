import { Reveal } from "@/components/motion/Reveal";
import { adminListEnquiries } from "@/lib/admin-data";
import { adminUpdateEnquiryStatus } from "@/actions/admin";
import { requireAdmin } from "@/lib/profiles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PortalChrome, PortalError } from "@/components/portals/PortalChrome";
import {
  ENQUIRY_STATUSES,
  portalLabels,
} from "@/lib/portal-labels";
import type { Dictionary } from "@/i18n/types";

export const dynamic = "force-dynamic";

type EnquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  service_type: string;
  project_description: string;
  status: string;
  created_at: string;
};

function statusLabel(dict: Dictionary, status: string): string {
  switch (status) {
    case "new":
      return dict.auth.statusNew;
    case "reviewing":
      return dict.auth.reviewing;
    case "contacted":
      return dict.auth.contacted;
    case "converted":
      return dict.auth.converted;
    case "closed":
      return dict.auth.closed;
    default:
      return dict.auth.unknown;
  }
}

function EnquiryStatusForm({
  enquiry,
  locale,
  dict,
}: {
  enquiry: EnquiryRow;
  locale: Locale;
  dict: Dictionary;
}) {
  const selectId = `enquiry-status-${enquiry.id}`;
  return (
    <form
      action={adminUpdateEnquiryStatus}
      className="flex gap-1 justify-end"
    >
      <input type="hidden" name="locale" value={locale} />
      <label htmlFor={selectId} className="sr-only">
        {dict.auth.updateStatus}: {enquiry.name}
      </label>
      <select
        id={selectId}
        name="status"
        defaultValue={enquiry.status}
        className="rounded border px-2 py-1 text-xs focus-visible:border-crimson focus-visible:outline-none transition-colors border-rule-strong bg-charcoal"
      >
        {ENQUIRY_STATUSES.map((status) => (
          <option key={status} value={status}>
            {statusLabel(dict, status)}
          </option>
        ))}
      </select>
      <input name="enquiry_id" type="hidden" value={enquiry.id} />
      <SubmitButton
        pendingLabel={dict.auth.sending}
        ariaLabel={`${dict.auth.save}: ${enquiry.name}`}
        className="w-auto px-2 py-1 text-xs font-semibold text-crimson-bright transition-colors hover:text-crimson-bright"
      >
        {dict.auth.save}
      </SubmitButton>
    </form>
  );
}

export default async function AdminEnquiriesPage({
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

  const result = await adminListEnquiries();
  const enquiries = result.data;
  const current = `/${locale}/admin/enquiries`;
  const portalNav = [
    { href: `/${locale}/admin`, label: dict.nav.dashboard },
    { href: `/${locale}/admin/customers`, label: dict.nav.customers },
    { href: `/${locale}/admin/projects`, label: dict.nav.adminProjects },
    { href: current, label: dict.auth.enquiries },
  ];

  return (
    <PortalChrome
      eyebrow={dict.auth.enquiries}
      title={dict.auth.enquiries}
      description={dict.auth.manageEnquiriesDescription}
      navLabel={dict.nav.account}
      nav={portalNav}
      current={current}
    >
      <div>
        {result.failed ? (
          <div className="mb-10">
            <PortalError
              heading={dict.auth.loadFailedTitle}
              message={dict.auth.loadError}
            />
          </div>
        ) : null}

        <FeedbackBanner dict={dict} error={error} success={message} />

        {!result.failed ? (
          <Reveal delay={0.1}>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rule">
                  <th
                    scope="col"
                    className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                  >
                    {dict.auth.name}
                  </th>
                  <th
                    scope="col"
                    className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                  >
                    {dict.auth.details}
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
                    {dict.auth.received}
                  </th>
                  <th
                    scope="col"
                    className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted text-right"
                  >
                    {dict.auth.action}
                  </th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      {dict.auth.noEnquiriesFound}
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enquiry: EnquiryRow) => (
                    <tr
                      key={enquiry.id}
                      className="border-b border-rule hover:bg-charcoal/20 transition-colors align-top"
                    >
                      <td className="py-4">
                        <div className="font-medium text-bone">{enquiry.name}</div>
                        <div className="text-xs text-muted mt-1">
                          {enquiry.email}
                        </div>
                      </td>
                      <td className="py-4 text-xs text-muted max-w-md">
                        <p>
                          <span className="font-semibold text-bone/80">
                            {dict.auth.businessName}:
                          </span>{" "}
                          {enquiry.business_name || dict.auth.notProvided}
                        </p>
                        <p className="mt-1">
                          <span className="font-semibold text-bone/80">
                            {dict.auth.phone}:
                          </span>{" "}
                          {enquiry.phone || dict.auth.notProvided}
                        </p>
                        <p className="mt-1 whitespace-pre-line">
                          <span className="font-semibold text-bone/80">
                            {dict.auth.projectDescription}:
                          </span>{" "}
                          {enquiry.project_description}
                        </p>
                      </td>
                      <td className="py-4 text-muted">
                        {portalLabels.service(dict.auth, enquiry.service_type)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wider ${
                            enquiry.status === "new"
                              ? "text-crimson-bright bg-crimson/10 border border-crimson/30"
                              : enquiry.status === "reviewing"
                                ? "text-bone bg-bone/10 border border-rule-strong"
                                : enquiry.status === "contacted"
                                  ? "text-forest bg-forest/10 border border-forest/20"
                                  : enquiry.status === "converted"
                                    ? "text-crimson-bright bg-crimson/10 border border-crimson/30"
                                    : "text-bone bg-bone/10 border border-rule-strong"
                          }`}
                        >
                          {portalLabels.enquiryStatus(dict.auth, enquiry.status)}
                        </span>
                      </td>
                      <td className="py-4 text-muted text-xs">
                        {portalLabels.date(enquiry.created_at, resolvedLocale)}
                      </td>
                      <td className="py-4 text-right">
                        <EnquiryStatusForm
                          enquiry={enquiry}
                          locale={resolvedLocale}
                          dict={dict}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </Reveal>
        ) : null}
      </div>
    </PortalChrome>
  );
}
