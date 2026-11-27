-- Events reported by sources, simulated events, and the record of each poll.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  -- The source's identifier, such as 'usgs'. 'simulated' is reserved.
  source text not null,
  external_id text not null,
  category public.event_category not null,
  severity public.severity not null,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  summary text,
  url text,
  occurred_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  simulated boolean not null default false,
  raw jsonb not null default '{}'::jsonb,
  -- Set by the tick once the event has been matched against alerts.
  matched_at timestamptz,
  unique (source, external_id),
  constraint events_simulated_source check ((source = 'simulated') = simulated)
);

create index events_unmatched_idx on public.events (ingested_at) where matched_at is null;
create index events_ingested_at_idx on public.events (ingested_at desc);

alter table public.events enable row level security;

revoke all on public.events from anon, authenticated;
grant select on public.events to authenticated;

create policy "Signed-in users read events"
  on public.events for select
  to authenticated
  using (true);

-- SECURITY DEFINER, on purpose: nobody may insert events directly. The tick
-- writes them with the secret key; this is the one other way in, and it
-- checks that the caller is an admin and marks the event as simulated.
create function public.simulate_event(
  p_category public.event_category,
  p_severity public.severity,
  p_title text,
  p_summary text default null,
  p_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not (select public.is_admin()) then
    raise exception 'only an admin can simulate an event' using errcode = '42501';
  end if;
  if p_url is not null and p_url !~* '^https?://' then
    raise exception 'the link must start with http:// or https://' using errcode = '22023';
  end if;

  insert into public.events (
    source, external_id, category, severity, title, summary, url, occurred_at, simulated
  )
  values (
    'simulated',
    gen_random_uuid()::text,
    p_category,
    -- News events are always low severity.
    case when p_category = 'news' then 'low'::public.severity else p_severity end,
    btrim(p_title),
    nullif(btrim(p_summary), ''),
    nullif(btrim(p_url), ''),
    now(),
    true
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.simulate_event(public.event_category, public.severity, text, text, text) from public, anon;
grant execute on function public.simulate_event(public.event_category, public.severity, text, text, text) to authenticated;

create table public.source_polls (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  polled_at timestamptz not null default now(),
  outcome text not null check (outcome in ('ok', 'error')),
  error text,
  events_stored integer not null default 0
);

create index source_polls_source_polled_at_idx on public.source_polls (source, polled_at desc);

alter table public.source_polls enable row level security;

revoke all on public.source_polls from anon, authenticated;
grant select on public.source_polls to authenticated;

create policy "Admins read source polls"
  on public.source_polls for select
  to authenticated
  using ((select public.is_admin()));
