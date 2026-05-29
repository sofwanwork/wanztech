-- Response edit tokens — magic links so respondents can edit their own
-- submission within an expiry window.
--
-- Schema notes:
--  * `submission_id` matches a hidden `_submission_id` column injected into
--    the user's Google Sheet on submit, so we can locate and update the
--    correct sheet row when the respondent re-submits.
--  * `snapshot` jsonb stores the original payload so the edit page can
--    prefill the form without round-tripping to Google Sheets.
--  * RLS: owner-only SELECT (so dashboard can list + audit). Anonymous reads
--    on the public edit page go through the admin client (service role)
--    scoped by token, so RLS doesn't need to grant public access.

create table if not exists public.response_edit_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  form_id uuid not null references public.forms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid not null,
  email text,
  snapshot jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists response_edit_tokens_form_id_idx
  on public.response_edit_tokens (form_id);
create index if not exists response_edit_tokens_user_id_idx
  on public.response_edit_tokens (user_id);
create index if not exists response_edit_tokens_token_idx
  on public.response_edit_tokens (token);

alter table public.response_edit_tokens enable row level security;

drop policy if exists "response_edit_tokens_owner_select" on public.response_edit_tokens;
create policy "response_edit_tokens_owner_select" on public.response_edit_tokens
  for select using (auth.uid() = user_id);

-- Per-form edit-link settings, stored as jsonb to avoid column proliferation.
-- Shape: { enabled: boolean, expiryDays: number, emailFieldId?: string }
alter table public.forms
  add column if not exists edit_link_settings jsonb;

notify pgrst, 'reload schema';
