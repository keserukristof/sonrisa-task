import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  setSlackAnswer,
  slackMessages,
  slackStubUrl,
  slackToken,
} from "./support/slack";
import { createUser, deleteUser, signIn, type TestUser } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// Specs that need the local Slack stub cannot run against a deployment.
test.skip(
  Boolean(process.env.E2E_BASE_URL),
  "needs the local Slack stub, which a deployment cannot reach",
);

let user: TestUser;

test.beforeEach(async ({ page }) => {
  user = await createUser();
  await signIn(page, user);
});

test.afterEach(async () => {
  await deleteUser(user);
});

async function addDestination(page: Page, name: string, token: string) {
  await page.goto("/destinations/slack/new");
  await expect(page).toHaveTitle(/Add Slack destination/);
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Webhook URL").fill(slackStubUrl(token));
  await page.getByRole("button", { name: "Add destination" }).click();
  await expect(page).toHaveURL(
    /\/destinations\?notice=slack-destination-added/,
  );
}

function rowOf(page: Page, name: string) {
  return page.getByRole("listitem").filter({ hasText: name });
}

test("adds a destination: the row shows the hint and never the URL", async ({
  page,
}) => {
  const name = `Ops ${Date.now()}`;
  const token = slackToken();
  await page.goto("/destinations");
  await page.getByRole("link", { name: "Add Slack destination" }).click();
  await expect(page).toHaveTitle(/Add Slack destination/);
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Webhook URL").fill(slackStubUrl(token));
  await page.getByRole("button", { name: "Add destination" }).click();

  await expect(page).toHaveURL(
    /\/destinations\?notice=slack-destination-added/,
  );
  await expect(
    page.getByText("Slack destination added. Send a test to check it works."),
  ).toBeVisible();
  const row = rowOf(page, name);
  await expect(row).toContainText(
    `Slack · hooks.slack.com/…/${token.slice(-4)}`,
  );
  await expect(
    row.getByRole("button", { name: `Send test to ${name}` }),
  ).toBeVisible();
  await expect(
    row.getByRole("button", { name: `Remove ${name}` }),
  ).toBeVisible();
  expect(await page.content()).not.toContain(token);
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);
});

test("the form shows each error next to its field and keeps what was typed", async ({
  page,
}) => {
  await page.goto("/destinations/slack/new");
  await expect(page).toHaveTitle(/Add Slack destination/);

  await page.getByRole("button", { name: "Add destination" }).click();
  await expect(page.getByText("Enter a name.")).toBeVisible();
  await expect(page.getByLabel("Name")).toBeFocused();
  await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByText(/^Paste a Slack incoming webhook URL/),
  ).toBeVisible();

  await page.getByLabel("Name").fill("x".repeat(61));
  await page.getByLabel("Webhook URL").fill("https://example.com/hook");
  await page.getByRole("button", { name: "Add destination" }).click();
  await expect(page.getByText("Use at most 60 characters.")).toBeVisible();
  await expect(page.getByLabel("Webhook URL")).toHaveValue(
    "https://example.com/hook",
  );
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);
});

