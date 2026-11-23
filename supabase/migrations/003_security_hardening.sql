-- ============================================================================
-- Ellixorrr — Security Hardening Migration (forward)
-- Migration: 003_security_hardening.sql
--
-- Supersedes 002_security_hardening.sql, which only pinned search_path and
-- addressed neither the profile INSERT escalation nor the unconstrained
-- public enquiry policy. This migration is self-contained and idempotent: it
-- is safe to apply whether or not 002 was ever applied.
--
-- Addresses:
--   C1   SECURITY DEFINER functions without a pinned search_path.
--   N1   Privilege escalation: an authenticated user could INSERT a profile
--        with role = 'admin' (the role trigger only fired on UPDATE).
--   N8   The public enquiry INSERT policy was `WITH CHECK (true)`, which let
--        anonymous callers set any customer_id and any status.
--   R1   The two admin policies on public.profiles referenced public.profiles
--        from inside a policy on public.profiles, which is the self-reference
--        pattern PostgreSQL reports as "infinite recursion detected in policy
--        for relation". They are replaced by an equivalent SECURITY DEFINER
--        helper (public.is_admin()).
--
-- Safety notes:
--   * No table is altered, dropped or truncated. No column, constraint or
--     index is changed.
--   * Existing SELECT/UPDATE policies are preserved except for the two
--     admin policies on public.profiles, which are replaced by an
--     equivalent predicate (see section 4).
--   * Every statement is idempotent, so this file can be re-applied.
--   * The whole script runs in one transaction; PostgreSQL DDL is
--     transactional, so a failure rolls the whole thing back.
--
-- IMPORTANT - the migration must be applied by the OWNER of the public
-- schema tables (in a stock Supabase project, the `postgres` role), because
-- public.is_admin() relies on being owned by the table owner in order to
-- bypass RLS when it reads public.profiles. Verify with query 4.4.
--
-- Apply with the Supabase SQL Editor (paste the whole file) or with
-- `supabase db push`. Do not apply any part of it manually.
-- ============================================================================

begin;

