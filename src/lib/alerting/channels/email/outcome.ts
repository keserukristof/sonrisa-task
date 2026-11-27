import type { SendOutcome } from "@/lib/alerting/types";

// The text of each outcome is a fixed sentence of ours. It is stored and
// shown to the user, so provider text (which can echo addresses or keys) is
// logged server-side only. Sentences start "The email " and end with a period
// so the notification history can show them.
const SLOW_DOWN = "The email service asked us to slow down.";
const SERVICE_PROBLEM = "The email service had a problem on its side.";
const CREDENTIALS = "The email service rejected our sending credentials.";
const REJECTED_BY_SERVICE = "The email was rejected by the email service.";
const REJECTED_BY_SERVER = "The email was rejected by the mail server.";
const NOT_YET = "The email could not be delivered yet.";

export const EMAIL_SERVICE_UNREACHABLE =
  "The email service could not be reached.";

/**
 * Sorts Resend's HTTP answer: 2xx is sent; 429, 5xx and 408 are worth another
 * try, and so are 401 and 403, because a bad key or an unverified domain is
 * our failure, not the recipient's. Any other answer is permanent.
 */
export function classifyResendResponse(response: {
  status: number;
  retryAfter: string | null;
  body?: unknown;
}): SendOutcome {
  const { status, retryAfter } = response;
  if (status >= 200 && status < 300) return { kind: "sent" };

  if (status === 429) {
    const seconds = Number(retryAfter);
    return Number.isFinite(seconds) && retryAfter !== null && seconds > 0
      ? { kind: "retry", error: SLOW_DOWN, retryAfterSeconds: seconds }
      : { kind: "retry", error: SLOW_DOWN };
  }
  if (status === 401 || status === 403) {
    return { kind: "retry", error: CREDENTIALS };
  }
  if (status === 408 || status >= 500) {
    return { kind: "retry", error: SERVICE_PROBLEM };
  }
  return { kind: "broken", error: REJECTED_BY_SERVICE };
}

/**
 * Sorts an SMTP failure: a 5xx reply is permanent, a 4xx reply or any
 * connection problem is transient.
 */
export function classifySmtpError(error: {
  code?: string;
  responseCode?: number;
  message: string;
}): SendOutcome {
  const { responseCode } = error;
  if (typeof responseCode === "number" && responseCode >= 500) {
    return { kind: "broken", error: REJECTED_BY_SERVER };
  }
  return { kind: "retry", error: NOT_YET };
}
