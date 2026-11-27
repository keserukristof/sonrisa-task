import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { PollRecord } from "./source-rows";

const healthRows = z.array(
  z.object({
    source: z.string(),
    last_polled_at: z.string(),
    last_outcome: z.string(),
    last_error: z.string().nullable(),
    last_events_stored: z.number(),
    last_success_at: z.string().nullable(),
  }),
);

const budgetRows = z.array(
  z.object({ emails_today: z.number(), test_sends_today: z.number() }),
);

/** The latest poll of each source that has been polled. Admin only. */
export async function getSourcePolls(): Promise<PollRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_source_health");
  if (error) throw new Error("Could not load the source health.");
  return healthRows.parse(data).map((row) => ({
    source: row.source,
    lastPolledAt: row.last_polled_at,
    lastOutcome: row.last_outcome,
    lastError: row.last_error,
    lastEventsStored: row.last_events_stored,
    lastSuccessAt: row.last_success_at,
  }));
}

export type EmailBudget = { emailsToday: number; testSendsToday: number };

/** Today's (UTC) email and test-send counts. Admin only. */
export async function getEmailBudget(): Promise<EmailBudget> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_email_budget");
  if (error) throw new Error("Could not load the email budget.");
  const row = budgetRows.parse(data)[0];
  return {
    emailsToday: row?.emails_today ?? 0,
    testSendsToday: row?.test_sends_today ?? 0,
  };
}
