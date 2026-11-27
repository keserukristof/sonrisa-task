-- Increment 2 (#4), two rules found while writing the tickets' contracts.

-- 1. "Send test" for a Slack destination runs as the user, who cannot read
-- destinations.settings, where the webhook URL is. This returns the URL of
-- the caller's own Slack destination for one test send the caller claimed
-- with claim_test_send in the last minute and has not finished, and nothing
-- otherwise. The URL reaches the server action that sends the test, never
-- the page. A user calling it through the API can read only a URL they
-- pasted themselves, and only right after claiming one of their daily tests.
-- SECURITY DEFINER, on purpose: it is the one narrow read of the settings
-- column, which no API role may select.
create function public.slack_test_target(p_test_send_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select d.settings ->> 'url'
  from public.test_sends t
  join public.destinations d on d.id = t.destination_id
  where t.id = p_test_send_id
    and t.user_id = (select auth.uid())
    and t.delivered is null
    and t.created_at > now() - interval '1 minute'
    and d.user_id = t.user_id
    and d.channel_type = 'slack';
$$;

revoke all on function public.slack_test_target(uuid) from public, anon;
grant execute on function public.slack_test_target(uuid) to authenticated;

-- 2. At most one market event per coin per 6 hours (story 43). A source never
-- touches the database, so it cannot know what it reported before; the rule
-- lives here. CoinGecko's external id is "<coin id>:<anything>", and an event
-- for a coin that already has one in the 6 hours before it is not stored.
-- The tick inserts candidates ignoring conflicts, and this trigger drops the
-- row the same quiet way (a BEFORE trigger returning null).
create function public.skip_repeated_market_event()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.source = 'coingecko' and exists (
    select 1 from public.events e
    where e.source = 'coingecko'
      and split_part(e.external_id, ':', 1) = split_part(new.external_id, ':', 1)
      and e.occurred_at > new.occurred_at - interval '6 hours'
      and e.occurred_at <= new.occurred_at
  ) then
    return null;
  end if;
  return new;
end;
$$;

revoke all on function public.skip_repeated_market_event() from public, anon, authenticated;

create index events_coingecko_coin_idx
  on public.events (split_part(external_id, ':', 1), occurred_at desc)
  where source = 'coingecko';

create trigger events_skip_repeated_market_event
  before insert on public.events
  for each row execute function public.skip_repeated_market_event();
