-- Run in Supabase SQL Editor (ticket 04). Append-only Adjustments with RLS.

create table if not exists public.adjustments (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day_key text not null,
  amount integer not null,
  at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists adjustments_user_day_idx
  on public.adjustments (user_id, day_key);

alter table public.adjustments enable row level security;

create policy "Users can read own adjustments"
  on public.adjustments
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own adjustments"
  on public.adjustments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No update/delete for clients: Adjustments are append-only.
