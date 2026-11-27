-- The tick's two atomic steps, run as the owner with a clock of their own.
-- Matching is global: other users' alerts (the seed's) match these events too,
-- so every check counts only this test's own user.
-- The clock is far in the future, so the email windows hold only this test's rows.
begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (instance_id, id, aud, role, email)
values ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-1111-4000-8000-000000000001', 'authenticated', 'authenticated', 'tick-a@heads-up.test');

-- Whole-word keywords.
select ok(public.text_has_word('M 5.0 - Honshu, Japan', 'japan'), 'a keyword matches a whole word, ignoring case');
select ok(not public.text_has_word('M 4.6 - 12 km E of Martinique', 'art'), 'a keyword does not match inside a word');
select ok(public.text_has_word('Price of C++ courses', 'c++'), 'punctuation in a keyword is matched literally');

-- Three alerts, created before the events arrive.
insert into public.alerts (id, user_id, name, category, min_severity, keywords, active, created_at)
values
  ('a2000000-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'Tick quakes', 'natural_disasters', 'moderate', '{japan}', true, '2090-01-01 00:00+00'),
  ('a2000000-0000-4000-8000-000000000002', 'aaaaaaaa-1111-4000-8000-000000000001', 'Tick quakes too', 'natural_disasters', 'low', '{}', true, '2090-01-01 00:00+00'),
  ('a2000000-0000-4000-8000-000000000003', 'aaaaaaaa-1111-4000-8000-000000000001', 'Tick paused', 'natural_disasters', 'low', '{}', false, '2090-01-01 00:00+00');

insert into public.alert_destinations (alert_id, destination_id, user_id)
select a.id, d.id, a.user_id
from public.alerts a
join public.destinations d on d.user_id = a.user_id
where a.user_id = 'aaaaaaaa-1111-4000-8000-000000000001';

insert into public.events (id, source, external_id, category, severity, title, occurred_at, ingested_at)
values
  ('e3000000-0000-4000-8000-000000000001', 'usgs', 'tick-test-1', 'natural_disasters', 'high', 'M 6.8 - Honshu, Japan', '2090-01-02 10:00+00', '2090-01-02 10:00+00'),
  ('e3000000-0000-4000-8000-000000000002', 'usgs', 'tick-test-2', 'natural_disasters', 'high', 'M 6.9 - before the alerts', '2089-12-31 10:00+00', '2089-12-31 10:00+00');

select lives_ok(
  $$select * from public.tick_match_events('2090-01-02 10:01+00', 10, 80)$$,
  'the tick matches events');

select is(
  (select count(*)::int from public.notifications where event_id = 'e3000000-0000-4000-8000-000000000001' and user_id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  1, 'two alerts on one destination give one notification for the event');
select is(
  (select status from public.notifications where event_id = 'e3000000-0000-4000-8000-000000000001' and user_id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  'pending', 'the notification is pending');
select is(
  (select count(*)::int from public.notifications where event_id = 'e3000000-0000-4000-8000-000000000002' and user_id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  0, 'an event ingested before the alert was created does not match it');
select ok(
  (select matched_at is not null from public.events where id = 'e3000000-0000-4000-8000-000000000002'),
  'every processed event is marked matched');

select lives_ok(
  $$select * from public.tick_match_events('2090-01-02 10:02+00', 10, 80)$$,
  'a second tick runs');
select is(
  (select count(*)::int from public.notifications where user_id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  1, 'a second tick creates nothing new');

-- The hourly limit: with a limit of 1, the next email in the same hour is skipped.
insert into public.events (id, source, external_id, category, severity, title, occurred_at, ingested_at)
values ('e3000000-0000-4000-8000-000000000003', 'usgs', 'tick-test-3', 'natural_disasters', 'high', 'M 6.1 - Kyushu, Japan', '2090-01-02 10:03+00', '2090-01-02 10:03+00');
select * from public.tick_match_events('2090-01-02 10:04+00', 1, 80);
select is(
  (select skip_reason from public.notifications where event_id = 'e3000000-0000-4000-8000-000000000003' and user_id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  'Hourly limit (1) reached', 'over the hourly limit the notification is skipped with its reason');

-- Claiming for delivery.
select is(
  (select count(*)::int from public.tick_claim_notifications('2090-01-02 10:05+00', 120)
   where user_id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  1, 'a due pending notification is claimed');
select is(
  (select count(*)::int from public.tick_claim_notifications('2090-01-02 10:05:30+00', 120)
   where user_id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  0, 'a claimed notification is not claimed again inside its lease');

-- Only the tick may call these.
select set_config('role', 'authenticated', true);
select throws_ok(
  $$select * from public.tick_match_events(now(), 10, 80)$$,
  '42501', null, 'a signed-in user cannot run the tick''s matching');

select * from finish();
rollback;