-- ============================================================================
-- 1. Shared helpers.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 public.has_trusted_provisioning_context()
--
-- True when the caller carries no end-user identity, i.e. it is a trusted
-- provisioning context rather than a browser session:
--
--   * auth.role() = 'service_role'  -> the service-role key. It is
--     server-only, never exposed to the browser, and it already bypasses
--     RLS, so it is treated as fully privileged.
--   * no JWT at all -> a direct database session: the Supabase dashboard SQL
--     Editor, `supabase db push`, or a psql session. Such a session already
--     holds full table-owner privileges.
--
-- The JWT role is read inline from the request settings rather than through
-- auth.role(), so this migration depends on no auth-schema function beyond
-- auth.uid() (which migration 001 already uses).
--
-- This function is deliberately INVOKER (not SECURITY DEFINER): it only
-- reads session settings, and it must report the CALLER's context, not the
-- owner's.
-- ---------------------------------------------------------------------------
create or replace function public.has_trusted_provisioning_context()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select
    coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
    ) = 'service_role'
    or (
      auth.uid() is null
      and coalesce(
        nullif(current_setting('request.jwt.claim.role', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
      ) is null
    );
$$;

-- ---------------------------------------------------------------------------
-- 1.2 public.is_admin()
--
-- Replaces the self-referencing subquery that the two admin policies on
-- public.profiles used:
--
--   exists (select 1 from public.profiles
--            where id = auth.uid() and role = 'admin')
--
-- WHY THE OLD FORM IS A PROBLEM
--   The subquery targets public.profiles, the very relation the policy is
--   attached to. PostgreSQL applies the same policies to the inner scan, so
--   the policy would be re-entered from within itself. PostgreSQL reports
--   this as:
--     ERROR: infinite recursion detected in policy for relation "profiles"
--   and refuses the statement.
--
-- WHY THE NEW FORM IS EQUIVALENT, NOT WEAKER
--   Inside a SECURITY DEFINER function the current user is the function
--   owner. The owner of public.profiles is exempt from RLS, so the inner
--   scan is not filtered by the profiles policies and cannot re-enter them.
--   The predicate itself is unchanged and still filters on id = auth.uid(),
--   so the answer is identical to the original in every case:
--
--     old: exists (select 1 from profiles where id = auth.uid() and role='admin')
--          evaluated with RLS -> the RLS filter could only ever match the
--          caller's own row, so the result was "the caller's own role is
--          admin".
--     new: the same predicate evaluated without RLS -> still "the caller's
--          own role is admin".
--
--   The function only ever answers a question about the CALLER, so granting
--   EXECUTE to authenticated cannot leak anybody else's data. EXECUTE is
--   revoked from PUBLIC first so that only authenticated users can call it.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ============================================================================
-- 2. C1 — Pin safe search_path on the trigger functions.
--
-- SECURITY DEFINER functions execute with the privileges of their owner.
-- If the caller's session can influence name resolution, a malicious object
-- placed earlier in the search_path could be substituted for a legitimate
-- one. Pinning `search_path` to `public, pg_temp` removes that freedom.
--
-- `pg_catalog` is always implicitly searched first by PostgreSQL, so
-- built-in functions such as now() continue to resolve unchanged.
-- `pg_temp` is placed last so that temporary objects can never shadow a
-- permanent one.
--
-- All references inside these functions are already schema-qualified
-- (public.profiles, auth.uid()), so behaviour is unchanged.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 set_updated_at() — not SECURITY DEFINER, but pinned for consistency
--     so that no trigger function in this schema resolves names loosely.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2.2 handle_new_user() — SECURITY DEFINER.
--
-- Behaviour is deliberately unchanged: it still creates exactly one profile
-- row with role = 'customer' for every new auth.users row.
--
-- Note that the trigger on auth.users is NOT dropped and recreated here.
-- CREATE OR REPLACE keeps the function OID, so the existing
-- `on_auth_user_created` trigger keeps working untouched. Dropping and
-- recreating it would additionally require ownership privileges over
-- auth.users that the migration role may not hold.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    role
  ) values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'customer'
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2.3 protect_profile_role() — SECURITY DEFINER.
--
-- This function enforces the role rules on INSERT as well as UPDATE, and
-- it distinguishes three kinds of caller:
--
--   (a) TRUSTED PROVISIONING CONTEXTS - see
--       public.has_trusted_provisioning_context(). These may set any role.
--
--   (b) AN EXISTING ADMINISTRATOR - identified by reading their own
--       profiles row. Because this function is SECURITY DEFINER and is
--       owned by the table owner, that read bypasses RLS and therefore
--       cannot recurse into the profiles policies.
--
--   (c) EVERYONE ELSE - an authenticated end user who is not an
--       administrator. They may only create a customer profile and may
--       never change a role.
--
-- IMPORTANT - this also fixes a defect in the original implementation. The
-- original raised an exception whenever the caller's role could not be
-- resolved from profiles. In the dashboard SQL Editor and via the
-- service-role key, auth.uid() IS NULL, so the caller's role was NULL, the
-- `caller_role = 'admin'` test was NULL (not true) and the statement
-- FAILED. The application has no role-assignment code at all, so manual
-- promotion from the SQL Editor was the only legitimate admin-provisioning
-- path the project had - and the original trigger blocked it. The trusted
-- branch above restores that path.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_role text;
  caller_uid  uuid;
begin
  caller_uid := auth.uid();

  -- (a) Trusted provisioning contexts.
  if public.has_trusted_provisioning_context() then
    return new;
  end if;

  -- -------------------------------------------------------------------------
  -- INSERT: a caller may only create a profile with the customer role.
  --
  -- Previously the role trigger fired on UPDATE only, so an authenticated
  -- user who had no profiles row could insert one with role = 'admin' and
  -- immediately inherit every admin RLS policy. The RLS INSERT policy
  -- tightened below closes the same hole independently; this trigger is
  -- the second line of defence.
  --
  -- Only the role is constrained here. The id is deliberately NOT compared
  -- against auth.uid(), because this trigger also fires for the SECURITY
  -- DEFINER insert performed by handle_new_user(), where the identity
  -- present in the session is the newly created auth user (or no identity
  -- at all). Row ownership is enforced by the RLS policy instead.
  -- -------------------------------------------------------------------------
  if tg_op = 'INSERT' then
    if new.role <> 'customer' then
      -- (b) Only an existing administrator may create an admin profile.
      select role into caller_role
      from public.profiles
      where id = caller_uid;

      if caller_role is distinct from 'admin' then
        raise exception 'Only administrators can assign the admin role.';
      end if;
    end if;

    return new;
  end if;

  -- -------------------------------------------------------------------------
  -- UPDATE: only an existing administrator may change the role column.
  -- The role column is only ever compared, never trusted from the client.
  -- -------------------------------------------------------------------------
  if new.role is distinct from old.role then
    select role into caller_role
    from public.profiles
    where id = caller_uid;

    if caller_role is distinct from 'admin' then
      raise exception 'Only administrators can change user roles.';
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2.4 protect_enquiry_insert() — SECURITY DEFINER.
--
-- Defence in depth for N8. The policy in section 5 is the primary control,
-- but a policy is only as strong as the set of policies on the table: one
-- additional permissive INSERT policy would let it through. A trigger is
-- not defeatable that way, so the same three conditions are enforced here.
--
-- The conditions are IDENTICAL to the policy's, so the two always agree:
--   * status must be 'new';
--   * customer_id must be null, or the caller's own id when signed in;
--   * created_at must equal the current transaction timestamp.
--
-- On created_at: this constrains the VALUE that is stored, not its
-- provenance. A caller that explicitly supplies created_at = now() would
-- also pass. The column default is now(), so the condition rejects any
-- backdated or forward-dated timestamp, which is what it is for.
--
-- Column defaults are applied when the row is formed, so new.created_at
-- already holds the default value when this BEFORE INSERT trigger runs.
-- ---------------------------------------------------------------------------
create or replace function public.protect_enquiry_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_uid uuid;
begin
  caller_uid := auth.uid();

  -- (a) Trusted provisioning contexts may import enquiries directly.
  if public.has_trusted_provisioning_context() then
    return new;
  end if;

  if new.status <> 'new' then
    raise exception 'Enquiries must be submitted with the new status.';
  end if;

  if new.customer_id is not null
     and (caller_uid is null or new.customer_id <> caller_uid) then
    raise exception 'Enquiries may only be linked to the submitting user.';
  end if;

  if new.created_at <> now() then
    raise exception 'Enquiries must use the current submission time.';
  end if;

  return new;
end;
$$;

-- ============================================================================
-- 3. Trigger coverage.
--
-- The existing trigger `profiles_role_protection` (BEFORE UPDATE OF role) is
-- left exactly as it is - CREATE OR REPLACE kept the function OID, so the
-- existing trigger still fires against the new function body.
--
-- A separate trigger is used for INSERT rather than combining
-- `INSERT OR UPDATE OF role` in one trigger, because PostgreSQL rejects
-- combining the OF column list with a second event
-- ("UPDATE OF" cannot be used with other events).
-- ============================================================================

drop trigger if exists profiles_role_protection_insert on public.profiles;

create trigger profiles_role_protection_insert
  before insert on public.profiles
  for each row
  execute function public.protect_profile_role();

drop trigger if exists enquiries_protect_insert on public.enquiries;

create trigger enquiries_protect_insert
  before insert on public.enquiries
  for each row
  execute function public.protect_enquiry_insert();

-- ============================================================================
-- 4. R1 — Replace the two self-referencing admin policies on public.profiles.
--
-- Policy inventory for public.profiles in migration 001 was:
--   SELECT  "Customers can read their own profile"   using (auth.uid() = id)
--   SELECT  "Admins can read all profiles"            using (exists (... profiles ...))   <-- self-reference
--   INSERT  "Authenticated users can insert their own profile"
--   UPDATE  "Customers can update their own profile"  using/with check (auth.uid() = id)
--   UPDATE  "Admins can update all profiles"           using (exists (... profiles ...))   <-- self-reference
--
-- Only the two marked policies reference public.profiles from inside a
-- policy on public.profiles. The admin policies on projects,
-- project_updates and enquiries reference public.profiles from a DIFFERENT
-- relation, which is not a self-reference, so they are left untouched.
--
-- The replacement keeps the same predicate, evaluated through
-- public.is_admin() (section 1.2). See that section for the equivalence
-- argument.
-- ============================================================================
drop policy if exists "Admins can read all profiles" on public.profiles;

create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update all profiles" on public.profiles;

create policy "Admins can update all profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin());

-- ============================================================================
-- 5. N1 — Close the profile INSERT privilege-escalation path.
--
-- The original policy was:
--   create policy "Authenticated users can insert their own profile"
--     on public.profiles for insert to authenticated
--     with check (auth.uid() = id);
--
-- `auth.uid() = id` constrains only the row owner. It said nothing about
-- `role`, so an authenticated user could POST
--   { "id": "<own uid>", "role": "admin" }
-- to PostgREST and be granted the administrator role.
--
-- The new policy constrains the role as well. It applies to the
-- `authenticated` role only; the `anon` role has no INSERT policy on
-- profiles at all, so anonymous callers cannot insert a profile row.
--
-- Trusted provisioning (SQL Editor, service-role key) is unaffected: those
-- contexts bypass RLS and are handled by the trigger's trusted branch.
--
-- POLICY INVENTORY CHECK: public.profiles has exactly ONE insert policy
-- ("Authenticated users can insert their own profile") and this statement
-- replaces it. Migration 002 adds no policies. If query 4.6 shows any
-- other INSERT policy on public.profiles, it must be dropped - a second
-- permissive INSERT policy would defeat this restriction.
-- ============================================================================
drop policy if exists "Authenticated users can insert their own profile" on public.profiles;

create policy "Authenticated users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (
    auth.uid() = id
    and role = 'customer'
  );

