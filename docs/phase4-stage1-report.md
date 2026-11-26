# Phase 4 — Stage 1: Inspection & Architecture Plan

**Project:** Ellixorrr — Supabase Authentication & Customer Portal
**Date:** Mon Nov 16 2026
**Stage:** Stage 1 — Inspection and Plan (pre-implementation)

---

## 1. Existing Project Inspection

### Stack & versions
| Layer | Version |
|---|---|
| Next.js | 16.4.6 (App Router, Turbopack) |
| React | 19.3.0 |
| TypeScript | ^5 |
| Tailwind CSS | 4.3.3 |
| Package manager | pnpm 12.18.0 |
| i18n | en / hi / mr (custom dictionary system) |
| Animations | GSAP 3.15.1, Motion 14.14.0 |
| Testing | vitest 5.1.0, axe-core 4.14.0 |

### Project structure (relevant files)
```
src/
  app/[locale]/
    layout.tsx        — root shell, MotionProvider, SiteHeader, SiteFooter, structured data
    page.tsx          — homepage sections (Hero, BrandIntro, Services, WhyEllixorrr, Process, Work, ContactCTA)
    [...rest]/page.tsx — 404 catch-all
    not-found.tsx
  components/
    nav/
      SiteHeader.tsx    — desktop + mobile drawer, CTAs link to #contact
      LanguageSwitcher.tsx — segmented locale control
    sections/
      ContactCTA.tsx    — contact channels + enquiry form (client-side validation only, no backend)
      SiteFooter.tsx    — brand, nav, language, contact channels
    brand/
      Logo.tsx
    motion/
      HeroEntrance, Reveal, ParallaxLayer, MotionProvider, usePrefersReducedMotion
    threeui/
      EmeraldHorizonBackground, EmeraldHorizonField, emeraldHorizonShaders
  i18n/
    config.ts           — locales, negotiateLocale, LOCALE_COOKIE = "ellixorrr-locale"
    dictionaries.ts     — imports en/hi/mr
    types.ts            — Dictionary = typeof en
    locales/{en,hi,mr}.ts — full translation dictionaries
  proxy.ts              — locale negotiation + redirect (NOT wired as middleware.ts)
  config.ts             — COPYRIGHT_YEAR = 2026
```

### Key findings
1. **No `middleware.ts` exists.** `src/proxy.ts` contains locale routing logic but is not imported anywhere as middleware. The `.next/server/middleware.js` is compiled output from a previous build. **Supabase auth callbacks must not break locale routing.**
2. **Contact form** (`ContactCTA.tsx`) has full client-side validation but **no backend** — on submit it shows a `backendNote` error. This will be replaced by Supabase-backed enquiry storage in Phase 4.
3. **Authentication:** None currently. No login, register, or protected routes.
4. **Database:** None currently. No Supabase, no PostgreSQL.
5. **`.env*` is already gitignored** (line 34 of `.gitignore`).
6. **No Supabase dependencies installed.**
7. **Test suite:** Only `tests/locales.test.ts` (dictionary shape consistency).
8. **Brand palette:** Charcoal `#171717`, Forest `#06110c`, Crimson `#a31c1b`, Bone `#f1f0eb`.

### Supabase compatibility
- Next.js 16.4.6 + React 19.3.0 are fully compatible with `@supabase/supabase-js` v2 and `@supabase/ssr` v0.x.
- `@supabase/ssr` provides `createServerClient` (for Server Components / Route Handlers) and `createBrowserClient` (for Client Components), both using cookie-based auth — matching Next.js App Router SSR patterns.
- No peer dependency conflicts expected.

---

## 2. Implementation & Security Plan

### Delivery approach (work in stages)
Per the implementation rule: **database + auth first, then dashboards.** No claims of live database connection until a real Supabase project is configured.

### New dependencies
- `@supabase/supabase-js` — browser + server Supabase client
- `@supabase/ssr` — Next.js SSR-aware clients (cookie-based auth)
- `zod` — schema validation for forms (replaces ad-hoc email regex)

### New file structure

```
src/lib/supabase/
  client.ts     — createBrowserClient (Client Components)
  server.ts     — createServerClient (Server Components, Route Handlers)
  middleware.ts — Next.js middleware: Supabase auth session refresh + locale proxy
  types.ts      — Database type generation (Database, Tables, etc.)

src/app/[locale]/
  auth/
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
  dashboard/
    page.tsx              — customer dashboard (protected, customer role)
    projects/page.tsx
    projects/[id]/page.tsx
    profile/page.tsx
  admin/
    page.tsx              — admin dashboard (protected, admin role)
    customers/page.tsx
    projects/page.tsx
    enquiries/page.tsx

src/components/
  auth/
    LoginForm.tsx
    RegisterForm.tsx
    ForgotPasswordForm.tsx
    ResetPasswordForm.tsx
    AuthGuard.tsx         — role-based route protection
  dashboard/
    ProjectCard.tsx
    ProjectUpdateList.tsx
    ProfileForm.tsx
  enquiry/
    EnquiryForm.tsx       — replaces client-only ContactCTA form submission

src/lib/
  validations/            — Zod schemas
  email.ts                — server-side email helper (placeholder, no credentials)
```

