# Technical SEO & Discoverability Audit — Ellixorrr

**Project:** Ellixorrr (`C:\Users\joshi\ellixorrr`)
**Stack:** Next.js 16 App Router, React 19, TypeScript
**Production domain:** `https://ellixorrr.dpdns.org`
**Locales:** English (`/en`), Hindi (`/hi`), Marathi (`/mr`)
**Deployment:** Render
**Audit type:** Read-only — no files modified, no secrets accessed, no configuration changes

---

## Executive summary

The Ellixorrr website has a solid technical foundation: semantic HTML, proper heading hierarchy, locale-aware JSON-LD structured data, hreflang alternates, and per-locale metadata via Next.js `generateMetadata`. However, several **critical gaps** exist that will significantly limit search engine discovery and indexing:

1. **No `sitemap.xml` exists** — search engines have no machine-readable index of the site's public pages.
2. **No `robots.txt` exists** — crawlers have no explicit crawl directives and no declared sitemap location.
3. **No `llms.txt`** — the site is not optimized for AI crawlers / answer engines.
4. **Canonical URLs are relative** — `generateMetadata` sets `alternates.canonical` to `/{locale}` (a relative path) instead of an absolute URL including the production domain. This weakens canonical consolidation and can cause duplicate-content issues across locales.
5. **No Open Graph images** — social previews will lack visual impact, reducing click-through from social platforms.
6. **No Twitter Cards metadata** — Twitter/X social sharing is unoptimized.
7. **Private routes lack `noindex`** — dashboard, admin, and auth pages are protected by server-side auth but carry no `noindex` robots directive; if ever linked or guessed, they could be crawled and indexed (though auth walls will block content).
8. **No `next/image` optimization** — images are served as raw assets without Next.js image optimization.
9. **No `next-sitemap` or `next-sitemap` equivalent configured** — no automated sitemap generation in build output.

None of these are security vulnerabilities. All are discoverability and indexing improvements.

---

## Existing implementation inventory

### Routes and pages

| Route | Public? | Indexable? | Auth required | Notes |
|---|---|---|---|---|
| `/[locale]` (homepage) | Yes | Yes | No | Core landing page; en/hi/mr static prerendered |
| `/[locale]/[...rest]` (catch-all) | No | No | No | Returns `notFound()` for unknown paths |
| `/[locale]/auth/login` | Yes (utility) | No (recommended) | No | Login form |
| `/[locale]/auth/register` | Yes (utility) | No (recommended) | No | Registration form |
| `/[locale]/auth/forgot-password` | Yes (utility) | No (recommended) | No | Password reset request |
| `/[locale]/auth/reset-password` | Yes (utility) | No (recommended) | No | Password reset completion (token-gated) |
| `/[locale]/dashboard` | No | No | Yes (`requireCustomer`) | Customer portal — `force-dynamic` |
| `/[locale]/dashboard/profile` | No | No | Yes (`requireCustomer`) | Profile edit — `force-dynamic` |
| `/[locale]/dashboard/projects` | No | No | Yes (`requireCustomer`) | Project list — `force-dynamic` |
| `/[locale]/dashboard/projects/[id]` | No | No | Yes (`requireCustomer`) | Project detail — `force-dynamic` |
| `/[locale]/admin/*` | No | No | Yes (`requireAdmin`) | Admin dashboard/customers/projects/enquiries — `force-dynamic` |

### Metadata (from `src/app/[locale]/layout.tsx`, `generateMetadata`)

Per locale, the following are set:

| Field | Value source | Example (en) |
|---|---|---|
| `title` | `dict.meta.title` | "Ellixorrr — Websites, Applications, Automations & Custom Solutions" |
| `description` | `dict.meta.description` | Locale-specific description |
| `alternates.canonical` | `/{locale}` | `/en` (**relative**, not absolute) |
| `alternates.languages` | en/hi/mr | `{"en": "/en", "hi": "/hi", "mr": "/mr"}` |
| `openGraph.type` | `"website"` | — |
| `openGraph.siteName` | `"ELLIXORRR"` | — |
| `openGraph.title` | `dict.meta.title` | — |
| `openGraph.description` | `dict.meta.description` | — |
| `openGraph.locale` | Current locale | `en` / `hi` / `mr` |
| `robots` | `{index: true, follow: true}` | Applied globally |

**File:** `src/app/[locale]/layout.tsx`, lines 18–46

### Structured data (JSON-LD)

A single `ProfessionalService` schema is rendered in every locale layout:

**File:** `src/app/[locale]/layout.tsx`, lines 72–91

