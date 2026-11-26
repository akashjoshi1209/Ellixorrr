# Supabase Setup — Ellixorrr

## Overview

This directory contains the SQL migrations and setup instructions for integrating
Supabase Authentication + PostgreSQL into the Ellixorrr website.

No credentials are committed to this repository. All secrets live in
`.env.local` (gitignored).

## 1. Create a Supabase project

1. Go to https://supabase.com and create a new project.
2. Note your project URL and the **anon (publishable) key** from
   **Project Settings → API**.
3. Note the **service role key** from the same page (server-only).

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your real values:

```bash
cp .env.example .env.local
```

`.env.local` contents:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are safe
  to expose to the browser.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** and must never be exposed to
  the browser or committed to Git.

## 3. Apply the database migrations

Apply migration files in filename order:

1. `supabase/migrations/001_initial_schema.sql` — creates tables, indexes,
   triggers, and the initial Row Level Security policies.
2. `supabase/migrations/002_security_hardening.sql` — historical hardening pass
   that pinned `search_path` on trigger functions.
3. `supabase/migrations/003_security_hardening.sql` — current, self-contained
   hardening pass. It supersedes `002`, is idempotent, and is safe whether or
   not `002` ran. It closes profile-INSERT escalation, restricts public enquiry
   inserts, replaces recursive profile policies with `public.is_admin()`, and
   pins `search_path` on all trigger functions.

Open the Supabase Dashboard → **SQL Editor** and paste each file in order, then
click **Run**. Apply `003` in full as one transaction; do not apply fragments
manually. The migration must be run by the owner of the `public` schema tables
(in a stock Supabase project, `postgres`).

Alternatively, use the Supabase CLI:

```bash
supabase db push
```

Migration execution against a live project is an external step; this repository
does not claim that any migration has been applied.

## 4. Verify the schema

After running the migration, confirm the following exist in your Supabase project:

### Tables
- `public.profiles` — id, full_name, email, phone, avatar_url, role, timestamps
- `public.projects` — id, customer_id, project_name, service_type, description, status, dates, timestamps
- `public.project_updates` — id, project_id, author_id, title, description, created_at
- `public.enquiries` — id, customer_id (nullable), name, email, phone, business_name, service_type, project_description, status, created_at

### Row Level Security (enabled on all tables)

| Table | Policies |
|-------|----------|
| `profiles` | Customers read/update own row; admins read/update all; authenticated insert own |
| `projects` | Customers read own; admins full CRUD |
| `project_updates` | Customers read updates on own projects; admins full CRUD |
| `enquiries` | Public insert; customers read own; admins full CRUD |

### Security controls

- `protect_profile_role()` trigger prevents non-admin users from changing the
  `role` column on `profiles`. Only an existing admin can assign admin roles.
- `handle_new_user()` trigger auto-creates a `profiles` row (role `customer`)
  when a new user signs up via Supabase Auth.
- All reads/writes are enforced at the database level by RLS, not merely by UI
  hiding.

> **2026-11-25 Phase 4 note:** These controls describe the intended post-003
> state. `003_security_hardening.sql` also closes profile INSERT
> self-promotion, constrains public enquiry INSERT, replaces recursive admin
> profile policies, and pins function `search_path`. Migration 003 was not
> applied by this handoff; an authorized operator must verify the live state.
> See `reports/phase-4/SUPABASE_READINESS.md`.

## 5. What is NOT configured yet

The following require a live Supabase project and real credentials before they
can be tested:

- Customer registration/login flows
- Customer portal (`/[locale]/dashboard/*`)
- Admin dashboard (`/[locale]/admin/*`)
- Server-side enquiry form submission
- Email delivery (Gmail/SMTP)

Do not claim a live Supabase connection until `.env.local` is configured and
the migration has been applied to a real project.

## 6. Local verification status

The following items were verified locally without a live Supabase project:

- TypeScript compilation of `src/lib/supabase/*` and `src/lib/validations.ts`
- ESLint on all new files
- SQL migration syntax reviewed (not executed against a live database)
- RLS policy design reviewed for self-promotion prevention

The following require a live Supabase project and cannot be verified locally:

- RLS policy enforcement with real queries
- Authentication flows (registration, login, password reset)
- Database triggers (`handle_new_user`, `protect_profile_role`)
- Email delivery
