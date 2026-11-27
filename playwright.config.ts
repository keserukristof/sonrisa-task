import { existsSync } from "node:fs";
import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

// The specs create their own users through the local Supabase admin API and
// read the local mail catcher, so they need the same variables as the app.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// End-to-end tests run on their own port, never the dev server's 3000, so they
// cannot silently test whatever else is listening there. Parallel agents each
// work in their own git worktree and may run e2e at the same time: a worktree
// derives a stable port from its path so their servers never collide.
function defaultPort(): number {
  const cwd = process.cwd();
  if (!cwd.includes("/.claude/worktrees/")) return 3100;
  let hash = 0;
  for (const char of cwd) hash = (hash * 31 + char.charCodeAt(0)) % 800;
  return 3101 + hash;
}

const port = Number(process.env.PORT ?? defaultPort());
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    // Panels fade in; an accessibility scan taken mid-fade reports blended
    // colours as contrast failures. The app honours this setting.
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // When E2E_BASE_URL points at a deployment, no local server is started.
  // Otherwise the suite runs against a production build: it is what ships, it
  // enforces the Cache Components prerender rules, and unlike `next dev` it can
  // run while a dev server for the same checkout is open.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm exec next build && pnpm exec next start --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      },
});
