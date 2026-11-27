import { z } from "zod";
import { formatUtcDateTime, formatUtcTime } from "@/lib/format";
import {
  CHANNEL_TYPES,
  NOTIFICATION_STATUSES,
  type NotificationStatus,
} from "@/lib/alerting/types";

export const PAGE_SIZE = 25;

/** The admin_notifications() rows, as the database returns them. */
const rawSchema = z.object({
  id: z.string(),
  status: z.enum(NOTIFICATION_STATUSES),
  channel_type: z.enum(CHANNEL_TYPES),
  attempts: z.number(),
  last_error: z.string().nullable(),
  skip_reason: z.string().nullable(),
  sent_at: z.string().nullable(),
  next_attempt_at: z.string().nullable(),
  event_title: z.string().nullable(),
  event_occurred_at: z.string().nullable(),
  event_simulated: z.boolean().nullable(),
  owner_email: z.string().nullable(),
  total_count: z.number(),
});

export type RawAdminNotification = z.infer<typeof rawSchema>;

/** The rows, or null when they are not the expected shape. */
export function parseAdminNotifications(
  data: unknown,
): RawAdminNotification[] | null {
  const parsed = z.array(rawSchema).safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** `?status=` as a status; anything else, or none, is All (null). */
export function parseStatusFilter(
  value: string | string[] | undefined,
): NotificationStatus | null {
  const parsed = z.enum(NOTIFICATION_STATUSES).safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** The list's own URL for a filter and page. All drops `status`. */
export function statusHref(
  status: NotificationStatus | null,
  page = 1,
): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/notifications?${query}` : "/admin/notifications";
}

export function attemptsLabel(attempts: number): string {
  return `${attempts} ${attempts === 1 ? "attempt" : "attempts"}`;
}

/** What a row shows. */
export type AdminNotificationRowData = {
  id: string;
  title: string;
  simulated: boolean;
  eventTime: string;
  ownerEmail: string;
  destination: "Email" | "Slack";
  attempts: string;
  status: NotificationStatus;
  detail: string | null;
};

// Only sentences our own code writes are shown. A raw provider or database
// message never reaches the page.
const KNOWN_FAILURE = /^The (email|Slack) [^.]{1,120}\.$/;

function failureReason(raw: RawAdminNotification): string {
  if (raw.last_error && KNOWN_FAILURE.test(raw.last_error)) {
    return raw.last_error;
  }
  const what = raw.channel_type === "slack" ? "Slack message" : "email";
  return `The ${what} couldn't be sent after ${Math.max(raw.attempts, 1)} attempts.`;
}

function detailFor(raw: RawAdminNotification): string | null {
  switch (raw.status) {
    case "pending":
      return raw.attempts === 0 || !raw.next_attempt_at
        ? "Waiting to be sent"
        : `Next attempt at ${formatUtcTime(raw.next_attempt_at)}`;
    case "sent":
      return raw.sent_at ? formatUtcTime(raw.sent_at) : null;
    case "failed":
      return failureReason(raw);
    case "skipped":
      return raw.skip_reason;
  }
}

export function toAdminNotificationRow(
  raw: RawAdminNotification,
): AdminNotificationRowData {
  return {
    id: raw.id,
    title: raw.event_title ?? "Event",
    simulated: raw.event_simulated ?? false,
    eventTime: raw.event_occurred_at
      ? formatUtcDateTime(raw.event_occurred_at)
      : "",
    ownerEmail: raw.owner_email ?? "Deleted account",
    destination: raw.channel_type === "slack" ? "Slack" : "Email",
    attempts: attemptsLabel(raw.attempts),
    status: raw.status,
    detail: detailFor(raw),
  };
}
