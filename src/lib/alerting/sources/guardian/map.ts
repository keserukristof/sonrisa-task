import { z } from "zod";
import type { EventCandidate } from "@/lib/alerting/types";

/** The only sections that become events. */
export const GUARDIAN_SECTIONS = ["world", "business", "environment"] as const;

/** One article of the Content API search response, the fields we read. */
const itemSchema = z.object({
  id: z.string().min(1),
  sectionId: z.string(),
  webPublicationDate: z.string().refine((s) => !Number.isNaN(Date.parse(s))),
  webTitle: z.string().min(1),
  webUrl: z.string().nullish(),
  fields: z
    .object({
      standfirst: z.string().nullish(),
      trailText: z.string().nullish(),
    })
    .nullish(),
});

const searchSchema = z.object({
  response: z.object({
    status: z.literal("ok"),
    results: z.array(z.unknown()),
  }),
});

/** Strips tags and decodes the few entities the API emits. */
function plainText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Maps a Content API search response to event candidates. Pure: an item that
 * does not parse or is outside the three sections is skipped, never thrown,
 * and a body that is not a successful search gives no events.
 */
export function mapGuardianSearch(body: unknown): EventCandidate[] {
  const search = searchSchema.safeParse(body);
  if (!search.success) return [];

  const events: EventCandidate[] = [];
  for (const raw of search.data.response.results) {
    const parsed = itemSchema.safeParse(raw);
    if (!parsed.success) continue;
    const item = parsed.data;
    if (!(GUARDIAN_SECTIONS as readonly string[]).includes(item.sectionId)) {
      continue;
    }
    events.push({
      externalId: item.id,
      title: item.webTitle,
      summary: plainText(item.fields?.standfirst || item.fields?.trailText),
      url:
        item.webUrl && /^https?:\/\//i.test(item.webUrl) ? item.webUrl : null,
      occurredAt: new Date(item.webPublicationDate),
      severity: "low",
      raw,
    });
  }
  return events;
}
