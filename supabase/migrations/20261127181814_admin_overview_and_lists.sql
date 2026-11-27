-- Increment 2 (#4, "Admin view"): the reads behind the admin overview and the
-- admin lists of users and notifications.
--
-- All are SECURITY INVOKER: an admin already reads every row of profiles,
-- alerts, events, notifications, test_sends and source_polls through Row
-- Level Security. Each also returns nothing unless the caller is an admin,
-- so a user calling them through the API learns nothing, not even their own
-- rows in a different shape. They exist because the lists join tables the
-- API cannot embed (no foreign key to profiles) and count in the database.

-- Today's email budget, counted exactly as the limits count it
-- (public.email_usage): sent or pending email notifications, by when they
-- were sent or created, plus email test sends, in the current UTC day.
create function public.admin_email_budget()
returns table (emails_today integer, test_sends_today integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with day as (
    select date_trunc('day', now() at time zone 'utc') at time zone 'utc' as start
  )
  select
    (
      (select count(*) from public.notifications n, day
        where n.channel_type = 'email'
          and n.status in ('sent', 'pending')
          and coalesce(n.sent_at, n.created_at) >= day.start
          and coalesce(n.sent_at, n.created_at) < day.start + interval '1 day')
      +
      (select count(*) from public.test_sends t, day
        where t.channel_type = 'email' and t.created_at >= day.start)
    )::integer,
    (select count(*) from public.test_sends t, day
      where t.channel_type = 'email' and t.created_at >= day.start)::integer
  where (select public.is_admin());
$$;

revoke all on function public.admin_email_budget() from public, anon;
grant execute on function public.admin_email_budget() to authenticated;

-- The latest poll of each source that has been polled, and its latest
-- successful poll. Sources never polled have no row; the overview lists
-- every known source and shows those as never polled.
create function public.admin_source_health()
returns table (
  source text,
  last_polled_at timestamptz,
  last_outcome text,
  last_error text,
  last_events_stored integer,
  last_success_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct on (p.source)
    p.source,
    p.polled_at,
    p.outcome,
    p.error,
    p.events_stored,
    (select max(s.polled_at) from public.source_polls s
      where s.source = p.source and s.outcome = 'ok')
  from public.source_polls p
  where (select public.is_admin())
  order by p.source, p.polled_at desc;
$$;

revoke all on function public.admin_source_health() from public, anon;
grant execute on function public.admin_source_health() to authenticated;

-- One page of users, newest sign-up first, with the number of alerts each
-- has. total_count is the number of users, for the pager.
create function public.admin_users(p_limit integer, p_offset integer)
returns table (
  user_id uuid,
  email text,
  role text,
  created_at timestamptz,
  alert_count integer,
  total_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    pr.user_id,
    pr.email,
    pr.role,
    pr.created_at,
    (select count(*) from public.alerts a where a.user_id = pr.user_id)::integer,
    (count(*) over ())::integer
  from public.profiles pr
  where (select public.is_admin())
  order by pr.created_at desc, pr.user_id
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.admin_users(integer, integer) from public, anon;
grant execute on function public.admin_users(integer, integer) to authenticated;

-- One page of notifications, newest first, optionally of one status, with
-- the event and the owner's email. total_count counts the filtered set.
-- p_status null means every status.
create function public.admin_notifications(p_status text, p_limit integer, p_offset integer)
returns table (
  id uuid,
  status text,
  channel_type text,
  attempts integer,
  last_error text,
  skip_reason text,
  sent_at timestamptz,
  next_attempt_at timestamptz,
  created_at timestamptz,
  event_title text,
  event_occurred_at timestamptz,
  event_simulated boolean,
  owner_email text,
  total_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    n.id,
    n.status,
    n.channel_type,
    n.attempts,
    n.last_error,
    n.skip_reason,
    n.sent_at,
    n.next_attempt_at,
    n.created_at,
    e.title,
    e.occurred_at,
    e.simulated,
    pr.email,
    (count(*) over ())::integer
  from public.notifications n
  join public.events e on e.id = n.event_id
  left join public.profiles pr on pr.user_id = n.user_id
  where (select public.is_admin())
    and (p_status is null or n.status = p_status)
  order by n.created_at desc, n.id
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.admin_notifications(text, integer, integer) from public, anon;
grant execute on function public.admin_notifications(text, integer, integer) to authenticated;
