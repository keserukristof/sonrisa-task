import "server-only";
import { allowsLocalSlackStub, serverEnv } from "@/lib/env.server";
import type {
  Channel,
  DeliveryTarget,
  SendOutcome,
} from "@/lib/alerting/types";
import { classifySlackResponse, SLACK_SERVICE_UNREACHABLE } from "./outcome";
import {
  renderAlertMessage,
  renderTestMessage,
  type SlackMessage,
} from "./render";
import { SLACK_INVALID_URL_REASON } from "./reasons";
import { slackSettingsSchema, type SlackSettings } from "./settings";

const SEND_TIMEOUT_MS = 10_000;

function schema() {
  return slackSettingsSchema({
    allowLocalStub: allowsLocalSlackStub(serverEnv()),
  });
}

/**
 * Posts one message. The stored URL is re-validated first, so a URL that is
 * not Slack's is never requested. The URL is a secret: it is never logged.
 */
async function deliver(
  settings: SlackSettings,
  message: SlackMessage,
): Promise<SendOutcome> {
  const parsed = schema().safeParse(settings);
  if (!parsed.success) {
    return {
      kind: "broken",
      error: SLACK_INVALID_URL_REASON.failure,
      destinationReason: SLACK_INVALID_URL_REASON.broken,
    };
  }
  try {
    const response = await fetch(parsed.data.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(message),
      redirect: "error",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    const body = await response.text().catch(() => null);
    const outcome = classifySlackResponse({
      status: response.status,
      body,
      retryAfter: response.headers.get("retry-after"),
    });
    if (outcome.kind !== "sent") {
      console.error("[slack] Slack answered", response.status, body);
    }
    return outcome;
  } catch (error) {
    // The error can carry the URL in its message: log only its name.
    console.error(
      "[slack] request failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { kind: "retry", error: SLACK_SERVICE_UNREACHABLE };
  }
}

export const slackChannel: Channel<SlackSettings> = {
  type: "slack",
  get settingsSchema() {
    return schema();
  },
  send(notification, target: DeliveryTarget<SlackSettings>) {
    return deliver(target.settings, renderAlertMessage(notification));
  },
  sendTest(target: DeliveryTarget<SlackSettings>, now: Date) {
    return deliver(
      target.settings,
      renderTestMessage(now, serverEnv().APP_URL),
    );
  },
};
