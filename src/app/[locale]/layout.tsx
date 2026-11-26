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
import { absoluteRootUrl, absoluteUrl } from "@/lib/site-config";
import { buildGraph } from "@/lib/structured-data";

/** Locale identifiers use the regional form expected by Open Graph. */
const OG_LOCALES: Record<Locale, string> = {
  en: "en_IN",
  hi: "hi_IN",
  mr: "mr_IN",
};

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

  const siteUrl = absoluteUrl(locale, "/");
  const ogLocale = OG_LOCALES[locale];

  // All routes under [locale] default to noindex. The homepage overrides
  // this in its own metadata export; auth, dashboard, and admin routes
  // intentionally remain noindex because they contain no public content
  // and are protected by server-side authorization.
  return {
    metadataBase: new URL(absoluteRootUrl("/")),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: siteUrl,
      languages: {
        en: absoluteUrl("en", "/"),
        hi: absoluteUrl("hi", "/"),
        mr: absoluteUrl("mr", "/"),
        "x-default": absoluteUrl("en", "/"),
      },
    },
    openGraph: {
      type: "website",
      siteName: "ELLIXORRR",
      title: dict.meta.title,
      description: dict.meta.description,
      url: siteUrl,
      locale: ogLocale,
      alternateLocale: locales
        .filter((alternate) => alternate !== locale)
        .map((alternate) => OG_LOCALES[alternate]),
      images: [
        {
          url: absoluteRootUrl("/og-image.svg"),
          width: 1200,
          height: 630,
          alt: dict.meta.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
      images: [
        {
          url: absoluteRootUrl("/og-image.svg"),
          width: 1200,
          height: 630,
          alt: dict.meta.ogImageAlt,
        },
      ],
    },
    robots: { index: false, follow: true },
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
            Each entity is rendered as its own JSON-LD block. */}
        {buildGraph(locale, dict.meta.description).map((entity, index) => (
          <script
            key={index}
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(entity)
                .replace(/&/g, "\\u0026")
                .replace(/</g, "\\u003c")
                .replace(/>/g, "\\u003e"),
            }}
          />
        ))}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-bone focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-charcoal"
        >
          {dict.nav.skipToContent}
        </a>
        <MotionProvider>
          <SiteHeader locale={locale as Locale} dict={dict} />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
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
