import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

// Parallel agents each work in their own git worktree and may run e2e at the same
// time. A worktree derives a stable port from its path so their dev servers never collide.
function defaultPort(): number {
  const cwd = process.cwd();
  if (!cwd.includes("/.claude/worktrees/")) return 3000;
  let hash = 0;
  for (const char of cwd) hash = (hash * 31 + char.charCodeAt(0)) % 800;
  return 3100 + hash;
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
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // When E2E_BASE_URL points at a deployment, no local server is started.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm exec next dev --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
