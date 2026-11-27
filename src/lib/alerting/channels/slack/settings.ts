import { z } from "zod";

/** Every Slack incoming webhook URL starts with this. */
export const SLACK_WEBHOOK_PREFIX = "https://hooks.slack.com/services/";

/**
 * The local stub's URLs (`e2e/support/slack-stub.mjs`), accepted only outside
 * production, where `allowsLocalSlackStub()` in `src/lib/env.server.ts` says so.
 */
const LOCAL_STUB_PATTERN = /^http:\/\/127\.0\.0\.1:\d{2,5}\/slack\/[\w/-]+$/;
const SLACK_PATTERN = /^https:\/\/hooks\.slack\.com\/services\/[\w/-]+$/;

export const SLACK_URL_MESSAGE =
  "Paste a Slack incoming webhook URL. It starts with https://hooks.slack.com/services/.";

export function isSlackWebhookUrl(
  url: string,
  options: { allowLocalStub: boolean },
): boolean {
  return (
    SLACK_PATTERN.test(url) ||
    (options.allowLocalStub && LOCAL_STUB_PATTERN.test(url))
  );
}

/** The webhook URL as the add form posts it. */
export function slackWebhookUrlField(options: { allowLocalStub: boolean }) {
  return z
    .string()
    .trim()
    .refine((url) => isSlackWebhookUrl(url, options), SLACK_URL_MESSAGE);
}

/**
 * `destinations.settings` of a Slack destination. The channel parses every
 * stored URL with this before sending, so a URL that is not Slack's (in
 * production, the local stub's too) is never requested, however it was stored.
 */
export function slackSettingsSchema(options: { allowLocalStub: boolean }) {
  return z.object({ url: slackWebhookUrlField(options) });
}

export type SlackSettings = { url: string };

/** What a destination row shows of its URL: "hooks.slack.com/…/WXYZ". */
export function slackHint(url: string): string {
  return `hooks.slack.com/…/${url.slice(-4)}`;
}
