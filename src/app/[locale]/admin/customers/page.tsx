import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { adminListCustomers } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/profiles";
import { isLocale, type Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const resolvedLocale = locale as Locale;

  // Server-side authorization: only admins may access admin routes.
  await requireAdmin(resolvedLocale);

  const result = await adminListCustomers();
  const customers = result.data;

  return (
    <section className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal py-28 md:py-40">
      <div className="relative mx-auto max-w-7xl px-gutter">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-forest" aria-hidden="true" />
                <h2 className="display-lg">Customer management</h2>
              </div>
              <p className="text-sm leading-relaxed text-bone/70">
                View and manage all customer accounts.
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
                    Role
                  </th>
                  <th className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-bone/40">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-bone/10 hover:bg-charcoal/20 transition-colors"
                    >
                      <td className="py-4">
                        <div className="font-medium text-bone">
                          {customer.full_name || "Unnamed"}
                        </div>
                      </td>
                      <td className="py-4 text-bone/70">
                        {customer.email ?? "—"}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[0.65rem] font-semibold tracking-wider ${
                            customer.role === "admin"
                              ? "text-crimson/60 bg-crimson/10 border border-crimson/20"
                              : "text-forest bg-forest/10 border border-forest/20"
                          }`}
                        >
                          {customer.role}
                        </span>
                      </td>
                      <td className="py-4 text-bone/40 text-xs">
                        {new Date(customer.created_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {customers.length === 0 && (
            <div className="py-8 text-center text-bone/60">
              No customers found.
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
