import {
  SOURCE_CATALOG,
  sourceStatus,
  type SourceStatus,
} from "@/lib/alerting/sources/catalog";
import { formatUtcDateTime, formatUtcTime } from "@/lib/format";

/** The latest poll of one source, as `admin_source_health` reports it. */
export type PollRecord = {
  source: string;
  lastPolledAt: string;
  lastOutcome: string;
  lastError: string | null;
  lastEventsStored: number;
  lastSuccessAt: string | null;
};

export type SourceRow = {
  id: string;
  name: string;
  description: string;
  status: SourceStatus;
  /** "18:47 UTC", with the date when not today; null when never polled. */
  lastPoll: string | null;
  /** "Succeeded" or "Failed: <error>"; null when never polled. */
  outcome: string | null;
  eventsStored: number | null;
};

function formatLastPoll(value: string, now: Date): string {
  const sameDay =
    new Date(value).toISOString().slice(0, 10) ===
    now.toISOString().slice(0, 10);
  return sameDay ? formatUtcTime(value) : formatUtcDateTime(value);
}

/** One row per catalog source, in catalog order; a missing one is never polled. */
export function buildSourceRows(
  polls: readonly PollRecord[],
  now: Date,
): SourceRow[] {
  return SOURCE_CATALOG.map((entry) => {
    const poll = polls.find((p) => p.source === entry.id);
    const failed = poll?.lastOutcome === "error";
    const status = sourceStatus(
      entry.intervalSeconds,
      {
        lastOutcome: poll ? (failed ? "error" : "ok") : null,
        lastSuccessAt: poll?.lastSuccessAt
          ? new Date(poll.lastSuccessAt)
          : null,
      },
      now,
    );
    return {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      status,
      lastPoll: poll ? formatLastPoll(poll.lastPolledAt, now) : null,
      outcome: poll
        ? failed
          ? `Failed: ${poll.lastError ?? "No reason was stored."}`
          : "Succeeded"
        : null,
      eventsStored: poll ? poll.lastEventsStored : null,
    };
  });
}
