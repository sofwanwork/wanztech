-- Category-based certificate mapping. Lets a form map a dropdown field's
-- answer to a specific certificate template (e.g. Urusetia/Penganjur/Peserta
-- each get a different cert). Stored as jsonb, shape:
--   { "fieldId": "<select field id>", "map": { "<option>": "<template id>" } }

ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS e_certificate_category jsonb;

NOTIFY pgrst, 'reload schema';
