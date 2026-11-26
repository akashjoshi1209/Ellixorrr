# Stage 2D Report — Autonomous Application Security & Reliability Remediation

**Project:** Ellixorrr (`C:\Users\joshi\ellixorrr`)
**Branch:** `master`
**Commit:** `ea2e9f0` (HEAD unchanged — nothing committed)
**Status:** Complete, all work uncommitted
**Scope:** Application-layer only — `src/` fixes, no DB changes, no env/secrets access, no deploy, no commit

---

## Executive summary

Stage 2D performed the autonomous application-layer security and reliability remediation for the Ellixorrr Next.js site, restricted to `src/` with no database, environment-variable, secret, deployment, or commit activity.

All required fixes were implemented and verified:

| Verification | Actual result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npx eslint src/` | 0 errors, 0 warnings (baseline: 8 errors / 30 warnings) |
| `npx vitest run` | 2 files, 28 tests passed |
| `npx next build` | exit 0, 42 pages generated, `ƒ Proxy (Middleware)` present |
| `python scripts/verify_stage_2d.py` | 59/59 checks passed |
| `python scripts/audit_a11y.py` | 0 axe violations across 6 viewport/locale combos (desktop-en/hi/mr, mobile-en/hi/mr) |
| `python scripts/verify_contact.py` | 70/70 checks passed |

No database changes were made, no deployments were performed, no commits were created, and `.env.local` / secrets were never read or printed. All work remains uncommitted.

---

## Confirmed issues discovered and fixed

The following issues were confirmed against the HEAD baseline (commit `ea2e9f0`) and fixed.

### A. `business_name` removed from the profile form (kept on enquiries)

**Before (HEAD):** `src/actions/auth.ts` `updateProfileAction` read `business_name` from `FormData`, validated it via `profileSchema`, and sent `business_name` in the `profiles.update` payload. The `profiles` table has no `business_name` column — it only exists on `enquiries`. The profile form also rendered a `business_name` field that could never be written to the database, and `updateProfileAction` leaked raw `error.message` into the URL via `encodeURIComponent(error.message)`.

**After:**
- `profileSchema` no longer includes `business_name`; `EnquiryInput` keeps `business_name` unchanged.
- `updateProfileAction` validates only `full_name`, `email`, `phone`; updates only those three columns; never touches `role`.
- The profile form renders no `business_name` field.
- `src/components/ui/FeedbackBanner.tsx` was created and wired into the contact form; all error messages resolve through the allowlist, so raw DB/internal errors are never exposed.

### B. Allowlisted error/success codes — no raw error rendering, no `URIError`, no raw DB/auth/internal errors

**Before (HEAD):** Server actions put raw Supabase error messages into URLs (`?error=${encodeURIComponent(error.message)}`), exposing internal details and risking `URIError` from malformed encoding. Unknown query `error` values were rendered verbatim into HTML.

**After:**
- New `src/lib/feedback.ts` declares `ERROR_CODES` (20 codes) and `SUCCESS_CODES` (9 codes), each mapped to a localized dictionary entry (`dict.feedback.errors` / `dict.feedback.success`).
- `isErrorCode()` / `isSuccessCode()` guard against `__proto__`, `constructor`, `toString`, empty strings, and non-string input.
- `getErrorMessage()` / `getSuccessMessage()` return `null` for anything not on the allowlist — unknown input is never rendered.
- `mapAuthError()` maps known Supabase auth failures onto allowlisted codes; everything unknown collapses to `generic_error`. The raw message is never returned.
- `feedbackQuery()` builds query strings from codes only via `URLSearchParams` (no manual string interpolation — no `URIError`).
- `FeedbackBanner` renders `role="alert"` for errors and `role="status"` for success; nothing renders for unknown codes.
- Every server action (`loginAction`, `registerAction`, `forgotPasswordAction`, `resetPasswordAction`, `submitEnquiryAction`, `updateProfileAction`, and all admin actions) now redirects with allowlisted codes only.

### C. Contact form redirects return to the localized homepage contact section

**Before (HEAD):** The contact form redirected to `/contact` (a route that does not exist; handled by `[...rest]` → `notFound()`). Empty submit used browser validation bubbles despite `noValidate`; the success message was hardcoded English.

**After:**
- `submitEnquiryAction` redirects via `feedbackPath(locale, "/", { ... }, "contact")` → `/{locale}?error=...#contact` or `/{locale}?message=...#contact`, preserving the `#contact` anchor on the localized homepage. No `/contact` route exists and none was created.
- `src/components/sections/ContactCTA.tsx` gained a `locale` prop (a hidden `locale` field on the form) and now renders `<FeedbackBanner dict={dict} error={error} success={message} />` instead of raw query-string rendering.
- Localized success/failure messages come from all three dictionaries (en/hi/mr).

