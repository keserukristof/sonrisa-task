-- Shared enumerations, and one profile per account with its role.

create type public.event_category as enum ('news', 'markets', 'natural_disasters');
-- Ordered: a later value is more severe, so `severity >= min_severity` works.
create type public.severity as enum ('low', 'moderate', 'high', 'critical');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- SECURITY DEFINER, on purpose: every admin policy calls this, including the
-- policy on profiles itself, so it must read profiles without going through
-- that policy again. It exposes one boolean about the caller only.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create policy "Users read their own profile, admins read all"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

-- SECURITY DEFINER, on purpose: nobody may write profiles directly, so a role
-- can only change here, where the two rules are checked: the caller is an
-- admin, and the caller is not changing their own role.
create function public.set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'only an admin can change a role' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'an admin cannot change their own role' using errcode = '42501';
  end if;
  if p_role not in ('user', 'admin') then
    raise exception 'unknown role' using errcode = '22023';
  end if;

  update public.profiles set role = p_role where user_id = p_user_id;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated;

comment on table public.profiles is
  'One row per account: the email copied at sign-up and the role. Written only by the new-user trigger and set_user_role().';
