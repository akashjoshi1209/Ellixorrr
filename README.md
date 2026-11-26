# Ellixorrr

Ellixorrr is a localized marketing website with Supabase-backed customer and
admin portals. The public site presents four service lines — Websites,
Applications, Automations, and Custom Solutions — in English, Hindi, and
Marathi. Authenticated users can manage their profile and projects; admins can
review enquiries, customers, and projects.

The implementation is intentionally conservative: public pages are server-first,
mutations go through server actions, authorization is enforced by Supabase Row
Level Security (RLS), and only the publishable key is available to browser code.

## Stack

- Next.js 16.4.6 (App Router, Turbopack)
- React 19.3.0
- TypeScript 5
- Tailwind CSS 4.3.3
- Supabase Auth + PostgreSQL (`@supabase/ssr`, `@supabase/supabase-js`)
- Zod 4 for server-side validation
- Motion, GSAP, and Three.js for selective interaction and ambience
- Vitest for unit tests

## Requirements

Use the pnpm version declared by `packageManager` in `package.json`
(`pnpm@12.18.0`). A Supabase project is required only for authenticated flows
and enquiry persistence; the public site can build without it.

Browser QA additionally requires Python 3, the `playwright` Python package, a
Playwright Chromium/Chrome installation, and `axe-core` in `node_modules`. The
capture script expects Chrome at the path derived from `LOCALAPPDATA` on
Windows; override that path in the script when using another OS or browser
installation.

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000>.

Fill `.env.local` with values from your Supabase project:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Anon/publishable key; safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Reserved for trusted admin operations; bypasses RLS |
| `NEXT_PUBLIC_APP_URL` | Public, optional | Canonical app origin for redirect validation |
| `NEXT_PUBLIC_SITE_URL` | Public, optional | Canonical origin for metadata, canonical URLs, Open Graph, sitemap, and robots |
| `NEXT_PUBLIC_GTM_ID` | Public, optional | Google Tag Manager container; analytics are skipped when unset |

`.env.local` is gitignored. Never commit credentials, and never import the
service-role key into a client component. Normal application database access
uses the publishable key with RLS.

`src/lib/supabase/env.ts` validates `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when any Supabase client is created. A
missing or malformed value throws a clear error that never echoes the value.
Because Next.js inlines `NEXT_PUBLIC_*` at build time, set these variables in
the environment that produces the deployed build.

## Database setup

The schema baseline is `supabase/migrations/001_initial_schema.sql`; the
current security hardening is `supabase/migrations/003_security_hardening.sql`,
which supersedes `002_security_hardening.sql` and is safe to apply whether or
not `002` was previously run. Apply the migrations in filename order in the
Supabase SQL editor or with the Supabase CLI, then verify the tables, indexes,
triggers, and RLS policies listed in `supabase/README.md`.

Security-relevant details:

- `profiles.role` is constrained to `customer` or `admin`.
- New users receive the `customer` role by default.
- `protect_profile_role()` prevents self-promotion; only an existing admin can
  change a role.
- `003_security_hardening.sql` closes profile-INSERT escalation, restricts
  public enquiry inserts, uses `public.is_admin()` to avoid recursive profile
  policies, and pins `search_path` on trigger functions.
- Customers can read their own profile, projects, project updates, and
  enquiries. Admins have the corresponding full CRUD access.

The live migration state and Supabase auth settings are external to this
repository and must be verified in the Supabase dashboard.

## Project structure

```text
src/
  actions/          Server actions for auth, profile, enquiries, and admin CRUD
  app/
    [locale]/       Localized public, auth, dashboard, and admin routes
    sitemap.ts      Generated XML sitemap
    robots.ts       Generated robots.txt
  components/
    brand/          Logo
    nav/            Site header and language switcher
    sections/       Homepage sections and footer
    motion/         Reveal, parallax, entrance, and motion provider
    threeui/        Ambient Three.js background
    ui/             Shared button and feedback components
  i18n/             Locale config, dictionaries, and dictionary types
  lib/supabase/     Browser, server, and proxy clients
  lib/              Validation, feedback allowlists, navigation, config helpers
