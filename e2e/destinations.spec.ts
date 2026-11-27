import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { waitForEmail } from "./support/mailbox";
import { createUser, deleteUser, signIn, type TestUser } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// "Send test" counts toward the shared daily email limit: each test uses an
// account of its own and deletes it afterwards.
let user: TestUser;

test.beforeEach(async ({ page }) => {
  user = await createUser();
  await signIn(page, user);
  await page.goto("/destinations");
  await expect(page).toHaveTitle(/Destinations/);
});

test.afterEach(async () => {
  await deleteUser(user);
});

test("the page shows the account email and sending a test delivers it", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Destinations", level: 1 }),
  ).toBeVisible();
  const row = page.getByRole("listitem").filter({ hasText: "Account email" });
  await expect(row).toContainText(user.email);

  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);

  await page.getByRole("button", { name: "Send test" }).click();
  await expect(page.getByRole("status")).toContainText(
    /Delivered at \d\d:\d\d UTC/,
  );

  const email = await waitForEmail(user.email, "Test from Heads-up");
  expect(email.text).toContain("This destination works");
});

test("a fourth test in a day is refused with its reason", async ({ page }) => {
  const send = page.getByRole("button", { name: "Send test" });
  for (let attempt = 0; attempt < 3; attempt++) {
    await send.click();
    await expect(page.getByRole("status")).toContainText("Delivered at");
    // A new result replaces the earlier one: wait for the button to be ready again.
    await expect(send).toBeEnabled();
  }

  await send.click();
  await expect(page.getByRole("status")).toContainText(
    "Not sent. You've sent 3 tests today.",
  );
});
