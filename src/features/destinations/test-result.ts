import type { ActionResult } from "@/lib/action-result";
import type { NotificationStatus } from "@/lib/alerting/types";

const FAILED = "Couldn't send the test. Try again in a minute.";

const REFUSALS: Record<string, string> = {
  hourly_limit: "Not sent. You've reached 10 emails this hour.",
  daily_limit: "Not sent. Heads-up has reached its 80 emails for today.",
  test_limit: "Not sent. You've sent 3 tests today.",
  slack_test_limit: "Not sent. You've sent 5 tests to this destination today.",
  system_test_limit:
    "Not sent. Heads-up has reached its 20 test emails for today.",
};

/** What the destination row shows for the state of the "Send test" form. */
export function describeTestResult(
  state: ActionResult,
): { status: NotificationStatus; label: string } | null {
  if (state.ok) {
    return state.message ? { status: "sent", label: state.message } : null;
  }
  if (state.code === "broken" && state.message) {
    return { status: "failed", label: `Not delivered. ${state.message}` };
  }
  const refusal = state.code ? REFUSALS[state.code] : undefined;
  return refusal
    ? { status: "skipped", label: refusal }
    : { status: "failed", label: FAILED };
}
