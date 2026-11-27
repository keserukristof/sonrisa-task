import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
  type Browser,
  type Locator,
  type Page,
} from "@playwright/test";
import process from "node:process";
import {
  setSlackAnswer,
  slackMessages,
  slackStubUrl,
  slackToken,
} from "./support/slack";
import { createUser, deleteUser, signIn, type TestUser } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// Needs the local Slack stub, which a deployment cannot reach.
test.skip(
  Boolean(process.env.E2E_BASE_URL),
  "needs the local Slack stub, which a deployment cannot reach",
);

let admin: TestUser;
let user: TestUser;

test.beforeEach(async ({ page }) => {
  admin = await createUser({ admin: true });
  user = await createUser();
  await signIn(page, user);
});

test.afterEach(async () => {
  await deleteUser(admin);
  await deleteUser(user);
});

/** Creates a Slack destination and an alert that uses only it. */
async function setUp(page: Page, token: string) {
  const destination = `Ops ${Date.now()}`;
  const alert = `Markets ${Date.now()}`;

  await page.goto("/destinations/slack/new");
  await expect(page).toHaveTitle(/Add Slack destination/);
  await page.getByLabel("Name").fill(destination);
  await page.getByLabel("Webhook URL").fill(slackStubUrl(token));
  await page.getByRole("button", { name: "Add destination" }).click();
  await expect(page).toHaveURL(
    /\/destinations\?notice=slack-destination-added/,
  );

  await page.goto("/alerts/new");
  await expect(page).toHaveTitle(/Create alert/);
  await page.getByLabel("Name").fill(alert);
  await page.getByRole("radio", { name: "Markets" }).click();
  await page.getByLabel("Minimum severity").selectOption("low");
  await page.getByRole("checkbox", { name: new RegExp(destination) }).click();
  await page.getByRole("button", { name: "Create alert" }).click();
  await expect(page).toHaveURL(/\/alerts\?notice=alert-created/);
  return { destination, alert };
}

async function simulateAndTick(
  browser: Browser,
  baseURL: string | undefined,
): Promise<string> {
  const title = `Simulated market move ${Date.now()}`;
  const context = await browser.newContext({
    baseURL,
    reducedMotion: "reduce",
  });
  try {
    const adminPage = await context.newPage();
    await signIn(adminPage, admin);
    await adminPage.goto("/admin/simulate");
    await expect(adminPage).toHaveTitle(/Simulate an event/);
    await adminPage.getByLabel("Markets").check();
    await adminPage.getByLabel("Title").fill(title);
    await adminPage
      .getByRole("button", { name: "Create simulated event" })
      .click();
    await expect(adminPage.getByRole("status")).toContainText("Event created.");
  } finally {
    await context.close();
  }

  const response = await fetch(`${baseURL}/api/tick`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.TICK_SECRET}` },
  });
  expect(response.status).toBe(200);
  return title;
}

/**
 * Waits until the row shows `status`. Every test runs the tick, and the tick
 * serves every account: a parallel test's tick may have claimed this test's
 * notification (a 120-second lease) and still be sending it when this test
 * looks. So the row is read again, after running the tick again, until it
 * settles. A row that never settles still fails the test.
 */
async function expectSettled(
  page: Page,
  baseURL: string | undefined,
  item: Locator,
  status: string,
): Promise<void> {
  await expect(async () => {
    await fetch(`${baseURL}/api/tick`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.TICK_SECRET}` },
    });
    await page.reload();
    await expect(item).toContainText(status, { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

test("a simulated event reaches Slack and history shows it as sent", async ({
  page,
  browser,
  baseURL,
}) => {
  const token = slackToken();
  const { destination } = await setUp(page, token);
  const title = await simulateAndTick(browser, baseURL);

  await page.goto("/notifications");
  await expect(page).toHaveTitle(/Notifications/);
  // The tick serves every account, and a new alert also writes to the
  // account email: pick this test's Slack row.
  const item = page
    .getByRole("listitem")
    .filter({ hasText: title })
    .filter({ hasText: `Slack · ${destination}` });
  await expectSettled(page, baseURL, item, "Sent");
  await expect(item).toContainText("Simulated");
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);

  // Parallel tests' events may also match this alert, so look for ours.
  expect(JSON.stringify(await slackMessages(token))).toContain(title);
});

test("a gone channel fails the delivery and shows the destination as broken", async ({
  page,
  browser,
  baseURL,
}) => {
  const token = slackToken();
  const { destination, alert } = await setUp(page, token);
  await setSlackAnswer(token, { status: 404, body: "channel_not_found" });
  await simulateAndTick(browser, baseURL);

  await page.goto("/notifications");
  // The tick serves every account, so a parallel test's event may have been
  // the one to fail first and break the destination: once it is broken,
  // later events skip it. Assert on this destination's failed row.
  const item = page
    .getByRole("listitem")
    .filter({ hasText: `Slack · ${destination}` })
    .first();
  await expectSettled(page, baseURL, item, "Failed");
  await expect(item).toContainText("The Slack channel no longer exists.");
  expect(await slackMessages(token)).toHaveLength(0);

  await page.goto("/destinations");
  await expect(page).toHaveTitle(/Destinations/);
  const row = page.getByRole("listitem").filter({ hasText: destination });
  await expect(row).toContainText("Broken.");
  await expect(row).toContainText("Slack says this channel no longer exists.");
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);

  await page.goto("/alerts");
  await expect(page).toHaveTitle(/Alerts/);
  const alertRow = page.getByRole("listitem").filter({ hasText: alert });
  await expect(alertRow).toContainText(`${destination} (broken)`);
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);
});
