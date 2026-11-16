-- ============================================================================
-- Ellixorrr — Security Hardening Migration
-- Migration: 002_security_hardening.sql
--
-- Safely replaces SECURITY DEFINER trigger functions with search_path pinning.
-- Preserves existing trigger behavior. No destructive table changes.
-- Safe to apply to the existing live database.
--
-- APPLY THIS TO YOUR Supabase project via the SQL Editor or Supabase CLI.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Replace protect_profile_role() with search_path pinned version
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS profiles_role_protection ON public.profiles;

DROP FUNCTION IF EXISTS public.protect_profile_role();

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_role text;
BEGIN
  -- If role is unchanged, allow the update.
  IF NEW.role = OLD.role THEN
    RETURN NEW;
  END IF;

  -- Role is being changed. Look up the caller's role from profiles.
  SELECT role INTO caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Only an existing admin may change a user's role.
  IF caller_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Any other role change attempt is rejected.
  RAISE EXCEPTION 'Only administrators can change user roles.';
END;
$$;

CREATE TRIGGER profiles_role_protection
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- Replace handle_new_user() with search_path pinned version
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    'customer'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- End of migration
-- ============================================================================