### D. Auth pages display supported query messages/error codes via allowlist only

**Before (HEAD):** Login/register/forgot-password/reset-password pages rendered raw `error`/`message` query values verbatim (e.g. `?error=Invalid email or password.` written straight into HTML).

**After:** All four auth pages now read `error`/`message` from `searchParams`, pass them to `<FeedbackBanner dict={dict} error={error} success={message} />`, and unknown codes render nothing. `loginAction` consumes a validated `redirectTo` else routes by role (admin → `/{locale}/admin`, customer → `/{locale}/dashboard`), fixing the admin login loop.

### E. `src/proxy.ts` — locale-prefixed routes always refresh Supabase session; `getAll`/`setAll` cookie adapter; locale cookie kept

**Before (HEAD):** The proxy only refreshed the Supabase session when it thought it needed to; locale-prefixed routes could see stale sessions; locale cookie was written on every locale-prefixed request including router prefetches.

**After:**
- Session refresh runs for all locale-prefixed routes via `createProxySupabaseClient` (new `src/lib/supabase/proxy.ts`) using `getAll`/`setAll` (setAll swallows cookie-write failures — proxy owns refresh).
- `src/lib/supabase/server.ts` migrated to `getAll`/`setAll` (best-effort; Server Components cannot mutate cookies anyway).
- Locale cookie is always set on real page loads; `src/proxy.ts` kept (no `middleware.ts`).
- GET/HEAD-only gating, optimistic auth redirects, refreshed cookies copied onto redirects, skips Supabase round trip when no `auth-token` cookie present.

### F. Read-only server utilities moved out of `"use server"` modules

**Before (HEAD):** `src/actions/admin.ts` exported read-only listings (`adminListCustomers`, `adminGetCustomer`, `adminListProjects`, `adminListEnquiries`) from a `"use server"` module, making them publicly reachable Server Actions. `updateProfileAction` and `getCurrentProfile` were also in `src/actions/auth.ts`. `(supabase as any)` casts were used throughout.

**After:**
- Read-only listings moved to `src/lib/admin-data.ts` (plain server functions, not Server Actions).
- `getCurrentProfile`, `requireAdmin`, `requireCustomer` moved to `src/lib/profiles.ts` (plain server functions, not Server Actions).
- `src/lib/supabase/types.ts` gained hand-written `Relationships` blocks for FKs `profiles_id_fkey`, `projects_customer_id_fkey`, `project_updates_author_id_fkey`, `project_updates_project_id_fkey`, `enquiries_customer_id_fkey`, removing `(supabase as any)` casts (the 8 pre-existing `no-explicit-any` errors are gone).
- Every caller passes through `requireAdmin()` / `requireCustomer()` for authorization; raw DB errors are reported as boolean flags, never surfaced to the page.

### Additional fixes found during Stage 2D

