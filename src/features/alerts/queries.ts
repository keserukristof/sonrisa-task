import "server-only";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import {
  CHANNEL_TYPES,
  type Category,
  type ChannelType,
  type Severity,
} from "@/lib/alerting/types";
import { createClient } from "@/lib/supabase/server";

const channelTypeSchema = z.enum(CHANNEL_TYPES);
const statusSchema = z.enum(["active", "broken"]);

export type DestinationOption = {
  id: string;
  name: string;
  channelType: ChannelType;
  status: z.infer<typeof statusSchema>;
};

export type AlertSummary = {
  id: string;
  name: string;
  category: Category;
  minSeverity: Severity | null;
  keywords: string[];
  active: boolean;
  destinations: { name: string; broken: boolean }[];
};

export type AlertDetail = {
  id: string;
  name: string;
  category: Category;
  minSeverity: Severity | null;
  keywords: string[];
  destinationIds: string[];
};

/** The signed-in user's destinations, for the form. Never reads `settings`. */
export async function getDestinationOptions(): Promise<{
  destinations: DestinationOption[];
  accountEmail: string | null;
}> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("id, name, channel_type, status")
    .eq("user_id", user.id)
    // "email" sorts before "slack": the account email first, then oldest first.
    .order("channel_type", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error("Could not load destinations.");
  return {
    destinations: data.map((row) => ({
      id: row.id,
      name: row.name,
      channelType: channelTypeSchema.parse(row.channel_type),
      status: statusSchema.parse(row.status),
    })),
    accountEmail: user.email,
  };
}

const destinationLink = z.object({
  destination_id: z.string(),
  destinations: z
    .object({
      name: z.string(),
      status: statusSchema,
    })
    .nullable(),
});

/** The user's alerts, newest first, each with its destination names. */
export async function getAlerts(): Promise<AlertSummary[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select(
      "id, name, category, min_severity, keywords, active, created_at, alert_destinations(destination_id, destinations(name, status, channel_type, created_at))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    // The account email first, then Slack, oldest first.
    .order("destinations(channel_type)", {
      referencedTable: "alert_destinations",
    })
    .order("destinations(created_at)", {
      referencedTable: "alert_destinations",
    });
  if (error) throw new Error("Could not load alerts.");

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    minSeverity: row.min_severity,
    keywords: row.keywords,
    active: row.active,
    destinations: z
      .array(destinationLink)
      .parse(row.alert_destinations)
      .flatMap((link) => (link.destinations ? [link.destinations] : []))
      .map((d) => ({ name: d.name, broken: d.status === "broken" })),
  }));
}

/** One of the user's alerts for the edit form, or null if it is not theirs. */
export async function getAlert(id: string): Promise<AlertDetail | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select(
      "id, name, category, min_severity, keywords, alert_destinations(destination_id)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Could not load the alert.");
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    category: data.category,
    minSeverity: data.min_severity,
    keywords: data.keywords,
    destinationIds: z
      .array(z.object({ destination_id: z.string() }))
      .parse(data.alert_destinations)
      .map((link) => link.destination_id),
  };
}
