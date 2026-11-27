import { z } from "zod";
import type { EventCandidate, Severity } from "@/lib/alerting/types";

/** One earthquake of the USGS GeoJSON summary feed, the fields we read. */
const itemSchema = z.object({
  id: z.string().min(1),
  properties: z.object({
    mag: z.number().finite(),
    place: z.string().nullish(),
    time: z.number().finite(),
    url: z.string().nullish(),
    alert: z.string().nullish(),
    title: z.string().nullish(),
  }),
  geometry: z.object({ coordinates: z.array(z.number()) }).nullish(),
});

const feedSchema = z.object({ features: z.array(z.unknown()) });

/** 4.5-5.4 low, 5.5-6.4 moderate, 6.5-7.4 high, 7.5 and above critical. */
export function severityFromMagnitude(magnitude: number): Severity {
  if (magnitude >= 7.5) return "critical";
  if (magnitude >= 6.5) return "high";
  if (magnitude >= 5.5) return "moderate";
  return "low";
}

function severityOf(magnitude: number, alert: string | null | undefined) {
  const fromMagnitude = severityFromMagnitude(magnitude);
  const pagerRaises = alert === "orange" || alert === "red";
  if (
    pagerRaises &&
    (fromMagnitude === "low" || fromMagnitude === "moderate")
  ) {
    return "high";
  }
  return fromMagnitude;
}

/**
 * Maps the feed's JSON to event candidates. Pure: an item that does not parse
 * is skipped, never thrown, and a body that is not a feed gives no events.
 */
export function mapUsgsFeed(body: unknown): EventCandidate[] {
  const feed = feedSchema.safeParse(body);
  if (!feed.success) return [];

  const events: EventCandidate[] = [];
  for (const raw of feed.data.features) {
    const parsed = itemSchema.safeParse(raw);
    if (!parsed.success) continue;
    const { id, properties: p, geometry } = parsed.data;

    const place = p.place ?? "an unnamed location";
    const depth = geometry?.coordinates[2];
    const depthText =
      depth === undefined ? "" : `, depth ${Math.round(depth)} km`;

    events.push({
      externalId: id,
      title: p.title ?? `M ${p.mag} - ${place}`,
      summary: `Magnitude ${p.mag} earthquake, ${place}${depthText}.`,
      url: p.url ?? null,
      occurredAt: new Date(p.time),
      severity: severityOf(p.mag, p.alert),
      raw,
    });
  }
  return events;
}
