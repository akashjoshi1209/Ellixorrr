-- ============================================================================
-- Ellixorrr — Test suite for 003_security_hardening.sql
-- File: supabase/tests/003_security_hardening.test.sql
--
-- THIS SCRIPT CHANGES NO STATE. It runs entirely inside a transaction that
-- is rolled back at the end, so it can be executed against the live
-- project without leaving anything behind.
--
-- HOW TO RUN
--   1. Run this file BEFORE applying 003_security_hardening.sql to observe
--      the pre-migration behaviour (see INTERPRETATION NOTES below).
--   2. Apply 003_security_hardening.sql.
--   3. Run this file again. All 30 assertions should report PASS.
--
--   Use the Supabase SQL Editor's "Run" (the whole script is sent as one
--   multi-statement query) or, preferably:
--     psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=0 -f 003_security_hardening.test.sql
--
-- WHY THIS SUITE SWITCHES POSTGRESQL ROLES
--   Setting JWT claims alone is NOT enough. RLS is only enforced for a
--   non-owner role: the table owner (and any superuser) bypasses RLS
--   entirely. If the suite ran every statement as the migration role, the
--   RLS policies would never be evaluated and the assertions would be
--   meaningless. Each policy assertion therefore runs under
--
--     SET LOCAL ROLE anon;             -- or authenticated
--     ... the statement ...
--     RESET ROLE;
--
--   with the JWT claims of the simulated user set beforehand. The claims
--   are what auth.uid() and the JWT-role checks read; the PostgreSQL role
--   is what makes RLS apply. Both are required.
--
--   The helper functions live in pg_temp, which is session-local and is
--   discarded when the session ends, so nothing can persist even if the
--   surrounding transaction were mishandled.
--
-- ALWAYS ROLLS BACK
--   The whole body is inside BEGIN ... ROLLBACK. Every statement that is
--   expected to fail is wrapped in a PL/pgSQL helper, and PL/pgSQL catches
--   its own errors in an implicit subtransaction - so an expected failure
--   never aborts the transaction. If something unexpected fails outside a
--   helper, the transaction enters the aborted state; ROLLBACK is still
--   accepted in an aborted transaction, so the final ROLLBACK statement
--   still discards everything.
--
-- TWO FIXTURE IDENTITIES are used throughout:
--   CUSTOMER = 11111111-1111-1111-1111-111111111111
--   ADMIN    = 22222222-2222-2222-2222-222222222222
--   SIGNUP   = 33333333-3333-3333-3333-333333333333
-- ============================================================================

begin;

-- ===========================================================================
-- SECTION 0 - Helpers and fixtures.
--
-- The fixture rows are created as the session role (the table owner), which
-- bypasses RLS and is also a trusted provisioning context for the role
-- trigger. They are removed by the ROLLBACK at the end.
-- ===========================================================================

