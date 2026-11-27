import type { Database } from "@/lib/supabase/database.types";
import type { AdminClient } from "@/lib/supabase/admin";
import type { Channel, Clock, SendOutcome } from "../types";
import type { TickConfig } from "../config";
import { errorText } from "./error-text";
import { planRetry } from "./retry";

export type DeliverResult = {
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
};

/** A claim that is not answered by the end of the lease is retried by a later tick. */
const LEASE_SECONDS = 120;

/**
 * Logs a failed write and says whether it went through. A failed write after a
 * send leaves the lease to expire, so a later tick looks at the row again.
 */
function written(label: string, error: { message: string } | null): boolean {
  if (error) console.error(`[tick] ${label}: ${errorText(error)}`);
  return error === null;
}

/** Claims the due notifications and sends each through its channel. */
export async function deliverNotifications(
  db: AdminClient,
  channels: readonly Channel[],
  clock: Clock,
  config: TickConfig,
): Promise<DeliverResult> {
  const result: DeliverResult = { claimed: 0, sent: 0, retried: 0, failed: 0 };

  const { data: claimed, error } = await db.rpc("tick_claim_notifications", {
    p_now: clock.now().toISOString(),
    p_lease_seconds: LEASE_SECONDS,
  });
  if (error) throw new Error(`tick_claim_notifications: ${error.message}`);
  result.claimed = claimed.length;

  for (const row of claimed) {
    const outcome = await sendOne(db, channels, row);
    const now = clock.now();

    if (outcome.kind === "sent") {
      const { error } = await db
        .from("notifications")
        .update({
          status: "sent",
          sent_at: now.toISOString(),
          last_error: null,
        })
        .eq("id", row.notification_id)
        .eq("status", "pending");
      if (written("mark sent", error)) result.sent += 1;
    } else if (outcome.kind === "broken") {
      const { error } = await db
        .from("notifications")
        .update({ status: "failed", last_error: outcome.error })
        .eq("id", row.notification_id)
        .eq("status", "pending");
      if (written("mark failed", error)) result.failed += 1;
      // An email destination is the account's own address and cannot be
      // removed, so a permanent failure fails this notification only.
      if (row.destination_id && row.channel_type !== "email") {
        const { error: brokenError } = await db
          .from("destinations")
          .update({ status: "broken", broken_reason: outcome.error })
          .eq("id", row.destination_id);
        written("mark destination broken", brokenError);
      }
    } else {
      const plan = planRetry(
        row.attempts,
        config.retryDelaysSeconds,
        outcome.retryAfterSeconds,
      );
      if (plan.kind === "give_up") {
        const { error } = await db
          .from("notifications")
          .update({ status: "failed", last_error: outcome.error })
          .eq("id", row.notification_id)
          .eq("status", "pending");
        if (written("give up", error)) result.failed += 1;
      } else {
        const { error } = await db
          .from("notifications")
          .update({
            next_attempt_at: new Date(
              now.getTime() + plan.delaySeconds * 1000,
            ).toISOString(),
            last_error: outcome.error,
          })
          .eq("id", row.notification_id)
          .eq("status", "pending");
        if (written("schedule retry", error)) result.retried += 1;
      }
    }
  }

  return result;
}

type Claimed =
  Database["public"]["Functions"]["tick_claim_notifications"]["Returns"][number];

async function sendOne(
  db: AdminClient,
  channels: readonly Channel[],
  row: Claimed,
): Promise<SendOutcome> {
  try {
    if (!row.destination_id) {
      return { kind: "broken", error: "The email destination was deleted." };
    }
    const channel = channels.find((c) => c.type === row.channel_type);
    if (!channel) {
      return {
        kind: "retry",
        error: `The ${row.channel_type} channel is not set up.`,
      };
    }
    const settings = channel.settingsSchema.safeParse(row.destination_settings);
    if (!settings.success) {
      return {
        kind: "broken",
        error: "The email destination's settings are invalid.",
      };
    }
    const { data: auth, error } = await db.auth.admin.getUserById(row.user_id);
    if (error || !auth.user?.email) {
      return {
        kind: "retry",
        error: "The email address of the account could not be read.",
      };
    }
    return await channel.send(
      {
        event: {
          title: row.event_title,
          summary: row.event_summary,
          url: row.event_url,
          category: row.event_category,
          severity: row.event_severity,
          occurredAt: new Date(row.event_occurred_at),
          source: row.event_source,
          simulated: row.event_simulated,
        },
        alertName: row.alert_name,
      },
      { settings: settings.data, accountEmail: auth.user.email },
    );
  } catch (caught) {
    console.error(`[tick] send failed: ${errorText(caught)}`);
    return {
      kind: "retry",
      error: "The email could not be sent because of an internal error.",
    };
  }
}
