-- Demo accounts and their data, for local development and tests only.
-- Loaded by `node scripts/seed-local.mjs`, which `pnpm db:reset` and
-- `pnpm bootstrap` run. That script writes into the local Docker database and
-- nowhere else. This file is deliberately not in the Supabase seed paths
-- (supabase/config.jsonc), so no command that seeds a hosted project can load
-- it: the two accounts below have public passwords, and one is an admin.
-- Idempotent: every row has a fixed id and is skipped when it already exists.
--
--   demo@heads-up.test   password: demo-password   role: user
--   admin@heads-up.test  password: admin-password  role: admin

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'demo@heads-up.test',
    extensions.crypt('demo-password', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'admin@heads-up.test',
    extensions.crypt('admin-password', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  )
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (
    '11111111-1111-4111-8111-1111111111aa', '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@heads-up.test","email_verified":true}',
    'email', now(), now(), now()
  ),
  (
    '22222222-2222-4222-8222-2222222222aa', '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    '{"sub":"22222222-2222-4222-8222-222222222222","email":"admin@heads-up.test","email_verified":true}',
    'email', now(), now(), now()
  )
on conflict (id) do nothing;

-- The new-user trigger created each profile and email destination.
-- The demo admin has no alerts, on purpose: an alert without keywords would
-- match every simulated event any test creates in the shared database.
update public.profiles set role = 'admin'
where user_id = '22222222-2222-4222-8222-222222222222' and role <> 'admin';

insert into public.alerts (id, user_id, name, category, min_severity, keywords, active, created_at)
values
  ('a1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Pacific rim quakes', 'natural_disasters', 'moderate', '{japan,tsunami}', true, '2026-11-20 08:00+00'),
  ('a1000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Big ones anywhere', 'natural_disasters', 'critical', '{}', false, '2026-11-20 08:05+00'),
  ('a1000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Rate decisions', 'news', null, '{ecb,rates}', true, '2026-11-20 08:10+00')
on conflict (id) do nothing;

insert into public.alert_destinations (alert_id, destination_id, user_id)
select a.id, d.id, a.user_id
from public.alerts a
join public.destinations d on d.user_id = a.user_id and d.channel_type = 'email'
where a.id in (
  'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003'
)
on conflict do nothing;

-- Every seeded event is already matched, so a tick never notifies about it again.
insert into public.events (id, source, external_id, category, severity, title, summary, url, occurred_at, ingested_at, simulated, matched_at)
values
  ('e1000000-0000-4000-8000-000000000001', 'usgs', 'seed-us7000hualien', 'natural_disasters', 'high', 'M 6.8 - 40 km S of Hualien, Taiwan', 'Magnitude 6.8 earthquake, 40 km S of Hualien, Taiwan, at a depth of 18 km.', 'https://earthquake.usgs.gov/earthquakes/map/', '2026-11-26 13:42+00', '2026-11-26 13:43+00', false, '2026-11-26 13:43+00'),
  ('e1000000-0000-4000-8000-000000000002', 'usgs', 'seed-us7000miyako', 'natural_disasters', 'moderate', 'M 5.6 - 87 km E of Miyako, Japan', 'Magnitude 5.6 earthquake, 87 km E of Miyako, Japan, at a depth of 35 km.', 'https://earthquake.usgs.gov/earthquakes/map/', '2026-11-26 12:10+00', '2026-11-26 12:11+00', false, '2026-11-26 12:11+00'),
  ('e1000000-0000-4000-8000-000000000003', 'usgs', 'seed-us7000kokopo', 'natural_disasters', 'critical', 'M 7.6 - 120 km SE of Kokopo, Papua New Guinea', 'Magnitude 7.6 earthquake, 120 km SE of Kokopo, Papua New Guinea, at a depth of 52 km.', 'https://earthquake.usgs.gov/earthquakes/map/', '2026-11-26 09:31+00', '2026-11-26 09:32+00', false, '2026-11-26 09:32+00'),
  ('e1000000-0000-4000-8000-000000000004', 'simulated', 'seed-simulated-tokyo', 'natural_disasters', 'high', 'Test quake near Tokyo', null, null, '2026-11-26 13:50+00', '2026-11-26 13:50+00', true, '2026-11-26 13:51+00')
on conflict (id) do nothing;

insert into public.notifications (id, event_id, alert_id, destination_id, user_id, channel_type, status, attempts, next_attempt_at, last_error, skip_reason, sent_at, created_at)
select v.id::uuid, v.event_id::uuid, v.alert_id::uuid, d.id, d.user_id, 'email', v.status, v.attempts, v.created_at::timestamptz, v.last_error, v.skip_reason, v.sent_at::timestamptz, v.created_at::timestamptz
from (
  values
    ('b1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'sent', 1, null, null, '2026-11-26 13:43+00', '2026-11-26 13:43+00'),
    ('b1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001', 'sent', 1, null, null, '2026-11-26 13:51+00', '2026-11-26 13:51+00'),
    ('b1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'skipped', 0, null, 'Hourly limit (10) reached', null, '2026-11-26 12:11+00'),
    ('b1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000003', null, 'failed', 4, 'The email provider didn''t respond after 4 attempts.', null, null, '2026-11-26 09:32+00')
) as v (id, event_id, alert_id, status, attempts, last_error, skip_reason, sent_at, created_at)
join public.destinations d
  on d.user_id = '11111111-1111-4111-8111-111111111111' and d.channel_type = 'email'
on conflict (id) do nothing;

-- Thirty older earthquakes, each sent, so the history has a second page.
insert into public.events (id, source, external_id, category, severity, title, summary, url, occurred_at, ingested_at, simulated, matched_at)
select
  ('e2000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'usgs', 'seed-older-' || n, 'natural_disasters', 'moderate',
  'M 5.' || (n % 10) || ' - ' || (20 + n) || ' km N of Hihifo, Tonga',
  'Magnitude 5.' || (n % 10) || ' earthquake, ' || (20 + n) || ' km N of Hihifo, Tonga, at a depth of 10 km.',
  'https://earthquake.usgs.gov/earthquakes/map/',
  timestamptz '2026-11-25 00:00+00' - make_interval(hours => n * 3),
  timestamptz '2026-11-25 00:01+00' - make_interval(hours => n * 3),
  false,
  timestamptz '2026-11-25 00:01+00' - make_interval(hours => n * 3)
from generate_series(1, 30) as n
on conflict (id) do nothing;

insert into public.notifications (id, event_id, alert_id, destination_id, user_id, channel_type, status, attempts, next_attempt_at, sent_at, created_at)
select
  ('b2000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('e2000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'a1000000-0000-4000-8000-000000000001', d.id, d.user_id, 'email', 'sent', 1,
  timestamptz '2026-11-25 00:01+00' - make_interval(hours => n * 3),
  timestamptz '2026-11-25 00:02+00' - make_interval(hours => n * 3),
  timestamptz '2026-11-25 00:01+00' - make_interval(hours => n * 3)
from generate_series(1, 30) as n
join public.destinations d
  on d.user_id = '11111111-1111-4111-8111-111111111111' and d.channel_type = 'email'
on conflict (id) do nothing;

insert into public.source_polls (id, source, polled_at, outcome, error, events_stored)
values
  ('c1000000-0000-4000-8000-000000000001', 'usgs', '2026-11-26 13:43+00', 'ok', null, 1),
  ('c1000000-0000-4000-8000-000000000002', 'usgs', '2026-11-26 13:44+00', 'error', 'The feed did not respond.', 0)
on conflict (id) do nothing;

-- Increment 2: Slack destinations, news and market events, and polls of
-- every source. The Slack URLs point at the local stub (e2e/support), which
-- answers only while the e2e suite runs; with no stub, a send is a transient
-- failure and retries, which is what a demo of the history needs anyway.
insert into public.destinations (id, user_id, channel_type, name, settings, hint, status, broken_reason, created_at)
values
  ('d2000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'slack', 'Ops channel',
   '{"url":"http://127.0.0.1:4100/slack/demo-ops"}', 'hooks.slack.com/…/-ops', 'active', null, '2026-11-26 10:00+00'),
  ('d2000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'slack', 'Incident room',
   '{"url":"http://127.0.0.1:4100/slack/demo-incident"}', 'hooks.slack.com/…/dent', 'broken',
   'Slack says this channel no longer exists.', '2026-11-26 10:05+00')
on conflict (id) do nothing;

insert into public.alerts (id, user_id, name, category, min_severity, keywords, active, created_at)
values
  ('a1000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Crypto swings', 'markets', 'moderate', '{bitcoin}', true, '2026-11-26 10:10+00')
on conflict (id) do nothing;

insert into public.alert_destinations (alert_id, destination_id, user_id)
values
  ('a1000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111')
on conflict do nothing;

insert into public.events (id, source, external_id, category, severity, title, summary, url, occurred_at, ingested_at, simulated, matched_at)
values
  ('e8000000-0000-4000-8000-000000000001', 'coingecko', 'seed-bitcoin-2026-11-26T18', 'markets', 'moderate',
   'Bitcoin (BTC) up 4.2% in the past hour', 'Price $64,210. 24-hour change −1.8%.',
   'https://www.coingecko.com/en/coins/bitcoin', '2026-11-26 18:05+00', '2026-11-26 18:05+00', false, '2026-11-26 18:05+00'),
  ('e8000000-0000-4000-8000-000000000002', 'guardian', 'seed-business/2026/nov/26/fed-holds-rates', 'news', 'low',
   'Fed holds rates as inflation cools', 'The US central bank kept its main rate unchanged for a third meeting.',
   'https://www.theguardian.com/business', '2026-11-26 17:48+00', '2026-11-26 17:49+00', false, '2026-11-26 17:49+00')
on conflict (id) do nothing;

insert into public.notifications (id, event_id, alert_id, destination_id, user_id, channel_type, status, attempts, next_attempt_at, last_error, skip_reason, sent_at, created_at)
values
  ('b2000000-0000-4000-8000-000000000001', 'e8000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004',
   'd2000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'slack', 'sent', 1,
   '2026-11-26 18:06+00', null, null, '2026-11-26 18:06+00', '2026-11-26 18:06+00'),
  ('b2000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   'd2000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'slack', 'failed', 1,
   '2026-11-26 13:44+00', 'The Slack channel no longer exists.', null, null, '2026-11-26 13:43+00'),
  ('b2000000-0000-4000-8000-000000000003', 'e8000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003',
   null, '11111111-1111-4111-8111-111111111111', 'email', 'sent', 1,
   '2026-11-26 17:50+00', null, null, '2026-11-26 17:50+00', '2026-11-26 17:50+00')
on conflict (id) do nothing;

insert into public.source_polls (id, source, polled_at, outcome, error, events_stored)
values
  ('c1000000-0000-4000-8000-000000000003', 'guardian', '2026-11-26 17:49+00', 'ok', null, 1),
  ('c1000000-0000-4000-8000-000000000004', 'guardian', '2026-11-26 17:52+00', 'error', 'The Guardian answered 503 Service Unavailable.', 0),
  ('c1000000-0000-4000-8000-000000000005', 'coingecko', '2026-11-26 18:05+00', 'ok', null, 1)
on conflict (id) do nothing;

update public.notifications
set destination_id = (
  select d.id from public.destinations d
  where d.user_id = '11111111-1111-4111-8111-111111111111' and d.channel_type = 'email'
)
where id = 'b2000000-0000-4000-8000-000000000003' and destination_id is null;

-- The demo alerts must not match the events the e2e suite simulates, or
-- their notifications push the seeded rows off the first page of history.
update public.alerts set keywords = '{bitcoin}'
where id = 'a1000000-0000-4000-8000-000000000004' and keywords = '{}';
