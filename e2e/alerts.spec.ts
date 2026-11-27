import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
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

// Increment 2: Slack destinations and the news keyword rule.

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("Run `pnpm bootstrap`.");
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function addSlack(
  owner: TestUser,
  name: string,
  status: "active" | "broken",
): Promise<string> {
  const { data, error } = await admin()
    .from("destinations")
    .insert({
      user_id: owner.id,
      channel_type: "slack",
      name,
      status,
      settings: { url: "http://127.0.0.1:1/slack/unused" },
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

test("the form lists Slack destinations by name and marks a broken one", async ({
  page,
}) => {
  await addSlack(user, "Ops channel", "active");
  await addSlack(user, "Incident room", "broken");
  await page.goto("/alerts/new");
  await expect(page).toHaveTitle(/Create alert/);

  const checkboxes = page.getByRole("checkbox");
  await expect(checkboxes).toHaveCount(3);
  await expect(checkboxes.nth(0)).toHaveAccessibleName(
    new RegExp(`Account email ${user.email}`),
  );
  await expect(checkboxes.nth(1)).toHaveAccessibleName(/Ops channel Slack$/);
  await expect(checkboxes.nth(2)).toBeEnabled();
  await expect(page.getByText("Broken", { exact: true })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);
});

test("the alerts list names every destination and marks the broken one", async ({
  page,
}) => {
  const ops = await addSlack(user, "Ops channel", "active");
  const incident = await addSlack(user, "Incident room", "broken");
  const { data, error } = await admin()
    .from("alerts")
    .insert({
      user_id: user.id,
      name: "Quakes fan-out",
      category: "natural_disasters",
      min_severity: "high",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const { error: linkError } = await admin()
    .from("alert_destinations")
    .insert(
      [ops, incident].map((destination_id) => ({
        alert_id: data.id,
        destination_id,
        user_id: user.id,
      })),
    );
  if (linkError) throw new Error(linkError.message);

  await page.goto("/alerts");
  await expect(page).toHaveTitle(/Alerts/);
  const row = page.getByRole("listitem").filter({ hasText: "Quakes fan-out" });
  await expect(row).toContainText("Ops channel and Incident room (broken)");
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);
});

test("a news alert needs a keyword", async ({ page }) => {
  await page.goto("/alerts/new");
  await page.getByLabel("Name").fill("News without keywords");
  await expect(page.getByText("(optional)")).toBeVisible();
  await page.getByRole("radio", { name: "News" }).click();
  await expect(page.getByText("(optional)")).toHaveCount(0);
  await expect(page.getByText(/^Required for news\./)).toBeVisible();

  await page.getByRole("button", { name: "Create alert" }).click();
  await expect(
    page.getByText(
      "News alerts need at least one keyword, or every article would notify you.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Keywords")).toBeFocused();
  await expect(page.getByLabel("Keywords")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);

  await page.getByLabel("Keywords").fill("tsunami");
  await page.getByRole("button", { name: "Create alert" }).click();
  await expect(page.getByText("Alert created.")).toBeVisible();
});

test("resuming a keyword-less news alert is refused and the switch reverts", async ({
  page,
}) => {
  const { data: email, error: emailError } = await admin()
    .from("destinations")
    .select("id")
    .eq("user_id", user.id)
    .eq("channel_type", "email")
    .single();
  if (emailError) throw new Error(emailError.message);
  const { data, error } = await admin()
    .from("alerts")
    .insert({
      user_id: user.id,
      name: "Old news",
      category: "news",
      min_severity: null,
      active: false,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const { error: linkError } = await admin()
    .from("alert_destinations")
    .insert({ alert_id: data.id, destination_id: email.id, user_id: user.id });
  if (linkError) throw new Error(linkError.message);

  await page.goto("/alerts");
  const toggle = page.getByRole("switch", { name: "Old news is paused" });
  await toggle.click();
  await expect(
    page.getByText(
      "News alerts need at least one keyword, or every article would notify you. Edit the alert to add one.",
    ),
  ).toBeVisible();
  await expect(toggle).toHaveAccessibleName("Old news is paused");
});