-- Must be rejected: the statement must raise, and the SQLSTATE must be one
-- of the expected codes.
--   42501 = insufficient_privilege (Postgres RLS: "new row violates
--           row-level security policy" / "permission denied for table")
--   P0001 = raise_exception (the trigger's own RAISE EXCEPTION)
create or replace function pg_temp.t_assert_rejected(
  p_label text,
  p_expected_codes text[],
  p_stmt text
) returns void
language plpgsql
as $$
declare
  v_state text;
  v_msg   text;
begin
  begin
    execute p_stmt;
  exception
    when others then
      v_state := sqlstate;
      v_msg   := sqlerrm;
      if v_state = any (p_expected_codes) then
        raise notice 'PASS  %  [rejected, sqlstate %]', p_label, v_state;
      else
        raise notice 'FAIL  %  [rejected with sqlstate % - expected one of %]  %',
          p_label, v_state, p_expected_codes, left(v_msg, 120);
      end if;
      return;
  end;
  raise notice 'FAIL  %  [statement SUCCEEDED but should have been rejected]',
    p_label;
end;
$$;

-- Must be accepted: the statement must complete without raising.
create or replace function pg_temp.t_assert_accepted(
  p_label text,
  p_stmt text
) returns void
language plpgsql
as $$
declare
  v_state text;
  v_msg   text;
begin
  begin
    execute p_stmt;
    raise notice 'PASS  %  [accepted]', p_label;
  exception
    when others then
      v_state := sqlstate;
      v_msg   := sqlerrm;
      raise notice 'FAIL  %  [rejected, sqlstate % - should have succeeded]  %',
        p_label, v_state, left(v_msg, 120);
  end;
end;
$$;

-- Must return exactly p_expected rows. RLS filters SELECT rows silently
-- rather than raising, so a row count is the correct assertion for reads.
create or replace function pg_temp.t_assert_rows(
  p_label text,
  p_expected integer,
  p_stmt text
) returns void
language plpgsql
as $$
declare
  n       integer := 0;
  r       record;
  v_state text;
  v_msg   text;
begin
  begin
    for r in execute p_stmt loop
      n := n + 1;
    end loop;
  exception
    when others then
      v_state := sqlstate;
      v_msg   := sqlerrm;
      raise notice 'FAIL  %  [query errored, sqlstate % - expected % rows]  %',
        p_label, v_state, p_expected, left(v_msg, 120);
      return;
  end;
  if n = p_expected then
    raise notice 'PASS  %  [% rows]', p_label, n;
  else
    raise notice 'FAIL  %  [expected % rows, got %]', p_label, p_expected, n;
  end if;
end;
$$;

-- The caller must not be able to read anything. Either the query returns
-- zero rows (RLS filtered it) or it is denied outright with 42501.
create or replace function pg_temp.t_assert_no_access(
  p_label text,
  p_stmt text
) returns void
language plpgsql
as $$
declare
  n       integer := 0;
  r       record;
  v_state text;
  v_msg   text;
begin
  begin
    for r in execute p_stmt loop
      n := n + 1;
    end loop;
  exception
    when others then
      v_state := sqlstate;
      v_msg   := sqlerrm;
      if v_state = '42501' then
        raise notice 'PASS  %  [denied, sqlstate %]', p_label, v_state;
      else
        raise notice 'FAIL  %  [errored with sqlstate % - expected 0 rows or 42501]  %',
          p_label, v_state, left(v_msg, 120);
      end if;
      return;
  end;
  if n = 0 then
    raise notice 'PASS  %  [0 rows]', p_label;
  else
    raise notice 'FAIL  %  [% rows leaked]', p_label, n;
  end if;
end;
$$;

-- A plain boolean check on data the session role can read.
create or replace function pg_temp.t_assert_true(
  p_label text,
  p_value boolean
) returns void
language plpgsql
as $$
begin
  if coalesce(p_value, false) then
    raise notice 'PASS  %', p_label;
  else
    raise notice 'FAIL  %  [expected true]', p_label;
  end if;
end;
$$;

-- Fixtures. The admin fixture is inserted with role = 'admin' from a
-- trusted context, which is exactly how a first administrator is
-- provisioned from the dashboard SQL Editor.
insert into public.profiles (id, full_name, email, role)
values
  ('11111111-1111-1111-1111-111111111111', 'Test Customer', 'customer@test.invalid', 'customer'),
  ('22222222-2222-2222-2222-222222222222', 'Test Admin',    'admin@test.invalid',    'admin');

-- ===========================================================================
-- SECTION 1 - Customer self-promotion (UPDATE).
-- ===========================================================================

select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

set local role authenticated;
select pg_temp.t_assert_rejected(
  'A01 customer UPDATE own role to admin',
  array['P0001', '42501'],
  $$update public.profiles
      set role = 'admin'
    where id = '11111111-1111-1111-1111-111111111111';$$);
reset role;

select pg_temp.t_assert_true(
  'A02 customer role is still customer',
  (select role = 'customer' from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'));

-- ===========================================================================
-- SECTION 2 - Unauthorised profile INSERT (the N1 escalation path).
--
-- The customer fixture currently occupies its own primary key, so the row
-- is deleted first to reproduce the "orphaned profile" precondition.
-- ===========================================================================

delete from public.profiles
 where id = '11111111-1111-1111-1111-111111111111';

set local role authenticated;
select pg_temp.t_assert_rejected(
  'A03 customer INSERT own profile with role=admin',
  array['P0001', '42501'],
  $$insert into public.profiles (id, full_name, email, role)
    values ('11111111-1111-1111-1111-111111111111',
            'Escalated', 'customer@test.invalid', 'admin');$$);
reset role;

select pg_temp.t_assert_true(
  'A04 no admin profile was created',
  (select count(*) = 0 from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'
      and role = 'admin'));

-- A05 isolates the RLS OWNERSHIP clause. The trigger lets this row
-- through (role = 'customer' is legitimate), so the rejection can only
-- come from the policy's `auth.uid() = id` check.
set local role authenticated;
select pg_temp.t_assert_rejected(
  'A05 customer INSERT profile for a different id',
  array['42501'],
  $$insert into public.profiles (id, full_name, email, role)
    values ('22222222-2222-2222-2222-222222222222',
            'Not Mine', 'attacker@test.invalid', 'customer');$$);
reset role;

-- ===========================================================================
-- SECTION 3 - Legitimate customer profile INSERT, ordinary UPDATE and reads.
-- ===========================================================================

set local role authenticated;
select pg_temp.t_assert_accepted(
  'A06 customer INSERT own profile with role=customer',
  $$insert into public.profiles (id, full_name, email, role)
    values ('11111111-1111-1111-1111-111111111111',
            'Restored Customer', 'customer@test.invalid', 'customer');$$);
reset role;

select pg_temp.t_assert_true(
  'A07 the customer profile was created with role=customer',
  (select role = 'customer' from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'));

set local role authenticated;
select pg_temp.t_assert_accepted(
  'A08 customer UPDATE own phone (non-role column)',
  $$update public.profiles
      set phone = '+910000000000'
    where id = '11111111-1111-1111-1111-111111111111';$$);
reset role;

-- A09 exercises the SELECT policy. IMPORTANT: on a database that still has
-- the original self-referencing "Admins can read all profiles" policy,
-- this query fails with
--   "infinite recursion detected in policy for relation profiles".
-- If that happens, it CONFIRMS the recursion risk and shows that 003 is
-- required before the customer portal can read a profile at all.
set local role authenticated;
select pg_temp.t_assert_rows(
  'A09 customer SELECT own profile',
  1,
  $$select id, role from public.profiles
    where id = '11111111-1111-1111-1111-111111111111';$$);
reset role;

set local role authenticated;
select pg_temp.t_assert_rows(
  'A10 customer SELECT another user profile',
  0,
  $$select id, role from public.profiles
    where id = '22222222-2222-2222-2222-222222222222';$$);
reset role;

-- ===========================================================================
-- SECTION 4 - Legitimate administrator role changes.
-- ===========================================================================

select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub',
  '22222222-2222-2222-2222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

set local role authenticated;
select pg_temp.t_assert_accepted(
  'A11 admin promotes customer via UPDATE',
  $$update public.profiles
      set role = 'admin'
    where id = '11111111-1111-1111-1111-111111111111';$$);
reset role;

select pg_temp.t_assert_true(
  'A12 the customer was promoted to admin',
  (select role = 'admin' from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'));

-- A13 is the manual first-admin provisioning path: the Supabase dashboard
-- SQL Editor, i.e. a table-owner session with no end-user JWT at all. It is
-- therefore executed WITHOUT a role switch on purpose - that IS the
-- context being simulated. The role trigger still fires for it, because
-- triggers fire regardless of RLS.
--
-- On a database that still has the ORIGINAL trigger this is EXPECTED TO
-- FAIL, which is the proof that the original trigger blocked admin
-- promotion from the SQL Editor.
select set_config('request.jwt.claims', '{}', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);

select pg_temp.t_assert_accepted(
  'A13 trusted context (SQL Editor) promotes customer',
  $$update public.profiles
      set role = 'customer'
    where id = '11111111-1111-1111-1111-111111111111';$$);

select pg_temp.t_assert_true(
  'A14 the trusted promotion took effect',
  (select role = 'customer' from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'));

-- ===========================================================================
-- SECTION 5 - Normal signup creates a customer profile.
--
-- The claims are set to the NEW user's identity so that the role trigger
-- sees a NON-trusted caller - the strictest case. The insert into
-- auth.users is performed as the session role, because that is how
-- GoTrue creates the user.
-- ===========================================================================

select set_config('request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub',
  '33333333-3333-3333-3333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.t_assert_accepted(
  'A15 signup creates a customer profile',
  $$insert into auth.users (
       instance_id, id, aud, role, email,
       encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at
     ) values (
       '00000000-0000-0000-0000-000000000000',
       '33333333-3333-3333-3333-333333333333',
       'authenticated', 'authenticated', 'signup@test.invalid',
       crypt('Test-Password-123', gen_salt('bf')),
       now(),
       '{"provider":"email","providers":["email"]}',
       '{"full_name":"Test Signup"}',
       now(), now()
     );$$);

select pg_temp.t_assert_true(
  'A16 the new signup got role=customer',
  (select role = 'customer' from public.profiles
    where id = '33333333-3333-3333-3333-333333333333'));

-- ===========================================================================
-- SECTION 6 - Public enquiry submissions.
-- ===========================================================================

-- Anonymous submission, exactly as the contact form sends it.
select set_config('request.jwt.claims', '{}', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);

set local role anon;
select pg_temp.t_assert_accepted(
  'A17 anonymous public enquiry submission',
  $$insert into public.enquiries (
       customer_id, name, email, phone, business_name,
       service_type, project_description, status
     ) values (
       null, 'Visitor', 'visitor@test.invalid', null, null,
       'Websites', 'A public enquiry from the contact form.', 'new'
     );$$);
reset role;

select pg_temp.t_assert_true(
  'A18 the anonymous enquiry was stored with status=new and no customer_id',
  (select count(*) = 1 from public.enquiries
    where email = 'visitor@test.invalid'
      and status = 'new'
      and customer_id is null));

-- Signed-in customer submission, with customer_id set to their own id.
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

set local role authenticated;
select pg_temp.t_assert_accepted(
  'A19 authenticated customer public enquiry with own customer_id',
  $$insert into public.enquiries (
       customer_id, name, email, phone, business_name,
       service_type, project_description, status
     ) values (
       '11111111-1111-1111-1111-111111111111',
       'Signed In', 'signedin@test.invalid', null, null,
       'Applications', 'An enquiry from a signed-in customer.', 'new'
     );$$);
reset role;

select pg_temp.t_assert_true(
  'A20 the authenticated enquiry carries the submitting customer_id',
  (select count(*) = 1 from public.enquiries
    where email = 'signedin@test.invalid'
      and customer_id = '11111111-1111-1111-1111-111111111111'));

-- ===========================================================================
-- SECTION 7 - Enquiry status, customer_id and timestamp manipulation.
-- ===========================================================================

select set_config('request.jwt.claims', '{}', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);

set local role anon;
select pg_temp.t_assert_rejected(
  'A21 anonymous enquiry with status=converted',
  array['P0001', '42501'],
  $$insert into public.enquiries (
       customer_id, name, email, phone, business_name,
       service_type, project_description, status
     ) values (
       null, 'Spammer', 'spammer@test.invalid', null, null,
       'Websites', 'Trying to skip the triage queue.', 'converted'
     );$$);

select pg_temp.t_assert_rejected(
  'A22 anonymous enquiry with status=closed',
  array['P0001', '42501'],
  $$insert into public.enquiries (
       customer_id, name, email, phone, business_name,
       service_type, project_description, status
     ) values (
       null, 'Spammer', 'spammer2@test.invalid', null, null,
       'Websites', 'Trying to skip the triage queue.', 'closed'
     );$$);

select pg_temp.t_assert_rejected(
  'A23 anonymous enquiry with a foreign customer_id',
  array['P0001', '42501'],
  $$insert into public.enquiries (
       customer_id, name, email, phone, business_name,
       service_type, project_description, status
     ) values (
       '22222222-2222-2222-2222-222222222222',
       'Spammer', 'spammer3@test.invalid', null, null,
       'Websites', 'Attributing this to somebody else.', 'new'
     );$$);
reset role;

select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

set local role authenticated;
select pg_temp.t_assert_rejected(
  'A24 authenticated customer enquiry with a foreign customer_id',
  array['P0001', '42501'],
  $$insert into public.enquiries (
       customer_id, name, email, phone, business_name,
       service_type, project_description, status
     ) values (
       '22222222-2222-2222-2222-222222222222',
       'Spammer', 'spammer4@test.invalid', null, null,
       'Websites', 'Attributing this to somebody else.', 'new'
     );$$);
reset role;

select set_config('request.jwt.claims', '{}', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);

set local role anon;
select pg_temp.t_assert_rejected(
  'A25 anonymous enquiry with a backdated created_at',
  array['P0001', '42501'],
  $$insert into public.enquiries (
       customer_id, name, email, phone, business_name,
       service_type, project_description, status, created_at
     ) values (
       null, 'Spammer', 'spammer5@test.invalid', null, null,
       'Websites', 'Backdating this.', 'new', now() - interval '365 days'
     );$$);
reset role;

-- A26 isolates the RLS POLICY layer for enquiries. The insert trigger is
-- disabled for this one statement, so the rejection can only come from
-- the policy itself. If this PASSES, the policy is genuinely restrictive
-- and is not merely shadowed by the trigger.
alter table public.enquiries disable trigger enquiries_protect_insert;

set local role anon;
select pg_temp.t_assert_rejected(
  'A26 policy alone rejects status=converted (trigger disabled)',
  array['42501'],
  $$insert into public.enquiries (
       customer_id, name, email, phone, business_name,
       service_type, project_description, status
     ) values (
       null, 'Spammer', 'spammer6@test.invalid', null, null,
       'Websites', 'Trying to skip the triage queue.', 'converted'
     );$$);
reset role;

alter table public.enquiries enable trigger enquiries_protect_insert;

-- ===========================================================================
-- SECTION 8 - Administrators keep full control of enquiries.
-- ===========================================================================

select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub',
  '22222222-2222-2222-2222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

set local role authenticated;
select pg_temp.t_assert_accepted(
  'A27 admin updates an enquiry status',
  $$update public.enquiries
      set status = 'contacted'
    where email = 'visitor@test.invalid';$$);
reset role;

select pg_temp.t_assert_true(
  'A28 the enquiry status was changed',
  (select count(*) = 1 from public.enquiries
    where email = 'visitor@test.invalid' and status = 'contacted'));

-- ===========================================================================
-- SECTION 9 - Enquiry SELECT policies still behave.
-- ===========================================================================

select set_config('request.jwt.claims', '{}', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);

set local role anon;
select pg_temp.t_assert_no_access(
  'A29 anonymous SELECT enquiries',
  $$select id, email, status from public.enquiries
    where email = 'visitor@test.invalid';$$);
reset role;

select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

set local role authenticated;
select pg_temp.t_assert_rows(
  'A30 authenticated customer SELECT own enquiry',
  1,
  $$select id, email, status from public.enquiries
    where email = 'signedin@test.invalid';$$);
reset role;

-- ===========================================================================
-- ROLLBACK - nothing above is persisted. The fixtures, the test enquiries
-- and the temporary helper functions are all discarded here.
-- ===========================================================================
rollback;

-- ===========================================================================
-- EXPECTED SUMMARY - 30 assertions.
--
--   SECTION 1  A01 customer UPDATE own role rejected
--              A02 customer role unchanged
--   SECTION 2  A03 customer INSERT role=admin rejected
--              A04 no admin profile created
--              A05 customer INSERT for another id rejected
--   SECTION 3  A06 customer INSERT role=customer accepted
--              A07 profile created as customer
--              A08 customer UPDATE own phone accepted
--              A09 customer SELECT own profile -> 1 row
--              A10 customer SELECT another profile -> 0 rows
--   SECTION 4  A11 admin promotes customer accepted
--              A12 the customer was promoted
--              A13 trusted context promotes customer accepted
--              A14 the trusted promotion took effect
--   SECTION 5  A15 signup creates a customer profile
--              A16 the new signup got role=customer
--   SECTION 6  A17 anonymous public enquiry accepted
--              A18 the anonymous enquiry was stored correctly
--              A19 authenticated customer enquiry accepted
--              A20 the authenticated enquiry carries its customer_id
--   SECTION 7  A21 anonymous status=converted rejected
--              A22 anonymous status=closed rejected
--              A23 anonymous foreign customer_id rejected
--              A24 authenticated foreign customer_id rejected
--              A25 anonymous backdated created_at rejected
--              A26 policy alone rejects status=converted
--   SECTION 8  A27 admin updates an enquiry status accepted
--              A28 the enquiry status was changed
--   SECTION 9  A29 anonymous SELECT enquiries -> no access
--              A30 authenticated customer SELECT own enquiry -> 1 row
--
-- INTERPRETATION NOTES
--   Run the suite BEFORE applying 003 to observe the vulnerable baseline.
--   On a database that has NOT had 003 applied, these assertions are
--   expected to FAIL, and each failure is the proof of a real defect:
--
--     A03  FAILS - the N1 escalation SUCCEEDS: a customer can insert a
--                  profile with role = 'admin'.
--     A13  FAILS - the original trigger blocks admin promotion from the
--                  dashboard SQL Editor, so first-admin provisioning is
--                  impossible.
--     A26  FAILS - the original policy is `with check (true)`, so status
--                  manipulation is allowed even with the trigger out of
--                  the way.
--     A09  MAY FAIL with "infinite recursion detected in policy for
--                  relation profiles" if the self-referencing admin
--                  policy on public.profiles is being evaluated.
--     A05  MAY FAIL - the original policy does not constrain `role`, so
--                  the trigger does not fire and the RLS ownership check
--                  is the only thing standing in the way.
--
--   After 003 is applied, all 30 assertions should PASS.
--
--   Every failure prints the SQLSTATE and the server message, so a failure
--   can be diagnosed without re-running anything.
-- ===========================================================================
