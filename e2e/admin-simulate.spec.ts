import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createUser, deleteUser, signIn } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("a signed-in non-admin gets the not-found page", async ({ page }) => {
  const user = await createUser();
  try {
    await signIn(page, user);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
  } finally {
    await deleteUser(user);
  }
});

test("an admin simulates an event and the form resets", async ({ page }) => {
  const admin = await createUser({ admin: true });
  try {
    await signIn(page, admin);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/simulate$/);
    await expect(page).toHaveTitle(/Simulate an event/);

    const scan = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(scan.violations).toEqual([]);

    // Empty submit: field errors, nothing created.
    await page.getByRole("button", { name: "Create simulated event" }).click();
    await expect(page.getByText("Choose a category.")).toBeVisible();
    await expect(page.getByText("Enter a title for the event.")).toBeVisible();

    // News forces severity to low and disables the select.
    await page.getByLabel("News").check();
    await expect(page.getByLabel("Severity")).toBeDisabled();
    await expect(page.getByLabel("Severity")).toHaveValue("low");
    await expect(
      page.getByText("News events are always low severity."),
    ).toBeVisible();
    await page.getByLabel("Markets").check();
    await expect(page.getByLabel("Severity")).toBeEnabled();
    await expect(page.getByLabel("Severity")).toHaveValue("high");

    // A bad link keeps what was typed.
    const title = `Simulated quake ${Date.now()}`;
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Link").fill("ftp://nope");
    await page.getByRole("button", { name: "Create simulated event" }).click();
    await expect(
      page.getByText("Enter a link that starts with https://"),
    ).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveValue(title);

    await page.getByLabel("Link").fill("https://example.com/report");
    await page.getByRole("button", { name: "Create simulated event" }).click();

    const notice = page.getByRole("status");
    await expect(notice).toContainText("Event created.");
    await expect(
      notice.getByRole("link", { name: "See your notifications" }),
    ).toHaveAttribute("href", "/notifications");
    await expect(page.getByLabel("Title")).toHaveValue("");
    await expect(page.getByLabel("Markets")).not.toBeChecked();
    await expect(page.getByLabel("Severity")).toHaveValue("high");
  } finally {
    await deleteUser(admin);
  }
});
