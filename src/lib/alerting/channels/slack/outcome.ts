import type { SendOutcome } from "@/lib/alerting/types";
import { SLACK_PERMANENT_REASONS, SLACK_STATUS_REASONS } from "./reasons";

// Slack's answer text is never stored or shown: our own sentences are.
// Sentences start "The Slack " and end with a full stop.
const SLOW_DOWN = "The Slack service asked us to slow down.";
const SERVICE_PROBLEM = "The Slack service had a problem on its side.";
const NOT_ACCEPTED = "The Slack service did not accept the message.";

export const SLACK_SERVICE_UNREACHABLE =
  "The Slack service could not be reached.";

function isPermanentCode(
  code: string,
): code is keyof typeof SLACK_PERMANENT_REASONS {
  return Object.hasOwn(SLACK_PERMANENT_REASONS, code);
}

function isReasonStatus(
  status: number,
): status is keyof typeof SLACK_STATUS_REASONS {
  return Object.hasOwn(SLACK_STATUS_REASONS, status);
}

/**
 * Sorts an incoming webhook's literal answer. A 2xx is sent; a recognised
 * error code in the body, or a 404 or 410, is permanent; a 429 retries after
 * Slack's own wait; everything else is worth another try.
 */
export function classifySlackResponse(response: {
  status: number;
  body: string | null;
  retryAfter: string | null;
}): SendOutcome {
  const { status, retryAfter } = response;
  if (status >= 200 && status < 300) return { kind: "sent" };

  const code = (response.body ?? "").trim();
  const reason = isPermanentCode(code)
    ? SLACK_PERMANENT_REASONS[code]
    : isReasonStatus(status)
      ? SLACK_STATUS_REASONS[status]
      : null;
  if (reason) {
    return {
      kind: "broken",
      error: reason.failure,
      destinationReason: reason.broken,
    };
  }

  if (status === 429) {
    const seconds = Number(retryAfter);
    return Number.isFinite(seconds) && retryAfter !== null && seconds > 0
      ? { kind: "retry", error: SLOW_DOWN, retryAfterSeconds: seconds }
      : { kind: "retry", error: SLOW_DOWN };
  }
  if (status === 408 || status >= 500) {
    return { kind: "retry", error: SERVICE_PROBLEM };
  }
  return { kind: "retry", error: NOT_ACCEPTED };
}