-- ============================================================================
-- 6. N8 — Constrain the public enquiry INSERT policy.
--
-- The original policy was:
--   create policy "Public can insert enquiries"
--     on public.enquiries for insert to anon, authenticated
--     with check (true);
--
-- `WITH CHECK (true)` allowed an anonymous caller to set ANY column of the
-- row they were inserting, including:
--   * customer_id - attributing an enquiry to an arbitrary user id;
--   * status      - marking their own enquiry as 'converted' or 'closed'
--                    so it never appears as new work for the admin;
--   * created_at  - backdating or forward-dating the enquiry.
--
-- The application payload (src/actions/auth.ts, submitEnquiryAction) is:
--   {
--     customer_id: user?.id ?? null,   -- the session user, or null
--     name, email, phone, business_name, service_type, project_description,
--     status: "new",                  -- always 'new'
--     -- created_at and id are left to the column defaults
--   }
--
-- The new policy accepts exactly that payload and nothing more:
--   * status must be 'new';
--   * customer_id must be null, or the caller's own id when signed in;
--   * created_at must equal the current transaction timestamp.
--
-- On created_at: this constrains the VALUE that is stored, not its
-- provenance. A caller that explicitly supplies created_at = now() would
-- also pass, because the policy compares values. What it does prevent is a
-- backdated or forward-dated timestamp, which is the property that matters
-- for the admin triage queue. The column default is now(), so the ordinary
-- application insert satisfies it.
--
-- The 'authenticated' path still works: a signed-in customer submits with
-- customer_id = their own id, and auth.uid() is that same id.
--
-- POLICY INVENTORY CHECK: public.enquiries has exactly ONE insert policy
-- ("Public can insert enquiries") and this statement replaces it.
-- Migration 002 adds no policies. If query 4.6 shows any other INSERT
-- policy on public.enquiries, it must be dropped - a second permissive
-- INSERT policy would defeat this restriction. The trigger in section 2.4
-- is the backstop for that case.
--
-- Note on `id`: an explicit `id` cannot be constrained to the column
-- default, because gen_random_uuid() is volatile and would be evaluated a
-- second time in the policy expression, producing a different value. The
-- residual risk is negligible: an explicit id can only cause a primary-key
-- collision if the attacker guesses an existing uuid, and the anon role has
-- no SELECT policy on enquiries, so they cannot read any id back.
-- ============================================================================
drop policy if exists "Public can insert enquiries" on public.enquiries;

