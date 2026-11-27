-- Increment 2 contracts (#17): the news keyword rule, Slack destinations
-- (add, cap, names, removal, test limit, broken state) and the admin reads.
-- Every assertion counts only this file's own users' rows: the local
-- database is shared with other tests and the seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(27);

insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-2222-4000-8000-000000000001', 'authenticated', 'authenticated', 'inc2-owner@heads-up.test'),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-2222-4000-8000-000000000002', 'authenticated', 'authenticated', 'inc2-other@heads-up.test'),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-2222-4000-8000-000000000003', 'authenticated', 'authenticated', 'inc2-admin@heads-up.test');

update public.profiles set role = 'admin' where user_id = 'eeeeeeee-2222-4000-8000-000000000003';

create function pg_temp.act_as(p_user uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true);
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

-- News alerts need a keyword -----------------------------------------------

select pg_temp.act_as('eeeeeeee-2222-4000-8000-000000000001');

select throws_ok(
  $$ insert into public.alerts (name, category, min_severity, keywords) values ('All news', 'news', null, '{}') $$,
  '23514', null,
  'an active news alert with no keyword is refused');

select lives_ok(
  $$ insert into public.alerts (name, category, min_severity, keywords, active) values ('Paused news', 'news', null, '{}', false) $$,
  'a paused news alert may have no keyword');

select throws_ok(
  $$ update public.alerts set active = true where name = 'Paused news' and user_id = 'eeeeeeee-2222-4000-8000-000000000001' $$,
  '23514', null,
  'resuming a news alert with no keyword is refused');

select lives_ok(
  $$ insert into public.alerts (name, category, min_severity, keywords) values ('Rates', 'news', null, '{rates}') $$,
  'a news alert with a keyword is accepted');

-- Adding Slack destinations ------------------------------------------------

select lives_ok(
  $$ select public.add_slack_destination('  Ops channel ', 'https://hooks.slack.com/services/T000/B000/abcdWXYZ') $$,
  'the owner adds a Slack destination');

select is(
  (select hint from public.destinations where user_id = 'eeeeeeee-2222-4000-8000-000000000001' and name = 'Ops channel'),
  'hooks.slack.com/…/WXYZ',
  'the name is trimmed and the hint is the URL''s last 4 characters');

select throws_ok(
  $$ select settings from public.destinations $$,
  '42501', null,
  'the settings column, which holds the URL, is not readable');

select throws_ok(
  $$ select public.add_slack_destination('ops CHANNEL', 'https://hooks.slack.com/services/T000/B000/other') $$,
  '23505', null,
  'a second destination with the same name, ignoring case, is refused');

select throws_ok(
  $$ select public.add_slack_destination('Account Email', 'https://hooks.slack.com/services/T000/B000/other') $$,
  '23505', null,
  'a Slack destination cannot take the email destination''s name');

select throws_ok(
  $$ select public.add_slack_destination('Elsewhere', 'https://example.com/services/T000/B000/x') $$,
  '22023', null,
  'a URL that is not a Slack incoming webhook is refused');

select throws_ok(
  $$ select public.add_slack_destination(repeat('n', 61), 'https://hooks.slack.com/services/T000/B000/x') $$,
  '23514', null,
  'a name over 60 characters is refused');

select lives_ok(
  $$ select public.add_slack_destination('Stub ' || n, 'http://127.0.0.1:4100/slack/stub' || n) from generate_series(2, 10) as n $$,
  'up to 10 Slack destinations are accepted, the local stub URL included');

select throws_ok(
  $$ select public.add_slack_destination('Eleventh', 'https://hooks.slack.com/services/T000/B000/x11') $$,
  'P0001', 'slack_destination_limit',
  'the 11th Slack destination is refused, naming the limit');

-- Slack test sends ---------------------------------------------------------

select is(
  (select array_agg(c.outcome) from (
    select (public.claim_test_send(d.id)).outcome
    from public.destinations d, generate_series(1, 6)
    where d.user_id = 'eeeeeeee-2222-4000-8000-000000000001' and d.name = 'Stub 2'
  ) c),
  array['ok', 'ok', 'ok', 'ok', 'ok', 'slack_test_limit'],
  'a Slack destination gets 5 tests a UTC day, then slack_test_limit');

select is(
  (select count(*)::int from public.test_sends where user_id = 'eeeeeeee-2222-4000-8000-000000000001' and channel_type = 'email'),
  0,
  'Slack tests use no email budget');

