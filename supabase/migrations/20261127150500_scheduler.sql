-- The scheduler that drives the alerting tick (ADR-0003): pg_cron calls the
-- tick route every minute through pg_net.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- pg_net keeps each request, headers included, in net.http_request_queue until
-- its worker has sent it, and its install grants PUBLIC usage on the net schema
-- and every privilege on that table. Those grants are made by supabase_admin,
-- and migrations run as postgres, which is neither a member of that role nor a
-- superuser: a REVOKE here does nothing ("no privileges could be revoked",
-- checked 2026-11-27). So the schema cannot be restricted from a migration.
-- What protects the header instead:
--   1. The API does not expose the net schema. PostgREST answers 406 for it;
--      e2e/smoke.spec.ts checks that. It must never be added to the exposed
--      schemas in supabase/config.jsonc or the project's API settings.
--   2. The header carries the tick secret, which can only start a tick. It is
--      never the Supabase secret key (ADR-0003).
--   3. No function in an exposed schema reads from the net schema.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Reads the tick URL and the tick secret from Supabase Vault, so each
-- environment sets its own and neither is in the repository. Does nothing
-- until both are set. Runs as the job's owner; not reachable through the API.
create function private.trigger_tick()
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'tick_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'tick_secret';

  if v_url is null or v_secret is null then
    return null;
  end if;

  return net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
end;
$$;

revoke all on function private.trigger_tick() from public, anon, authenticated;

select cron.schedule('alerting-tick', '* * * * *', 'select private.trigger_tick()');
