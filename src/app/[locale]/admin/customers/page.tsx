import { Reveal } from "@/components/motion/Reveal";
import { adminListCustomers } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/profiles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { PortalChrome, PortalError } from "@/components/portals/PortalChrome";
import { portalLabels } from "@/lib/portal-labels";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);

  // Server-side authorization: only admins may access admin routes.
  await requireAdmin(resolvedLocale);

  const result = await adminListCustomers();
  const customers = result.data;
  const current = `/${locale}/admin/customers`;
  const portalNav = [
    { href: `/${locale}/admin`, label: dict.nav.dashboard },
    { href: current, label: dict.nav.customers },
    { href: `/${locale}/admin/projects`, label: dict.nav.adminProjects },
    { href: `/${locale}/admin/enquiries`, label: dict.auth.enquiries },
  ];

  return (
    <PortalChrome
      eyebrow={dict.nav.customers}
      title={dict.auth.customerManagement}
      description={dict.auth.manageCustomersDescription}
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
                    {dict.auth.email}
                  </th>
                  <th
                    scope="col"
                    className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                  >
                    {dict.auth.role}
                  </th>
                  <th
                    scope="col"
                    className="pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                  >
                    {dict.auth.joined}
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted">
                      {dict.auth.noCustomersFound}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-rule hover:bg-charcoal/20 transition-colors"
                    >
                      <td className="py-4">
                        <div className="font-medium text-bone">
                          {customer.full_name || dict.auth.unnamed}
                        </div>
                      </td>
                      <td className="py-4 text-muted">
                        {customer.email ?? dict.auth.notProvided}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wider ${
                            customer.role === "admin"
                              ? "text-crimson-bright bg-crimson/10 border border-crimson/30"
                              : "text-forest bg-forest/10 border border-forest/20"
                          }`}
                        >
                          {portalLabels.role(dict.auth, customer.role)}
                        </span>
                      </td>
                      <td className="py-4 text-muted text-xs">
                        {portalLabels.date(customer.created_at, resolvedLocale)}
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
