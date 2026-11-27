import { existsSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration tests that need the local Supabase database: `*.dbtest.ts`.
// They are not part of `pnpm verify`, which must pass without a database;
// run them with `pnpm test:db` after `pnpm bootstrap`. CI runs them in the
// job that starts Supabase.
// .env.local holds the local URL and keys.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./test/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.dbtest.ts"],
    // One shared database: files run one after another.
    fileParallelism: false,
    restoreMocks: true,
  },
});
