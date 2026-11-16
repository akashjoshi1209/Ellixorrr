-- ============================================================================
-- Ellixorrr — Initial Supabase Schema
-- Migration: 001_initial_schema.sql
--
-- Creates profiles, projects, project_updates, and enquiries tables
-- with Row Level Security (RLS) policies, indexes, and triggers.
--
-- APPLY THIS TO YOUR Supabase project via the SQL Editor or Supabase CLI.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Table: profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

-- ---------------------------------------------------------------------------
-- Table: projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid not null default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  project_name text not null,
  service_type text not null check (
    service_type in ('Websites', 'Applications', 'Automations', 'Custom Solutions')
  ),
  description text,
  status text not null default 'enquiry' check (
    status in ('enquiry', 'planning', 'in_progress', 'review', 'completed', 'on_hold')
  ),
  start_date date,
  expected_completion_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

-- ---------------------------------------------------------------------------
-- Table: project_updates
-- ---------------------------------------------------------------------------
create table public.project_updates (
  id uuid not null default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  primary key (id)
);

-- ---------------------------------------------------------------------------
-- Table: enquiries
-- ---------------------------------------------------------------------------
create table public.enquiries (
  id uuid not null default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  business_name text,
  service_type text not null,
  project_description text not null,
  status text not null default 'new' check (
    status in ('new', 'reviewing', 'contacted', 'converted', 'closed')
  ),
  created_at timestamptz not null default now(),
  primary key (id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_profiles_role on public.profiles(role);
create index idx_projects_customer_id on public.projects(customer_id);
create index idx_projects_status on public.projects(status);
create index idx_project_updates_project_id on public.project_updates(project_id);
create index idx_project_updates_author_id on public.project_updates(author_id);
create index idx_enquiries_customer_id on public.enquiries(customer_id);
create index idx_enquiries_status on public.enquiries(status);

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role protection trigger: prevent non-admin users from changing their role.
--
-- This is the critical security control ensuring customers can never promote
-- themselves to admin. The trigger runs with SECURITY DEFINER so it can read
-- the caller's profile regardless of RLS, and raises an exception if a
-- non-admin attempts to change the role column.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger as $$
declare
  caller_role text;
begin
  -- If role is unchanged, allow the update.
  if new.role = old.role then
    return new;
  end if;

  -- Role is being changed. Look up the caller's role from profiles.
  select role into caller_role
  from public.profiles
  where id = auth.uid();

  -- Only an existing admin may change a user's role.
  if caller_role = 'admin' then
    return new;
  end if;

  -- Any other role change attempt is rejected.
  raise exception 'Only administrators can change user roles.';
end;
$$ language plpgsql security definer;

create trigger profiles_role_protection
  before update of role on public.profiles
  for each row
  execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- Auto-create profile on user registration.
--
-- When Supabase Auth creates a new user in auth.users, this trigger creates
-- a matching public.profiles row with role 'customer'. New registrations
-- always receive the customer role by default.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
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
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security — enable on every table
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_updates enable row level security;
alter table public.enquiries enable row level security;

-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------
-- Customers read their own profile.
create policy "Customers can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Admins read all profiles.
create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Authenticated users insert their own profile (e.g. after sign-up).
create policy "Authenticated users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Customers update their own profile. Role changes are blocked by the
-- protect_profile_role trigger above.
create policy "Customers can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins update any profile.
create policy "Admins can update all profiles"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- projects policies
-- ---------------------------------------------------------------------------
-- Customers read their own projects.
create policy "Customers can read their own projects"
  on public.projects for select
  to authenticated
  using (customer_id in (
    select id from public.profiles where id = auth.uid()
  ));

-- Admins read all projects.
create policy "Admins can read all projects"
  on public.projects for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins insert projects (assign to customers).
create policy "Admins can insert projects"
  on public.projects for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins update projects.
create policy "Admins can update projects"
  on public.projects for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins delete projects.
create policy "Admins can delete projects"
  on public.projects for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- project_updates policies
-- ---------------------------------------------------------------------------
-- Customers read updates on their own projects.
create policy "Customers can read updates on their projects"
  on public.project_updates for select
  to authenticated
  using (project_id in (
    select p.id
    from public.projects p
    where p.customer_id in (
      select id from public.profiles where id = auth.uid()
    )
  ));

-- Admins read all project updates.
create policy "Admins can read all project updates"
  on public.project_updates for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins insert project updates.
create policy "Admins can insert project updates"
  on public.project_updates for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins update project updates.
create policy "Admins can update project updates"
  on public.project_updates for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins delete project updates.
create policy "Admins can delete project updates"
  on public.project_updates for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- enquiries policies
-- ---------------------------------------------------------------------------
-- Public (including unauthenticated visitors) can insert enquiries.
create policy "Public can insert enquiries"
  on public.enquiries for insert
  to anon, authenticated
  with check (true);

-- Customers read their own enquiries.
create policy "Customers can read their own enquiries"
  on public.enquiries for select
  to authenticated
  using (customer_id = auth.uid());

-- Admins read all enquiries.
create policy "Admins can read all enquiries"
  on public.enquiries for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins update enquiries (e.g. change status).
create policy "Admins can update enquiries"
  on public.enquiries for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins delete enquiries.
create policy "Admins can delete enquiries"
  on public.enquiries for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime publication (optional; uncomment when needed)
-- ---------------------------------------------------------------------------
-- alter publication supabase_realtime add table public.profiles;
-- alter publication supabase_realtime add table public.projects;
-- alter publication supabase_realtime add table public.project_updates;
-- alter publication supabase_realtime add table public.enquiries;
