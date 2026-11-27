-- Increment 2 (#4, "Slack destinations"): adding, testing and removing Slack
-- incoming-webhook destinations.
--
-- Users still cannot write `destinations` directly: the webhook URL is a
-- secret that must never be readable from the browser, and the rules below
-- (the cap, unique names, the removal refusal) must hold however the API is
-- called. Every write goes through one of these functions.

-- 1. A destination's name is unique per account, ignoring case and the
-- spaces around it. "Account email" counts, so a Slack destination cannot
-- take that name.
create unique index destinations_user_name_idx
  on public.destinations (user_id, lower(btrim(name)));

-- 2. Adding a Slack destination.
-- SECURITY DEFINER, on purpose: users have no insert right on destinations,
-- so the settings column (the secret URL) stays unwritable and unreadable
-- through the API. This writes one row for the caller only, after checking
-- the cap under a per-account lock so two requests cannot both pass it.
-- The URL's full rule (Slack's host in production, the local stub elsewhere)
-- is the application's: the database checks only that it is a plausible
-- webhook URL, and the Slack channel re-validates every URL before sending.
create function public.add_slack_destination(p_name text, p_url text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_name, ''));
  v_url text := btrim(coalesce(p_url, ''));
  v_id uuid;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  if char_length(v_name) not between 1 and 60 then
    raise exception 'a destination name has 1 to 60 characters' using errcode = '23514';
  end if;

  if v_url !~ '^(https://hooks\.slack\.com/services/|http://127\.0\.0\.1:[0-9]{2,5}/slack/)[A-Za-z0-9/_-]+$' then
    raise exception 'not a Slack incoming webhook URL' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('slack_destinations:' || v_user::text));

  if (
    select count(*) from public.destinations
    where user_id = v_user and channel_type = 'slack'
  ) >= 10 then
    raise exception 'slack_destination_limit' using errcode = 'P0001',
      hint = 'An account has at most 10 Slack destinations.';
  end if;

  -- A duplicate name raises unique_violation (23505) from the index above.
  insert into public.destinations (user_id, channel_type, name, settings, hint)
  values (
    v_user,
    'slack',
    v_name,
    jsonb_build_object('url', v_url),
    'hooks.slack.com/…/' || right(v_url, 4)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.add_slack_destination(text, text) from public, anon;
grant execute on function public.add_slack_destination(text, text) to authenticated;

-- 3. Removing a Slack destination.
-- SECURITY DEFINER, on purpose: users have no delete right on destinations,
-- and removal also fails the destination's pending notifications, which
-- users may not write. It acts only on the caller's own Slack destination.
--   outcome 'ok'               removed; pending notifications failed with
--                              "The Slack destination was removed."
--   outcome 'only_destination' refused: it is the only destination of
--                              alert_count alerts. Nothing changes.
create function public.remove_destination(p_destination_id uuid)
returns table (outcome text, alert_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_count integer;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  -- Locks the row, so an alert cannot be pointed at it meanwhile.
  perform 1 from public.destinations
  where id = p_destination_id and user_id = v_user and channel_type = 'slack'
  for update;

  if not found then
    raise exception 'destination not found' using errcode = 'P0002';
  end if;

  select count(*)::integer into v_count
  from public.alert_destinations ad
  where ad.destination_id = p_destination_id
    and not exists (
      select 1 from public.alert_destinations other
      where other.alert_id = ad.alert_id
        and other.destination_id <> p_destination_id
    );

  if v_count > 0 then
    return query select 'only_destination'::text, v_count;
    return;
  end if;

  update public.notifications
  set status = 'failed',
      last_error = 'The Slack destination was removed.'
  where destination_id = p_destination_id
    and status = 'pending';

  delete from public.destinations where id = p_destination_id;

  return query select 'ok'::text, 0;
end;
$$;

revoke all on function public.remove_destination(uuid) from public, anon;
grant execute on function public.remove_destination(uuid) to authenticated;

-- 4. "Send test" learns Slack: 5 tests per Slack destination per UTC day,
-- with their own outcome, `slack_test_limit`. Slack tests use no email
-- budget. The email branch is unchanged from 20261127162316.
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
  v_destination_tests integer;
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
    if v_system_tests >= 20 then
      return query select 'system_test_limit'::text, null::uuid;
      return;
    end if;
    if v_usage.system_day >= 80 then
      return query select 'daily_limit'::text, null::uuid;
      return;
    end if;
  else
    perform pg_advisory_xact_lock(hashtext('slack_test:' || p_destination_id::text));

    select count(*)::integer into v_destination_tests
    from public.test_sends t
    where t.destination_id = p_destination_id and t.created_at >= v_day_start;

    if v_destination_tests >= 5 then
      return query select 'slack_test_limit'::text, null::uuid;
      return;
    end if;
  end if;

  insert into public.test_sends (user_id, destination_id, channel_type)
  values (v_user, p_destination_id, v_channel)
  returning id into v_id;

  return query select 'ok'::text, v_id;
end;
$$;

-- 5. Finishing a test send now also sets the destination's state:
-- a delivered test returns a broken Slack destination to active; a
-- permanent answer (p_broken_reason) marks it broken with that reason.
-- The old three-argument form is replaced; calls by name still work.
drop function public.finish_test_send(uuid, boolean, text);

-- SECURITY DEFINER, on purpose: records the result of the caller's own
-- claimed test send, once, and updates the state of that test's own
-- destination. Users cannot write test_sends or destinations otherwise.
create function public.finish_test_send(
  p_test_send_id uuid,
  p_delivered boolean,
  p_error text default null,
  p_broken_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_destination uuid;
begin
  update public.test_sends
  set delivered = p_delivered,
      error = case when p_delivered then null else left(p_error, 500) end
  where id = p_test_send_id
    and user_id = (select auth.uid())
    and delivered is null
  returning destination_id into v_destination;

  if not found then
    raise exception 'test send not found' using errcode = 'P0002';
  end if;

  if v_destination is null then
    return;
  end if;

  if p_delivered then
    update public.destinations
    set status = 'active', broken_reason = null
    where id = v_destination and channel_type = 'slack' and status = 'broken';
  elsif p_broken_reason is not null then
    update public.destinations
    set status = 'broken', broken_reason = left(p_broken_reason, 300)
    where id = v_destination and channel_type = 'slack';
  end if;
end;
$$;

revoke all on function public.finish_test_send(uuid, boolean, text, text) from public, anon;
grant execute on function public.finish_test_send(uuid, boolean, text, text) to authenticated;
