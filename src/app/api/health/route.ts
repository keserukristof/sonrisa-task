import { getHealth } from "@/features/health/queries";

export async function GET() {
  const health = await getHealth();

  return Response.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
