-- Migration: Create generate_form_short_code trigger function for public.forms table
-- 

CREATE OR REPLACE FUNCTION public.generate_form_short_code()
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
  -- Only generate when short_code not provided
  IF NEW.short_code IS NULL OR NEW.short_code = '' THEN
    LOOP
      result := '';
      FOR i IN 1..6 LOOP
        result := result || substr(chars, (floor(random() * length(chars))::int) + 1, 1);
      END LOOP;

      -- Check if it already exists in public.forms
      SELECT count(*) INTO exists_count
      FROM public.forms
      WHERE short_code = result;

      EXIT WHEN exists_count = 0;
    END LOOP;
    NEW.short_code := result;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger on public.forms that executed the modified generate_short_code function
DROP TRIGGER IF EXISTS set_short_code ON public.forms;

-- Create correct trigger on public.forms
CREATE TRIGGER set_short_code
  BEFORE INSERT ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_form_short_code();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
