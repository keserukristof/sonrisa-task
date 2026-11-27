-- Checks added after the security audit of the Contracts ticket
-- (docs/reviews/1-security-auditor-contracts.md).
begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-2222-4000-8000-000000000001', 'authenticated', 'authenticated', 'hard-a@heads-up.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-2222-4000-8000-000000000002', 'authenticated', 'authenticated', 'hard-b@heads-up.test');

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

create function pg_temp.act_as_owner() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- An alert of A's, paused and resumed after an event arrived.
insert into public.alerts (id, user_id, name, category, min_severity, created_at, activated_at)
values ('a4000000-0000-4000-8000-000000000001', 'aaaaaaaa-2222-4000-8000-000000000001', 'Hardening alert', 'natural_disasters', 'low', '2091-01-01 00:00+00', '2091-01-03 00:00+00');
insert into public.alert_destinations (alert_id, destination_id, user_id)
select 'a4000000-0000-4000-8000-000000000001', d.id, d.user_id
from public.destinations d where d.user_id = 'aaaaaaaa-2222-4000-8000-000000000001';
insert into public.events (id, source, external_id, category, severity, title, occurred_at, ingested_at)
values
  ('e4000000-0000-4000-8000-000000000001', 'usgs', 'hard-1', 'natural_disasters', 'high', 'Arrived while paused', '2091-01-02 00:00+00', '2091-01-02 00:00+00'),
  ('e4000000-0000-4000-8000-000000000002', 'usgs', 'hard-2', 'natural_disasters', 'high', 'Arrived after resuming', '2091-01-04 00:00+00', '2091-01-04 00:00+00');
select * from public.tick_match_events('2091-01-04 00:01+00', 10, 80);

select is(
  (select count(*)::int from public.notifications where event_id = 'e4000000-0000-4000-8000-000000000001' and user_id = 'aaaaaaaa-2222-4000-8000-000000000001'),
  0, 'an event that arrived while the alert was paused does not match after it resumes');
select is(
  (select count(*)::int from public.notifications where event_id = 'e4000000-0000-4000-8000-000000000002' and user_id = 'aaaaaaaa-2222-4000-8000-000000000001'),
  1, 'an event that arrived after the alert resumed matches');

-- User A, straight through the API, past the form.
select pg_temp.act_as('aaaaaaaa-2222-4000-8000-000000000001');

select throws_ok(
  format($$update public.alerts set keywords = array[%L] where id = 'a4000000-0000-4000-8000-000000000001'$$, repeat('x', 41)),
  '23514', null, 'a keyword longer than 40 characters is refused by the database');
select throws_ok(
  $$update public.alerts set keywords = '{""}' where id = 'a4000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'an empty keyword is refused by the database');
select throws_ok(
  $$update public.alerts set keywords = '{Japan}' where id = 'a4000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'a keyword that is not lowercase is refused by the database');
select throws_ok(
  $$update public.alerts set activated_at = '2000-01-01' where id = 'a4000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'a user cannot change when an alert became active');
select throws_ok(
  $$select * from public.tick_claim_notifications(now())$$,
  '42501', null, 'a user cannot claim notifications for delivery');
select throws_ok(
  $$select public.text_has_word('a', 'a')$$,
  '42501', null, 'a user cannot call the keyword matcher');

select is((select outcome from public.claim_test_send((select id from public.destinations limit 1))), 'ok', 'the first test send of the day is allowed');
select is((select outcome from public.claim_test_send((select id from public.destinations limit 1))), 'ok', 'the second test send of the day is allowed');
select is((select outcome from public.claim_test_send((select id from public.destinations limit 1))), 'ok', 'the third test send of the day is allowed');
select is((select outcome from public.claim_test_send((select id from public.destinations limit 1))), 'test_limit', 'the fourth test send of the day is refused');
select is((select count(*)::int from public.test_sends), 3, 'a refused test send is not recorded');

-- Remember one of A's test sends, so B can try to finish it.
select pg_temp.act_as_owner();
create temp table hardening_ids as
  select id from public.test_sends where user_id = 'aaaaaaaa-2222-4000-8000-000000000001' limit 1;
grant select on hardening_ids to authenticated;

-- User B.
select pg_temp.act_as('bbbbbbbb-2222-4000-8000-000000000002');

select is(
  (select count(*)::int from (select id from public.destinations where user_id = 'aaaaaaaa-2222-4000-8000-000000000001') d),
  0, 'another user cannot read the destinations');
select is((select count(*)::int from public.alert_destinations), 0, 'another user cannot read the alert links');
select throws_ok(
  $$insert into public.alert_destinations (alert_id, destination_id)
    select 'a4000000-0000-4000-8000-000000000001', id from public.destinations limit 1$$,
  '23503', null, 'a user cannot link their destination to another user''s alert');
select throws_ok(
  format($$select public.finish_test_send(%L, true)$$, (select id from hardening_ids)),
  'P0002', null, 'a user cannot finish a test send that is not their own');

-- An anonymous visitor.
select pg_temp.act_as_anon();

select throws_ok('select user_id from public.profiles', '42501', null, 'an anonymous visitor cannot read profiles');
select throws_ok('select id from public.destinations', '42501', null, 'an anonymous visitor cannot read destinations');
select throws_ok('select id from public.events', '42501', null, 'an anonymous visitor cannot read events');
select throws_ok('select id from public.test_sends', '42501', null, 'an anonymous visitor cannot read test sends');
select throws_ok(
  $$select public.save_alert(null, 'x', 'news', null, '{}', '{}')$$,
  '42501', null, 'an anonymous visitor cannot save an alert');

select * from finish();
rollback;
