import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/noto-sans-devanagari";
import "../globals.css";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { GoogleTagManager } from "@next/third-parties/google";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        hi: "/hi",
        mr: "/mr",
      },
    },
    openGraph: {
      type: "website",
      siteName: "ELLIXORRR",
      title: dict.meta.title,
      description: dict.meta.description,
      locale,
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale as Locale);

  // Google Tag Manager container ID. Only rendered when configured so the
  // tag is inactive in environments without a GTM container (e.g. local
  // development without NEXT_PUBLIC_GTM_ID).
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang={locale} dir="ltr" className="h-full">
      <body className="flex min-h-full flex-col">
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
        {/* Structured data — only facts defined by the brief; no invented
            address, phone, rating or awards until real ones exist.
            The payload is escaped so a `<` in any value can never close
            the script element early. */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "ELLIXORRR",
              description: dict.meta.description,
              knowsAbout: ["Websites", "Applications", "Automations", "Custom Solutions"],
              inLanguage: locale,
              email: "ellixorrr@gmail.com",
              telephone: "+919404044607",
              url: `https://ellixorrr.com/${locale}`,
            })
              .replace(/&/g, "\\u0026")
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e"),
          }}
        />
        <a
          href="#home"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-bone focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-charcoal"
        >
          {dict.nav.home}
        </a>
        <MotionProvider>
          <SiteHeader locale={locale as Locale} dict={dict} />
          <main className="flex-1">{children}</main>
        </MotionProvider>
        <SiteFooter locale={locale as Locale} dict={dict} />
        <div className="noise-overlay" aria-hidden="true" />
        {/* Entrance animations start hidden via inline styles; without JS
            nothing would ever reveal them. Force content visible instead. */}
        <noscript>
          <style>{`.motion-reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
