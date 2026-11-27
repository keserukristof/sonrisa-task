import { z } from "zod";
import { sourceCredit } from "@/lib/alerting/sources/catalog";
import { formatUtcDateTime, formatUtcTime } from "@/lib/format";
import {
  NOTIFICATION_STATUSES,
  SEVERITIES,
  type NotificationStatus,
  type Severity,
} from "@/lib/alerting/types";

export const PAGE_SIZE = 25;

/** A notification as the query returns it, with its event, alert and destination. */
const rawNotificationSchema = z.object({
  id: z.string(),
  status: z.enum(NOTIFICATION_STATUSES),
  attempts: z.number(),
  next_attempt_at: z.string(),
  last_error: z.string().nullable(),
  skip_reason: z.string().nullable(),
  sent_at: z.string().nullable(),
  channel_type: z.string(),
  events: z
    .object({
      title: z.string(),
      severity: z.enum(SEVERITIES),
      occurred_at: z.string(),
      simulated: z.boolean(),
      source: z.string(),
    })
    .nullable(),
  /** Null once the alert is deleted. */
  alerts: z.object({ name: z.string() }).nullable(),
  destinations: z.object({ name: z.string() }).nullable(),
});

export type RawNotification = z.infer<typeof rawNotificationSchema>;

/** The embedded rows of the query, or null when they are not the expected shape. */
export function parseRawNotifications(data: unknown): RawNotification[] | null {
  const parsed = z.array(rawNotificationSchema).safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** What a history row shows. */
export type NotificationRowData = {
  id: string;
  title: string;
  simulated: boolean;
  eventTime: string;
  /** The source's credit line; null for simulated events. */
  credit: string | null;
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
const KNOWN_FAILURE = /^The (?:email|Slack) [^.]{1,120}\.$/;

function failureReason(
  lastError: string | null,
  attempts: number,
  channelType: string,
): string {
  if (lastError && KNOWN_FAILURE.test(lastError)) return lastError;
  const what = channelType === "slack" ? "The Slack message" : "The email";
  return `${what} couldn't be sent after ${Math.max(attempts, 1)} attempts.`;
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
      return failureReason(raw.last_error, raw.attempts, raw.channel_type);
    case "skipped":
      return raw.skip_reason;
  }
}

function destinationLabel(raw: RawNotification): string {
  const name = raw.destinations?.name ?? "Removed destination";
  return raw.channel_type === "slack" ? `Slack \u00b7 ${name}` : name;
}

export function toNotificationRow(raw: RawNotification): NotificationRowData {
  return {
    id: raw.id,
    title: raw.events?.title ?? "Event",
    simulated: raw.events?.simulated ?? false,
    eventTime: raw.events ? formatUtcDateTime(raw.events.occurred_at) : "",
    alertName: raw.alerts?.name ?? null,
    credit:
      raw.events && !raw.events.simulated
        ? sourceCredit(raw.events.source)
        : null,
    destinationName: destinationLabel(raw),
    severity: raw.events?.severity ?? null,
    status: raw.status,
    detail: detailFor(raw),
  };
}
