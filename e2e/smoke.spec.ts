import process from "node:process";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { DEMO_USER, signIn } from "./support/users";

test("the landing page renders", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign up" }).first(),
  ).toBeVisible();
});

test("the landing page has no detectable accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("health endpoint reports the database clock", async ({ request }) => {
  const response = await request.get("/api/health");

  // Body first: when the probe is degraded, the failure message shows the reason.
  expect(await response.json()).toEqual({
    status: "ok",
    databaseTime: expect.any(String),
  });
  expect(response.status()).toBe(200);
});

test("unknown routes show the not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");

  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
});

test("a signed-out visitor is sent to sign in and back", async ({ page }) => {
  await page.goto("/notifications");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fnotifications/);
  await page.getByLabel("Email").fill(DEMO_USER.email);
  await page.getByLabel("Password").fill(DEMO_USER.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/notifications$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Notifications" }),
  ).toBeVisible();
});

test("a user who is not an admin gets the not-found page for the admin area", async ({
  page,
}) => {
  await signIn(page, DEMO_USER);
  await page.goto("/admin/simulate");

  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
});

// The scheduler's request queue stores the tick secret in a header, and the
// database cannot close pg_net's schema to the API roles (see the scheduler
// migration). What keeps it private is that the API does not expose the schema.
test("the API does not expose the pg_net schema", async ({ request }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  expect(url, "NEXT_PUBLIC_SUPABASE_URL is set").toBeTruthy();

  const response = await request.get(
    `${url}/rest/v1/http_request_queue?select=id`,
    {
      headers: { apikey: key ?? "", "Accept-Profile": "net" },
    },
  );

  expect(response.status()).toBe(406);
});
