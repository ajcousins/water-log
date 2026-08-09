-- Run in Supabase SQL Editor (tickets 05–06). Follow + Follow Request with RLS.

create table if not exists public.follow_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint follow_requests_not_self check (from_user_id <> to_user_id)
);

create unique index if not exists follow_requests_one_pending
  on public.follow_requests (from_user_id, to_user_id)
  where status = 'pending';

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

-- MVP: at most one active Follow per follower
create unique index if not exists follows_one_following
  on public.follows (follower_id);

alter table public.follow_requests enable row level security;
alter table public.follows enable row level security;

create policy "Users read own follow requests"
  on public.follow_requests for select to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users insert outgoing follow requests"
  on public.follow_requests for insert to authenticated
  with check (auth.uid() = from_user_id);

create policy "Users update follow requests they are party to"
  on public.follow_requests for update to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users read follows they are party to"
  on public.follows for select to authenticated
  using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "Users insert follows as following (accept)"
  on public.follows for insert to authenticated
  with check (auth.uid() = following_id);

create policy "Follower can delete own follow"
  on public.follows for delete to authenticated
  using (auth.uid() = follower_id);

create policy "Followed can revoke follower"
  on public.follows for delete to authenticated
  using (auth.uid() = following_id);

-- Projection for an accepted Follow: Daily Total + latest Adjustment time only.
create or replace function public.followed_day_projection(p_day_key text)
returns table (username text, daily_total integer, latest_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_following_id uuid;
  v_username text;
begin
  select f.following_id, p.username
    into v_following_id, v_username
  from public.follows f
  join public.profiles p on p.id = f.following_id
  where f.follower_id = auth.uid()
  limit 1;

  if v_following_id is null then
    return;
  end if;

  return query
  select
    v_username,
    greatest(0, coalesce(sum(a.amount), 0))::integer,
    max(a.at)
  from public.adjustments a
  where a.user_id = v_following_id
    and a.day_key = p_day_key
  having coalesce(sum(a.amount), 0) > 0;
end;
$$;

revoke all on function public.followed_day_projection(text) from public;
grant execute on function public.followed_day_projection(text) to authenticated;
