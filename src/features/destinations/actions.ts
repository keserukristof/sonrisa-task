"use server";

import type { ActionResult } from "@/lib/action-result";
import { emailChannel } from "@/lib/alerting/channels/email";
import { getCurrentUser } from "@/lib/auth/session";
import { formatUtcTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { sendTestSchema } from "./schema";

const FAILED: ActionResult = { ok: false, code: "failed" };

/**
 * Sends the account email a test message at once. The claim counts against
 * both email limits and the daily test limit whatever the outcome; the
 * result goes in the test-send log, not in notification history.
 */
export async function sendTest(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user?.email) return FAILED;

  const parsed = sendTestSchema.safeParse({
    destinationId: formData.get("destinationId"),
  });
  if (!parsed.success) return FAILED;

  const supabase = await createClient();
  const { data: claims, error } = await supabase.rpc("claim_test_send", {
    p_destination_id: parsed.data.destinationId,
  });
  const claim = claims?.[0];
  if (error || !claim) return FAILED;

  if (claim.outcome !== "ok") return { ok: false, code: claim.outcome };

  const now = new Date();
  const outcome = await emailChannel.sendTest(
    { settings: {}, accountEmail: user.email },
    now,
  );
  const delivered = outcome.kind === "sent";

  await supabase.rpc("finish_test_send", {
    p_test_send_id: claim.test_send_id,
    p_delivered: delivered,
    ...(delivered ? {} : { p_error: outcome.error }),
  });

  return delivered
    ? { ok: true, message: `Delivered at ${formatUtcTime(now)}` }
    : FAILED;
}
