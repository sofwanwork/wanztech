-- Migration: Fix handle_new_user trigger to use correct column names and supply the NOT NULL month value
-- 

-- Clean up redundant triggers and functions from older migrations to prevent race conditions on signup
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_subscription();


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

  -- Seed usage tracking row with correct column names (forms_created) and current month
  INSERT INTO public.usage (user_id, month, forms_created, total_submissions)
  VALUES (NEW.id, date_trunc('month', current_date)::date, 0, 0)
  ON CONFLICT (user_id, month) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Re-create trigger just to ensure consistency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Reload PostgREST schema cache so the API layer sees these changes
NOTIFY pgrst, 'reload schema';
