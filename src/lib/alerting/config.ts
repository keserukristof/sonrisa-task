/**
 * The limits and timings of the alerting tick. `runTick` receives a
 * `TickConfig`, so tests can pass their own.
 */
export type TickConfig = {
  /** Alert emails one user may get in any 60 minutes. */
  emailsPerUserPerHour: number;
  /** Alert emails the whole system may send in one UTC day. */
  emailsPerSystemPerDay: number;
  /** Waits before the second, third and fourth attempt, in seconds. */
  retryDelaysSeconds: readonly number[];
  /** When false, no source is polled: only stored events are matched and delivered. */
  realPolling: boolean;
};

/**
 * Production values. The two email limits are also written into the database
 * function `claim_test_send`, which "Send test" uses: change both together.
 */
export const DEFAULT_TICK_CONFIG: TickConfig = {
  emailsPerUserPerHour: 10,
  emailsPerSystemPerDay: 80,
  retryDelaysSeconds: [60, 300, 900],
  realPolling: false,
};

/** The exact reasons a skipped notification shows in history. */
export const SKIP_REASONS = {
  hourly: "Hourly limit (10) reached",
  daily: "Daily system limit (80) reached",
} as const;