create policy "Public can insert enquiries"
  on public.enquiries for insert
  to anon, authenticated
  with check (
    status = 'new'
    and (
      customer_id is null
      or (auth.uid() is not null and customer_id = auth.uid())
    )
    and created_at = now()
  );

-- ============================================================================
-- 7. Post-migration verification (read-only).
--
-- Run these after committing the transaction. Every statement is
-- informational; none of them changes state.
-- ============================================================================

-- 7.1 search_path is pinned on every function this migration touches.
--     Expect proconfig = {search_path=public, pg_temp} for all six.
-- select proname, proconfig
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in (
--     'set_updated_at', 'handle_new_user', 'protect_profile_role',
--     'protect_enquiry_insert', 'has_trusted_provisioning_context',
--     'is_admin'
--   )
-- order by 1;

-- 7.2 Trigger coverage.
--     Expect on public.profiles: profiles_updated_at (UPDATE),
--     profiles_role_protection (UPDATE OF role),
--     profiles_role_protection_insert (INSERT).
--     Expect on public.enquiries: enquiries_protect_insert (INSERT).
-- select tgrelid::regclass as table_name, tgname, pg_get_triggerdef(oid)
-- from pg_trigger
-- where tgrelid in ('public.profiles'::regclass, 'public.enquiries'::regclass)
--   and not tgisinternal
-- order by 1, 2;

