import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home page renders and reaches the database", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Starter is running" }),
  ).toBeVisible();
  await expect(page.getByText("Database connected")).toBeVisible();
});

test("home page has no detectable accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Database connected")).toBeVisible();

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
