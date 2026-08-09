-- Run in Supabase SQL Editor (ticket 03). Enables RLS before any data is stored.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_unique unique (username)
);

alter table public.profiles enable row level security;

create policy "Authenticated users can read profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Username is fixed after signup: no update/delete policies for authenticated clients.