```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "ELLIXORRR",
  "description": "<locale description>",
  "knowsAbout": ["Websites", "Applications", "Automations", "Custom Solutions"],
  "inLanguage": "<locale>",
  "email": "ellixorrr@gmail.com",
  "telephone": "+919404044607",
  "url": "https://ellixorrr.com/<locale>"
}
```

Strengths: locale-aware `inLanguage` and `url`, no invented facts (address/rating omitted).  
Limitations: only `ProfessionalService`; no `WebSite`, `Service`, `BreadcrumbList`, `FAQPage`, or `LocalBusiness` schemas.

### hreflang / alternate language links

Configured via `alternates.languages` in `generateMetadata` (layout.tsx lines 29–35). All three locales cross-reference each other. The footer (`src/components/sections/SiteFooter.tsx`, lines 61–74) also renders locale switcher links with `hrefLang`.

### Canonical URLs — ISSUE

`alternates.canonical` is set to `/{locale}` (e.g. `/en`) — a **relative path**. Canonical URLs **must** be absolute (including scheme and host) to be effective for cross-locale canonical consolidation. Recommended: `https://ellixorrr.dpdns.org/en`.

### Open Graph

No `openGraph.images` configured — social shares will lack a preview image. No `openGraph.url` absolute URL.

### Twitter Cards

Not configured at all.

### Robots meta

`{index: true, follow: true}` is applied globally (layout.tsx line 44), including to auth, dashboard, and admin routes that should not be indexed.

### Sitemap

**Does not exist.** No `sitemap.xml`, no `robots.txt`, no `next-sitemap` package, no sitemap generation in `next.config.ts`.

### Robots.txt

**Does not exist.** No crawl directives, no sitemap location declaration.

### llms.txt

**Does not exist.** No AI-crawler guidance file.

### Image optimization

No `next/image` usage or `images` configuration in `next.config.ts`. Logo is served as `/ellixorrr-emblem.svg` via a plain `` (Logo.tsx line 15). Favicons: `favicon.ico`, `apple-icon.png`, `icon.png`, `icon.svg` in `src/app/`.

### Fonts

Self-hosted via `@fontsource-variable` packages (Inter, Space Grotesk, Noto Sans Devanagari) — good for performance and privacy (no Google Fonts external requests).

### Semantic HTML & heading hierarchy

- `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<h1>`–`<h4>` used correctly
- Hero section (`src/components/sections/Hero.tsx`) has a single `<h1>` per page
- Section shells use `<h2>` for section titles, `<h3>`/`<h4>` for card titles
- Skip-to-content link present (layout.tsx lines 92–97)
- `aria-hidden="true"` on decorative elements

### Internal linking

- Header navigation: anchor links to page sections (`#home`, `#services`, `#about`, `#work`, `#contact`)
- Footer navigation: same anchor links
- Footer language switcher: direct `/<locale>` links with `hrefLang`
- Hero CTAs: `#contact` and `#services` anchor links
- Auth pages: links between login/register/forgot-password
- Dashboard: links to profile and projects
- All internal links are relative, locale-prefixed where applicable

### Redirect behavior

- Root `/` → locale-prefixed (`/en`, `/hi`, `/mr`) handled by `src/proxy.ts` middleware (locale negotiation via cookie or `Accept-Language`)
- Unknown paths under a locale → `notFound()` via `[...rest]/page.tsx`
- Auth-gated routes redirect unauthenticated users to `/auth/login` with `redirectTo`
- Logout redirects to localized homepage

### Existing accessibility safeguards (SEO-adjacent)

- `focus-visible` outline styling (globals.css lines 52–55)
- `prefers-reduced-motion` respected (globals.css lines 33–37, 145–153)
- `skip` link to `#home` (layout.tsx lines 92–97)
- Language attribute on `<html>` per locale (layout.tsx line 59)
- `sr-only` screen-reader text on language switcher labels
- Devanagari line-height adjustment for hi/mr (globals.css lines 58–61)

---

## Issues categorized

### Critical

| # | Issue | Location | Impact |
|---|---|---|---|
| C1 | **No `sitemap.xml`** | `next.config.ts` (absent), project root | Search engines cannot efficiently discover all public pages; indexing is slower and incomplete |
| C2 | **No `robots.txt`** | Project root (absent) | No crawl directives, no sitemap location declared; crawlers must guess |
| C3 | **Relative canonical URL** | `src/app/[locale]/layout.tsx`, line 30 | Canonical is `/{locale}` instead of `https://ellixorrr.dpdns.org/<locale>`; weakens canonical consolidation and risks duplicate content across locales |
| C4 | **Global `index: follow` on private routes** | `src/app/[locale]/layout.tsx`, line 44 | Auth, dashboard, and admin routes are marked indexable though they contain no public content |

