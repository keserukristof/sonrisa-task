#!/usr/bin/env node
// One-command local setup: starts the local Supabase stack (Docker required),
// applies migrations and seed data, and writes .env.local from its credentials.
// Usage: pnpm bootstrap          full stack, including Studio on :54323
//        pnpm bootstrap --lite   only what the app needs, for machines where
//                                Docker has little memory (about 300 MB)

import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

const ENV_FILE = ".env.local";

// Services the application does not call. Database, Auth, the REST API, the
// gateway and the local mail catcher stay.
const LITE_EXCLUDES = [
  "studio",
  "edge-runtime",
  "logflare",
  "vector",
  "imgproxy",
  "realtime",
  "storage-api",
  "postgres-meta",
];
const lite = process.argv.includes("--lite");

function run(args, options = {}) {
  return execFileSync("pnpm", ["exec", "supabase", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    ...options,
  });
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

try {
  execFileSync("docker", ["info"], { stdio: "ignore" });
} catch {
  fail(
    "Docker is not running. Start Docker Desktop and run `pnpm bootstrap` again.",
  );
}

console.log("→ Starting local Supabase (the first run downloads images)…");
run(lite ? ["start", "-x", LITE_EXCLUDES.join(",")] : ["start"], {
  stdio: "inherit",
});

console.log("→ Applying migrations and seed data…");
run(["db", "reset"], { stdio: "inherit" });

const status = JSON.parse(run(["status", "-o", "json"]));
const apiUrl = status.API_URL;
const publishableKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;

if (!apiUrl || !publishableKey || !secretKey) {
  fail(
    "Could not read credentials from `supabase status`. Is the stack healthy?",
  );
}

if (existsSync(ENV_FILE)) {
  console.log(`→ ${ENV_FILE} already exists, leaving it untouched.`);
} else {
  writeFileSync(
    ENV_FILE,
    [
      `NEXT_PUBLIC_SUPABASE_URL=${apiUrl}`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishableKey}`,
      `SUPABASE_SECRET_KEY=${secretKey}`,
      "",
    ].join("\n"),
  );
  console.log(`→ Wrote ${ENV_FILE}.`);
}

// Server-only variables and the local scheduler's settings.
execFileSync("node", ["scripts/local-env.mjs"], { stdio: "inherit" });

console.log("\n✔ Ready. Run `pnpm dev` and open http://localhost:3000");
