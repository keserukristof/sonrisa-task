import type { Database } from "@/lib/supabase/database.types";
import type { AdminClient } from "@/lib/supabase/admin";
import type { Channel, Clock, SendOutcome } from "../types";
import type { TickConfig } from "../config";
import { planRetry } from "./retry";

export type DeliverResult = {
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
};

/** A claim that is not answered by the end of the lease is retried by a later tick. */
const LEASE_SECONDS = 120;

function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
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
      await db
        .from("notifications")
        .update({
          status: "sent",
          sent_at: now.toISOString(),
          last_error: null,
        })
        .eq("id", row.notification_id)
        .eq("status", "pending");
      result.sent += 1;
    } else if (outcome.kind === "broken") {
      await db
        .from("notifications")
        .update({ status: "failed", last_error: outcome.error })
        .eq("id", row.notification_id)
        .eq("status", "pending");
      if (row.destination_id) {
        await db
          .from("destinations")
          .update({ status: "broken", broken_reason: outcome.error })
          .eq("id", row.destination_id);
      }
      result.failed += 1;
    } else {
      const plan = planRetry(
        row.attempts,
        config.retryDelaysSeconds,
        outcome.retryAfterSeconds,
      );
      if (plan.kind === "give_up") {
        await db
          .from("notifications")
          .update({ status: "failed", last_error: outcome.error })
          .eq("id", row.notification_id)
          .eq("status", "pending");
        result.failed += 1;
      } else {
        await db
          .from("notifications")
          .update({
            next_attempt_at: new Date(
              now.getTime() + plan.delaySeconds * 1000,
            ).toISOString(),
            last_error: outcome.error,
          })
          .eq("id", row.notification_id)
          .eq("status", "pending");
        result.retried += 1;
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
      return { kind: "broken", error: "The destination was deleted" };
    }
    const channel = channels.find((c) => c.type === row.channel_type);
    if (!channel) {
      return {
        kind: "retry",
        error: `No ${row.channel_type} channel is set up`,
      };
    }
    const settings = channel.settingsSchema.safeParse(row.destination_settings);
    if (!settings.success) {
      return {
        kind: "broken",
        error: "The destination's settings are invalid",
      };
    }
    const { data: auth, error } = await db.auth.admin.getUserById(row.user_id);
    if (error || !auth.user?.email) {
      return {
        kind: "retry",
        error: "The account's address could not be read",
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
    return { kind: "retry", error: errorText(caught) };
  }
}
