import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { adminListEnquiries } from "@/lib/admin-data";
import { adminUpdateEnquiryStatus } from "@/actions/admin";
import { requireAdmin } from "@/lib/profiles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";

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

function EnquiryStatusForm({
  enquiry,
  locale,
}: {
  enquiry: EnquiryRow;
  locale: string;
}) {
  return (
    <form
      action={adminUpdateEnquiryStatus}
      className="flex gap-1 justify-end"
      noValidate
    >
      <input type="hidden" name="locale" value={locale} />
      <select
        name="status"
        defaultValue={enquiry.status}
        aria-label="Enquiry status"
        className="rounded border px-2 py-1 text-xs focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20 bg-charcoal"
      >
        <option value="new">New</option>
        <option value="reviewing">Reviewing</option>
        <option value="contacted">Contacted</option>
        <option value="converted">Converted</option>
        <option value="closed">Closed</option>
      </select>
      <input name="enquiry_id" type="hidden" value={enquiry.id} />
      <SubmitButton
        className="px-2 py-1 text-xs font-semibold text-crimson transition-colors hover:text-crimson-bright"
      >
        Save
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

  return (
    <section className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal py-28 md:py-40">
      <div className="relative mx-auto max-w-7xl px-gutter">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-forest" aria-hidden="true" />
                <h2 className="display-lg">Enquiries</h2>
              </div>
              <p className="text-sm leading-relaxed text-bone/70">
                Review and respond to new enquiries.
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
        </Reveal>

        <FeedbackBanner dict={dict} error={error} success={message} />

        <Reveal delay={0.1}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-bone/10">
                  <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                    Name
                  </th>
                  <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                    Email
                  </th>
                  <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                    Service
                  </th>
                  <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                    Status
                  </th>
                  <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                    Received
                  </th>
                  <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-bone/40">
                      No enquiries found.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enquiry: EnquiryRow) => (
                    <tr
                      key={enquiry.id}
                      className="border-b border-bone/10 hover:bg-charcoal/20 transition-colors"
                    >
                      <td className="py-4">
                        <div className="font-medium text-bone">
                          {enquiry.name}
                        </div>
                        <div className="text-xs text-bone/40 mt-1">
                          {enquiry.business_name || "—"}
                        </div>
                      </td>
                      <td className="py-4 text-bone/70">{enquiry.email}</td>
                      <td className="py-4 text-bone/60">{enquiry.service_type}</td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[0.65rem] font-semibold tracking-wider ${
                            enquiry.status === "new"
                              ? "text-crimson/60 bg-crimson/10 border border-crimson/20"
                              : enquiry.status === "reviewing"
                                ? "text-bone bg-bone/10 border border-bone/20"
                                : enquiry.status === "contacted"
                                  ? "text-forest bg-forest/10 border border-forest/20"
                                  : enquiry.status === "converted"
                                    ? "text-crimson/60 bg-crimson/10 border border-crimson/20"
                                    : "text-bone bg-bone/10 border border-bone/20"
                          }`}
                        >
                          {enquiry.status}
                        </span>
                      </td>
                      <td className="py-4 text-bone/40 text-xs">
                        {new Date(enquiry.created_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <EnquiryStatusForm enquiry={enquiry} locale={locale} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
