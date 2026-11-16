import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { Mail, Phone, Smartphone } from "lucide-react";
import { COPYRIGHT_YEAR } from "@/config";
import { locales, localeNames } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";

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
    <footer className="border-t border-bone/10 bg-forest">
      <div className="mx-auto max-w-7xl px-gutter py-16">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <LogoMark className="h-7 w-auto" />
              <span className="font-display text-lg font-semibold tracking-[0.18em] text-bone">
                ELLIXORRR
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone/60">
              {dict.footer.tagline}
            </p>
          </div>

          {/* Navigation */}
          <nav className="md:col-span-3" aria-label={dict.footer.navTitle}>
            <h2 className="eyebrow">{dict.footer.navTitle}</h2>
            <ul className="mt-5 space-y-3">
              {navTargets.map(({ id, key }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="text-sm text-bone/70 transition-colors hover:text-bone focus-visible:text-bone"
                  >
                    {dict.nav[key]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Language */}
          <div className="md:col-span-2">
            <h2 className="eyebrow">{dict.footer.langTitle}</h2>
            <ul className="mt-5 space-y-3">
              {locales.map((l) => (
                <li key={l}>
                  <Link
                    href={`/${l}`}
                    hrefLang={l}
                    aria-current={l === locale ? "true" : undefined}
                    className={`text-sm transition-colors hover:text-bone focus-visible:text-bone ${
                      l === locale ? "font-semibold text-bone" : "text-bone/70"
                    }`}
                  >
                    {localeNames[l]}
                  </Link>
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
                  href={`https://wa.me/919404044607?text=${encodeURIComponent(
                    "Hello Ellixorrr, I'm interested in discussing a digital solution for my business. I'd like to share my requirements."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-bone/70 transition-colors hover:text-bone focus-visible:text-bone"
                >
                  <Smartphone className="h-4 w-4 shrink-0 text-crimson" aria-hidden="true" />
                  <span>{dict.contact.whatsapp.label}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:ellixorrr@gmail.com?subject=${encodeURIComponent("Project Enquiry — Ellixorrr")}`}
                  className="flex items-center gap-2 text-sm text-bone/70 transition-colors hover:text-bone focus-visible:text-bone"
                >
                  <Mail className="h-4 w-4 shrink-0 text-crimson" aria-hidden="true" />
                  <span>{dict.contact.email.address}</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+919404044607"
                  className="flex items-center gap-2 text-sm text-bone/70 transition-colors hover:text-bone focus-visible:text-bone"
                >
                  <Phone className="h-4 w-4 shrink-0 text-crimson" aria-hidden="true" />
                  <span>{dict.contact.phone.number}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-bone/10 pt-6 text-xs text-bone/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COPYRIGHT_YEAR} ELLIXORRR. {dict.footer.rights}
          </p>
          <p className="font-display tracking-[0.28em] text-bone/55">ELLIXORRR</p>
        </div>
      </div>
    </footer>
  );
}
