-- Outgoing webhooks per form.
--
-- Each webhook fires on a configured event (currently: 'submission').
-- Secret is stored encrypted via the same AES-256-CBC helper used for
-- Google credentials. Owner-only RLS — public submissions never read this
-- table directly; the server action looks them up under the form owner's
-- identity (or via the admin client during submission, scoped by form.user_id).

create table if not exists public.form_webhooks (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  secret_encrypted text not null,
  events text[] not null default array['submission']::text[],
  enabled boolean not null default true,
  last_status int,
  last_error text,
  last_fired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists form_webhooks_form_id_idx on public.form_webhooks (form_id);
create index if not exists form_webhooks_user_id_idx on public.form_webhooks (user_id);

alter table public.form_webhooks enable row level security;

-- Owner SELECT/INSERT/UPDATE/DELETE
drop policy if exists "form_webhooks_owner_select" on public.form_webhooks;
create policy "form_webhooks_owner_select" on public.form_webhooks
  for select using (auth.uid() = user_id);

drop policy if exists "form_webhooks_owner_insert" on public.form_webhooks;
create policy "form_webhooks_owner_insert" on public.form_webhooks
  for insert with check (auth.uid() = user_id);

drop policy if exists "form_webhooks_owner_update" on public.form_webhooks;
create policy "form_webhooks_owner_update" on public.form_webhooks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "form_webhooks_owner_delete" on public.form_webhooks;
create policy "form_webhooks_owner_delete" on public.form_webhooks
  for delete using (auth.uid() = user_id);

-- updated_at touch
create or replace function public.set_form_webhooks_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_form_webhooks_updated_at on public.form_webhooks;
create trigger trg_form_webhooks_updated_at
  before update on public.form_webhooks
  for each row execute function public.set_form_webhooks_updated_at();

notify pgrst, 'reload schema';
