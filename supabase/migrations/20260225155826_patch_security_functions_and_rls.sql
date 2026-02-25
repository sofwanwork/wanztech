-- Security Patching for Role Mutable Search Path 
-- and fixing open RLS policies on transactions.

-- 1. Secure functions against arbitrary code execution by fixing the search_path
-- We use ALTER FUNCTION to set the search_path to empty, forcing explicit schema references or safe defaults.

-- We wrap in a DO block to securely handle varying argument signatures if they exist, 
-- though Supabase reports these names directly.
DO $$
BEGIN
  -- We attempt to alter them if they exist. We need the exact signature.
  -- generate_short_code() takes 0 args based on typical Supabase examples, but just in case, we query pg_proc.
  
  -- Patch generate_short_code
  EXECUTE (
    SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = '''';'
    FROM pg_proc 
    WHERE proname = 'generate_short_code' AND pronamespace = 'public'::regnamespace
  );

  -- Patch handle_new_user
  EXECUTE (
    SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = '''';'
    FROM pg_proc 
    WHERE proname = 'handle_new_user' AND pronamespace = 'public'::regnamespace
  );

  -- Patch get_email_by_username
  EXECUTE (
    SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = '''';'
    FROM pg_proc 
    WHERE proname = 'get_email_by_username' AND pronamespace = 'public'::regnamespace
  );
EXCEPTION WHEN NULL_VALUE_NOT_ALLOWED OR OTHERS THEN
  -- Ignore if not found, though they should be based on the dashboard warnings.
  RAISE NOTICE 'Some functions were not fully patched. Ensure they exist.';
END
$$;

-- 2. Fix the dangerous "with check (true)" / "using (true)" RLS on transactions
-- These policies let any public user insert/update without auth checks.
-- We must restrict them to the `service_role` ONLY.

-- Drop the old insecure policies
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role can update transactions" ON public.transactions;

-- Recreate them securely, tied strictly to the service_role
CREATE POLICY "Service role can insert transactions"
  ON public.transactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update transactions"
  ON public.transactions
  FOR UPDATE
  TO service_role
  USING (true);
