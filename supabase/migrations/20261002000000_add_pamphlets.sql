-- Migration: Add pamphlets table for E-Pamphlet & Buku Program Digital

create table if not exists public.pamphlets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null default '',
  description text default '',
  event_date text default '',
  location text default '',
  cover_image text default '',
  pdf_url text default '',
  theme text not null default 'dark',
  display_mode text not null default 'flipbook',
  pages jsonb not null default '[]'::jsonb,
  action_buttons jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pamphlets_user_id_idx on public.pamphlets (user_id);
create index if not exists pamphlets_slug_idx on public.pamphlets (slug);

-- Enable RLS
alter table public.pamphlets enable row level security;

-- Policies
drop policy if exists "pamphlets_select" on public.pamphlets;
create policy "pamphlets_select" on public.pamphlets
  for select using (auth.uid() = user_id or is_active = true);

drop policy if exists "pamphlets_insert" on public.pamphlets;
create policy "pamphlets_insert" on public.pamphlets
  for insert with check (auth.uid() = user_id);

drop policy if exists "pamphlets_update" on public.pamphlets;
create policy "pamphlets_update" on public.pamphlets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "pamphlets_delete" on public.pamphlets;
create policy "pamphlets_delete" on public.pamphlets
  for delete using (auth.uid() = user_id);

-- Touch updated_at trigger
create or replace function public.set_pamphlets_updated_at()
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

drop trigger if exists trg_pamphlets_updated_at on public.pamphlets;
create trigger trg_pamphlets_updated_at
  before update on public.pamphlets
  for each row execute function public.set_pamphlets_updated_at();

notify pgrst, 'reload schema';