supabase/           SQL migration and setup documentation
tests/              Vitest suites
reports/            Source audits and architectural reviews
```

## Routes

- `/en`, `/hi`, `/mr` — localized public homepage
- `/[locale]/auth/login`, `/register`, `/forgot-password`, `/reset-password`
- `/[locale]/dashboard`, `/dashboard/profile`, `/dashboard/projects`
- `/[locale]/admin`, `/admin/customers`, `/admin/enquiries`, `/admin/projects`
- `/sitemap.xml`, `/robots.txt`, `/llms.txt`

Auth, dashboard, and admin routes are intentionally `noindex` and excluded from
the sitemap.

## Scripts

```bash
pnpm dev      # development server
pnpm build    # production build
pnpm start    # serve a production build
pnpm lint     # ESLint
pnpm test     # Vitest
pnpm format   # Prettier
```

## Localization

Dictionaries live in `src/i18n/locales/{en,hi,mr}.ts` and are typed against
English. `tests/locales.test.ts` enforces identical leaf shapes and non-empty
translations. Auth copy, contact validation messages, and submit states are
localized; service values remain canonical English strings so stored data is
not invalidated by translation.

## SEO and analytics

`src/lib/site-config.ts` centralizes canonical URL construction from
`NEXT_PUBLIC_SITE_URL` and the real contact channels shared by public links,
structured data, and consistency tests. Locale metadata, hreflang alternates,
Open Graph tags, JSON-LD, `sitemap.ts`, and `robots.ts` are generated from
source configuration; `public/llms.txt` is a reviewed static summary checked
against those constants by `tests/contact-consistency.test.ts`. Search indexing
and analytics collection depend on deploying the site and configuring external
accounts; they are not guaranteed by this repository.

## Verification

Run all local checks before submitting changes. Phase 4 re-ran these after the
Supabase environment validation change: lint and type checking were clean,
`pnpm test` passed 10 files / 85 tests, and `pnpm build` generated 44/44 pages.

```bash
pnpm lint
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

For browser QA, start a production server on a separate available port and
point the capture script at it. The final Phase 8 run used `3002` because
`3001` was already occupied; the earlier `3001` record remains in the QA
history.

```bash
pnpm build
pnpm exec next start -p 3002
ELLIXORRR_BASE_URL=http://localhost:3002 python scripts/capture_visual_qa.py
```

`ELLIXORRR_BASE_URL` is a QA-script variable, not an application secret. The
final Phase 8 viewport and axe evidence was captured on port `3002`; the
earlier port-`3001` record remains in `BROWSER_QA.md`. The axe audit
(`scripts/audit_a11y.py`) currently targets `http://localhost:3000` and loads
`node_modules/axe-core/axe.min.js`; adjust its local base URL if a different
port is used. Neither script mutates application data.

See `ELLIXORRR_WEBSITE_TRANSFORMATION_REPORT.md` for the Phase 1/2
transformation scope, `ELLIXORRR_PHASE_3_BUSINESS_READINESS_REPORT.md` for
Phase 3 page, component, security, SEO, and verification detail, and
`PRODUCTION_READINESS_CHECKLIST.md` for checked local items plus external
go-live prerequisites. Historical QA records are preserved in
`reports/visual-transformation/BROWSER_QA.md` and its dated Phase 8 addendum.

## Phase 4 runbooks and launch evidence

The Phase 4 handoff is the uncommitted working tree itself. Capture untracked
files as well as tracked modifications before any commit, archive, or deploy.

- `reports/phase-4/RELEASE_AUDIT.md` — release inventory, fresh gates, live public endpoint evidence, and classified blockers.
- `reports/phase-4/SUPABASE_READINESS.md` — migration classification and the exact authorized verification sequence.
- `reports/phase-4/AUTH_EMAIL_READINESS.md` — auth source behavior and external auth/email configuration checklist.
- `reports/phase-4/DEPLOYMENT_RUNBOOK.md` — preflight, environment contract, deployment instructions, post-deploy checks, and rollback conditions.
- `reports/phase-4/DOMAIN_SSL_EVIDENCE.md` — read-only DNS/SSL/canonical observations and the superseded robots record.
- `reports/phase-4/SEO_ANALYTICS_READINESS.md` — implemented SEO source, live metadata checks, and search/analytics blockers.
- `reports/phase-4/MONITORING_AND_DIAGNOSTICS.md` — current diagnostics, monitoring gaps, and privacy rules.
- `INCIDENT_RESPONSE_AND_RECOVERY.md` — incident scenarios, containment, recovery, and escalation.
- `ELLIXORRR_BUSINESS_OPERATIONS_PLAYBOOK.md` — enquiry, project, admin, content, and launch-day operations.
- `ELLIXORRR_PRODUCTION_LAUNCH_REPORT.md` — final 19-section Phase 4 report and release decision.
- `PRODUCTION_READINESS_CHECKLIST.md` — dated Phase 4 assessment using the approved status vocabulary.

