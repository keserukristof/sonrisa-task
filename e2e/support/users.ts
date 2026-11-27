import { randomUUID } from "node:crypto";
import process from "node:process";
import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export type Credentials = { email: string; password: string };
/** An account a test created for itself. */
export type TestUser = Credentials & { id: string };

/** The seeded accounts. Shared by every test run: read from them, never assert on their totals. */
export const DEMO_USER: Credentials = {
  email: "demo@heads-up.test",
  password: "demo-password",
};
export const DEMO_ADMIN: Credentials = {
  email: "admin@heads-up.test",
  password: "admin-password",
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set. Run `pnpm bootstrap`.",
    );
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A unique address for one test, so parallel runs never share an account. */
export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@heads-up.test`;
}

/**
 * Creates a confirmed account of its own for a test, through the local
 * Supabase admin API. The new-user trigger gives it a profile and an email
 * destination. Use this instead of the demo accounts whenever the test
 * writes data or asserts on a list.
 *
 * A test that sends email (an alert email, "Send test") must call
 * `deleteUser()` when it is done: every email counts toward the system's
 * 80 a day, which all test runs share, and deleting the account removes its
 * notifications and test sends from that count.
 */
export async function createUser(
  options: { admin?: boolean } = {},
): Promise<TestUser> {
  const supabase = adminClient();
  const credentials = {
    email: uniqueEmail(options.admin ? "e2e-admin" : "e2e-user"),
    password: `pw-${randomUUID()}`,
  };

  const { data, error } = await supabase.auth.admin.createUser({
    ...credentials,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Could not create the test user: ${error?.message}`);
  }

  if (options.admin) {
    const { error: roleError } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("user_id", data.user.id);
    if (roleError) {
      throw new Error(
        `Could not make the test user an admin: ${roleError.message}`,
      );
    }
  }

  return { ...credentials, id: data.user.id };
}

/** Deletes an account a test created, with everything it owns. */
export async function deleteUser(user: TestUser): Promise<void> {
  const { error } = await adminClient().auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(`Could not delete the test user: ${error.message}`);
  }
}

/** Signs in through the sign-in page and waits for the alerts page. */
export async function signIn(
  page: Page,
  credentials: Credentials,
): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/alerts/);
}
