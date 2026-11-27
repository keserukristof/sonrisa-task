import "server-only";
import type { Channel, Source } from "./types";

/**
 * The real sources and channels the tick route runs with. Empty until the
 * end-to-end ticket registers the USGS source and the email channel.
 */
export function buildSources(): Source[] {
  return [];
}

export function buildChannels(): Channel[] {
  return [];
}
