-- Migration: Properly secure trigger functions with search_path = ''
-- 
-- Background:
--   The 2026-02-25 patch (`20260225155826_patch_security_functions_and_rls.sql`)
--   set `search_path = ''` on three trigger functions to satisfy Supabase
--   Security Advisor. This broke INSERT/UPDATE on `forms` because the trigger
--   bodies referenced `public.forms` (and other tables) without the schema
--   prefix — `search_path = ''` removes the implicit `public` lookup.
--
--   The temporary fix was `ALTER FUNCTION ... RESET search_path;`, which
--   restored functionality but reintroduced the security warning.
--
-- This migration's strategy:
--   1. Re-create the three trigger functions with EXPLICIT schema-qualified
--      references (e.g. `public.forms`, `public.user_inactivity_log`).
--   2. Re-apply `SET search_path = ''` so they're safe AND functional.
--
-- IMPORTANT: This migration uses CREATE OR REPLACE FUNCTION so it's idempotent.
--            If your function bodies have diverged, review and merge before
--            running.
--
-- After applying, run:
--   NOTIFY pgrst, 'reload schema';

-- ──────────────────────────────────────────────────────────────────────
-- 1. generate_short_code() — used by short_links table
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
  exists_count integer;
BEGIN
  -- Only generate when slug not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    LOOP
      result := '';
      FOR i IN 1..6 LOOP
        result := result || substr(chars, (floor(random() * length(chars))::int) + 1, 1);
      END LOOP;

      -- Use fully qualified name; search_path is empty
      SELECT count(*) INTO exists_count
      FROM public.short_links
      WHERE slug = result;

      EXIT WHEN exists_count = 0;
    END LOOP;
    NEW.slug := result;
  END IF;

  RETURN NEW;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────
-- 2. handle_new_user() — auth.users → public.subscriptions / usage seed
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Seed a free-tier subscription row for every new auth user
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- Seed usage tracking row
  INSERT INTO public.usage (user_id, total_forms, total_submissions)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────
-- 3. get_email_by_username() — username → email lookup for login UX
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_email_by_username(username_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  found_email text;
BEGIN
  SELECT email INTO found_email
  FROM auth.users
  WHERE raw_user_meta_data->>'username' = username_input
  LIMIT 1;

  RETURN found_email;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────
-- Re-create triggers (CREATE OR REPLACE not supported for triggers in PG)
-- ──────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_short_code ON public.short_links;
CREATE TRIGGER set_short_code
  BEFORE INSERT ON public.short_links
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_short_code();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Reload PostgREST schema cache so the API layer sees these changes
NOTIFY pgrst, 'reload schema';
