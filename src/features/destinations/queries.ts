import "server-only";
import { z } from "zod";
import { CHANNEL_TYPES, type ChannelType } from "@/lib/alerting/types";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const DESTINATION_STATUSES = ["active", "broken"] as const;
export type DestinationStatus = (typeof DESTINATION_STATUSES)[number];

const channelTypeSchema = z.enum(CHANNEL_TYPES);
const statusSchema = z.enum(DESTINATION_STATUSES);

export type DestinationRow = {
  id: string;
  name: string;
  channelType: ChannelType;
  /** "hooks.slack.com/…/x7Qa" for Slack; null for email. */
  hint: string | null;
  status: DestinationStatus;
  brokenReason: string | null;
};

export type DestinationsView = {
  /** The signed-in user's address: the email destination's recipient. */
  accountEmail: string;
  /** Email first, then Slack, oldest first. */
  destinations: DestinationRow[];
};

/** The user's destinations. `settings` is never read. */
export async function listDestinations(): Promise<DestinationsView> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("id, name, channel_type, hint, status, broken_reason, created_at")
    .eq("user_id", user.id)
    // "email" sorts before "slack": the account email first, then oldest first.
    .order("channel_type", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error("Could not read the destinations.");

  return {
    accountEmail: user.email ?? "",
    destinations: data.map((row) => ({
      id: row.id,
      name: row.name,
      channelType: channelTypeSchema.parse(row.channel_type),
      hint: row.hint,
      status: statusSchema.parse(row.status),
      brokenReason: row.broken_reason,
    })),
  };
}
