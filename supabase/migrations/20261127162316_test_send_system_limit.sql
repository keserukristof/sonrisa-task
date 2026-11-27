-- Review of increment 1 (docs/reviews/1-code-review.md, spec finding 2):
-- "Send test" reported the 20-test-sends-a-day cap as the system's 80-email
-- limit. The cap now has its own outcome, `system_test_limit`, so the reason
-- shown names the limit that was reached. Nothing else in the function
-- changes; grants carry over with `create or replace`.
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
    if v_system_tests >= 20 then
      return query select 'system_test_limit'::text, null::uuid;
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
