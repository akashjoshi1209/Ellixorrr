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

## 3. Apply the database migration

Open the Supabase Dashboard → **SQL Editor** and paste the contents of:

```
supabase/migrations/001_initial_schema.sql
```

Click **Run** to create all tables, indexes, triggers, and Row Level Security
policies.

Alternatively, use the Supabase CLI:

```bash
supabase db push
```

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
