-- Increment 2 contracts (#17) and their security audit
-- (docs/reviews/2-security-auditor-contracts.md): the Slack test target and
-- its server key, anonymous and cross-user calls, the admin reads for a
-- non-admin, and the market cooldown.
begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

-- The server key, as the database owner. Locally `scripts/local-env.mjs`
-- stores it; create one if this database has none.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'slack_target_key') then
    perform vault.create_secret(repeat('k', 64), 'slack_target_key');
  end if;
end $$;
create temp table server_key as
  select decrypted_secret as key from vault.decrypted_secrets where name = 'slack_target_key';
grant select on server_key to authenticated;

insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'ffffffff-2222-4000-8000-000000000001', 'authenticated', 'authenticated', 'inc2-target@heads-up.test'),
  ('00000000-0000-0000-0000-000000000000', 'ffffffff-2222-4000-8000-000000000002', 'authenticated', 'authenticated', 'inc2-stranger@heads-up.test');

create function pg_temp.act_as(p_user uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true);
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

select pg_temp.act_as('ffffffff-2222-4000-8000-000000000001');
select public.add_slack_destination('Target', 'https://hooks.slack.com/services/T000/B000/target01');
create temp table claimed as
  select (public.claim_test_send((select id from public.destinations where name = 'Target' and user_id = 'ffffffff-2222-4000-8000-000000000001'))).test_send_id as id;
grant select on claimed to authenticated;

-- The URL needs the server's key ---------------------------------------------

select is(
  public.slack_test_target((select id from claimed), (select key from server_key)),
  'https://hooks.slack.com/services/T000/B000/target01',
  'the owner''s server gets the URL for a test send just claimed');

select is(
  public.slack_test_target((select id from claimed), 'not-the-key'),
  null,
  'a wrong key gets nothing: a browser with the session cannot read the URL');

select is(
  public.slack_test_target((select id from claimed), null),
  null,
  'no key gets nothing');

-- Another user ---------------------------------------------------------------

select pg_temp.act_as('ffffffff-2222-4000-8000-000000000002');

select is(
  public.slack_test_target((select id from claimed), (select key from server_key)),
  null,
  'another user gets nothing for it, even with the key');

select throws_ok(
  $$ select public.claim_test_send((select id from public.destinations where name = 'Target' and user_id = 'ffffffff-2222-4000-8000-000000000001')) $$,
  'P0002', null,
  'another user cannot claim a test of it');

select throws_ok(
  $$ select public.finish_test_send((select id from claimed), false, 'x', 'Marked broken by a stranger.') $$,
  'P0002', null,
  'another user cannot finish its test send or mark it broken');

select is(
  (select count(*)::int from public.admin_email_budget()) + (select count(*)::int from public.admin_source_health())
    + (select count(*)::int from public.admin_notifications(null, 100, 0)),
  0,
  'a non-admin gets nothing from the admin budget, source health and notifications');

-- Expiry and finishing -------------------------------------------------------

reset role;
update public.test_sends set created_at = now() - interval '2 minutes' where id = (select id from claimed);
select pg_temp.act_as('ffffffff-2222-4000-8000-000000000001');

select is(
  public.slack_test_target((select id from claimed), (select key from server_key)),
  null,
  'a test send claimed more than a minute ago gives nothing');

reset role;
update public.test_sends set created_at = now() where id = (select id from claimed);
select pg_temp.act_as('ffffffff-2222-4000-8000-000000000001');
select public.finish_test_send((select id from claimed), true);

select is(
  public.slack_test_target((select id from claimed), (select key from server_key)),
  null,
  'a finished test send gives nothing');

-- An anonymous visitor -------------------------------------------------------

reset role;
select ok(not has_function_privilege('anon', 'public.slack_test_target(uuid, text)', 'execute'), 'anon cannot read a Slack test target');
select ok(not has_function_privilege('anon', 'public.add_slack_destination(text, text)', 'execute'), 'anon cannot add a Slack destination');
select ok(not has_function_privilege('anon', 'public.remove_destination(uuid)', 'execute'), 'anon cannot remove a destination');
select ok(not has_function_privilege('anon', 'public.admin_notifications(text, integer, integer)', 'execute'), 'anon cannot call the admin reads');
select ok(not has_function_privilege('anon', 'public.finish_test_send(uuid, boolean, text, text)', 'execute'), 'anon cannot finish a test send');

-- At most one market event per coin per 6 hours ----------------------------

insert into public.events (source, external_id, category, severity, title, occurred_at)
values ('coingecko', 'inc2coin:2026-11-27T10', 'markets', 'moderate', 'Inc2 coin up', '2026-11-27 10:00+00');
insert into public.events (source, external_id, category, severity, title, occurred_at)
values ('coingecko', 'inc2coin:2026-11-27T15', 'markets', 'moderate', 'Inc2 coin up again', '2026-11-27 15:59+00');
select is(
  (select count(*)::int from public.events where source = 'coingecko' and external_id like 'inc2coin:%'),
  1,
  'a second event for a coin within 6 hours is not stored');

insert into public.events (source, external_id, category, severity, title, occurred_at)
values ('coingecko', 'inc2coin:2026-11-27T16', 'markets', 'moderate', 'Inc2 coin down', '2026-11-27 16:01+00');
select is(
  (select count(*)::int from public.events where source = 'coingecko' and external_id like 'inc2coin:%'),
  2,
  'an event for the coin more than 6 hours later is stored');

insert into public.events (source, external_id, category, severity, title, occurred_at)
values ('coingecko', 'inc2other:2026-11-27T10', 'markets', 'moderate', 'Inc2 other coin', '2026-11-27 10:30+00');
select is(
  (select count(*)::int from public.events where source = 'coingecko' and external_id like 'inc2other:%'),
  1,
  'another coin is not affected');

select * from finish();
rollback;
