import type { Category } from "../types";
import { SIMULATED_SOURCE } from "../types";

/**
 * Every real source the tick knows, with what the admin overview and the
 * credit lines need. Framework-free and safe to import anywhere: it holds no
 * keys and makes no requests. Each source module takes its interval from here.
 */
export const SOURCE_CATALOG = [
  {
    id: "usgs",
    name: "U.S. Geological Survey",
    category: "natural_disasters",
    /** "Earthquakes, every minute" on the admin overview. */
    description: "Earthquakes, every minute",
    intervalSeconds: 60,
    credit: "U.S. Geological Survey",
  },
  {
    id: "guardian",
    name: "The Guardian",
    category: "news",
    description: "News, every 3 minutes",
    intervalSeconds: 180,
    credit: "Source: The Guardian",
  },
  {
    id: "coingecko",
    name: "CoinGecko",
    category: "markets",
    description: "Markets, every 5 minutes",
    intervalSeconds: 300,
    credit: "Powered by CoinGecko",
  },
] as const satisfies readonly {
  id: string;
  name: string;
  category: Category;
  description: string;
  intervalSeconds: number;
  credit: string;
}[];

export type SourceId = (typeof SOURCE_CATALOG)[number]["id"];
export type SourceEntry = (typeof SOURCE_CATALOG)[number];

export function sourceEntry(id: string): SourceEntry | undefined {
  return SOURCE_CATALOG.find((entry) => entry.id === id);
}

/**
 * The credit line for an event's source, shown on history rows, the admin
 * events list, the email footer and the Slack context line. Simulated events
 * and unknown sources have none.
 */
export function sourceCredit(source: string): string | null {
  if (source === SIMULATED_SOURCE) return null;
  return sourceEntry(source)?.credit ?? null;
}

/** The name an admin sees for a source: "The Guardian", "Simulated". */
export function sourceName(source: string): string {
  if (source === SIMULATED_SOURCE) return "Simulated";
  return sourceEntry(source)?.name ?? source;
}

/** A source is late when its last success is older than this many intervals. */
export const LATE_AFTER_INTERVALS = 3;

export type SourceStatus = "ok" | "late" | "failing";

/**
 * The status the admin overview shows for one source:
 * - failing: the last poll failed (wins over late);
 * - late: never succeeded, or the last success is older than three intervals;
 * - ok: otherwise.
 */
export function sourceStatus(
  intervalSeconds: number,
  health: {
    lastOutcome: "ok" | "error" | null;
    lastSuccessAt: Date | null;
  },
  now: Date,
): SourceStatus {
  if (health.lastOutcome === "error") return "failing";
  if (health.lastSuccessAt === null) return "late";
  const ageSeconds = (now.getTime() - health.lastSuccessAt.getTime()) / 1000;
  return ageSeconds > intervalSeconds * LATE_AFTER_INTERVALS ? "late" : "ok";
}
