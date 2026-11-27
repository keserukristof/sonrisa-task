-- The notification outbox, the log of test sends, and the email budget they share.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  -- Null once the alert is deleted: history keeps the row as "Deleted alert".
  alert_id uuid references public.alerts (id) on delete set null,
  destination_id uuid references public.destinations (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Copied from the destination, so limits still count after it is removed.
  channel_type text not null check (channel_type in ('email', 'slack')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  skip_reason text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  -- One notification per event and destination, however many alerts match.
  unique (event_id, destination_id)
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_due_idx on public.notifications (next_attempt_at) where status = 'pending';
create index notifications_event_id_idx on public.notifications (event_id);
create index notifications_alert_id_idx on public.notifications (alert_id);
create index notifications_destination_id_idx on public.notifications (destination_id);
create index notifications_email_sent_idx on public.notifications (sent_at) where channel_type = 'email' and status = 'sent';

alter table public.notifications enable row level security;

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;

create policy "Users read their own notifications, admins read all"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create table public.test_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  destination_id uuid references public.destinations (id) on delete set null,
  channel_type text not null check (channel_type in ('email', 'slack')),
  -- Null until the send finishes.
  delivered boolean,
  error text,
  created_at timestamptz not null default now()
);

create index test_sends_user_created_idx on public.test_sends (user_id, created_at desc);
create index test_sends_created_idx on public.test_sends (created_at) where channel_type = 'email';
create index test_sends_destination_id_idx on public.test_sends (destination_id);

alter table public.test_sends enable row level security;

revoke all on public.test_sends from anon, authenticated;
grant select on public.test_sends to authenticated;

create policy "Users read their own test sends, admins read all"
  on public.test_sends for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

-- How much of the email budget is used at p_now. The one definition both the
-- tick and "Send test" count with.
--   An email notification counts when it was sent inside the window, or is
--   pending and was created inside it. A test send counts by when it was made.
--   user_hour: the hour ending at p_now. system_day: the UTC day of p_now.
-- p_now is a parameter so the tick's tests can pass their own clock.
create function public.email_usage(p_user_id uuid, p_now timestamptz)
returns table (user_hour integer, system_day integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select
      p_now - interval '1 hour' as hour_start,
      date_trunc('day', p_now at time zone 'utc') at time zone 'utc' as day_start
  ),
  used as (
    select n.user_id, coalesce(n.sent_at, n.created_at) as at
    from public.notifications n
    where n.channel_type = 'email'
      and n.status in ('sent', 'pending')
    union all
    select t.user_id, t.created_at
    from public.test_sends t
    where t.channel_type = 'email'
  )
  select
    count(*) filter (
      where used.user_id = p_user_id and used.at > bounds.hour_start and used.at <= p_now
    )::integer,
    count(*) filter (
      where used.at >= bounds.day_start and used.at < bounds.day_start + interval '1 day'
    )::integer
  from used, bounds;
$$;

revoke all on function public.email_usage(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.email_usage(uuid, timestamptz) to service_role;

-- SECURITY DEFINER, on purpose: "Send test" runs as the user, who may not
-- write test_sends or count other users' emails. This checks both email
-- limits and records the test in one step, so two clicks cannot both pass.
-- The limits are the same numbers as the tick's configuration in
-- src/lib/alerting/config.ts: 10 per user per hour, 80 per UTC day in all.
create function public.claim_test_send(p_destination_id uuid)
returns table (outcome text, test_send_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_channel text;
  v_usage record;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select d.channel_type into v_channel
  from public.destinations d
  where d.id = p_destination_id and d.user_id = v_user;

  if v_channel is null then
    raise exception 'destination not found' using errcode = 'P0002';
  end if;

  if v_channel = 'email' then
    -- Serialises concurrent claims, so the count below cannot be raced.
    perform pg_advisory_xact_lock(hashtext('email_budget'));
    select * into v_usage from public.email_usage(v_user, now());
    if v_usage.user_hour >= 10 then
      return query select 'hourly_limit'::text, null::uuid;
      return;
    end if;
    if v_usage.system_day >= 80 then
      return query select 'daily_limit'::text, null::uuid;
      return;
    end if;
  end if;

  insert into public.test_sends (user_id, destination_id, channel_type)
  values (v_user, p_destination_id, v_channel)
  returning id into v_id;

  return query select 'ok'::text, v_id;
end;
$$;

revoke all on function public.claim_test_send(uuid) from public, anon;
grant execute on function public.claim_test_send(uuid) to authenticated;

-- SECURITY DEFINER, on purpose: records the result of the caller's own
-- claimed test send, once. Nothing else in test_sends is writable.
create function public.finish_test_send(p_test_send_id uuid, p_delivered boolean, p_error text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.test_sends
  set delivered = p_delivered,
      error = case when p_delivered then null else left(p_error, 500) end
  where id = p_test_send_id
    and user_id = (select auth.uid())
    and delivered is null;

  if not found then
    raise exception 'test send not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.finish_test_send(uuid, boolean, text) from public, anon;
grant execute on function public.finish_test_send(uuid, boolean, text) to authenticated;
