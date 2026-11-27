import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type DestinationRow = {
  id: string;
  name: string;
  channelType: string;
  /** "hooks.slack.com/…/x7Qa" for Slack; null for email. */
  hint: string | null;
  status: string;
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
    .order("created_at", { ascending: true });
  if (error) throw new Error("Could not read the destinations.");

  const rows = data.map((row) => ({
    id: row.id,
    name: row.name,
    channelType: row.channel_type,
    hint: row.hint,
    status: row.status,
    brokenReason: row.broken_reason,
  }));
  return {
    accountEmail: user.email ?? "",
    destinations: [
      ...rows.filter((row) => row.channelType === "email"),
      ...rows.filter((row) => row.channelType !== "email"),
    ],
  };
}
