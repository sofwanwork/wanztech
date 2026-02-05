-- Create transactions table to track BCL payments
create type transaction_status as enum ('pending', 'completed', 'failed', 'cancelled');

create table public.transactions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount decimal(10, 2) not null,
  currency text not null default 'MYR',
  description text,
  status transaction_status not null default 'pending',
  provider_transaction_id text, -- BCL Bill ID
  provider_reference text, -- BCL Reference ID
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_pkey primary key (id)
);

-- Add RLS policies
alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
  on public.transactions
  for select
  using (auth.uid() = user_id);

-- Only service role can insert/update transactions (via API)
create policy "Service role can insert transactions"
  on public.transactions
  for insert
  with check (true);

create policy "Service role can update transactions"
  on public.transactions
  for update
  using (true);