1. **Locale-cookie clobbering by router prefetches (verified bug):** The language switcher `<Link>`s to `/en`, `/hi`, `/mr` are prefetched by Next.js. Those RSC fetches pass through the proxy and each wrote `Set-Cookie: ellixorrr-locale=<that locale>`, so a visitor on `/hi` was remembered as `mr` (verified empirically: raw HTTP showed correct per-URL cookies, but browser stored `mr` after `/hi`). Root cause: pre-existing proxy set the cookie on every locale-prefixed request.
   - **Fix:** proxy now sets the locale cookie only for real page loads, detected via `sec-fetch-mode` (`navigate` = document, `cors` = RSC prefetch). Next.js strips its own `RSC`/`Next-Router-Prefetch` headers before the proxy runs, so `sec-fetch-mode` is the reliable signal (verified empirically).
   - `src/components/nav/LanguageSwitcher.tsx` additionally writes the cookie client-side on click, because a client-side navigation can be served entirely from the router cache with no request reaching the proxy.

2. **`admin/enquiries` column-count bug:** HEAD had 5 `<th>` cells but `<td colSpan={5}>` for the empty state — should be 6 columns (name, email, service, status, received, action). Fixed to `colSpan={6}`.

3. **`dashboard/projects/[id]` local type mismatch:** The local `ProjectRow.project_updates` type required `id`, but the Supabase select omitted `id`. Added `id` to the `project_updates(...)` select so the type overlaps correctly.

4. **All admin + customer dashboard pages fetched via a non-existent `dict` prop:** HEAD declared `dict: Dictionary` as a page prop but never passed it, causing runtime crashes on `admin/page.tsx`, `dashboard/projects/page.tsx`, `dashboard/projects/[id]/page.tsx`. All now fetch their own dictionary via `getDictionary(locale)` and call `requireAdmin()` / `requireCustomer()` via `src/lib/profiles.ts`. `admin/customers`, `admin/projects`, `admin/enquiries` now use `getDictionary` instead of the unused `dict` prop.

5. **JSON-LD `<`/`>`/`&` escaping:** `src/app/[locale]/layout.tsx` now escapes the structured-data payload so a `<` in any value cannot close the `<script type="application/ld+json">` element early.

6. **SiteHeader authenticated-state fix:** `SiteHeader.tsx` now reads session from the browser Supabase client (`createBrowserClient`, publishable key only — service-role key never exposed), removed the unused `LogIn` icon import and `useRouter`, and `handleLogout` calls `logoutAction(locale)` which itself redirects to the localized homepage.

7. **Stale `verify_contact.py` assertion:** The "Form shows validation errors on empty submit" assertion was already failing at HEAD (the form carries `noValidate` since before Stage 2D). Updated it to assert actual server-side validation behaviour (`error=validation_failed` in URL, stays on homepage contact section, one localized alert banner) using the `COUNT_ALERTS_JS` JS-evaluation pattern (proven in `verify_stage_2d.py`) to exclude Next.js's `#__next-route-announcer__` `role="alert"`.

---

## Complete changed-file inventory

### New files (untracked)

| File | Purpose |
|---|---|
| `src/lib/feedback.ts` | Allowlisted error/success codes, `mapAuthError`, `feedbackPath`, `getErrorMessage`/`getSuccessMessage` |
| `src/lib/navigation.ts` | `localizedPath`, `safeRedirectPath`, `resolveLocale`, `stripLocalePrefix`, `isAuthPath`/`isCustomerPath`/`isAdminPath` |
| `src/lib/profiles.ts` | `getCurrentProfile`, `getAdminProfile`, `requireAdmin`, `requireCustomer` (DAL, not Server Actions) |
| `src/lib/admin-data.ts` | Read-only admin listings (not Server Actions) |
| `src/lib/supabase/proxy.ts` | `createProxySupabaseClient` with `getAll`/`setAll` cookie adapter |
| `src/components/ui/FeedbackBanner.tsx` | `role="alert"` errors / `role="status"` success, allowlist-only rendering |
| `tests/security.test.ts` | 26 new regression tests (feedback allowlist, `mapAuthError`, `safeRedirectPath`, navigation helpers, profile schema, admin enquiry schema, locale feedback parity) |
| `vitest.config.mts` | `@/*` alias + `tests/**/*.test.ts` include (`.mts` to avoid adding `"type": "module"` to `package.json`) |
| `scripts/verify_stage_2d.py` | 59-check Playwright verification suite |
| `supabase/migrations/003_security_hardening.sql` | Forward migration (untracked, not applied, not committed) |
| `supabase/tests/003_security_hardening.test.sql` | Stage 2C test suite (untracked, not run against DB) |

