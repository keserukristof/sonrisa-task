import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type DestinationRow = {
  id: string;
  name: string;
  channelType: string;
  status: string;
};

export type DestinationsView = {
  /** The signed-in user's address: the email destination's recipient. */
  accountEmail: string;
  destinations: DestinationRow[];
};

/** The user's destinations. `settings` is never read. */
export async function listDestinations(): Promise<DestinationsView> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("id, name, channel_type, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Could not read the destinations.");

  return {
    accountEmail: user.email ?? "",
    destinations: data.map((row) => ({
      id: row.id,
      name: row.name,
      channelType: row.channel_type,
      status: row.status,
    })),
  };
}