### High

| # | Issue | Location | Impact |
|---|---|---|---|
| H1 | **No Open Graph images** | `src/app/[locale]/layout.tsx`, lines 37–44 | Social shares lack preview images; lower CTR from social platforms |
| H2 | **No Twitter Cards metadata** | `src/app/[locale]/layout.tsx` | Twitter/X sharing shows default/unoptimized preview |
| H3 | **No `openGraph.url` absolute URL** | `src/app/[locale]/layout.tsx`, lines 37–44 | Open Graph objects lack absolute URL; social platforms may misattribute |
| H4 | **No `next/image` / image optimization** | `next.config.ts` (absent), `src/components/brand/Logo.tsx` line 15 | Images served unoptimized; affects LCP and Core Web Vitals |

### Medium

| # | Issue | Location | Impact |
|---|---|---|---|
| M1 | **No `llms.txt`** | Project root (absent) | AI crawlers / answer engines lack structured guidance; reduced GEO/AEO visibility |
| M2 | **Limited structured data schema types** | `src/app/[locale]/layout.tsx`, lines 72–91 | Only `ProfessionalService`; missing `WebSite`, `Service`, `BreadcrumbList`, `FAQPage` |
| M3 | **Canonical uses relative path** | See C3 | (Also categorized as Critical; repeated here for emphasis in dependency order) |
| M4 | **No explicit `noindex` on auth pages** | `src/app/[locale]/auth/*/page.tsx` | Login/register/forgot-password/reset-password pages are utility pages that should not appear in search results |

### Low

| # | Issue | Location | Impact |
|---|---|---|---|
| L1 | **No `alternates` default locale fallback** | `src/app/[locale]/layout.tsx`, lines 31–35 | If a user requests an unsupported locale, `generateMetadata` returns `{}` (empty metadata) |
| L2 | **Copyright year hardcoded** | `src/config.ts`, line 6 | `COPYRIGHT_YEAR = 2026` requires manual bump; minor SEO signal |
| L3 | **No `changefreq`/`priority` in sitemap** | N/A (sitemap does not exist) | Will be addressed when sitemap is created |

---

## Exact file paths and line references

### Metadata configuration

- **File:** `src/app/[locale]/layout.tsx`
  - Lines 18–46: `generateMetadata` — title, description, canonical, hreflang, Open Graph, robots
  - Line 30: `canonical: /{locale}` — relative canonical (ISSUE C3)
  - Line 44: `robots: { index: true, follow: true }` — global, applies to private routes (ISSUE C4)
  - Lines 37–44: Open Graph block — no images, no `openGraph.url` (ISSUES H1–H3)

### Structured data

- **File:** `src/app/[locale]/layout.tsx`
  - Lines 72–91: JSON-LD `ProfessionalService` script
  - Line 85: `url: \`https://ellixorrr.com/${locale}\`` — uses `ellixorrr.com` not `ellixorrr.dpdns.org` (potential domain mismatch)

### Routes

- **File:** `src/app/[locale]/page.tsx` — homepage (indexable)
- **File:** `src/app/[locale]/[...rest]/page.tsx` — catch-all 404
- **File:** `src/app/[locale]/not-found.tsx` — localized 404
- **Files:** `src/app/[locale]/auth/{login,register,forgot-password,reset-password}/page.tsx` — auth utility pages
- **Files:** `src/app/[locale]/dashboard/*` — customer portal (auth-gated)
- **Files:** `src/app/[locale]/admin/*` — admin portal (auth-gated)

### Configuration

- **File:** `next.config.ts` — no sitemap, robots, or image config (ISSUES C1, C2, H4)
- **File:** `src/i18n/config.ts` — locale definitions, default locale, negotiation logic

---

## Recommended fixes in dependency order

### Phase 1 — Crawlability foundation (Critical)

1.1. **Add `robots.txt`** at project root with:
   - Allow all public pages
   - Disallow `/dashboard`, `/admin`, `/auth` paths
   - Declare sitemap location: `Sitemap: https://ellixorrr.dpdns.org/sitemap.xml`

1.2. **Add `sitemap.xml`** at project root listing all public pages:
   - `/en`, `/hi`, `/mr` (homepages)
   - Exclude all `/dashboard`, `/admin`, `/auth` routes
   - Use absolute URLs with `https://ellixorrr.dpdns.org`
   - Include `lastmod`, `changefreq`, `priority` per page

1.3. **Fix canonical URLs** in `src/app/[locale]/layout.tsx` line 30: change `canonical: /{locale}` to an absolute URL: `https://ellixorrr.dpdns.org/<locale>`

