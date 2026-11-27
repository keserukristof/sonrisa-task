import "server-only";
import { emailChannel } from "./channels/email";
import { usgsSource } from "./sources/usgs";
import type { Channel, Source } from "./types";

/** The real sources and channels the tick route runs with. */
export function buildSources(): Source[] {
  return [usgsSource];
}

export function buildChannels(): Channel[] {
  return [emailChannel];
}
