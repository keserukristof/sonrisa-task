import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { AdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { DEFAULT_TICK_CONFIG } from "../config";
import type {
  Category,
  Channel,
  ChannelType,
  Clock,
  OutgoingNotification,
  SendOutcome,
  Severity,
} from "../types";

/** The admin client, built from the environment the way the tick route builds it. */
export function testDb(): AdminClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Run `pnpm bootstrap` first.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const baseConfig = { ...DEFAULT_TICK_CONFIG, realPolling: false };

export type FakeClock = Clock & {
  set(date: Date): void;
  advance(s: number): void;
};

export function fakeClock(start: Date): FakeClock {
  let current = start;
  return {
    now: () => current,
    set: (date) => {
      current = date;
    },
    advance: (seconds) => {
      current = new Date(current.getTime() + seconds * 1000);
    },
  };
}

/** Noon on 15 June of the given year: each test uses its own far-future year. */
export function windowAt(year: number): Date {
  return new Date(Date.UTC(year, 5, 15, 12, 0, 0));
}

export type TestAccount = { id: string; emailDestinationId: string };

export async function createAccount(db: AdminClient): Promise<TestAccount> {
  const { data, error } = await db.auth.admin.createUser({
    email: `tick-${randomUUID().slice(0, 8)}@heads-up.test`,
    password: `pw-${randomUUID()}`,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
  const { data: destination, error: destinationError } = await db
    .from("destinations")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("channel_type", "email")
    .single();
  if (destinationError) throw new Error(destinationError.message);
  return { id: data.user.id, emailDestinationId: destination.id };
}

export async function deleteAccount(db: AdminClient, id: string) {
  await db.auth.admin.deleteUser(id);
}

export async function addSlackDestination(
  db: AdminClient,
  userId: string,
): Promise<string> {
  const { data, error } = await db
    .from("destinations")
    .insert({
      user_id: userId,
      channel_type: "slack",
      name: "Slack",
      settings: { webhookUrl: "https://hooks.slack.test/x" },
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function createAlert(
  db: AdminClient,
  account: TestAccount,
  options: {
    category: Category;
    minSeverity?: Severity | null;
    keywords?: string[];
    active?: boolean;
    createdAt: Date;
    destinationIds?: string[];
  },
): Promise<string> {
  const { data, error } = await db
    .from("alerts")
    .insert({
      user_id: account.id,
      name: `alert-${randomUUID().slice(0, 6)}`,
      category: options.category,
      min_severity:
        options.category === "news" ? null : (options.minSeverity ?? "low"),
      keywords: options.keywords ?? [],
      active: options.active ?? true,
      created_at: options.createdAt.toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const { error: linkError } = await db.from("alert_destinations").insert(
    (options.destinationIds ?? [account.emailDestinationId]).map((id) => ({
      alert_id: data.id,
      destination_id: id,
      user_id: account.id,
    })),
  );
  if (linkError) throw new Error(linkError.message);
  return data.id;
}

export async function insertEvent(
  db: AdminClient,
  options: {
    category: Category;
    severity?: Severity;
    title: string;
    summary?: string | null;
    ingestedAt: Date;
    source?: string;
  },
): Promise<string> {
  const source = options.source ?? `test-${randomUUID().slice(0, 8)}`;
  const { data, error } = await db
    .from("events")
    .insert({
      source,
      external_id: randomUUID(),
      category: options.category,
      severity: options.severity ?? "low",
      title: options.title,
      summary: options.summary ?? null,
      occurred_at: options.ingestedAt.toISOString(),
      ingested_at: options.ingestedAt.toISOString(),
      simulated: source === "simulated",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function notificationsFor(db: AdminClient, userId: string) {
  const { data, error } = await db
    .from("notifications")
    .select(
      "id, event_id, alert_id, destination_id, channel_type, status, attempts, next_attempt_at, last_error, skip_reason, sent_at",
    )
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return data;
}

export type FakeChannel = Channel & {
  /** Every send for an event whose title contains the marker. */
  calls: OutgoingNotification[];
};

/**
 * A fake channel. It answers `sent` for everything, including notifications
 * that belong to other tests and to the seed, unless `outcomeFor` returns
 * something for a notification of this test (matched by `marker` in the title).
 */
export function fakeChannel(
  type: ChannelType,
  marker: string,
  outcomeFor?: (n: OutgoingNotification) => SendOutcome | undefined,
): FakeChannel {
  const calls: OutgoingNotification[] = [];
  return {
    type,
    settingsSchema: z.unknown(),
    calls,
    async send(notification) {
      if (!notification.event.title.includes(marker)) return { kind: "sent" };
      calls.push(notification);
      return outcomeFor?.(notification) ?? { kind: "sent" };
    },
    async sendTest() {
      return { kind: "sent" };
    },
  };
}