1.4. **Add `noindex` to private/auth routes** in their respective page components or via layout-level logic that detects auth/dashboard/admin paths and returns `robots: { index: false, follow: false }`

### Phase 2 — Social & rich results (High)

2.1. **Add Open Graph images** in `generateMetadata` (`src/app/[locale]/layout.tsx`): `openGraph.images` with an absolute URL to a share image (e.g. `/og-image.png` or a per-locale variant)

2.2. **Add `openGraph.url`** with absolute URL `https://ellixorrr.dpdns.org/<locale>`

2.3. **Add Twitter Cards metadata** in `generateMetadata`: `twitter: { card: "summary_large_image", title, description, images }`

### Phase 3 — Structured data & AEO (Medium)

3.1. **Expand JSON-LD schemas** in `src/app/[locale]/layout.tsx`:
   - Add `WebSite` schema with `potentialAction` (search action)
   - Add `Service` schemas for the four services (Websites, Applications, Automations, Custom Solutions)
   - Add `BreadcrumbList` schema matching the site navigation structure
   - Consider `FAQPage` if FAQ content is added

3.2. **Add `llms.txt`** at project root with:
   - Site identity (Ellixorrr, SaaS & technology agency)
   - Service descriptions (four services)
   - Contact information (email, phone, WhatsApp)
   - URL structure explanation
   - Instructions for AI crawlers

### Phase 4 — Performance & images (Medium)

4.1. **Configure `next/image`** in `next.config.ts` with `domains` or `remotePatterns` if external images are used; optimize the logo SVG with `next/image`

4.2. **Add `images` configuration** in `next.config.ts` for `deviceSizes`, `formats` (`image/avif`)

### Phase 5 — Monitoring (Low)

5.1. **Register domain in Google Search Console** (domain verification via DNS TXT record)
5.2. **Submit `sitemap.xml`** via GSC
5.3. **Inspect key URLs** in GSC: `/en`, `/hi`, `/mr`, `/contact` sections

---

## Phase-by-phase implementation plan

| Phase | Focus | Files to touch | Estimated effort |
|---|---|---|---|
| 1 | Crawlability foundation | `robots.txt` (new), `sitemap.xml` (new), `src/app/[locale]/layout.tsx` | Low |
| 2 | Social & rich results | `src/app/[locale]/layout.tsx` | Low |
| 3 | Structured data & AEO | `src/app/[locale]/layout.tsx`, `llms.txt` (new) | Medium |
| 4 | Performance & images | `next.config.ts`, image components | Medium |
| 5 | Monitoring | External (GSC, Render) | Low |

---

## Validation commands and expected outcomes

```bash
# TypeScript check
npx tsc --noEmit
# Expected: exit 0, no errors

# ESLint
npx eslint src/
# Expected: exit 0, no new errors or warnings

# Vitest tests
npx vitest run
# Expected: all existing tests pass (currently 2 files, 32 tests)

# Production build
npx next build
# Expected: exit 0, 42 pages generated, ƒ Proxy (Middleware) present

# Verify sitemap accessibility (after creation)
curl -I https://ellixorrr.dpdns.org/sitemap.xml
# Expected: HTTP 200, Content-Type: application/xml

# Verify robots.txt accessibility (after creation)
curl -I https://ellixorrr.dpdns.org/robots.txt
# Expected: HTTP 200, contains "Sitemap:" directive

# Verify canonical URL in rendered HTML
curl -s https://ellixorrr.dpdns.org/en | grep -o 'rel="canonical"[^>]*'
# Expected: href="https://ellixorrr.dpdns.org/en" (absolute)

# Verify hreflang alternates
curl -s https://ellixorrr.dpdns.org/en | grep -o 'hreflang="[^"]*"'
# Expected: en, hi, mr all present
```

---

## Security & privacy confirmation

- No customer data is exposed in any public route — all dashboard/admin routes are protected by server-side `requireAdmin()` / `requireCustomer()` checks
- No `.env.local` or secrets were accessed during this audit
- No Supabase or Render configuration was inspected or modified
- The service-role key is never exposed to browser code (confirmed: `src/lib/supabase/server.ts` uses only publishable/anon key)
- No new dependencies beyond `@next/third-parties` (already installed for GTM) are recommended for SEO fixes

---

## Audit scope & limitations

This audit is based on static source-code inspection only. It does not include:

- Live crawling or rendering verification
- Google Search Console data
- Real-user Core Web Vitals measurements
- Render deployment configuration
- DNS or domain verification status

The report reflects the codebase state at commit `ea2e9f0` / `464d222` / `87949c2` on branch `master`. All findings are based on file contents observed in `C:\Users\joshi\ellixorrr`.

---
