-- Increment 2 contracts (#17): the Slack test target and the market cooldown.
begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

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

select is(
  public.slack_test_target((select id from claimed)),
  'https://hooks.slack.com/services/T000/B000/target01',
  'the owner gets the URL for a test send they just claimed');

select pg_temp.act_as('ffffffff-2222-4000-8000-000000000002');
select is(
  public.slack_test_target((select id from claimed)),
  null,
  'another user gets nothing for it');

select pg_temp.act_as('ffffffff-2222-4000-8000-000000000001');
select public.finish_test_send((select id from claimed), true);
select is(
  public.slack_test_target((select id from claimed)),
  null,
  'a finished test send gives nothing');

reset role;

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
