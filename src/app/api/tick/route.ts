import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { buildChannels, buildSources } from "@/lib/alerting/collaborators";
import { DEFAULT_TICK_CONFIG } from "@/lib/alerting/config";
import { runTick } from "@/lib/alerting/run-tick";
import { systemClock } from "@/lib/alerting/types";
import { serverEnv } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Constant-time comparison of the bearer token with the tick secret. */
function isAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return timingSafeEqual(digest(token), digest(secret));
}

export async function POST(request: Request) {
  const env = serverEnv();
  if (!isAuthorized(request, env.TICK_SECRET)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runTick({
      db: createAdminClient(),
      sources: buildSources(),
      channels: buildChannels(),
      clock: systemClock,
      config: { ...DEFAULT_TICK_CONFIG, realPolling: env.REAL_POLLING },
    });
    return Response.json(summary);
  } catch {
    // The reason stays in the server log: the response is stored by pg_net.
    console.error("tick failed");
    return Response.json({ error: "tick failed" }, { status: 500 });
  }
}
