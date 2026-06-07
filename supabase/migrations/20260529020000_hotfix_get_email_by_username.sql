-- HOTFIX: Restore login-by-username after the over-zealous replacement in
-- 20260529000000_fix_trigger_search_path.sql.
--
-- The previous migration replaced `get_email_by_username` with an
-- assumed body that may not match the original. This hotfix is defensive:
-- it searches multiple common username fields in raw_user_meta_data and
-- also falls back to the public.profiles table (if it exists), so login
-- works regardless of which field the original code used.

CREATE OR REPLACE FUNCTION public.get_email_by_username(username_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  found_email text;
  has_profiles boolean;
BEGIN
  -- 1) Try raw_user_meta_data variants
  SELECT email INTO found_email
  FROM auth.users
  WHERE raw_user_meta_data->>'username' = username_input
     OR raw_user_meta_data->>'user_name' = username_input
     OR raw_user_meta_data->>'preferred_username' = username_input
  LIMIT 1;

  IF found_email IS NOT NULL THEN
    RETURN found_email;
  END IF;

  -- 2) Try user_metadata (some apps use that key)
  SELECT email INTO found_email
  FROM auth.users
  WHERE (raw_user_meta_data::jsonb)->>'username' = username_input
  LIMIT 1;

  IF found_email IS NOT NULL THEN
    RETURN found_email;
  END IF;

  -- 3) Fallback to public.profiles.username if such a table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) INTO has_profiles;

  IF has_profiles THEN
    EXECUTE format(
      'SELECT u.email FROM auth.users u JOIN public.profiles p ON p.id = u.id WHERE p.username = %L LIMIT 1',
      username_input
    ) INTO found_email;
  END IF;

  RETURN found_email; -- may be NULL; client treats NULL as "not found"
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
