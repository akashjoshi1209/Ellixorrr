import Link from "next/link";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Localized 404, rendered inside the [locale] layout. The not-found boundary
 * receives no params, so the active locale is recovered from the cookie the
 * middleware writes on every locale visit (falls back to English).
 */
export default async function LocaleNotFound() {
  const store = await cookies();
  const cookieLocale = store.get("ellixorrr-locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto flex min-h-[70svh] max-w-7xl flex-col justify-center px-gutter py-24">
      <p className="eyebrow">404</p>
      <h1 className="display-lg mt-4 max-w-2xl">{dict.notFound.title}</h1>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-bone/60">{dict.notFound.body}</p>
      <Link
        href={`/${locale}`}
        className="mt-10 inline-flex w-fit items-center rounded-full bg-bone px-6 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone"
      >
        {dict.notFound.backHome}
      </Link>
    </div>
  );
}
