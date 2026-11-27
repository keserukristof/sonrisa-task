import { formatUtcDateTime, formatUtcTime } from "@/lib/format";
import type { NotificationStatus, Severity } from "@/lib/alerting/types";

export const PAGE_SIZE = 25;

/** A notification as the query returns it, with its event, alert and destination. */
export type RawNotification = {
  id: string;
  status: NotificationStatus;
  attempts: number;
  next_attempt_at: string;
  last_error: string | null;
  skip_reason: string | null;
  sent_at: string | null;
  events: {
    title: string;
    severity: Severity;
    occurred_at: string;
    simulated: boolean;
  } | null;
  /** Null once the alert is deleted. */
  alerts: { name: string } | null;
  destinations: { name: string } | null;
};

/** What a history row shows. */
export type NotificationRowData = {
  id: string;
  title: string;
  simulated: boolean;
  eventTime: string;
  /** Null when the alert was deleted. */
  alertName: string | null;
  destinationName: string;
  severity: Severity | null;
  status: NotificationStatus;
  detail: string | null;
};

/** `?page=` as a positive whole number; anything else is the first page. */
export function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^[1-9]\d{0,6}$/.test(value)) return 1;
  return Number(value);
}

// Only sentences our own code writes are shown. A raw provider or database
// message never reaches the page.
const KNOWN_FAILURE = /^The email [^.]{1,120}\.$/;

function failureReason(lastError: string | null, attempts: number): string {
  if (lastError && KNOWN_FAILURE.test(lastError)) return lastError;
  return `The email couldn't be sent after ${Math.max(attempts, 1)} attempts.`;
}

function detailFor(raw: RawNotification): string | null {
  switch (raw.status) {
    case "pending":
      return raw.attempts === 0
        ? "Waiting to be sent"
        : `Next attempt at ${formatUtcTime(raw.next_attempt_at)}`;
    case "sent":
      return raw.sent_at ? formatUtcTime(raw.sent_at) : null;
    case "failed":
      return failureReason(raw.last_error, raw.attempts);
    case "skipped":
      return raw.skip_reason;
  }
}

export function toNotificationRow(raw: RawNotification): NotificationRowData {
  return {
    id: raw.id,
    title: raw.events?.title ?? "Event",
    simulated: raw.events?.simulated ?? false,
    eventTime: raw.events ? formatUtcDateTime(raw.events.occurred_at) : "",
    alertName: raw.alerts?.name ?? null,
    destinationName: raw.destinations?.name ?? "Removed destination",
    severity: raw.events?.severity ?? null,
    status: raw.status,
    detail: detailFor(raw),
  };
}
