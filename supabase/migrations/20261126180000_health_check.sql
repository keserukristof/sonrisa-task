-- Liveness probe behind GET /api/health.
-- Proves the app can reach the database and that migrations have been applied.
-- Exposes nothing beyond the database clock, so it is callable by anonymous visitors.

create or replace function public.health_check()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select now();
$$;

revoke all on function public.health_check() from public;
grant execute on function public.health_check() to anon, authenticated;

comment on function public.health_check() is
  'Liveness probe for /api/health. Returns the database clock.';
