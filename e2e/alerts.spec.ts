import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createUser, deleteUser, signIn, type TestUser } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

let user: TestUser;

test.beforeEach(async ({ page }) => {
  user = await createUser();
  await signIn(page, user);
});

test.afterEach(async () => {
  await deleteUser(user);
});

test("create, edit, pause, resume and delete an alert", async ({ page }) => {
  const name = `Quakes ${Date.now()}`;

  await page.goto("/alerts");
  await expect(page).toHaveTitle(/Alerts/);
  await expect(
    page.getByRole("heading", { name: "Create your first alert" }),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);

  await page.getByRole("link", { name: "Create alert" }).click();
  await expect(page).toHaveTitle(/Create alert/);
  await page.getByLabel("Name").fill(name);
  await page.getByRole("radio", { name: "Natural disasters" }).click();
  await page.getByLabel("Minimum severity").selectOption("high");
  await page.getByLabel("Keywords").fill("Japan, Tsunami, japan");
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Create alert" }).click();

  await expect(page).toHaveURL(/\/alerts\?notice=alert-created/);
  await expect(page.getByText("Alert created.")).toBeVisible();
  const row = page.getByRole("listitem").filter({ hasText: name });
  await expect(row).toContainText("Natural disasters, to Account email");
  await expect(row).toContainText("High and above");
  await expect(row).toContainText("japan");
  await expect(row).toContainText("tsunami");
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);

  // Edit
  await row.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveTitle(/Edit alert/);
  await expect(page.getByLabel("Name")).toHaveValue(name);
  const renamed = `${name} renamed`;
  await page.getByLabel("Name").fill(renamed);
  await page.getByRole("radio", { name: "News" }).click();
  await expect(page.getByLabel("Minimum severity")).toBeDisabled();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();
  const edited = page.getByRole("listitem").filter({ hasText: renamed });
  await expect(edited).toContainText("Any severity");

  // Pause and resume
  const toggle = edited.getByRole("switch");
  await expect(toggle).toHaveAccessibleName(`${renamed} is active`);
  await toggle.click();
  await expect(toggle).toHaveAccessibleName(`${renamed} is paused`);
  await expect(edited.getByText("Paused")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("switch", { name: `${renamed} is paused` }),
  ).toBeVisible();
  await page.getByRole("switch", { name: `${renamed} is paused` }).click();
  await expect(
    page.getByRole("switch", { name: `${renamed} is active` }),
  ).toBeVisible();

  // Delete
  await page
    .getByRole("listitem")
    .filter({ hasText: renamed })
    .getByRole("button", { name: /Delete/ })
    .click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText(`Delete "${renamed}"?`);
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);
  await dialog.getByRole("button", { name: "Delete alert" }).click();
  await expect(page.getByText("Alert deleted.")).toBeVisible();
  await expect(page.getByText(renamed)).toHaveCount(0);
});

test("a form without a destination shows the field error", async ({ page }) => {
  await page.goto("/alerts/new");
  await page.getByLabel("Name").fill("No destination");
  await page.getByRole("radio", { name: "Markets" }).click();
  await page.getByRole("checkbox").first().click();
  await page.getByRole("button", { name: "Create alert" }).click();
  await expect(
    page.getByText("Choose at least one destination."),
  ).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("No destination");
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);
});

test("another user's alert gives the not-found page", async ({ page }) => {
  await page.goto("/alerts/5b8e6c3a-0a53-4a43-8f55-9d3f3b0f6f11/edit");
  await expect(page.getByText("Page not found")).toBeVisible();
  await expect(page).toHaveTitle(/^Page not found/);
  await expect(page.getByRole("banner")).toHaveCount(1);
});