-- 7.3 The WITH CHECK clauses of the two INSERT policies.
-- select polrelid::regclass as table_name, policyname,
--        pg_get_expr(polwithcheck, polrelid) as with_check
-- from pg_policy
-- where polrelid in ('public.profiles'::regclass, 'public.enquiries'::regclass)
--   and polcmd = 'i'
-- order by 1, 2;

-- 7.4 FULL POLICY INVENTORY for public.profiles and public.enquiries.
--     THIS IS THE CHECK FOR REQUIREMENT "no additional permissive policy".
--     Expected after this migration:
--       profiles  : 5 policies - 2 select, 1 insert, 2 update.
--                   The 2 admin policies must use public.is_admin().
--       enquiries : 5 policies - 1 insert, 2 select, 1 update, 1 delete.
--                   The insert policy must carry the three conditions.
--     If any ADDITIONAL insert policy appears on either table, drop it -
--     a second permissive insert policy defeats the new restrictions.
-- select polrelid::regclass as table_name, polcmd, polroles::regrole[] as roles,
--        policyname, pg_get_expr(polqual, polrelid) as using_expr,
--        pg_get_expr(polwithcheck, polrelid) as with_check
-- from pg_policy
-- where polrelid in ('public.profiles'::regclass, 'public.enquiries'::regclass)
-- order by 1, 4;

-- 7.5 CONFIRM the tables are NOT FORCE ROW LEVEL SECURITY, and that the
--     migration role owns them. public.is_admin() and the SECURITY DEFINER
--     trigger reads of public.profiles only bypass RLS if the owner is
--     exempt. Expect relforcerowsecurity = false and owner = the role you
--     applied the migration as.
-- select relname, relforcerowsecurity, relrowsecurity,
--        pg_get_userbyid(relowner) as owner
-- from pg_class
-- where relname in ('profiles','enquiries')
--   and relnamespace = 'public'::regnamespace;

