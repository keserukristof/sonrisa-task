"use server";

import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { isCurrentUserAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { simulateEventSchema, type SimulateEventField } from "./schema";

const FAILED = "Couldn't create the event. Nothing was changed. Try again.";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * Stores a simulated event. Nothing is sent from here: the next scheduled
 * tick matches and delivers it like any other event.
 */
export async function simulateEvent(
  _previous: ActionResult<SimulateEventField>,
  formData: FormData,
): Promise<ActionResult<SimulateEventField>> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, message: FAILED };
  }

  const parsed = simulateEventSchema.safeParse({
    category: text(formData, "category"),
    severity: text(formData, "severity") || undefined,
    title: text(formData, "title"),
    summary: text(formData, "summary"),
    url: text(formData, "url"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<SimulateEventField>(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("simulate_event", {
    p_category: parsed.data.category,
    p_severity: parsed.data.severity,
    p_title: parsed.data.title,
    p_summary: parsed.data.summary ?? undefined,
    p_url: parsed.data.url ?? undefined,
  });
  if (error) return { ok: false, message: FAILED };

  return { ok: true, message: "Event created." };
}
