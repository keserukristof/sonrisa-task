import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createUser, deleteUser, signIn } from "./support/users";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("a non-admin gets the not-found page at /admin", async ({ page }) => {
  const user = await createUser();
  try {
    await signIn(page, user);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Admin" })).toHaveCount(
      0,
    );
    await expect(page.getByText("Email budget")).toHaveCount(0);
  } finally {
    await deleteUser(user);
  }
});

test("an admin sees the source health and today's email budget", async ({
  page,
}) => {
  const admin = await createUser({ admin: true });
  try {
    await signIn(page, admin);
    await page.goto("/admin");
    await expect(page).toHaveTitle(/^Overview · Admin/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Admin" }),
    ).toBeVisible();

    // Real polling is off in the e2e environment.
    await expect(
      page.getByRole("heading", { level: 2, name: "Sources" }),
    ).toBeVisible();
    await expect(
      page.getByText("Not polled in this environment"),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { level: 2, name: "Email budget" }),
    ).toBeVisible();
    await expect(page.getByText(/emails sent today \(UTC\)/)).toBeVisible();
    await expect(page.getByText(/^\d+ of 20 test sends$/)).toBeVisible();
    await expect(
      page.getByRole("img", { name: /^\d+ of 80 emails sent today$/ }),
    ).toBeVisible();
    await expect(
      page.getByText(/Daily system limit \(80\) reached/),
    ).toBeVisible();

    const scan = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(scan.violations).toEqual([]);
  } finally {
    await deleteUser(admin);
  }
});
