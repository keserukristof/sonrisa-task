import "server-only";
import { emailChannel } from "./channels/email";
import { slackChannel } from "./channels/slack";
import { coingeckoSource } from "./sources/coingecko";
import { guardianSource } from "./sources/guardian";
import { usgsSource } from "./sources/usgs";
import type { Channel, Source } from "./types";

/** The real sources and channels the tick route runs with. */
export function buildSources(): Source[] {
  return [usgsSource, guardianSource, coingeckoSource];
}

export function buildChannels(): Channel[] {
  return [emailChannel, slackChannel];
}
