import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import process from "node:process";
import { waitForEmail } from "./support/mailbox";
import { createUser, deleteUser, signIn } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("a simulated event arrives by email and shows as sent", async ({
  page,
  browser,
  baseURL,
}) => {
  const admin = await createUser({ admin: true });
  const user = await createUser();
  try {
    // The recipient creates a matching alert through the UI.
    await signIn(page, user);
    const name = `Markets ${Date.now()}`;
    await page.goto("/alerts");
    await page.getByRole("link", { name: "Create alert" }).first().click();
    await expect(page).toHaveTitle(/Create alert/);
    await page.getByLabel("Name").fill(name);
    await page.getByRole("radio", { name: "Markets" }).click();
    await page.getByLabel("Minimum severity").selectOption("low");
    await page.getByRole("button", { name: "Create alert" }).click();
    await expect(page.getByText("Alert created.")).toBeVisible();

    // An admin, in a second browser context, simulates an event in the same
    // category.
    const title = `Simulated market move ${Date.now()}`;
    const adminContext = await browser.newContext({
      baseURL,
      reducedMotion: "reduce",
    });
    const adminPage = await adminContext.newPage();
    await signIn(adminPage, admin);
    await adminPage.goto("/admin/simulate");
    await expect(adminPage).toHaveTitle(/Simulate an event/);
    await adminPage.getByLabel("Markets").check();
    await adminPage.getByLabel("Title").fill(title);
    await adminPage
      .getByRole("button", { name: "Create simulated event" })
      .click();
    await expect(adminPage.getByRole("status")).toContainText("Event created.");
    await adminContext.close();

    // Run a tick against this test's own server.
    const response = await fetch(`${baseURL}/api/tick`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.TICK_SECRET}` },
    });
    expect(response.status).toBe(200);

    // History shows it as sent, with the Simulated badge.
    await page.goto("/notifications");
    await expect(page).toHaveTitle(/Notifications/);
    const item = page.getByRole("listitem").filter({ hasText: title });
    await expect(item).toContainText("Sent");
    await expect(item).toContainText("Simulated");

    const scan = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(scan.violations).toEqual([]);

    // And the email is in the mail catcher.
    const email = await waitForEmail(user.email, "[SIMULATED]");
    expect(email.subject).toContain(title);
  } finally {
    await deleteUser(admin);
    await deleteUser(user);
  }
});
