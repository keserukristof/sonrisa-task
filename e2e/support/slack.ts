import process from "node:process";

/**
 * The local Slack stub (e2e/support/slack-stub.mjs), started by Playwright.
 * Give each test its own token: `slackToken()`.
 */
function stubOrigin(): string {
  return `http://127.0.0.1:${process.env.SLACK_STUB_PORT ?? "4100"}`;
}

export function slackToken(): string {
  return `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The webhook URL to paste into "Add Slack destination". */
export function slackStubUrl(token: string): string {
  return `${stubOrigin()}/slack/${token}`;
}

/** Makes the stub answer every later post to `token` like this. */
export async function setSlackAnswer(
  token: string,
  answer: { status: number; body: string; retryAfter?: number },
): Promise<void> {
  const response = await fetch(`${stubOrigin()}/__answer/${token}`, {
    method: "POST",
    body: JSON.stringify(answer),
  });
  if (!response.ok) throw new Error(`Slack stub answered ${response.status}`);
}

/** The Block Kit bodies the stub accepted for `token`, oldest first. */
export async function slackMessages(token: string): Promise<unknown[]> {
  const response = await fetch(`${stubOrigin()}/__messages/${token}`);
  if (!response.ok) throw new Error(`Slack stub answered ${response.status}`);
  const body: unknown = await response.json();
  return Array.isArray(body) ? body : [];
}
