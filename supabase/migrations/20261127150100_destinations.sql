-- Destinations: one place a user has connected on a channel.
-- Every account gets exactly one email destination, created with the account.

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel_type text not null check (channel_type in ('email', 'slack')),
  name text not null check (char_length(name) between 1 and 80),
  -- Channel-specific settings, validated by the channel's Zod schema. For
  -- Slack this holds the webhook URL, a secret: see the column grants below.
  settings jsonb not null default '{}'::jsonb,
  -- A masked hint of the settings that is safe to show, such as the end of a URL.
  hint text,
  status text not null default 'active' check (status in ('active', 'broken')),
  broken_reason text,
  created_at timestamptz not null default now(),
  -- Lets alert_destinations prove, with a foreign key, that an alert and a
  -- destination belong to the same user.
  unique (id, user_id)
);

create index destinations_user_id_idx on public.destinations (user_id);
create unique index destinations_one_email_per_user_idx
  on public.destinations (user_id)
  where channel_type = 'email';

alter table public.destinations enable row level security;

-- The settings column is never readable from the browser: no table-wide
-- select, only the columns that are safe to show.
revoke all on public.destinations from anon, authenticated;
grant select (id, user_id, channel_type, name, hint, status, broken_reason, created_at)
  on public.destinations to authenticated;

create policy "Users read their own destinations, admins read all"
  on public.destinations for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

-- SECURITY DEFINER, on purpose: it runs as part of sign-up, inside the auth
-- service's insert into auth.users, where no application role has rights on
-- the public tables. It writes only the new user's own two rows.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, coalesce(new.email, ''));

  insert into public.destinations (user_id, channel_type, name)
  values (new.id, 'email', 'Account email');

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on table public.destinations is
  'Where notifications can be sent. The email destination is created by the new-user trigger and cannot be removed; its recipient is the account address, read when sending.';
