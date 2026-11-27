import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { waitForEmail } from "./support/mailbox";
import { createUser, uniqueEmail } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page, title: string | RegExp) {
  await expect(page).toHaveTitle(title);
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);
}

test("a visitor signs up, confirms through the emailed link, signs out and signs in", async ({
  page,
  isMobile,
}) => {
  const email = uniqueEmail("e2e-signup");
  const password = `pw-${randomUUID()}`;

  await page.goto("/sign-up");
  await expectNoViolations(page, /Create your account/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue(email);

  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/sign-up\/confirm$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Check your inbox" }),
  ).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expectNoViolations(page, /Check your inbox/);

  // Not confirmed yet: signing in says so.
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("isn't confirmed yet")).toBeVisible();

  const mail = await waitForEmail(email, "Confirm your Heads-up account");
  const link = mail.links.find((href) => href.includes("/auth/confirm"));
  expect(link).toBeTruthy();
  await page.goto(link ?? "/");

  await expect(page).toHaveURL(/\/alerts/);
  await expect(page.getByText("Email confirmed.")).toBeVisible();

  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("link", { name: "Sign up" }).first(),
  ).toBeVisible();

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/alerts/);
});

test("a used confirmation link shows the expired page", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=not-a-real-token");

  await expect(page).toHaveURL(/\/link-expired$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "This link has expired or was already used",
    }),
  ).toBeVisible();
  await expectNoViolations(page, /This link has expired/);
  await page.getByRole("link", { name: "Go to sign in" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("signing up with an existing address shows the same waiting page", async ({
  page,
}) => {
  const user = await createUser();

  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill("another-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/sign-up\/confirm$/);
  await expect(page.getByText(user.email)).toBeVisible();
});

test("a wrong password shows the error without saying which part was wrong", async ({
  page,
}) => {
  const user = await createUser();

  await page.goto("/sign-in");
  await expectNoViolations(page, /Sign in/);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Email or password" }),
  ).toHaveText(/Email or password is incorrect\./);
  await expect(page.getByLabel("Email")).toHaveValue(user.email);
});

test("sign-in returns to a path on this site and ignores any other", async ({
  page,
}) => {
  const user = await createUser();

  await page.goto("/sign-in?next=%2Fnotifications");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/notifications$/);

  await page.context().clearCookies();
  await page.goto("/sign-in?next=https%3A%2F%2Fevil.example%2F");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/alerts$/);
});

test("a signed-in user who opens the landing or sign-up page goes to alerts", async ({
  page,
}) => {
  const user = await createUser();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/alerts/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/alerts$/);
  await page.goto("/sign-up");
  await expect(page).toHaveURL(/\/alerts$/);
});
