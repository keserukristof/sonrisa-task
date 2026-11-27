"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { emailChannel } from "@/lib/alerting/channels/email";
import { slackChannel } from "@/lib/alerting/channels/slack";
import { SLACK_INVALID_URL_REASON } from "@/lib/alerting/channels/slack/reasons";
import type { SendOutcome } from "@/lib/alerting/types";
import { getCurrentUser } from "@/lib/auth/session";
import { allowsLocalSlackStub, serverEnv } from "@/lib/env.server";
import { formatUtcTime } from "@/lib/format";
import { withNotice } from "@/lib/notices";
import { createClient } from "@/lib/supabase/server";
import { addSlackFailure, type AddSlackField } from "./add-failure";
import { removeRefusal } from "./remove-refusal";
import {
  addSlackDestinationSchema,
  removeDestinationSchema,
  sendTestSchema,
} from "./schema";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const FAILED: ActionResult = { ok: false, code: "failed" };
const COULDNT_SEND = "Couldn't send the test. Try again in a minute.";

async function finishTest(
  supabase: Supabase,
  testSendId: string,
  delivered: boolean,
  error?: string,
  brokenReason?: string,
) {
  const { error: finishError } = await supabase.rpc("finish_test_send", {
    p_test_send_id: testSendId,
    p_delivered: delivered,
    ...(error === undefined ? {} : { p_error: error }),
    ...(brokenReason === undefined ? {} : { p_broken_reason: brokenReason }),
  });
  if (finishError) {
    console.error(
      "[destinations] finish_test_send failed",
      finishError.message,
    );
  }
}

/**
 * Sends the destination a test message at once. The claim counts against the
 * limits whatever the outcome; the result goes in the test-send log, not in
 * notification history. Never returns or logs a Slack webhook URL.
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
  const { data: destination } = await supabase
    .from("destinations")
    .select("channel_type")
    .eq("id", parsed.data.destinationId)
    .maybeSingle();
  if (!destination) return FAILED;

  const { data: claims, error } = await supabase.rpc("claim_test_send", {
    p_destination_id: parsed.data.destinationId,
  });
  const claim = claims?.[0];
  if (error || !claim) return FAILED;
  if (claim.outcome !== "ok") return { ok: false, code: claim.outcome };

  const now = new Date();
  let outcome: SendOutcome;
  if (destination.channel_type === "slack") {
    const slack = await slackTestOutcome(supabase, claim.test_send_id, now);
    if (slack === null) {
      await finishTest(supabase, claim.test_send_id, false, COULDNT_SEND);
      return FAILED;
    }
    outcome = slack;
  } else {
    outcome = await emailChannel.sendTest(
      { settings: {}, accountEmail: user.email },
      now,
    );
  }

  const delivered = outcome.kind === "sent";
  await finishTest(
    supabase,
    claim.test_send_id,
    delivered,
    outcome.kind === "sent" ? undefined : outcome.error,
    outcome.kind === "broken" ? outcome.destinationReason : undefined,
  );
  // The row's Broken line follows the destination's status.
  refresh();

  if (delivered) {
    return { ok: true, message: `Delivered at ${formatUtcTime(now)}` };
  }
  if (outcome.kind === "broken" && outcome.destinationReason) {
    return { ok: false, code: "broken", message: outcome.destinationReason };
  }
  return FAILED;
}

/**
 * Reads the webhook URL with the server's key and sends the test. The URL
 * stays in this function. Null means the URL could not be read: send nothing.
 */
async function slackTestOutcome(
  supabase: Supabase,
  testSendId: string,
  now: Date,
): Promise<SendOutcome | null> {
  const key = serverEnv().SLACK_TARGET_KEY;
  if (!key) return null;
  const { data: url, error } = await supabase.rpc("slack_test_target", {
    p_test_send_id: testSendId,
    p_key: key,
  });
  if (error || !url) return null;

  const settings = slackChannel.settingsSchema.safeParse({ url });
  if (!settings.success) {
    return {
      kind: "broken",
      error: SLACK_INVALID_URL_REASON.failure,
      destinationReason: SLACK_INVALID_URL_REASON.broken,
    };
  }
  return slackChannel.sendTest(
    { settings: settings.data, accountEmail: "" },
    now,
  );
}

/** Adds a Slack destination. The URL is stored by the database function. */
export async function addSlackDestination(
  _previous: ActionResult<AddSlackField>,
  formData: FormData,
): Promise<ActionResult<AddSlackField>> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Your session has ended. Sign in again." };
  }

  const parsed = addSlackDestinationSchema({
    allowLocalStub: allowsLocalSlackStub(),
  }).safeParse({ name: formData.get("name"), url: formData.get("url") });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<AddSlackField>(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_slack_destination", {
    p_name: parsed.data.name,
    p_url: parsed.data.url,
  });
  if (error) {
    return addSlackFailure(error.code, error.message, parsed.data.name);
  }

  redirect(withNotice("/destinations", "slack-destination-added"));
}

/** Removes a Slack destination, unless it is some alert's only destination. */
export async function removeDestination(
  destinationId: string,
  name: string,
): Promise<ActionResult> {
  const failure = {
    ok: false,
    message: "Couldn't remove the destination. Try again in a minute.",
  } as const;
  const user = await getCurrentUser();
  const parsed = removeDestinationSchema.safeParse({ destinationId });
  if (!user || !parsed.success) return failure;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("remove_destination", {
    p_destination_id: parsed.data.destinationId,
  });
  const result = data?.[0];
  if (error || !result) return failure;

  if (result.outcome === "only_destination") {
    return {
      ok: false,
      code: "only_destination",
      message: removeRefusal(name, result.alert_count),
    };
  }
  if (result.outcome !== "ok") return failure;

  redirect(withNotice("/destinations", "slack-destination-removed"));
}