### Rewritten / edited files (tracked, uncommitted)

**Auth actions & pages:**
- `src/actions/auth.ts` — rewritten; allowlist-only feedback, role-based redirect, validated `redirectTo`, `business_name` removed
- `src/actions/admin.ts` — rewritten; `requireAdmin` + allowlisted codes + `adminEnquiryStatusSchema`; no raw error messages
- `src/app/[locale]/auth/login/page.tsx`, `auth/register/page.tsx`, `auth/forgot-password/page.tsx`, `auth/reset-password/page.tsx` — allowlisted feedback via `FeedbackBanner`

**Admin & dashboard pages:**
- `src/app/[locale]/admin/page.tsx`, `admin/customers/page.tsx`, `admin/projects/page.tsx`, `admin/enquiries/page.tsx` — `getDictionary`, `requireAdmin`, `admin-data.ts`, server-side feedback
- `src/app/[locale]/dashboard/page.tsx`, `dashboard/profile/page.tsx`, `dashboard/projects/page.tsx`, `dashboard/projects/[id]/page.tsx` — `getDictionary`, `requireCustomer`, fixed `project_updates` select

**Infrastructure:**
- `src/proxy.ts` — rewritten (session refresh always runs for locale-prefixed routes, `sec-fetch-mode` cookie guard, optimistic auth redirects)
- `src/lib/supabase/server.ts` — migrated to `getAll`/`setAll`
- `src/lib/supabase/types.ts` — added `Relationships` blocks, removed `(supabase as any)` casts
- `src/lib/validations.ts` — `profileSchema` without `business_name`; new `adminCreateProjectSchema`, `adminUpdateProjectSchema`, `adminDeleteProjectSchema`, `adminEnquiryStatusSchema`
- `src/components/nav/SiteHeader.tsx` — browser-client session, locale-aware logout, removed `LogIn`/`useRouter`
- `src/components/nav/LanguageSwitcher.tsx` — client-side locale cookie persistence on click
- `src/components/sections/ContactCTA.tsx` — `locale` prop, `FeedbackBanner`, hidden `locale` field
- `src/app/[locale]/layout.tsx` — JSON-LD escaping
- `src/app/[locale]/page.tsx` — passes `locale` to `ContactCTA`

**Localization:**
- `src/i18n/locales/en.ts`, `hi.ts`, `mr.ts` — added `feedback` dictionary block (all 20 error + 9 success codes)

**Scripts:**
- `scripts/verify_contact.py` — corrected banner-count selector via `COUNT_ALERTS_JS` / `count_app_alerts`

### Stage 2C artifacts (untouched, untracked, not applied)

- `supabase/migrations/001_initial_schema.sql` — not modified
- `supabase/migrations/002_security_hardening.sql` — not modified
- `supabase/migrations/003_security_hardening.sql` — written but **not applied** (must be pasted into Supabase dashboard SQL Editor by user)
- `supabase/tests/003_security_hardening.test.sql` — written but **not run against a live DB**

### Removed

- Seven temporary debug scripts: `scripts/_debug_stage_2d.py` … `_debug_stage_2d7.py` (all deleted)

---

## Security improvements

