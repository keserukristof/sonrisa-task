import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { createUser, deleteUser, signIn } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Run `pnpm bootstrap`.");
  return createClient(url, key, { auth: { persistSession: false } });
}

test("a non-admin gets the not-found page on the events list", async ({
  page,
}) => {
  const user = await createUser();
  try {
    await signIn(page, user);
    await page.goto("/admin/events");
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Admin" })).toHaveCount(
      0,
    );
  } finally {
    await deleteUser(user);
  }
});

test("an admin sees events with source, credit, severity and the Simulated badge", async ({
  page,
}) => {
  const admin = await createUser({ admin: true });
  const suffix = randomUUID().slice(0, 8);
  const guardianTitle = `E2E guardian ${suffix}`;
  const simulatedTitle = `E2E simulated ${suffix}`;
  const supabase = serviceClient();
  // Far in the future, so both rows sit on page 1 whatever else is stored.
  const base = Date.UTC(2099, 0, 1, 12, 0, 0);
  try {
    const { error } = await supabase.from("events").insert([
      {
        source: "guardian",
        external_id: `e2e-${suffix}-g`,
        category: "news",
        severity: "low",
        title: guardianTitle,
        simulated: false,
        occurred_at: new Date(base).toISOString(),
      },
      {
        source: "simulated",
        external_id: `e2e-${suffix}-s`,
        category: "markets",
        severity: "critical",
        title: simulatedTitle,
        simulated: true,
        occurred_at: new Date(base - 60_000).toISOString(),
      },
    ]);
    expect(error).toBeNull();

    await signIn(page, admin);
    await page.goto("/admin/events");
    await expect(page).toHaveTitle(/^Events · Admin/);

    const guardian = page
      .getByRole("listitem")
      .filter({ hasText: guardianTitle });
    await expect(guardian).toContainText("The Guardian");
    await expect(guardian).toContainText("News");
    await expect(guardian).toContainText("Source: The Guardian");
    await expect(guardian).toContainText("1 Jan 2099, 12:00 UTC");
    await expect(guardian).toContainText("Low");
    await expect(guardian).not.toContainText("Simulated");

    const simulated = page
      .getByRole("listitem")
      .filter({ hasText: simulatedTitle });
    await expect(simulated).toContainText("Simulated");
    await expect(simulated).toContainText("Critical");
    await expect(simulated).not.toContainText(/Source:|Powered by/);

    // Newest first.
    const titles = await page
      .getByRole("listitem")
      .filter({ hasText: new RegExp(`E2E (guardian|simulated) ${suffix}`) })
      .allTextContents();
    expect(titles[0]).toContain(guardianTitle);

    const scan = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(scan.violations).toEqual([]);
  } finally {
    await supabase
      .from("events")
      .delete()
      .like("external_id", `e2e-${suffix}-%`);
    await deleteUser(admin);
  }
});
