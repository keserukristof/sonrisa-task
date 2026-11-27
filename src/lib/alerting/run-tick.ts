import type { AdminClient } from "@/lib/supabase/admin";
import type { TickConfig } from "./config";
import { deliverNotifications } from "./tick/deliver";
import { pollSources } from "./tick/poll";
import type { Channel, Clock, Source } from "./types";

export type TickDeps = {
  db: AdminClient;
  sources: readonly Source[];
  channels: readonly Channel[];
  clock: Clock;
  config: TickConfig;
};

/** Counts only: the route returns this, so it carries no addresses, titles or errors. */
export type TickSummary = {
  sourcesPolled: number;
  eventsStored: number;
  sourcesFailed: number;
  eventsMatched: number;
  notificationsCreated: number;
  notificationsSkipped: number;
  notificationsSent: number;
  notificationsRetried: number;
  notificationsFailed: number;
};

/** Poll, match, limit, deliver. Safe to run twice at once: each step claims its rows. */
export async function runTick(deps: TickDeps): Promise<TickSummary> {
  const { db, sources, channels, clock, config } = deps;

  const polled = config.realPolling
    ? await pollSources(db, sources, clock)
    : { polled: 0, stored: 0, failed: 0 };

  const { data: matched, error } = await db.rpc("tick_match_events", {
    p_now: clock.now().toISOString(),
    p_emails_per_user_per_hour: config.emailsPerUserPerHour,
    p_emails_per_system_per_day: config.emailsPerSystemPerDay,
  });
  if (error) throw new Error(`tick_match_events: ${error.message}`);
  const match = matched[0];

  const delivered = await deliverNotifications(db, channels, clock, config);

  return {
    sourcesPolled: polled.polled,
    eventsStored: polled.stored,
    sourcesFailed: polled.failed,
    eventsMatched: match?.events_matched ?? 0,
    notificationsCreated: match?.notifications_created ?? 0,
    notificationsSkipped: match?.notifications_skipped ?? 0,
    notificationsSent: delivered.sent,
    notificationsRetried: delivered.retried,
    notificationsFailed: delivered.failed,
  };
}