1. **No raw error leakage:** Raw Supabase/auth/database/internal error messages never reach URLs or HTML. All feedback flows through the allowlist; unknown codes resolve to `null`.
2. **No reflected XSS via query strings:** Auth/contact pages no longer echo untrusted `error`/`message` values. Verified empirically: raw and percent-encoded `?error=<script>…</script>` payloads produced a constant `</script>` count, no literal breakout, no `role="alert"` rendered.
3. **Open-redirect protection:** `safeRedirectPath` rejects external URLs, protocol-relative `//`, `javascript:`/`data:`, traversal segments (`..`/`.`), query strings, fragments, spaces, backslashes, control characters, `%`, oversized values (>512 chars), non-string types, and authentication paths. Validated `redirectTo` is consumed by `loginAction`; external targets are not placed in the form.
4. **Authentication boundaries:** Proxy redirects anonymous visitors away from `/dashboard`/`/admin` routes to the localized login with a valid `redirectTo`. `requireAdmin()` sends non-admins to `/dashboard`; `requireCustomer()` sends admins to `/admin` (fixes the admin login loop).
5. **Server Action surface reduced:** Read-only utilities moved out of `"use server"` modules (`admin-data.ts`, `profiles.ts`). Only mutations are exported Server Actions, each with its own `requireAdmin()` check.
6. **No client-exposed service role:** `createServerClient` (proxy + server components) uses only the publishable/anon key; the service-role key is never passed to any client-side or server-action code.
7. **Role cannot be self-promoted:** `updateProfileAction` omits `role` entirely; the `profiles` table trigger `protect_profile_role()` (migration 001, SECURITY DEFINER) blocks role changes by non-admins on UPDATE; migration 003 adds an INSERT branch so a customer cannot `INSERT role = 'admin'`.
8. **Removed `no-explicit-any` casts:** Hand-written `Relationships` blocks in `src/lib/supabase/types.ts` eliminated the 8 pre-existing `no-explicit-any` ESLint errors.

---

## Locale-cookie prefetch bug and its resolution

**Symptom:** A visitor browsing `/hi` was cookie-remembered as `mr` after the page loaded.

**Root cause (pre-existing):** Next.js prefetches every `<Link>` in the viewport. The language switcher links to all three locale routes, so those RSC prefetch requests pass through the proxy. The original proxy wrote `Set-Cookie: ellixorrr-locale=<that locale>` on every locale-prefixed request, including prefetches. The last prefetch won, overwriting the locale the visitor was actually reading.

**Verification:** Empirically confirmed via raw HTTP (`urllib` — server sent correct per-URL cookies) vs browser (`document.cookie` showed `mr` after `/hi`). A response-header probe showed three document/fetch responses carrying `Set-Cookie` for `/hi`, `/en`, `/mr` respectively, with the fetch responses carrying `Next-Router-Prefetch: 1` and `RSC` headers — which Next.js strips before the proxy runs.

**Resolution:**
1. Proxy sets the locale cookie only when `sec-fetch-mode === "navigate"` (a real top-level browser navigation). RSC prefetches (`sec-fetch-mode: cors`) are excluded. `next-router-prefetch` is also honoured as belt-and-braces.
2. `LanguageSwitcher` writes `ellixorrr-locale` client-side via `document.cookie` on click, because a client-side navigation can be served entirely from the router cache with no request reaching the proxy.

**Test added:** `verify_stage_2d.py` asserts prefetch requests do not set the locale cookie while real navigations do.

---

## Test results with actual counts

| Suite | Files | Tests | Result |
|---|---|---|---|
| `tests/locales.test.ts` | 1 | 2 | passed |
| `tests/security.test.ts` | 1 | 26 | passed |
| **Total Vitest** | **2** | **28** | **all passed** |
| `scripts/verify_stage_2d.py` (Playwright) | — | 59 checks | 59/59 passed |
| `scripts/audit_a11y.py` (axe-core) | — | 6 viewport/locale combos | 0 violations |
| `scripts/verify_contact.py` (Playwright) | — | 70 checks | 70/70 passed |

ESLint: 0 errors, 0 warnings (baseline 8 errors / 30 warnings — the 8 `no-explicit-any` errors are gone).
TypeScript: `tsc --noEmit` exit 0.
Next.js build: exit 0, 42 pages generated, `ƒ Proxy (Middleware)` present.

---

## Remaining security risks and limitations

