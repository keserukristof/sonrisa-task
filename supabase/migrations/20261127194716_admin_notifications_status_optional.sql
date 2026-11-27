-- Build of increment 2 (#25): the status filter's "All" is a null p_status,
-- but the generated types required a string, which pushed a cast into the
-- query. Defaults make the parameters optional; the body is unchanged from
-- 20261127181814. Grants carry over with `create or replace`.
create or replace function public.admin_notifications(
  p_status text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
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
