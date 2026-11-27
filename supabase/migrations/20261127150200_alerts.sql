-- Alerts: the standing rules users set up, and the destinations each one notifies.

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  category public.event_category not null,
  -- Null for news, which has no severity levels; required otherwise.
  min_severity public.severity,
  keywords text[] not null default '{}' check (cardinality(keywords) <= 10),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint alerts_severity_matches_category
    check ((category = 'news') = (min_severity is null))
);

create index alerts_user_id_idx on public.alerts (user_id);
create index alerts_matching_idx on public.alerts (category) where active;

alter table public.alerts enable row level security;

-- Column grants keep user_id, created_at and updated_at out of reach: an
-- alert must not be backdated to match events from before it existed.
revoke all on public.alerts from anon, authenticated;
grant select, delete on public.alerts to authenticated;
grant insert (name, category, min_severity, keywords, active) on public.alerts to authenticated;
grant update (name, category, min_severity, keywords, active) on public.alerts to authenticated;

create policy "Users read their own alerts, admins read all"
  on public.alerts for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Users create their own alerts"
  on public.alerts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own alerts"
  on public.alerts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own alerts"
  on public.alerts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger alerts_set_updated_at
  before update on public.alerts
  for each row execute function public.set_updated_at();

create table public.alert_destinations (
  alert_id uuid not null,
  destination_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (alert_id, destination_id),
  -- Both composite keys carry user_id, so an alert can only link a
  -- destination of the same user. The database enforces it, not the form.
  foreign key (alert_id, user_id)
    references public.alerts (id, user_id) on delete cascade,
  foreign key (destination_id, user_id)
    references public.destinations (id, user_id) on delete cascade
);

create index alert_destinations_destination_id_idx on public.alert_destinations (destination_id);
create index alert_destinations_user_id_idx on public.alert_destinations (user_id);

alter table public.alert_destinations enable row level security;

revoke all on public.alert_destinations from anon, authenticated;
grant select, delete on public.alert_destinations to authenticated;
grant insert (alert_id, destination_id) on public.alert_destinations to authenticated;

create policy "Users read their own alert destinations, admins read all"
  on public.alert_destinations for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Users link their own alerts to their own destinations"
  on public.alert_destinations for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users unlink their own alert destinations"
  on public.alert_destinations for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Creates or updates an alert together with its destinations in one
-- transaction, as the caller: Row Level Security and the foreign keys above
-- still decide what is allowed. Pass a null id to create.
create function public.save_alert(
  p_alert_id uuid,
  p_name text,
  p_category public.event_category,
  p_min_severity public.severity,
  p_keywords text[],
  p_destination_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(cardinality(p_destination_ids), 0) = 0 then
    raise exception 'an alert needs at least one destination' using errcode = '23514';
  end if;

  if p_alert_id is null then
    insert into public.alerts (name, category, min_severity, keywords)
    values (btrim(p_name), p_category, p_min_severity, coalesce(p_keywords, '{}'))
    returning id into v_id;
  else
    update public.alerts
    set name = btrim(p_name),
        category = p_category,
        min_severity = p_min_severity,
        keywords = coalesce(p_keywords, '{}')
    where id = p_alert_id
    returning id into v_id;

    if v_id is null then
      raise exception 'alert not found' using errcode = 'P0002';
    end if;

    delete from public.alert_destinations where alert_id = v_id;
  end if;

  insert into public.alert_destinations (alert_id, destination_id)
  select v_id, d.destination_id
  from (select distinct unnest(p_destination_ids) as destination_id) as d;

  return v_id;
end;
$$;

revoke all on function public.save_alert(uuid, text, public.event_category, public.severity, text[], uuid[]) from public, anon;
grant execute on function public.save_alert(uuid, text, public.event_category, public.severity, text[], uuid[]) to authenticated;
