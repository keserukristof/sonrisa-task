import { randomUUID } from "node:crypto";
import process from "node:process";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { createUser, deleteUser, signIn, type TestUser } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("Run `pnpm bootstrap` first.");
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

test.describe("admin lists", () => {
  let admin: TestUser;
  let member: TestUser;
  let suffix: string;
  let eventIds: string[] = [];

  test.beforeAll(async () => {
    admin = await createUser({ admin: true });
    member = await createUser();
    suffix = randomUUID().slice(0, 8);

    // One event of our own, with notifications for the member that no tick
    // will touch: matched already, next attempt far away, no destination.
    const db = serviceClient();
    const mk = async (title: string) => {
      const { data, error } = await db
        .from("events")
        .insert({
          category: "news",
          external_id: `e2e-${title}-${suffix}`,
          occurred_at: new Date().toISOString(),
          severity: "high",
          simulated: true,
          source: "simulated",
          title,
          matched_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data.id;
    };
    const failedEvent = await mk(`Failed ${suffix}`);
    const sentEvent = await mk(`Sent ${suffix}`);
    eventIds = [failedEvent, sentEvent];

    const far = new Date(Date.now() + 86_400_000).toISOString();
    const base = {
      user_id: member.id,
      channel_type: "slack",
      next_attempt_at: far,
    };
    const rows = [
      {
        ...base,
        event_id: sentEvent,
        status: "sent",
        attempts: 1,
        sent_at: new Date().toISOString(),
      },
      // 26 failed rows: the filtered list needs a second page.
      ...Array.from({ length: 26 }, () => ({
        ...base,
        event_id: failedEvent,
        status: "failed",
        attempts: 4,
        last_error: "The Slack workspace didn't accept the message.",
      })),
    ];
    const { error } = await db.from("notifications").insert(rows);
    if (error) throw new Error(error.message);
  });

  test.afterAll(async () => {
    await serviceClient().from("events").delete().in("id", eventIds);
    await deleteUser(member);
    await deleteUser(admin);
  });

  test("a non-admin gets the not-found page on both lists", async ({
    page,
  }) => {
    await signIn(page, member);
    for (const path of ["/admin/users", "/admin/notifications"]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1, name: "Page not found" }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/^Page not found/);
      await expect(page.getByText("Not built yet.")).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
    }
  });

  test("users: email, role, sign-up date and alert count", async ({ page }) => {
    await signIn(page, admin);
    await page.goto("/admin/users");
    await expect(page).toHaveTitle("Users · Admin · Heads-up");

    const adminRow = page
      .getByRole("listitem")
      .filter({ hasText: admin.email });
    await expect(adminRow).toContainText("Admin");
    await expect(adminRow).toContainText("0 alerts");
    await expect(adminRow).toContainText(
      new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date()),
    );
    const memberRow = page
      .getByRole("listitem")
      .filter({ hasText: member.email });
    await expect(memberRow).toContainText("User");

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("notifications: rows, status filter, unknown value and the pager", async ({
    page,
  }) => {
    await signIn(page, admin);
    await page.goto("/admin/notifications");
    await expect(page).toHaveTitle("Notifications · Admin · Heads-up");

    const filter = page.getByRole("navigation", { name: "Status" });
    await expect(filter.getByRole("link", { name: "All" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Filter to Failed: the 26 failed rows of ours fill page 1 and page 2.
    await filter.getByRole("link", { name: "Failed" }).click();
    await expect(page).toHaveURL(/status=failed/);
    const failed = page
      .getByRole("listitem")
      .filter({ hasText: `Failed ${suffix}` });
    // The other project's worker adds failed rows of its own at the same
    // time, so ours may sit on page 1 or 2: walk the pages until they show.
    const pagination = page.getByRole("navigation", { name: "Pagination" });
    // 26 failed rows of ours guarantee a second page, and Next keeps the filter.
    await expect(
      pagination.getByRole("link", { name: "Next" }),
    ).toHaveAttribute("href", /status=failed/);
    for (let i = 0; i < 4 && (await failed.count()) === 0; i++) {
      await pagination.getByRole("link", { name: "Next" }).click();
      await expect(page).toHaveURL(/status=failed/);
      await expect(page).toHaveURL(new RegExp(`page=${i + 2}`));
    }
    await expect(failed.first()).toContainText(member.email);
    await expect(failed.first()).toContainText("Slack");
    await expect(failed.first()).toContainText("4 attempts");
    await expect(failed.first()).toContainText(
      "The Slack workspace didn't accept the message.",
    );
    await expect(failed.first()).toContainText("Simulated");
    await expect(
      page.getByRole("listitem").filter({ hasText: `Sent ${suffix}` }),
    ).toHaveCount(0);

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);

    // Whatever page we are on, Previous carries the filter too.
    if (await pagination.getByRole("link", { name: "Previous" }).count()) {
      await expect(
        pagination.getByRole("link", { name: "Previous" }),
      ).toHaveAttribute("href", /status=failed/);
    }

    // Sent shows our sent row.
    await page.goto("/admin/notifications?status=sent");
    const sent = page
      .getByRole("listitem")
      .filter({ hasText: `Sent ${suffix}` });
    await expect(sent).toContainText("Sent");
    await expect(sent).toContainText("1 attempt");

    // An unknown value shows All.
    await page.goto("/admin/notifications?status=bogus");
    await expect(page).toHaveTitle("Notifications · Admin · Heads-up");
    await expect(
      page
        .getByRole("navigation", { name: "Status" })
        .getByRole("link", { name: "All" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("listitem")).toHaveCount(25);
  });
});
