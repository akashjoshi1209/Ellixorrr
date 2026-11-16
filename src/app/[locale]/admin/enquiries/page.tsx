import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule } from "@/components/sections/SectionShell";
import { adminListEnquiries, adminUpdateEnquiryStatus } from "@/actions/admin";
import type { Dictionary } from "@/i18n/types";
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
      className="flex gap-1"
      noValidate
    >
      <select
        name="status"
        defaultValue={enquiry.status}
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
    redirect(`/${locale}/auth/login?redirectTo=/${locale}/admin/enquiries`);
  }

  const result = await adminListEnquiries();
  if ("error" in result) {
    notFound();
  }
  const enquiries = (result.enquiries ?? []) as EnquiryRow[];

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
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-bone/40">
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
                      <td className="py-4 text-bone/70">
                        {enquiry.email}
                      </td>
                      <td className="py-4 text-bone/60">
                        {enquiry.service_type}
                      </td>
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