test("a name already in use is refused on the name field", async ({ page }) => {
  const name = `Dup ${Date.now()}`;
  await addDestination(page, name, slackToken());

  await page.goto("/destinations/slack/new");
  await page.getByLabel("Name").fill(name.toUpperCase());
  await page.getByLabel("Webhook URL").fill(slackStubUrl(slackToken()));
  await page.getByRole("button", { name: "Add destination" }).click();
  await expect(
    page.getByText(
      `You already have a destination called ${name.toUpperCase()}.`,
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Name")).toBeFocused();
});

test("the eleventh destination is refused", async ({ page }) => {
  for (let index = 0; index < 10; index++) {
    await addDestination(page, `Limit ${index} ${Date.now()}`, slackToken());
  }
  await page.goto("/destinations/slack/new");
  await page.getByLabel("Name").fill("One too many");
  await page.getByLabel("Webhook URL").fill(slackStubUrl(slackToken()));
  await page.getByRole("button", { name: "Add destination" }).click();
  await expect(
    page.getByText(
      "You have 10 Slack destinations, the most an account can have. Remove one before adding another.",
    ),
  ).toBeVisible();
  // Focus is on the notice's wrapper.
  await expect(page.locator(":focus")).toContainText("You have 10 Slack");
});

test("send test delivers to Slack, and a failure or limit shows its own result", async ({
  page,
}) => {
  const name = `Test ${Date.now()}`;
  const token = slackToken();
  await addDestination(page, name, token);
  const row = rowOf(page, name);
  const send = row.getByRole("button", { name: `Send test to ${name}` });

  await send.click();
  await expect(row.getByRole("status")).toContainText(
    /Delivered at \d\d:\d\d UTC/,
  );
  expect(await slackMessages(token)).toHaveLength(1);

  await setSlackAnswer(token, { status: 500, body: "boom" });
  await send.click();
  await expect(row.getByRole("status")).toContainText(
    "Couldn't send the test. Try again in a minute.",
  );
  await expect(row).not.toContainText("Broken.");

  await setSlackAnswer(token, { status: 200, body: "ok" });
  for (let attempt = 0; attempt < 3; attempt++) {
    await send.click();
    await expect(row.getByRole("status")).toContainText("Delivered at");
    await expect(send).toBeEnabled();
  }
  await send.click();
  await expect(row.getByRole("status")).toContainText(
    "Not sent. You've sent 5 tests to this destination today.",
  );
});

test("a permanent answer marks the destination broken, and a delivered test repairs it", async ({
  page,
}) => {
  const name = `Gone ${Date.now()}`;
  const token = slackToken();
  await addDestination(page, name, token);
  const row = rowOf(page, name);
  const send = row.getByRole("button", { name: `Send test to ${name}` });

  await setSlackAnswer(token, { status: 404, body: "channel_not_found" });
  await send.click();
  await expect(row.getByRole("status")).toContainText(
    "Not delivered. Slack says this channel no longer exists.",
  );
  await expect(row).toContainText("Broken.");
  await expect(row).toContainText("Slack says this channel no longer exists.");
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);

  // It stays broken after a reload.
  await page.reload();
  await expect(rowOf(page, name)).toContainText("Broken.");

  await setSlackAnswer(token, { status: 200, body: "ok" });
  await rowOf(page, name)
    .getByRole("button", { name: `Send test to ${name}` })
    .click();
  await expect(rowOf(page, name).getByRole("status")).toContainText(
    "Delivered at",
  );
  await expect(rowOf(page, name)).not.toContainText("Broken.");
});

test("remove asks first, closes on Cancel and removes on confirm", async ({
  page,
}) => {
  const name = `Bye ${Date.now()}`;
  await addDestination(page, name, slackToken());
  const remove = rowOf(page, name).getByRole("button", {
    name: `Remove ${name}`,
  });

  await remove.click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText(`Remove "${name}"?`);
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  expect(
    (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(remove).toBeFocused();

  await remove.click();
  await dialog.getByRole("button", { name: "Remove destination" }).click();
  await expect(page).toHaveURL(/notice=slack-destination-removed/);
  await expect(page.getByText("Slack destination removed.")).toBeVisible();
  await expect(rowOf(page, name)).toHaveCount(0);
});

test("a destination that is an alert's only one cannot be removed", async ({
  page,
}) => {
  const name = `Only ${Date.now()}`;
  await addDestination(page, name, slackToken());

  await page.goto("/alerts/new");
  await page.getByLabel("Name").fill(`Alert ${Date.now()}`);
  await page.getByRole("radio", { name: "Natural disasters" }).click();
  await page.getByRole("checkbox", { name: new RegExp(user.email) }).click();
  await page.getByRole("checkbox", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "Create alert" }).click();
  await expect(page).toHaveURL(/\/alerts\?notice=alert-created/);

  await page.goto("/destinations");
  await rowOf(page, name)
    .getByRole("button", { name: `Remove ${name}` })
    .click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "Remove destination" }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    `${name} is the only destination of 1 alert. Change them first.`,
  );
  await expect(
    dialog.getByRole("link", { name: "Go to alerts" }),
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(rowOf(page, name)).toBeVisible();
});