-- 7.6 CONFIRM the live created_at defaults are now(), which the new
--     enquiry policy assumes. Expect now() for both tables.
-- select table_name, column_name, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in ('enquiries','profiles')
--   and column_name = 'created_at';

-- 7.7 CONFIRM the admin policies no longer reference public.profiles
--     directly. Expect the two admin policies on profiles to show
--     public.is_admin() and no `select ... from public.profiles` subquery.
-- select policyname, pg_get_expr(polqual, polrelid) as using_expr
-- from pg_policy
-- where polrelid = 'public.profiles'::regclass and polcmd in ('r','w')
-- order by 1;

commit;

-- ============================================================================
-- ROLLBACK GUIDANCE
--
-- The migration is transactional, so if it fails it rolls back completely
-- and no rollback is needed. To revert it deliberately after a successful
-- apply, run the statements below (also transactional).
--
-- 7.1 Restore the original, unconstrained profile INSERT policy:
--
--   begin;
--   drop policy if exists "Authenticated users can insert their own profile"
--     on public.profiles;
--   create policy "Authenticated users can insert their own profile"
--     on public.profiles for insert
--     to authenticated
--     with check (auth.uid() = id);
--
-- 7.2 Restore the original, unconstrained public enquiry INSERT policy:
--
--   drop policy if exists "Public can insert enquiries" on public.enquiries;
--   create policy "Public can insert enquiries"
--     on public.enquiries for insert
--     to anon, authenticated
--     with check (true);
--
-- 7.3 Restore the two original self-referencing admin policies:
--
--   drop policy if exists "Admins can read all profiles" on public.profiles;
--   create policy "Admins can read all profiles"
--     on public.profiles for select
--     to authenticated
--     using (
--       exists (
--         select 1 from public.profiles
--         where id = auth.uid() and role = 'admin'
--       )
--     );
--
--   drop policy if exists "Admins can update all profiles" on public.profiles;
--   create policy "Admins can update all profiles"
--     on public.profiles for update
--     to authenticated
--     using (
--       exists (
--         select 1 from public.profiles
--         where id = auth.uid() and role = 'admin'
--       )
--     );
--
-- 7.4 Remove the new triggers:
--
--   drop trigger if exists profiles_role_protection_insert on public.profiles;
--   drop trigger if exists enquiries_protect_insert on public.enquiries;
--
-- 7.5 Restore the original trigger function bodies (no pinned search_path,
--     no trusted-context branch, no INSERT branch):
--
--   create or replace function public.protect_profile_role()
--   returns trigger language plpgsql security definer as $$
--   declare
--     caller_role text;
--   begin
--     if new.role = old.role then
--       return new;
--     end if;
--     select role into caller_role
--     from public.profiles
--     where id = auth.uid();
--     if caller_role = 'admin' then
--       return new;
--     end if;
--     raise exception 'Only administrators can change user roles.';
--   end;
--   $$;
--
--   create or replace function public.handle_new_user()
--   returns trigger language plpgsql security definer as $$
--   begin
--     insert into public.profiles (id, full_name, email, role)
--     values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'customer');
--     return new;
--   end;
--   $$;
--
--   create or replace function public.set_updated_at()
--   returns trigger language plpgsql as $$
--   begin
--     new.updated_at = now();
--     return new;
--   end;
--   $$;
--
-- 7.6 Drop the objects this migration added:
--
--   drop trigger if exists profiles_role_protection_insert on public.profiles;
--   drop trigger if exists enquiries_protect_insert on public.enquiries;
--   drop function if exists public.protect_enquiry_insert();
--   drop function if exists public.has_trusted_provisioning_context();
--   drop function if exists public.is_admin();
--
--   commit;
--
-- NOTE: rolling back to 7.5 restores the original trigger, which BLOCKS
-- admin promotion from the dashboard SQL Editor and from the service-role
-- key. If the project relies on manual promotion, prefer rolling back only
-- 7.1-7.3 and keeping the hardened trigger and the is_admin() helper.
-- ============================================================================
