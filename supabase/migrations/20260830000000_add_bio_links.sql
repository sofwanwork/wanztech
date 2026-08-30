-- Migration: Add bio_pages and bio_links tables for KlikBio (Linktree-style bio links)

create table if not exists public.bio_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null unique,
  title text not null default '',
  bio text default '',
  avatar_url text default '',
  theme text not null default 'emerald',
  theme_config jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bio_pages_user_id_idx on public.bio_pages (user_id);
create index if not exists bio_pages_username_idx on public.bio_pages (username);

create table if not exists public.bio_links (
  id uuid primary key default gen_random_uuid(),
  bio_page_id uuid not null references public.bio_pages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'link',
  title text not null default '',
  url text not null default '',
  icon text default '',
  highlight boolean not null default false,
  is_active boolean not null default true,
  clicks integer not null default 0,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bio_links_bio_page_id_idx on public.bio_links (bio_page_id, order_index);
create index if not exists bio_links_user_id_idx on public.bio_links (user_id);

-- Enable RLS
alter table public.bio_pages enable row level security;
alter table public.bio_links enable row level security;

-- bio_pages Policies
drop policy if exists "bio_pages_select" on public.bio_pages;
create policy "bio_pages_select" on public.bio_pages
  for select using (auth.uid() = user_id or is_active = true);

drop policy if exists "bio_pages_insert" on public.bio_pages;
create policy "bio_pages_insert" on public.bio_pages
  for insert with check (auth.uid() = user_id);

drop policy if exists "bio_pages_update" on public.bio_pages;
create policy "bio_pages_update" on public.bio_pages
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "bio_pages_delete" on public.bio_pages;
create policy "bio_pages_delete" on public.bio_pages
  for delete using (auth.uid() = user_id);

-- bio_links Policies
drop policy if exists "bio_links_select" on public.bio_links;
create policy "bio_links_select" on public.bio_links
  for select using (
    auth.uid() = user_id or (
      is_active = true and exists (
        select 1 from public.bio_pages
        where public.bio_pages.id = bio_links.bio_page_id
        and public.bio_pages.is_active = true
      )
    )
  );

drop policy if exists "bio_links_insert" on public.bio_links;
create policy "bio_links_insert" on public.bio_links
  for insert with check (auth.uid() = user_id);

drop policy if exists "bio_links_update" on public.bio_links;
create policy "bio_links_update" on public.bio_links
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "bio_links_delete" on public.bio_links;
create policy "bio_links_delete" on public.bio_links
  for delete using (auth.uid() = user_id);

-- Touch updated_at triggers
create or replace function public.set_bio_pages_updated_at()
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

drop trigger if exists trg_bio_pages_updated_at on public.bio_pages;
create trigger trg_bio_pages_updated_at
  before update on public.bio_pages
  for each row execute function public.set_bio_pages_updated_at();

create or replace function public.set_bio_links_updated_at()
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

drop trigger if exists trg_bio_links_updated_at on public.bio_links;
create trigger trg_bio_links_updated_at
  before update on public.bio_links
  for each row execute function public.set_bio_links_updated_at();

notify pgrst, 'reload schema';
