import { expect, test } from "@playwright/test";
import { createUser, deleteUser, signIn, type TestUser } from "./support/users";

// Row Level Security lets an admin read every user's alerts, destinations and
// notifications. The user pages must still show only the admin's own rows,
// while the seed holds other users' data.
test.describe("an admin's own pages", () => {
  let admin: TestUser;

  test.beforeAll(async () => {
    admin = await createUser({ admin: true });
  });

  test.afterAll(async () => {
    await deleteUser(admin);
  });

  test("show only the admin's own rows", async ({ page }) => {
    await signIn(page, admin);

    await page.goto("/alerts");
    await expect(page).toHaveTitle(/Alerts/);
    await expect(page.getByText("Create your first alert")).toBeVisible();

    await page.goto("/alerts/new");
    await expect(page).toHaveTitle(/alert/i);
    await expect(
      page.getByRole("checkbox", { name: /Account email/ }),
    ).toHaveCount(1);

    await page.goto("/destinations");
    await expect(page).toHaveTitle(/Destinations/);
    await expect(
      page.getByRole("listitem").filter({ hasText: "Account email" }),
    ).toHaveCount(1);

    await page.goto("/notifications");
    await expect(page).toHaveTitle(/Notifications/);
    await expect(page.getByText("No notifications yet")).toBeVisible();
  });
});
