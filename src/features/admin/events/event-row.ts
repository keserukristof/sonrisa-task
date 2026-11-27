import { z } from "zod";
import { sourceCredit, sourceName } from "@/lib/alerting/sources/catalog";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  SEVERITIES,
  type Severity,
} from "@/lib/alerting/types";
import { formatUtcDateTime } from "@/lib/format";

const rawEventSchema = z.object({
  id: z.string(),
  source: z.string(),
  category: z.enum(CATEGORIES),
  severity: z.enum(SEVERITIES),
  title: z.string(),
  occurred_at: z.string(),
  simulated: z.boolean(),
});

export type RawEvent = z.infer<typeof rawEventSchema>;

/** The rows of the query, or null when they are not the expected shape. */
export function parseRawEvents(data: unknown): RawEvent[] | null {
  const parsed = z.array(rawEventSchema).safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** What an admin events row shows. */
export type EventRowData = {
  id: string;
  title: string;
  simulated: boolean;
  time: string;
  sourceName: string;
  categoryLabel: string;
  credit: string | null;
  severity: Severity;
};

export function toEventRow(raw: RawEvent): EventRowData {
  return {
    id: raw.id,
    title: raw.title,
    simulated: raw.simulated,
    time: formatUtcDateTime(raw.occurred_at),
    sourceName: sourceName(raw.source),
    categoryLabel: CATEGORY_LABELS[raw.category],
    credit: sourceCredit(raw.source),
    severity: raw.severity,
  };
}
