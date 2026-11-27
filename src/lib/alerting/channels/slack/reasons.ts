/**
 * Slack's permanent answers, in our words (docs/design/screens/destinations.md,
 * "Broken reasons", and notifications.md). Each has two sentences:
 * - failure: stored on the notification and shown in history ("The Slack …");
 * - broken: stored on the destination and shown on /destinations.
 * The Slack channel returns both in its `broken` outcome.
 */
type Reason = { failure: string; broken: string };

const GONE: Reason = {
  failure: "The Slack channel no longer exists.",
  broken: "Slack says this channel no longer exists.",
};
const REVOKED: Reason = {
  failure: "The Slack webhook was removed or revoked.",
  broken: "Slack says this webhook was removed or revoked.",
};

export const SLACK_PERMANENT_REASONS = {
  channel_not_found: GONE,
  channel_is_archived: {
    failure: "The Slack channel is archived.",
    broken: "Slack says this channel is archived.",
  },
  no_service: REVOKED,
  no_active_hooks: REVOKED,
  invalid_token: REVOKED,
  action_prohibited: {
    failure: "The Slack workspace blocks this webhook.",
    broken: "Slack's workspace settings block this webhook.",
  },
  team_disabled: {
    failure: "The Slack workspace is no longer active.",
    broken: "Slack says this workspace is no longer active.",
  },
} as const satisfies Record<string, Reason>;

/** A 404 with no recognised code reads as a gone channel; a 410 as a revoked webhook. */
export const SLACK_STATUS_REASONS = {
  404: GONE,
  410: REVOKED,
} as const satisfies Record<number, Reason>;

/** The sentence history shows when the stored URL is not a Slack webhook URL. */
export const SLACK_INVALID_URL_REASON: Reason = {
  failure: "The Slack webhook URL is not valid.",
  broken: "This webhook URL is not a Slack incoming webhook.",
};
