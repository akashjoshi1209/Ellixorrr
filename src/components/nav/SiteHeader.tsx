"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/nav/LanguageSwitcher";
import { logoutAction } from "@/actions/auth";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";

type SiteHeaderProps = {
  locale: Locale;
  dict: Dictionary;
};

const sectionLinks = [
  { id: "home", key: "home" },
  { id: "services", key: "services" },
  { id: "about", key: "about" },
  { id: "work", key: "work" },
  { id: "contact", key: "contact" },
] as const;

export function SiteHeader({ locale, dict }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // The session is read from the browser Supabase client so the header
  // reflects the real auth state. The publishable key is the only key the
  // browser ever sees — the service-role key stays server-side.
  useEffect(() => {
    const supabase = createBrowserClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setIsAuthenticated(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsAuthenticated(Boolean(session));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the drawer; focus returns to the trigger.
  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const handleLogout = async () => {
    // The action signs the session out and redirects to the localized
    // homepage itself — no client-side navigation is needed.
    await logoutAction(locale);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open
          ? "border-b border-bone/10 bg-charcoal/90"
          : "border-b border-transparent"
      } ${scrolled && !open ? "backdrop-blur-sm" : ""}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-gutter md:h-20">
        <Logo href={`/${locale}`} linkLabel={dict.nav.home} />

        {/* Desktop navigation */}
        <nav aria-label={dict.nav.home} className="hidden items-center gap-7 lg:flex">
          {sectionLinks.map(({ id, key }) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-sm text-bone/70 transition-colors duration-200 hover:text-bone focus-visible:text-bone"
            >
              {dict.nav[key]}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher locale={locale} label={dict.nav.language} />

          {isAuthenticated ? (
            <>
              <a
                href={`/${locale}/dashboard`}
                className="rounded-full bg-bone px-4 py-2 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone"
              >
                <User className="h-4 w-4 mr-2" aria-hidden="true" />
                {dict.auth.myProfile}
              </a>
              <button
                onClick={handleLogout}
                className="rounded-full bg-bone px-4 py-2 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {dict.auth.logout}
              </button>
            </>
          ) : (
            <a
              href={`/${locale}/auth/login`}
              className="rounded-full bg-bone px-4 py-2 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-crimson hover:text-bone focus-visible:bg-crimson focus-visible:text-bone"
            >
              {dict.nav.cta}
            </a>
          )}
        </div>

        {/* Mobile trigger */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
            className="rounded-md p-2 text-bone transition-colors hover:text-crimson-bright"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div
          id="mobile-nav"
          className="fixed inset-0 top-0 z-40 bg-forest lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={dict.nav.home}
        >
          <div className="flex h-16 items-center justify-between px-gutter md:h-20">
            <Logo href={`/${locale}`} linkLabel={dict.nav.home} />
            <button
              type="button"
              onClick={close}
              aria-label={dict.nav.closeMenu}
              className="rounded-md p-2 text-bone transition-colors hover:text-crimson-bright"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-6 flex flex-col px-gutter" aria-label={dict.nav.home}>
            {sectionLinks.map(({ id, key }, index) => (
              <a
                key={id}
                ref={index === 0 ? firstLinkRef : undefined}
                href={`#${id}`}
                onClick={close}
                className="border-b border-bone/10 py-4 font-display text-2xl font-semibold text-bone"
              >
                {dict.nav[key]}
              </a>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-6 px-gutter">
            <LanguageSwitcher locale={locale} label={dict.nav.language} />

            {isAuthenticated ? (
              <>
                <a
                  href={`/${locale}/dashboard`}
                  onClick={close}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-charcoal"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  {dict.auth.myProfile}
                </a>
                <button
                  onClick={handleLogout}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-charcoal"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {dict.auth.logout}
                </button>
              </>
            ) : (
              <a
                href={`/${locale}/auth/login`}
                onClick={close}
                className="inline-flex w-fit items-center rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-charcoal"
              >
                {dict.nav.cta}
              </a>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
