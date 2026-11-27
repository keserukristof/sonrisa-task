export type RetryPlan =
  { kind: "later"; delaySeconds: number } | { kind: "give_up" };

/**
 * What to do after attempt number `attempts` (already counted) failed with a
 * transient error. There are `delays.length + 1` attempts in all.
 */
export function planRetry(
  attempts: number,
  delays: readonly number[],
  retryAfterSeconds?: number,
): RetryPlan {
  const delay = delays[attempts - 1];
  if (delay === undefined) return { kind: "give_up" };
  return {
    kind: "later",
    delaySeconds: Math.max(delay, retryAfterSeconds ?? 0),
  };
}