> **2026-11-25 Phase 4 correction:** The reset target cited in item 2 and in the
> user-actions table below is stale. The current `forgotPasswordAction` calls
> `resetPasswordForEmail` with
> `redirectTo: ${getAppOrigin()}/${locale}/auth/reset-password`.
> `getAppOrigin()` prefers `NEXT_PUBLIC_APP_URL` and falls back to the request
> origin; it never falls back to Supabase. The live Supabase Redirect URL
> allowlist still requires external verification. See
> `reports/phase-4/AUTH_EMAIL_READINESS.md`.

1. **Migration 003 never executed against PostgreSQL.** No local `psql`/Postgres and Docker daemon not running. Validated only by dollar-quote/string/parenthesis balance checks. Live DB-dependent items unverified:
   - Whether `profiles` admin SELECT/UPDATE policies trigger "infinite recursion detected in policy for relation profiles" (would block admins until 003 is applied).
   - `enquiries.created_at` default is `now()`; `relforcerowsecurity = false`; extra INSERT policies; `anon`/`authenticated` table grants; `auth.users` column list for test A15.
   - Whether `002_security_hardening.sql` may already be applied (must not apply 002 after 003).

2. **Password-reset email target still points at `NEXT_PUBLIC_SUPABASE_URL/auth/reset-password`.** Correcting it requires a Site URL / Redirect URL change in the Supabase dashboard, which is outside Stage 2D scope. Documented as requiring user involvement.

3. **First-admin bootstrap remains a manual SQL update** (`profiles.role = 'admin'` via Supabase SQL Editor); no app flow exists to create the first admin.

4. **Supabase MCP `apply_migration` times out** in this environment; migration 003 must be pasted into the Supabase dashboard SQL Editor manually.

5. **Static analysis only** for DB-layer items; live policies, triggers, `search_path`, and recursion remain unverified.

6. `playwright` npm package is absent from `package.json`; Python Playwright scripts are used instead with Chromium at `%LOCALAPPDATA%\ms-playwright\chromium-1248\chrome-win64\chrome.exe` (available and working).

---

## User actions still required

| Item | Why | Where |
|---|---|---|
| **Apply migration 003** | Hardens `profiles` INSERT (blocks customer self-promotion to admin), constrains `enquiries` INSERT, pins `search_path`, replaces self-referencing admin policies. | Paste `supabase/migrations/003_security_hardening.sql` into Supabase dashboard SQL Editor. **Do not apply 002 after 003.** |
| **Supabase password-reset redirect configuration** | `forgotPasswordAction` redirects to `NEXT_PUBLIC_SUPABASE_URL/auth/reset-password`; needs Site URL / Redirect URLs configured in Supabase dashboard so the reset email links back to the app. | Supabase dashboard → Authentication → URL Configuration. |
| **First-admin provisioning** | No app flow exists to create the first admin; bootstrap is a manual `profiles.role = 'admin'` SQL update. | Supabase dashboard SQL Editor: `UPDATE public.profiles SET role = 'admin' WHERE id = '<desired user id>';` |
| **Review and commit** | All Stage 2D work is uncommitted on `master` at `ea2e9f0`. | `git add` + `git commit` when ready. |

---

## Confirmation

- **No database changes** were made. No SQL was executed against any live environment. Migration 003 was written but never applied.
- **No deployments** were performed. `npx next build` was run locally for verification only; `next start` served localhost:3000 temporarily for Playwright checks and was stopped.
- **No commits or pushes** were created. Git HEAD remains `ea2e9f0` on branch `master`. All Stage 2D edits are uncommitted.
- **No secret modifications.** `.env.local` was never read, printed, modified, or accessed. The service-role key is never exposed to browser code.
- **No migration edits.** `001_initial_schema.sql` and `002_security_hardening.sql` were not modified. `003_security_hardening.sql` and its test suite were created but are untracked and unapplied.
- **No redesign.** Branding, palette (Charcoal `#171717`, Forest Green `#06110C`, Crimson `#A31C1B`, Warm Off-white `#F1F0EB`), typography, logo, navigation, exactly four services, copy, and en/hi/mr localization are preserved. All visible text flows through existing dictionaries.

---
