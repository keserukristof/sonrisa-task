#!/usr/bin/env node
// Loads the demo accounts and their data into the LOCAL database. It talks
// to the local Supabase Docker container directly, so it cannot reach a
// hosted project. `pnpm db:reset` and `pnpm bootstrap` run it.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const projectId = readFileSync("supabase/config.jsonc", "utf8").match(
  /"project_id":\s*"([^"]+)"/,
)?.[1];

if (!projectId) {
  console.error(
    "✖ Could not find the Supabase project id in supabase/config.jsonc.",
  );
  process.exit(1);
}

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
  {
    input: readFileSync("supabase/local/demo-data.sql", "utf8"),
    stdio: ["pipe", "ignore", "inherit"],
  },
);
console.log(
  "→ Loaded the local demo accounts: demo@heads-up.test and admin@heads-up.test.",
);
