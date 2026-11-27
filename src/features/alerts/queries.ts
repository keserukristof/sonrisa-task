import "server-only";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import type { Category, Severity } from "@/lib/alerting/types";
import { createClient } from "@/lib/supabase/server";

export type DestinationOption = {
  id: string;
  name: string;
  channelType: string;
  status: string;
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
    .order("created_at", { ascending: true });
  if (error) throw new Error("Could not load destinations.");
  return {
    destinations: data
      .toSorted((a, b) => emailFirst(a.channel_type, b.channel_type))
      .map((row) => ({
        id: row.id,
        name: row.name,
        channelType: row.channel_type,
        status: row.status,
      })),
    accountEmail: user.email,
  };
}

/** Sort order: the account email first, then Slack (the caller keeps oldest first). */
function emailFirst(a: string, b: string): number {
  return Number(b === "email") - Number(a === "email");
}

const destinationLink = z.object({
  destination_id: z.string(),
  destinations: z
    .object({
      name: z.string(),
      status: z.string(),
      channel_type: z.string(),
      created_at: z.string(),
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
    .order("created_at", { ascending: false });
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
      .toSorted(
        (a, b) =>
          emailFirst(a.channel_type, b.channel_type) ||
          a.created_at.localeCompare(b.created_at),
      )
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
