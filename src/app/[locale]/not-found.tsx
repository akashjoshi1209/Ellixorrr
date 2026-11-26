import Link from "next/link";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { EyebrowRule } from "@/components/sections/SectionShell";

/**
 * Localized 404, rendered inside the [locale] layout. The not-found boundary
 * receives no params, so the active locale is recovered from the cookie the
 * middleware writes on every locale visit (falls back to English).
 */
export default async function LocaleNotFound() {
  const store = await cookies();
  const cookieLocale = store.get("ellixorrr-locale")?.value;
  const locale: Locale =
    cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <section className="relative flex min-h-[70svh] items-center overflow-hidden bg-charcoal py-24">
      <div aria-hidden="true" className="grid-texture absolute inset-0 opacity-70" />
      <div
        aria-hidden="true"
        className="forest-glow absolute inset-0 [--glow-x:82%] [--glow-y:0%]"
      />
      <div className="relative mx-auto w-full max-w-3xl px-gutter">
        <div className="dossier-panel p-8 md:p-12">
          <EyebrowRule eyebrow="404" />
          <h1 className="display-lg mt-5 max-w-2xl">{dict.notFound.title}</h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
            {dict.notFound.body}
          </p>
          <Link
            href={`/${locale}`}
            prefetch={false}
            className="mt-10 inline-flex w-fit items-center rounded-full bg-bone px-6 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone"
          >
            {dict.notFound.backHome}
          </Link>
        </div>
      </div>
    </section>
  );
}