No deployment, live migration, DNS/SSL change, SMTP change, account creation, or external permission change was performed. The live public origin was checked read-only only.

## Documentation

- `PRODUCT.md` — product scope, users, flows, and constraints
- `DESIGN.md` — design tokens, interaction rules, and accessibility guidance
- `ELLIXORRR_WEBSITE_TRANSFORMATION_REPORT.md` — Phase 1/2 transformation record
- `ELLIXORRR_PHASE_3_BUSINESS_READINESS_REPORT.md` — Phase 3 scope, changes, and actual results
- `PRODUCTION_READINESS_CHECKLIST.md` — local verification and external go-live prerequisites
- `PORTFOLIO_CONTENT_INVENTORY.md` — publication rules and empty approved-items list
- `supabase/README.md` — database setup and RLS expectations
- `reports/phase-3/INITIAL_AUDIT.md` — Phase 0 evidence base
- `reports/visual-transformation/BROWSER_QA.md` — historical QA plus dated Phase 8 addendum
- `reports/THREE_ROLE_AUTHENTICATION_ARCHITECTURE_AUDIT.md` — read-only architecture audit

## Phase 6 release infrastructure

Phase 6 produced a protected source baseline and a reproducible release package, but did not create staging or touch production. Final local classification is `CONDITIONALLY READY`: all safe repository-side work is complete, while external access and authorization remain.

- Verified pre-Phase-6 backup: `C:\Users\joshi\ellixorrr-phase6-backups\working-tree-20261125T145144.zip`, SHA-256 `C5835FA2FCA5B6524C71B34F1032C568618D2F1503878AA2FB44F13FF20D4835`.
- Release snapshot script: `scripts/phase6_release_snapshot.py` — copies a secret-free source tree outside the repository, generates a SHA-256 manifest, and verifies file count and hashes.
- Snapshot build: `pnpm install --frozen-lockfile --offline` followed by `pnpm build` with placeholder public environment values only; 44/44 static pages generated.
- Detailed evidence: `ELLIXORRR_PHASE_6_INFRASTRUCTURE_READINESS_REPORT.md` and `reports/phase-6/`.

No commit, push, deploy, production migration, DNS/SSL/SMTP change, account creation, or customer message was performed. `.env.local` was never inspected or printed. Do not treat a local production build as staging, and do not mark production items verified from local evidence.

## Phase 7 staging provisioning

Phase 7 created a genuinely isolated staging service and Supabase project from the verified Phase 6 release snapshot. The live staging URL is `https://ellixorrr-staging.onrender.com`; the Supabase staging project is `ellixorrr-staging`. Final staging classification is `STAGING VERIFIED`. Production remains separately `NOT READY` and was not changed.

- Staging deployment evidence: `reports/phase-7/STAGING_PROVISIONING_AND_DEPLOYMENT.md`.
- Database security and synthetic data: `reports/phase-7/DATABASE_SECURITY_AND_DATA_VERIFICATION.md`.
- Core flow acceptance: `reports/phase-7/CORE_FLOW_ACCEPTANCE.md`.
- Operational limits and production isolation: `reports/phase-7/OPERATIONAL_READINESS_AND_PRODUCTION_ISOLATION.md`.
- Staged metadata and accessibility evidence: `reports/phase-7/ACCESSIBILITY_AND_METADATA_AUDIT.md`.
- Consolidated 19-section report: `ELLIXORRR_PHASE_7_STAGING_PROVISIONING_REPORT.md`.

Email delivery proof, database backup/restore, alerting/SLOs, and rollback rehearsal remain open. Staging metadata still contains production-domain references because it is staged from the Phase 6 snapshot. No secret value, production write, purchase, commit, push, tag, reset, clean, stash, or deployment trigger was used.
