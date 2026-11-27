import { z } from "zod";
import type { EventCandidate, Severity } from "@/lib/alerting/types";

/** The smallest absolute 1-hour change, in percent, that becomes an event. */
export const MIN_HOURLY_CHANGE = 3;

/** One coin of `/coins/markets?price_change_percentage=1h,24h`, the fields we read. */
const coinSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  current_price: z.number().finite(),
  price_change_percentage_1h_in_currency: z.number().finite().nullish(),
  price_change_percentage_24h_in_currency: z.number().finite().nullish(),
  price_change_percentage_24h: z.number().finite().nullish(),
});

/** 3-5% low, 5-8% moderate, 8-12% high, above 12% critical (absolute change). */
export function severityFromChange(change: number): Severity {
  const size = Math.abs(change);
  if (size > 12) return "critical";
  if (size >= 8) return "high";
  if (size >= 5) return "moderate";
  return "low";
}

function formatPrice(price: number): string {
  const whole = Number.isInteger(price);
  const small = Math.abs(price) < 1;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: small ? 6 : whole ? 0 : 2,
  });
  return formatter.format(price);
}

/** One decimal with an explicit sign, using the true minus sign. */
function formatSigned(change: number): string {
  const text = Math.abs(change).toFixed(1);
  if (Number(text) === 0) return `${text}%`;
  return `${change < 0 ? "−" : "+"}${text}%`;
}

/**
 * Maps the markets response to event candidates. Pure. Every coin whose
 * 1-hour change crosses the threshold is reported, with an external id of
 * `<coin id>:<poll minute>`; the database drops a repeat within 6 hours.
 * An item that does not parse is skipped, and a body that is not a list
 * gives no events.
 */
export function mapCoingeckoMarkets(
  body: unknown,
  now: Date,
): EventCandidate[] {
  if (!Array.isArray(body)) return [];
  const pollMinute = now.toISOString().slice(0, 16);

  const events: EventCandidate[] = [];
  for (const raw of body) {
    const parsed = coinSchema.safeParse(raw);
    if (!parsed.success) continue;
    const coin = parsed.data;
    const hour = coin.price_change_percentage_1h_in_currency;
    if (hour == null || Math.abs(hour) < MIN_HOURLY_CHANGE) continue;

    const day =
      coin.price_change_percentage_24h_in_currency ??
      coin.price_change_percentage_24h;
    const price = `Price ${formatPrice(coin.current_price)}.`;
    const summary =
      day == null ? price : `${price} 24-hour change ${formatSigned(day)}.`;
    const direction = hour > 0 ? "up" : "down";

    events.push({
      externalId: `${coin.id}:${pollMinute}`,
      title: `${coin.name} (${coin.symbol.toUpperCase()}) ${direction} ${Math.abs(hour).toFixed(1)}% in the past hour`,
      summary,
      url: `https://www.coingecko.com/en/coins/${encodeURIComponent(coin.id)}`,
      occurredAt: now,
      severity: severityFromChange(hour),
      raw,
    });
  }
  return events;
}
