import type { z } from "zod";

/**
 * The vocabulary and contracts of the alerting core. Everything here is
 * framework-free: no Next.js, no Supabase client, so sources, channels and
 * the tick can be tested on their own.
 */

export const CATEGORIES = ["news", "markets", "natural_disasters"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Lowest first. The order is the scale. */
export const SEVERITIES = ["low", "moderate", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const CHANNEL_TYPES = ["email", "slack"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const NOTIFICATION_STATUSES = [
  "pending",
  "sent",
  "failed",
  "skipped",
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/** The reserved source of events an admin creates by hand. */
export const SIMULATED_SOURCE = "simulated";

export const CATEGORY_LABELS: Record<Category, string> = {
  news: "News",
  markets: "Markets",
  natural_disasters: "Natural disasters",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

/** How an alert's minimum severity reads: "Moderate and above", "Critical only". */
export const MIN_SEVERITY_LABELS: Record<Severity, string> = {
  low: "Low and above",
  moderate: "Moderate and above",
  high: "High and above",
  critical: "Critical only",
};

/** 1 for low up to 4 for critical: the number of filled bars in the severity mark. */
export function severityRank(severity: Severity): number {
  return SEVERITIES.indexOf(severity) + 1;
}

export function isAtLeast(severity: Severity, minimum: Severity): boolean {
  return severityRank(severity) >= severityRank(minimum);
}

/** One event as a source reports it, before it is stored. */
export type EventCandidate = {
  /** The source's own id for the event. Unique per source. */
  externalId: string;
  title: string;
  summary: string | null;
  url: string | null;
  occurredAt: Date;
  severity: Severity;
  /** The provider's item, kept for debugging. Must be JSON-serialisable. */
  raw: unknown;
};

/**
 * An external feed that reports events. `fetch` gets the feed and maps it to
 * candidates; the mapping is a separate pure function in the source's module,
 * so it can be tested on recorded responses. A source never touches the database.
 */
export interface Source {
  /** Stored in `events.source`, such as "usgs". */
  readonly id: string;
  readonly category: Category;
  /** How often the tick may call `fetch`. */
  readonly intervalSeconds: number;
  fetch(now: Date): Promise<EventCandidate[]>;
}

/** What a channel needs to render one notification. */
export type OutgoingNotification = {
  event: {
    title: string;
    summary: string | null;
    url: string | null;
    category: Category;
    severity: Severity;
    occurredAt: Date;
    source: string;
    simulated: boolean;
  };
  /** The alert that matched. Null if it was deleted before sending. */
  alertName: string | null;
};

/** Where one notification goes. */
export type DeliveryTarget<Settings> = {
  /** The destination's settings, already parsed with the channel's schema. */
  settings: Settings;
  /** The account's own address, read from auth when sending. */
  accountEmail: string;
};

/**
 * The result of one send, sorted by what the tick must do next.
 * - sent: done.
 * - retry: a transient failure (network, 5xx, 429). `retryAfterSeconds` is the
 *   provider's own wait, when it gave one.
 * - broken: a permanent failure. The notification fails at once with
 *   `error`, and the destination is marked broken with `destinationReason`
 *   (or `error` when there is none). Failure sentences name their channel:
 *   "The email …", "The Slack …".
 */
export type SendOutcome =
  | { kind: "sent" }
  | { kind: "retry"; error: string; retryAfterSeconds?: number }
  | { kind: "broken"; error: string; destinationReason?: string };

/**
 * A way a notification reaches a user. Adding a channel means a new adapter
 * with its settings schema and a destination form; the tick does not change.
 */
export interface Channel<Settings = unknown> {
  readonly type: ChannelType;
  /** Validates `destinations.settings` for this channel. */
  readonly settingsSchema: z.ZodType<Settings>;
  /** Renders and sends an alert notification. Never throws: failures are outcomes. */
  send(
    notification: OutgoingNotification,
    target: DeliveryTarget<Settings>,
  ): Promise<SendOutcome>;
  /** Sends the "Send test" message for a destination. Never throws. */
  sendTest(target: DeliveryTarget<Settings>, now: Date): Promise<SendOutcome>;
}

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };
