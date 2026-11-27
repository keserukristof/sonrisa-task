import type { AdminClient } from "@/lib/supabase/admin";
import type { Clock, Source } from "../types";
import { errorText } from "./error-text";

export type PollResult = { polled: number; stored: number; failed: number };

/** Polls every source whose interval has passed. One source failing never stops the others. */
export async function pollSources(
  db: AdminClient,
  sources: readonly Source[],
  clock: Clock,
): Promise<PollResult> {
  const result: PollResult = { polled: 0, stored: 0, failed: 0 };

  for (const source of sources) {
    const now = clock.now();

    const { data: last, error: lastError } = await db
      .from("source_polls")
      .select("polled_at")
      .eq("source", source.id)
      .order("polled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) {
      result.failed += 1;
      continue;
    }
    if (last) {
      const elapsed = now.getTime() - new Date(last.polled_at).getTime();
      if (elapsed < source.intervalSeconds * 1000) continue;
    }

    result.polled += 1;
    let stored = 0;
    let error: string | null = null;
    try {
      const candidates = await source.fetch(now);
      if (candidates.length > 0) {
        const { data, error: insertError } = await db
          .from("events")
          .upsert(
            candidates.map((c) => ({
              source: source.id,
              external_id: c.externalId,
              category: source.category,
              severity: c.severity,
              title: c.title,
              summary: c.summary,
              url: c.url,
              occurred_at: c.occurredAt.toISOString(),
              ingested_at: now.toISOString(),
              raw: JSON.parse(JSON.stringify(c.raw ?? {})),
            })),
            { onConflict: "source,external_id", ignoreDuplicates: true },
          )
          .select("id");
        if (insertError) throw new Error(insertError.message);
        stored = data.length;
      }
    } catch (caught) {
      error = errorText(caught);
    }

    const { error: logError } = await db.from("source_polls").insert({
      source: source.id,
      polled_at: now.toISOString(),
      outcome: error === null ? "ok" : "error",
      error,
      events_stored: stored,
    });
    if (logError) {
      console.error(`[tick] source_polls insert: ${errorText(logError)}`);
    }

    if (error === null) result.stored += stored;
    else result.failed += 1;
  }

  return result;
}
