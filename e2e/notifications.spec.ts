import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createUser, deleteUser, DEMO_USER, signIn } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.describe("notification history", () => {
  test("shows the demo user's seeded notifications with status, reason and badge", async ({
    page,
  }) => {
    await signIn(page, DEMO_USER);
    await page.goto("/notifications");
    await expect(page).toHaveTitle(/Notifications/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Notifications" }),
    ).toBeVisible();

    const sent = page.getByRole("listitem").filter({
      hasText: "M 6.8 - 40 km S of Hualien, Taiwan",
    });
    await expect(sent).toContainText("26 Nov 2026, 13:42 UTC");
    await expect(sent).toContainText("Sent");
    await expect(sent).toContainText("13:43 UTC");
    await expect(sent).toContainText("High");

    const skipped = page.getByRole("listitem").filter({
      hasText: "M 5.6 - 87 km E of Miyako, Japan",
    });
    await expect(skipped).toContainText("Skipped");
    await expect(skipped).toContainText("Hourly limit (10) reached");

    const failed = page.getByRole("listitem").filter({
      hasText: "M 7.6 - 120 km SE of Kokopo, Papua New Guinea",
    });
    await expect(failed).toContainText("Failed");
    await expect(failed).toContainText(
      "The email provider didn't respond after 4 attempts.",
    );
    await expect(failed).toContainText("Deleted alert");

    const simulated = page.getByRole("listitem").filter({
      hasText: "Test quake near Tokyo",
    });
    await expect(simulated).toContainText("Simulated");

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("pages with Previous and Next, and a bad page shows the first page", async ({
    page,
  }) => {
    await signIn(page, DEMO_USER);
    await page.goto("/notifications");
    await expect(page).toHaveTitle(/Notifications/);
    // Other tests add notifications for the demo user, so nothing here
    // depends on which rows are newest: only that the seed fills several pages.
    const items = page.getByRole("listitem");
    await expect(items).toHaveCount(25);
    const firstOnPage1 = await items.first().innerText();
    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await expect(
      pagination.getByRole("link", { name: "Previous" }),
    ).toHaveCount(0);

    await pagination.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(pagination).toContainText("Page 2");
    await expect(
      pagination.getByRole("link", { name: "Previous" }),
    ).toBeVisible();
    await expect(items.first()).not.toHaveText(firstOnPage1);

    for (const bad of ["abc", "0", "9999"]) {
      await page.goto(`/notifications?page=${bad}`);
      await expect(page).toHaveTitle(/Notifications/);
      await expect(pagination).toContainText("Page 1");
      await expect(items).toHaveCount(25);
    }
  });

  test("a new account sees the empty state and nobody else's rows", async ({
    page,
  }) => {
    const user = await createUser();
    try {
      await signIn(page, user);
      await page.goto("/notifications");
      await expect(page).toHaveTitle(/Notifications/);
      await expect(
        page.getByRole("heading", { name: "No notifications yet" }),
      ).toBeVisible();
      await expect(page.getByText("Hualien")).toHaveCount(0);
      await expect(
        page.getByRole("link", { name: "Go to alerts" }),
      ).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .analyze();
      expect(results.violations).toEqual([]);
    } finally {
      await deleteUser(user);
    }
  });
});
