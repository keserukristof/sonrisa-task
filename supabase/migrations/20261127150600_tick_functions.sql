-- The two steps of the alerting tick that must be atomic, as functions the
-- tick calls with the secret key. The API cannot lock rows, and both steps
-- have to be safe when two ticks overlap: each claims its rows with
-- FOR UPDATE SKIP LOCKED. Everything else in the tick is plain reads and writes.
-- Only service_role may execute them.

-- True when p_word appears in p_text as a whole word, ignoring case:
-- 'art' is in "State of the art" but not in "Martinique". Punctuation in the
-- keyword is matched literally.
create function public.text_has_word(p_text text, p_word text)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select p_text ~* (
    '(^|[^[:alnum:]_])'
    || regexp_replace(p_word, '([][\\.^$*+?(){}|-])', '\\\1', 'g')
    || '($|[^[:alnum:]_])'
  );
$$;

revoke all on function public.text_has_word(text, text) from public, anon, authenticated;
grant execute on function public.text_has_word(text, text) to service_role;

-- Match and limit. For every event not yet matched: find the active alerts
-- it satisfies and create one notification per destination, then mark the
-- event matched. An alert matches when
--   the category is equal,
--   the event's severity is at or above the alert's minimum (news has none),
--   every keyword is a whole word of the title or summary,
--   the alert was created before the event was ingested,
-- and the destination is not broken.
-- An email notification is created as 'skipped', with the reason, when the
-- user's hour or the system's UTC day is already full (see email_usage);
-- otherwise as 'pending', due at p_now. The unique key on (event, destination)
-- makes a repeat harmless.
create function public.tick_match_events(
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
          v_created := v_created + 1;
        else
          v_skipped := v_skipped + 1;
        end if;
      end if;
    end loop;

    update public.events set matched_at = p_now where id = v_event.id;
    v_events := v_events + 1;
  end loop;

  return query select v_events, v_created, v_skipped;
end;
$$;

revoke all on function public.tick_match_events(timestamptz, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.tick_match_events(timestamptz, integer, integer, integer) to service_role;

-- Claim for delivery. Takes the pending notifications that are due, counts
-- the attempt, and moves their next attempt p_lease_seconds ahead, so an
-- overlapping tick does not send them too and a tick that dies leaves them
-- to be retried. Returns everything a channel needs to send each one. The
-- tick then records the outcome with a plain update:
--   sent    -> status 'sent', sent_at
--   retry   -> next_attempt_at, last_error; or status 'failed' when attempts ran out
--   broken  -> status 'failed', last_error, and the destination marked broken
create function public.tick_claim_notifications(
  p_now timestamptz,
  p_lease_seconds integer default 120,
  p_batch integer default 50
)
returns table (
  notification_id uuid,
  attempts integer,
  user_id uuid,
  channel_type text,
  destination_id uuid,
  destination_settings jsonb,
  alert_name text,
  event_title text,
  event_summary text,
  event_url text,
  event_category public.event_category,
  event_severity public.severity,
  event_occurred_at timestamptz,
  event_source text,
  event_simulated boolean
)
language sql
volatile
security invoker
set search_path = ''
as $$
  with due as (
    select n.id
    from public.notifications n
    where n.status = 'pending' and n.next_attempt_at <= p_now
    order by n.next_attempt_at
    limit p_batch
    for update skip locked
  ),
  claimed as (
    update public.notifications n
    set attempts = n.attempts + 1,
        next_attempt_at = p_now + make_interval(secs => p_lease_seconds)
    from due
    where n.id = due.id
    returning n.id, n.attempts, n.user_id, n.channel_type, n.destination_id, n.alert_id, n.event_id
  )
  select
    c.id, c.attempts, c.user_id, c.channel_type, c.destination_id, d.settings,
    a.name, e.title, e.summary, e.url, e.category, e.severity, e.occurred_at, e.source, e.simulated
  from claimed c
  join public.events e on e.id = c.event_id
  left join public.alerts a on a.id = c.alert_id
  left join public.destinations d on d.id = c.destination_id;
$$;

revoke all on function public.tick_claim_notifications(timestamptz, integer, integer) from public, anon, authenticated;
grant execute on function public.tick_claim_notifications(timestamptz, integer, integer) to service_role;