-- A permanent answer marks the destination broken; a delivered test heals it.
select lives_ok(
  $$ select public.finish_test_send(
       (select id from public.test_sends t where t.user_id = 'eeeeeeee-2222-4000-8000-000000000001' and t.delivered is null order by t.created_at, t.id limit 1),
       false, 'channel_not_found', 'Slack says this channel no longer exists.') $$,
  'finishing a failed test with a broken reason');

select is(
  (select status || ': ' || broken_reason from public.destinations where user_id = 'eeeeeeee-2222-4000-8000-000000000001' and name = 'Stub 2'),
  'broken: Slack says this channel no longer exists.',
  'the destination is broken with the reason');

select lives_ok(
  $$ select public.finish_test_send(
       (select id from public.test_sends t where t.user_id = 'eeeeeeee-2222-4000-8000-000000000001' and t.delivered is null order by t.created_at, t.id limit 1),
       true) $$,
  'finishing a delivered test');

select is(
  (select status from public.destinations where user_id = 'eeeeeeee-2222-4000-8000-000000000001' and name = 'Stub 2'),
  'active',
  'a delivered test returns a broken destination to active');

-- Removing Slack destinations ----------------------------------------------

-- "Only Ops" sends only to Ops channel; "Both" also to the account email.
select public.save_alert(null, 'Only Ops', 'natural_disasters', 'high', '{}',
  array[(select id from public.destinations where user_id = 'eeeeeeee-2222-4000-8000-000000000001' and name = 'Ops channel')]);
select public.save_alert(null, 'Both', 'natural_disasters', 'high', '{}',
  array(select id from public.destinations where user_id = 'eeeeeeee-2222-4000-8000-000000000001' and name in ('Ops channel', 'Account email')));

select is(
  (select row(r.outcome, r.alert_count)::text from public.remove_destination(
    (select id from public.destinations where user_id = 'eeeeeeee-2222-4000-8000-000000000001' and name = 'Ops channel')) r),
  '(only_destination,1)',
  'removing the only destination of an alert is refused with the count');

select pg_temp.act_as('eeeeeeee-2222-4000-8000-000000000002');

select throws_ok(
  $$ select public.remove_destination((select id from public.destinations where name = 'Stub 3' limit 1)) $$,
  'P0002', null,
  'another user cannot remove it (nor see it)');

select pg_temp.act_as('eeeeeeee-2222-4000-8000-000000000001');

select throws_ok(
  $$ select public.remove_destination((select id from public.destinations where user_id = 'eeeeeeee-2222-4000-8000-000000000001' and channel_type = 'email')) $$,
  'P0002', null,
  'the email destination cannot be removed');

-- A pending notification of Stub 3, inserted as the owner of the database.
reset role;
insert into public.events (id, source, external_id, category, severity, title, occurred_at)
values ('eeeeeeee-2222-4000-8000-0000000000e1', 'usgs', 'inc2-test-event', 'natural_disasters', 'high', 'Inc2 test quake', now());
insert into public.notifications (event_id, destination_id, user_id, channel_type)
select 'eeeeeeee-2222-4000-8000-0000000000e1', d.id, d.user_id, 'slack'
from public.destinations d where d.user_id = 'eeeeeeee-2222-4000-8000-000000000001' and d.name = 'Stub 3';
select pg_temp.act_as('eeeeeeee-2222-4000-8000-000000000001');

select is(
  (select r.outcome from public.remove_destination(
    (select id from public.destinations where user_id = 'eeeeeeee-2222-4000-8000-000000000001' and name = 'Stub 3')) r),
  'ok',
  'a destination no alert depends on alone is removed');

select is(
  (select status || ': ' || last_error from public.notifications where event_id = 'eeeeeeee-2222-4000-8000-0000000000e1'),
  'failed: The Slack destination was removed.',
  'its pending notifications fail with the reason');

-- Admin reads --------------------------------------------------------------

select is(
  (select count(*)::int from public.admin_users(100, 0)),
  0,
  'a user gets no rows from admin_users');

select pg_temp.act_as('eeeeeeee-2222-4000-8000-000000000003');

select is(
  (select alert_count from public.admin_users(100, 0) where email = 'inc2-owner@heads-up.test'),
  4,
  'an admin sees each user with their number of alerts');

select is(
  (select owner_email || ' ' || status from public.admin_notifications('failed', 100, 0) where event_title = 'Inc2 test quake'),
  'inc2-owner@heads-up.test failed',
  'an admin sees notifications with the owner''s email, filtered by status');

select * from finish();
rollback;
