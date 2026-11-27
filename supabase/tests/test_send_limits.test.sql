-- The 20-test-sends-a-day cap has its own outcome
-- (docs/reviews/1-code-review.md, spec finding 2).
begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-3333-4000-8000-000000000001', 'authenticated', 'authenticated', 'limits-a@heads-up.test'),
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-3333-4000-8000-000000000002', 'authenticated', 'authenticated', 'limits-b@heads-up.test');

-- Twenty test sends today, by account A, as the database owner.
insert into public.test_sends (user_id, destination_id, channel_type, created_at)
select 'cccccccc-3333-4000-8000-000000000001', d.id, 'email', now()
from public.destinations d, generate_series(1, 20)
where d.user_id = 'cccccccc-3333-4000-8000-000000000001';

select is((select count(*)::int from public.test_sends where user_id = 'cccccccc-3333-4000-8000-000000000001'), 20, 'account A has twenty test sends today');

-- Account B, which has sent none, is refused by the system-wide cap.
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', json_build_object('sub', 'dddddddd-3333-4000-8000-000000000002', 'role', 'authenticated')::text, true);

select is(
  (select outcome from public.claim_test_send((select id from public.destinations limit 1))),
  'system_test_limit',
  'the 21st test send of the day is refused by the 20-a-day cap, with its own outcome');

select * from finish();
rollback;
