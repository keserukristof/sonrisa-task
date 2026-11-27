"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/session";
import { withNotice } from "@/lib/notices";
import { createClient } from "@/lib/supabase/server";
import { parseAlertForm } from "./form-data";
import { saveAlertFailure } from "./save-error";
import type { AlertField } from "./schema";

const NOT_SIGNED_IN = "Your session has ended. Sign in again.";

/** Creates (no `alertId`) or updates an alert from the form. */
export async function saveAlert(
  _previous: ActionResult<AlertField>,
  formData: FormData,
): Promise<ActionResult<AlertField>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: NOT_SIGNED_IN };

  const parsed = parseAlertForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<AlertField>(parsed.error),
    };
  }

  const rawId = formData.get("alertId");
  const alertId = typeof rawId === "string" && rawId !== "" ? rawId : null;
  if (alertId !== null && !z.uuid().safeParse(alertId).success) {
    return saveAlertFailure(undefined, true);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_alert", {
    // The function takes a null id to create; the generated types do not mark it nullable.
    p_alert_id: alertId as string,
    p_name: parsed.data.name,
    p_category: parsed.data.category,
    p_min_severity: parsed.data.minSeverity as "low",
    p_keywords: parsed.data.keywords,
    p_destination_ids: parsed.data.destinationIds,
  });
  if (error) return saveAlertFailure(error.code, alertId !== null);

  redirect(
    withNotice("/alerts", alertId === null ? "alert-created" : "changes-saved"),
  );
}

/** Pauses or resumes an alert. */
export async function setAlertActive(
  alertId: string,
  active: boolean,
): Promise<ActionResult> {
  const failure = {
    ok: false,
    message: `Couldn't ${active ? "resume" : "pause"} the alert. Try again.`,
  } as const;
  const user = await getCurrentUser();
  const parsed = z
    .object({ alertId: z.uuid(), active: z.boolean() })
    .safeParse({ alertId, active });
  if (!user || !parsed.success) return failure;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.alertId)
    .select("id");
  if (error || data.length === 0) return failure;

  refresh();
  return { ok: true };
}

/** Deletes an alert. Its notifications stay in history. */
export async function deleteAlert(alertId: string): Promise<ActionResult> {
  const failure = {
    ok: false,
    message: "Couldn't delete the alert. Try again.",
  } as const;
  const user = await getCurrentUser();
  if (!user || !z.uuid().safeParse(alertId).success) return failure;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .delete()
    .eq("id", alertId)
    .select("id");
  if (error || data.length === 0) return failure;

  redirect(withNotice("/alerts", "alert-deleted"));
}
