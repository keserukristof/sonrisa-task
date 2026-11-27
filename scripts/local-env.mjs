#!/usr/bin/env node
// Completes the local setup after the database exists. A person runs this
// (through `pnpm bootstrap` or `pnpm db:reset`); agents are not allowed to
// read or edit .env.local and must not run it.
//   1. Adds the server-only variables the app needs to .env.local, keeping
//      every value that is already there.
//   2. Stores the tick URL and the tick secret in the local database's Vault,
//      where the scheduler's job reads them (ADR-0003). A reset empties the
//      Vault, which is why `pnpm db:reset` runs this again.
// Local only. It never talks to the cloud project.

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const ENV_FILE = ".env.local";
// The local database runs in Docker; the dev server is on the host.
const LOCAL_TICK_URL = "http://host.docker.internal:3000/api/tick";

function readEnv() {
  if (!existsSync(ENV_FILE)) return new Map();
  const entries = readFileSync(ENV_FILE, "utf8")
    .split("\n")
    .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map(([, name, value]) => [name, value]);
  return new Map(entries);
}

function supabaseStatus() {
  const output = execFileSync(
    "pnpm",
    ["exec", "supabase", "status", "-o", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  return JSON.parse(output);
}

if (!existsSync(ENV_FILE)) {
  console.error(`✖ ${ENV_FILE} does not exist. Run \`pnpm bootstrap\` first.`);
  process.exit(1);
}

const env = readEnv();
const missing = [];

if (!env.has("SUPABASE_SECRET_KEY")) {
  const status = supabaseStatus();
  missing.push([
    "SUPABASE_SECRET_KEY",
    status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
  ]);
}
if (!env.has("TICK_SECRET")) {
  missing.push(["TICK_SECRET", randomBytes(32).toString("hex")]);
}
if (!env.has("APP_URL")) {
  missing.push(["APP_URL", "http://localhost:3000"]);
}

if (missing.length > 0) {
  const text = readFileSync(ENV_FILE, "utf8");
  const lines = missing.map(([name, value]) => `${name}=${value}`).join("\n");
  appendFileSync(ENV_FILE, `${text.endsWith("\n") ? "" : "\n"}${lines}\n`);
  console.log(
    `→ Added to ${ENV_FILE}: ${missing.map(([name]) => name).join(", ")}.`,
  );
}

const tickSecret = readEnv().get("TICK_SECRET");
const projectId = readFileSync("supabase/config.jsonc", "utf8").match(
  /"project_id":\s*"([^"]+)"/,
)?.[1];

if (!tickSecret || !projectId) {
  console.error("✖ Could not find TICK_SECRET or the Supabase project id.");
  process.exit(1);
}

const quote = (value) => `'${value.replaceAll("'", "''")}'`;
const sql = `
do $$
declare
  v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'tick_url';
  if v_id is null then
    perform vault.create_secret(${quote(LOCAL_TICK_URL)}, 'tick_url');
  else
    perform vault.update_secret(v_id, ${quote(LOCAL_TICK_URL)});
  end if;

  select id into v_id from vault.secrets where name = 'tick_secret';
  if v_id is null then
    perform vault.create_secret(${quote(tickSecret)}, 'tick_secret');
  else
    perform vault.update_secret(v_id, ${quote(tickSecret)});
  end if;
end $$;
`;

// The SQL goes over stdin, so the secret is not in any process's arguments.
execFileSync(
  "docker",
  [
    "exec",
    "-i",
    `supabase_db_${projectId}`,
    "psql",
    "-U",
    "postgres",
    "-q",
    "-v",
    "ON_ERROR_STOP=1",
  ],
  { input: sql, stdio: ["pipe", "ignore", "inherit"] },
);
console.log(
  "→ The local scheduler now calls the tick route on http://localhost:3000.",
);
