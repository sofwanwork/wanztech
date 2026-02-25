-- Performance Improvements for Row Level Security (RLS)
-- As recommended by Supabase Advisory, adding indexes on columns used in RLS policies prevents Full Table Scans.

-- 1. Index for forms table (user_id is heavily used in RLS)
CREATE INDEX IF NOT EXISTS forms_user_id_idx ON public.forms(user_id);

-- 2. Index for settings table
CREATE INDEX IF NOT EXISTS settings_user_id_idx ON public.settings(user_id);

-- 3. Index for profiles table (id column is primary key so already indexed, but let's be explicitly safe if rules use other columns or if it was dropped)
-- Note: id is PK so usually indexed automatically. Supabase warns about profiles sometimes if we do auth.uid() = id without explicit index on large setups, but PK handles it. 
-- If the warning is about another column, adjust here. Assuming the warning is the common `auth.uid() = id` one for profiles, the PK usually suffices, but we'll add one if missing.
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);

-- 4. Index for subscriptions table
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);

-- 5. Index for certificates table
CREATE INDEX IF NOT EXISTS certificates_user_id_idx ON public.certificates(user_id);

-- 6. Index for transactions table
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);

-- 7. Additional indexes for commonly queried foreign keys
CREATE INDEX IF NOT EXISTS forms_short_code_idx ON public.forms(short_code);
CREATE INDEX IF NOT EXISTS certificates_form_id_idx ON public.certificates(form_id);
-- CREATE INDEX IF NOT EXISTS transactions_subscription_id_idx ON public.transactions(subscription_id);

-- Document completion
COMMENT ON INDEX public.forms_user_id_idx IS 'Index to improve RLS performance for form owner checks';
COMMENT ON INDEX public.settings_user_id_idx IS 'Index to improve RLS performance for settings owner checks';
COMMENT ON INDEX public.subscriptions_user_id_idx IS 'Index to improve RLS performance for subscription owner checks';
