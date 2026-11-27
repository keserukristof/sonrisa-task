-- Hardening after the security audit of the Contracts ticket
-- (docs/reviews/1-security-auditor-contracts.md).

-- 1. Keywords are user input that the tick turns into a regular expression.
-- A user can write alerts through the API directly, past the form's checks,
-- so the limits have to hold here: each keyword 1 to 40 characters, trimmed
-- and lowercase. An oversized keyword made the regex engine fail and stopped
-- matching for every user.
create function public.keywords_valid(p_keywords text[])
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select coalesce(
    bool_and(k is not null and char_length(k) between 1 and 40 and k = lower(btrim(k))),
    true
  )
  from unnest(p_keywords) as k;
$$;

revoke all on function public.keywords_valid(text[]) from public, anon;
grant execute on function public.keywords_valid(text[]) to authenticated, service_role;

alter table public.alerts
  add constraint alerts_keywords_valid check (public.keywords_valid(keywords));

-- 2. Nothing limited how many alerts one account could create through the
-- API, and every alert is work for each tick.
create function public.enforce_alert_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select count(*) from public.alerts where user_id = new.user_id) >= 50 then
    raise exception 'an account can have 50 alerts at most' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_alert_limit() from public, anon;

create trigger alerts_enforce_limit
  before insert on public.alerts
  for each row execute function public.enforce_alert_limit();

-- 3. An event that arrives while an alert is paused must never match it,
-- even if the tick only gets to the event after the alert was resumed.
-- activated_at is when the alert last became active; matching compares the
-- event's arrival with it. Users cannot write the column.
alter table public.alerts
  add column activated_at timestamptz not null default now();

update public.alerts set activated_at = created_at;

create function public.set_activated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.active and not old.active then
    new.activated_at := now();
  end if;
  return new;
end;
$$;

revoke all on function public.set_activated_at() from public, anon, authenticated;

create trigger alerts_set_activated_at
  before update on public.alerts
  for each row execute function public.set_activated_at();

-- 4. Two admins demoting each other at the same moment could leave no admin.
-- SECURITY DEFINER for the reason given where it was first created.
create or replace function public.set_user_role(p_user_id uuid, p_role text)
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

  -- One role change at a time, so the count below cannot be raced.
  perform pg_advisory_xact_lock(hashtext('user_roles'));

  if p_role = 'user'
     and not exists (
       select 1 from public.profiles where role = 'admin' and user_id <> p_user_id
     ) then
    raise exception 'the last admin cannot be demoted' using errcode = '42501';
  end if;

  update public.profiles set role = p_role where user_id = p_user_id;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
end;
$$;

-- 5. A claimed test send counts toward the email budget whether or not an
-- email follows, so one account could claim ten an hour, send nothing, and
-- use up the system's 80 a day for everyone. Two more limits bound that:
-- an account gets 3 test sends per UTC day, and all test sends together get
-- 20 of the system's 80, so alert emails always keep at least 60.
-- SECURITY DEFINER for the reason given where it was first created.
create or replace function public.claim_test_send(p_destination_id uuid)
returns table (outcome text, test_send_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_channel text;
  v_usage record;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_user_tests integer;
  v_system_tests integer;
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
    -- Serialises concurrent claims and the tick's matching.
    perform pg_advisory_xact_lock(hashtext('email_budget'));

    select
      count(*) filter (where t.user_id = v_user)::integer,
      count(*)::integer
    into v_user_tests, v_system_tests
    from public.test_sends t
    where t.channel_type = 'email' and t.created_at >= v_day_start;

    if v_user_tests >= 3 then
      return query select 'test_limit'::text, null::uuid;
      return;
    end if;

    select * into v_usage from public.email_usage(v_user, now());
    if v_usage.user_hour >= 10 then
      return query select 'hourly_limit'::text, null::uuid;
      return;
    end if;
    if v_system_tests >= 20 or v_usage.system_day >= 80 then
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

-- 6. Matching again, with two changes: the alert must have been active since
-- before the event arrived (point 3), and one event that fails no longer
-- stops the rest of the batch. A failed event stays unmatched, is reported
-- as a warning, and is tried again by the next tick.
create or replace function public.tick_match_events(
  p_now timestamptz,
  p_emails_per_user_per_hour integer,
  p_emails_per_system_per_day integer,
  p_batch integer default 200
)
returns table (events_matched integer, notifications_created integer, notifications_skipped integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event record;
  v_target record;
  v_usage record;
  v_status text;
  v_reason text;
  v_events integer := 0;
  v_created integer := 0;
  v_skipped integer := 0;
  v_event_created integer;
  v_event_skipped integer;
begin
  -- One budget, one counter at a time: "Send test" takes the same lock.
  perform pg_advisory_xact_lock(hashtext('email_budget'));

  for v_event in
    select e.id, e.category, e.severity, e.title, e.summary, e.ingested_at
    from public.events e
    where e.matched_at is null
    order by e.ingested_at
    limit p_batch
    for update skip locked
  loop
    begin
      v_event_created := 0;
      v_event_skipped := 0;

      for v_target in
        select distinct on (d.id)
          a.id as alert_id, a.user_id, d.id as destination_id, d.channel_type
        from public.alerts a
        join public.alert_destinations ad on ad.alert_id = a.id
        join public.destinations d on d.id = ad.destination_id
        where a.active
          and a.category = v_event.category
          and (a.min_severity is null or v_event.severity >= a.min_severity)
          and a.created_at < v_event.ingested_at
          and a.activated_at < v_event.ingested_at
          and d.status = 'active'
          and not exists (
            select 1
            from unnest(a.keywords) as k (keyword)
            where not public.text_has_word(
              v_event.title || ' ' || coalesce(v_event.summary, ''), k.keyword
            )
          )
        order by d.id, a.created_at
      loop
        v_status := 'pending';
        v_reason := null;

        if v_target.channel_type = 'email' then
          select * into v_usage from public.email_usage(v_target.user_id, p_now);
          if v_usage.user_hour >= p_emails_per_user_per_hour then
            v_status := 'skipped';
            v_reason := format('Hourly limit (%s) reached', p_emails_per_user_per_hour);
          elsif v_usage.system_day >= p_emails_per_system_per_day then
            v_status := 'skipped';
            v_reason := format('Daily system limit (%s) reached', p_emails_per_system_per_day);
          end if;
        end if;

        insert into public.notifications (
          event_id, alert_id, destination_id, user_id, channel_type,
          status, skip_reason, next_attempt_at, created_at
        )
        values (
          v_event.id, v_target.alert_id, v_target.destination_id, v_target.user_id,
          v_target.channel_type, v_status, v_reason, p_now, p_now
        )
        on conflict (event_id, destination_id) do nothing;

        if found then
          if v_status = 'pending' then
            v_event_created := v_event_created + 1;
          else
            v_event_skipped := v_event_skipped + 1;
          end if;
        end if;
      end loop;

      update public.events set matched_at = p_now where id = v_event.id;

      v_events := v_events + 1;
      v_created := v_created + v_event_created;
      v_skipped := v_skipped + v_event_skipped;
    exception when others then
      raise warning 'tick_match_events: event % was not matched: %', v_event.id, sqlerrm;
    end;
  end loop;

  return query select v_events, v_created, v_skipped;
end;
$$;