> **2026-11-25 Phase 4 correction:** `src/lib/email.ts` was planned here but was
> never implemented. The current tree has no repository email layer; signup and
> recovery email depend entirely on live Supabase Auth/SMTP configuration. See
> `reports/phase-4/AUTH_EMAIL_READINESS.md`.

### Environment variables
| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + Server | Anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Admin operations (never in browser) |

All three added to `.env.example` with empty placeholders. `.env.local` already gitignored.

### Database schema (SQL migrations)

**profiles**
- `id` UUID PK references `auth.users`
- `full_name` text
- `email` text
- `phone` text
- `avatar_url` text
- `role` text CHECK (customer, admin) DEFAULT 'customer'
- `created_at`, `updated_at` timestamptz

**projects**
- `id` UUID PK default gen_random_uuid()
- `customer_id` UUID FK references profiles(id)
- `project_name` text
- `service_type` text CHECK (Websites, Applications, Automations, Custom Solutions)
- `description` text
- `status` text CHECK (enquiry, planning, in_progress, review, completed, on_hold) DEFAULT 'enquiry'
- `start_date`, `expected_completion_date` date
- `created_at`, `updated_at` timestamptz

**project_updates**
- `id` UUID PK default gen_random_uuid()
- `project_id` UUID FK references projects(id)
- `author_id` UUID FK references profiles(id)
- `title` text
- `description` text
- `created_at` timestamptz

**enquiries**
- `id` UUID PK default gen_random_uuid()
- `customer_id` UUID FK references profiles(id) nullable
- `name`, `email`, `phone`, `business_name`, `service_type`, `project_description` text
- `status` text CHECK (new, reviewing, contacted, converted, closed) DEFAULT 'new'
- `created_at` timestamptz

### Row Level Security (RLS)
Every table: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`

**profiles:**
- Customers: SELECT own row, UPDATE own row (excluding `role`)
- Admins: SELECT all, UPDATE all

**projects:**
- Customers: SELECT own projects only
- Admins: full CRUD

**project_updates:**
- Customers: SELECT updates on own projects
- Admins: full CRUD

**enquiries:**
- Public (anon): INSERT only (no SELECT)
- Authenticated customers: SELECT own enquiries only
- Admins: full CRUD

### Authentication flows
- Registration → email confirmation required (Supabase default)
- Login → email/password, PKCE via `@supabase/ssr` cookies
- Forgot password → reset email (Supabase default)
- Password reset → set new password
- Logout → clear cookies
- Session persistence → automatic via cookies
- Protected routes → middleware checks session + role; redirects to login or dashboard

### Security requirements
- Service role key **never** in Client Components
- `getClaims()` used for server-side authorization (not `getSession()` alone)
- RLS on every table — database-level enforcement, not just UI hiding
- No IDOR: policies filter by `customer_id` / `auth.uid()`
- Input validation with Zod on all forms
- Safe error messages (no stack traces leaked)
- Rate limiting: middleware or edge function for public enquiry + auth endpoints
- No open redirects: validate `next`/`redirectTo` params against allowed routes
- Role cannot be changed by client; admin assignment via server-side SQL only

### Localization
- All new visible text added to en/hi/mr dictionaries following existing `contact.form.*` pattern
- Locale dictionary shape test (`tests/locales.test.ts`) must continue to pass
- Auth pages use `dict.auth.*` keys

### Middleware integration (critical)
- New `src/middleware.ts` will:
  1. Initialize Supabase auth cookie refresh (required by `@supabase/ssr`)
  2. Call existing locale logic from `src/proxy.ts` (reused, not replaced)
  3. Protect `/dashboard/*` and `/admin/*` routes based on user role
  4. Redirect authenticated users away from `/auth/*` pages
- Must NOT break existing `/` locale redirect or `/[locale]/*` routing

---

## 3. What must NOT change
- Homepage (public pages) design, copy, or architecture
- Brand palette, typography, logo
- Existing navigation (header/footer) — only auth links may be added
- `src/proxy.ts` locale logic — reused in middleware
- Contact channels (WhatsApp/email/phone) — remain working
- No Google or phone OTP login
- No billing/payments

---

## 4. Next steps (Stage 2)
1. Install `@supabase/supabase-js`, `@supabase/ssr`, `zod`
2. Create `.env.example` with empty placeholders
3. Create `src/lib/supabase/` (client.ts, server.ts, middleware.ts, types.ts)
4. Create SQL migration files
5. Stop and await Supabase project credentials from user

---

## 5. Immediate action required from user
No Supabase project exists yet. The code and SQL migrations will be prepared in Stage 2, then implementation pauses until the user provides:
- Supabase project URL
- Supabase publishable (anon) key

These must never be pasted into source code — only into `.env.local` (gitignored).
