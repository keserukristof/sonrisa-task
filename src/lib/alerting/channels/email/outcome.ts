import type { SendOutcome } from "@/lib/alerting/types";

function messageOf(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    const { message } = body;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

/**
 * Sorts Resend's HTTP answer: 2xx is sent, 429 and 5xx (and 408) are worth
 * another try, any other answer is permanent: a bad key, an unverified
 * domain, a rejected address.
 */
export function classifyResendResponse(response: {
  status: number;
  retryAfter: string | null;
  body: unknown;
}): SendOutcome {
  const { status, retryAfter, body } = response;
  if (status >= 200 && status < 300) return { kind: "sent" };

  const error = messageOf(body, `Resend answered ${status}.`);
  if (status === 429) {
    const seconds = Number(retryAfter);
    return Number.isFinite(seconds) && retryAfter !== null && seconds > 0
      ? { kind: "retry", error, retryAfterSeconds: seconds }
      : { kind: "retry", error };
  }
  if (status === 408 || status >= 500) return { kind: "retry", error };
  return { kind: "broken", error };
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
  const { responseCode, message } = error;
  if (typeof responseCode === "number" && responseCode >= 500) {
    return { kind: "broken", error: message };
  }
  return { kind: "retry", error: message };
}
