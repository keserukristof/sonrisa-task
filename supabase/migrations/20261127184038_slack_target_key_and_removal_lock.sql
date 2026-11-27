-- Security audit of the increment 2 contracts (docs/reviews/2-security-auditor-contracts.md).

-- F1: slack_test_target returned the webhook URL to any holder of the
-- user's session, so a stolen session could read it and keep posting to the
-- channel after the session was revoked. #4 says the URL is never sent to
-- the browser again. It now also needs a key only the server holds: the
-- Vault secret `slack_target_key`, which the server knows as
-- SLACK_TARGET_KEY. A browser cannot supply it. Without the secret in Vault
-- it returns nothing, so Slack tests fail closed until it is set.
drop function public.slack_test_target(uuid);

-- SECURITY DEFINER, on purpose: the one narrow read of destinations.settings,
-- which no API role may select, and of the Vault secret that guards it.
create function public.slack_test_target(p_test_send_id uuid, p_key text)
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
    and d.channel_type = 'slack'
    and p_key is not null
    and p_key = (
      select s.decrypted_secret from vault.decrypted_secrets s
      where s.name = 'slack_target_key'
    );
$$;

revoke all on function public.slack_test_target(uuid, text) from public, anon;
grant execute on function public.slack_test_target(uuid, text) to authenticated;

-- F2: two removals at once could each see the other destination still
-- linked and leave an alert with none. Removal now takes the same
-- per-account lock as adding. SECURITY DEFINER for the reason given where it
-- was first created.
create or replace function public.remove_destination(p_destination_id uuid)
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

  perform pg_advisory_xact_lock(hashtext('slack_destinations:' || v_user::text));

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
