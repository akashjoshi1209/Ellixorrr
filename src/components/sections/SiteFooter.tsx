import { LogoMark } from "@/components/brand/Logo";
import { LocaleLink } from "@/components/nav/LanguageSwitcher";
import { Mail, Phone, Smartphone } from "lucide-react";
import { COPYRIGHT_YEAR } from "@/config";
import { locales, localeNames } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { CONTACT, mailtoUrl, whatsappUrl } from "@/lib/site-config";

type SiteFooterProps = {
  locale: Locale;
  dict: Dictionary;
};

const navTargets = [
  { id: "home", key: "home" },
  { id: "services", key: "services" },
  { id: "about", key: "about" },
  { id: "work", key: "work" },
  { id: "contact", key: "contact" },
] as const;

export function SiteFooter({ locale, dict }: SiteFooterProps) {
  return (
    <footer className="relative overflow-hidden border-t border-rule bg-forest">
      <div aria-hidden="true" className="grid-texture absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-gutter py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-5">
            <div className="flex items-center gap-3">
              <LogoMark className="h-7 w-auto" />
              <span className="font-display text-lg font-semibold tracking-[0.18em] text-bone">
                ELLIXORRR
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              {dict.footer.tagline}
            </p>
          </div>

          {/* Navigation */}
          <nav className="md:col-span-1 lg:col-span-3" aria-label={dict.footer.navTitle}>
            <h2 className="eyebrow">{dict.footer.navTitle}</h2>
            <ul className="mt-5 space-y-3">
              {navTargets.map(({ id, key }) => (
                <li key={id}>
                  <a
                    href={`/${locale}#${id}`}
                    className="text-sm text-bone transition-colors hover:text-crimson-bright focus-visible:text-crimson-bright"
                  >
                    {dict.nav[key]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Language */}
          <div className="md:col-span-1 lg:col-span-2">
            <h2 className="eyebrow">{dict.footer.langTitle}</h2>
            <ul className="mt-5 space-y-3">
              {locales.map((l) => (
                <li key={l}>
                  <LocaleLink
                    locale={l}
                    current={l === locale}
                    className={`text-sm transition-colors hover:text-bone focus-visible:text-bone ${
                      l === locale ? "font-semibold text-bone" : "text-muted"
                    }`}
                  >
                    {localeNames[l]}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact channels — real destinations only */}
          <div className="md:col-span-2">
            <h2 className="eyebrow">{dict.footer.channelsTitle}</h2>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href={whatsappUrl(dict.contact.whatsapp.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-bone transition-colors hover:text-crimson-bright focus-visible:text-crimson-bright"
                >
                  <Smartphone className="h-4 w-4 shrink-0 text-crimson-bright" aria-hidden="true" />
                  <span>{dict.contact.whatsapp.label}</span>
                </a>
              </li>
              <li>
                <a
                  href={mailtoUrl(dict.contact.email.subject)}
                  className="flex items-center gap-2 text-sm text-bone transition-colors hover:text-crimson-bright focus-visible:text-crimson-bright"
                >
                  <Mail className="h-4 w-4 shrink-0 text-crimson-bright" aria-hidden="true" />
                  <span>{dict.contact.email.address}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phoneDial}`}
                  className="flex items-center gap-2 text-sm text-bone transition-colors hover:text-crimson-bright focus-visible:text-crimson-bright"
                >
                  <Phone className="h-4 w-4 shrink-0 text-crimson-bright" aria-hidden="true" />
                  <span>{dict.contact.phone.number}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-rule pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COPYRIGHT_YEAR} ELLIXORRR. {dict.footer.rights}
          </p>
          <p className="font-display tracking-[0.28em] text-muted">ELLIXORRR</p>
        </div>
      </div>
    </footer>
  );
}
