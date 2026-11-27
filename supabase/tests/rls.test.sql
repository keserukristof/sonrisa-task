-- Row Level Security and privilege tests for increment 1.
-- Each check runs as a real API role with a user's JWT claims, never as the owner.
begin;

create extension if not exists pgtap with schema extensions;

select plan(38);

-- Three accounts: two users and an admin. The new-user trigger gives each a
-- profile and an email destination.
insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-a@heads-up.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'rls-b@heads-up.test'),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'rls-admin@heads-up.test');

update public.profiles set role = 'admin' where user_id = 'cccccccc-0000-4000-8000-000000000003';

create function pg_temp.act_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end $$;

create function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end $$;

create function pg_temp.rows_changed(p_sql text) returns integer language plpgsql as $$
declare v_count integer;
begin
  execute p_sql;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

create function pg_temp.act_as_owner() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Fixtures written as the owner, for the tables only the tick writes.
insert into public.events (id, source, external_id, category, severity, title, occurred_at)
values ('eeeeeeee-0000-4000-8000-000000000001', 'usgs', 'rls-test-1', 'natural_disasters', 'high', 'RLS test quake', now());

insert into public.notifications (id, event_id, destination_id, user_id, channel_type, status)
select 'dddddddd-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-000000000001', d.id, d.user_id, 'email', 'sent'
from public.destinations d where d.user_id = 'aaaaaaaa-0000-4000-8000-000000000001';

insert into public.source_polls (source, outcome) values ('usgs', 'ok');

-- The scheduler's own schema is closed to the API roles. (pg_net's schema
-- cannot be closed from a migration: see the scheduler migration.)
select ok(not has_schema_privilege('authenticated', 'private', 'usage'), 'authenticated has no usage on the private schema');

-- New accounts.
select is(
  (select count(*)::int from public.destinations where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' and channel_type = 'email'),
  1, 'a new account gets exactly one email destination');
select is(
  (select role from public.profiles where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'user', 'a new account gets a profile with the user role');

-- User A.
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');

select is((select count(*)::int from public.profiles), 1, 'a user reads only their own profile');
select is((select count(*)::int from (select id from public.destinations) d), 1, 'a user reads only their own destinations');
select throws_ok('select settings from public.destinations', '42501', null, 'nobody signed in can read destination settings');
select throws_ok(
  $$insert into public.destinations (user_id, channel_type, name) values ('aaaaaaaa-0000-4000-8000-000000000001', 'slack', 'x')$$,
  '42501', null, 'a user cannot insert a destination directly');

select lives_ok(
  $$select public.save_alert(null, 'RLS alert A', 'natural_disasters', 'moderate', '{japan}',
      array(select id from public.destinations where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'))$$,
  'a user creates an alert with their own destination');
select is((select count(*)::int from public.alerts where name = 'RLS alert A'), 1, 'the user reads the alert they created');
select is((select count(*)::int from public.alert_destinations), 1, 'the alert is linked to its destination');
select throws_ok(
  $$select public.save_alert(null, 'No destination', 'natural_disasters', 'moderate', '{}', '{}')$$,
  '23514', null, 'an alert without a destination is refused');
select throws_ok(
  $$insert into public.alerts (name, category, min_severity) values ('News with severity', 'news', 'low')$$,
  '23514', null, 'a news alert with a severity is refused');
select throws_ok(
  $$update public.alerts set created_at = now() - interval '1 year' where name = 'RLS alert A'$$,
  '42501', null, 'a user cannot change when an alert was created');
select throws_ok(
  $$insert into public.alerts (name, category, min_severity, user_id) values ('For someone else', 'natural_disasters', 'low', 'bbbbbbbb-0000-4000-8000-000000000002')$$,
  '42501', null, 'a user cannot create an alert for another user');

select is((select count(*)::int from public.notifications), 1, 'a user reads their own notifications');
select throws_ok(
  $$update public.notifications set status = 'pending'$$,
  '42501', null, 'a user cannot change a notification');
select is((select count(*)::int from public.events where external_id = 'rls-test-1'), 1, 'a signed-in user reads events');
select throws_ok(
  $$insert into public.events (source, external_id, category, severity, title, occurred_at) values ('usgs', 'x', 'news', 'low', 'x', now())$$,
  '42501', null, 'a user cannot insert an event');
select is((select count(*)::int from public.source_polls), 0, 'a user reads no source polls');
select throws_ok(
  $$select public.simulate_event('natural_disasters', 'high', 'Not allowed')$$,
  '42501', null, 'a user cannot simulate an event');
select throws_ok(
  $$select public.set_user_role('bbbbbbbb-0000-4000-8000-000000000002', 'admin')$$,
  '42501', null, 'a user cannot change a role');
select throws_ok(
  $$select * from public.email_usage('aaaaaaaa-0000-4000-8000-000000000001', now())$$,
  '42501', null, 'a user cannot read the email budget directly');

select is(
  (select outcome from public.claim_test_send((select id from public.destinations limit 1))),
  'ok', 'a user claims a test send for their own destination');
select is((select count(*)::int from public.test_sends), 1, 'the test send is recorded');
select lives_ok(
  $$select public.finish_test_send((select id from public.test_sends limit 1), true)$$,
  'the user records the result of their test send');
select throws_ok(
  $$select public.finish_test_send((select id from public.test_sends limit 1), false, 'again')$$,
  'P0002', null, 'a test send result is recorded only once');

-- User B.
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');

select is((select count(*)::int from public.alerts where name = 'RLS alert A'), 0, 'another user cannot read the alert');
select is(
  pg_temp.rows_changed($$update public.alerts set active = false where name = 'RLS alert A'$$),
  0, 'another user cannot update the alert');
select is(
  pg_temp.rows_changed($$delete from public.alerts where name = 'RLS alert A'$$),
  0, 'another user cannot delete the alert');
select is((select count(*)::int from public.notifications), 0, 'another user cannot read the notifications');
select is((select count(*)::int from public.test_sends), 0, 'another user cannot read the test sends');
select throws_ok(
  $$select public.save_alert(null, 'Borrowed destination', 'natural_disasters', 'low', '{}',
      array['00000000-0000-4000-8000-00000000dead'::uuid])$$,
  '23503', null, 'an alert cannot link a destination that is not the user''s own');
select throws_ok(
  $$select * from public.claim_test_send('00000000-0000-4000-8000-00000000dead')$$,
  'P0002', null, 'a user cannot test a destination that is not their own');

-- An anonymous visitor.
select pg_temp.act_as_anon();

select throws_ok('select id from public.alerts', '42501', null, 'an anonymous visitor cannot read alerts');
select throws_ok('select id from public.notifications', '42501', null, 'an anonymous visitor cannot read notifications');

-- The admin.
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');

select ok((select count(*) from public.profiles) >= 3, 'an admin reads all profiles');
select ok((select count(*) from public.source_polls) >= 1, 'an admin reads source polls');
select throws_ok(
  $$select public.set_user_role('cccccccc-0000-4000-8000-000000000003', 'user')$$,
  '42501', null, 'an admin cannot change their own role');

select * from finish();
rollback;
