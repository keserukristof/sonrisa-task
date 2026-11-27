import "server-only";
import { z } from "zod";

const flag = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const serverEnvSchema = z.object({
  /** Bypasses Row Level Security. Read only by `src/lib/supabase/admin.ts`. */
  SUPABASE_SECRET_KEY: z.string().min(1),
  /** Authenticates the scheduler's call to the tick route. Can do nothing else. */
  TICK_SECRET: z.string().min(32),
  /** The site's own origin, for links in emails. */
  APP_URL: z.url().default("http://localhost:3000"),
  /** Resend API key. When absent, email goes over SMTP to the local mail catcher. */
  RESEND_API_KEY: z.string().min(1).optional(),
  /** The From header of alert emails. In production, an address on the verified domain. */
  EMAIL_FROM: z.string().min(1).default("Heads-up <alerts@heads-up.test>"),
  SMTP_HOST: z.string().min(1).default("127.0.0.1"),
  SMTP_PORT: z.coerce.number().int().positive().default(54325),
  /** Increment 2. */
  GUARDIAN_API_KEY: z.string().min(1).optional(),
  /** Increment 2. */
  COINGECKO_API_KEY: z.string().min(1).optional(),
  /** "true" only in production: lets the tick call the real sources. */
  REAL_POLLING: flag,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Validates the server-only environment and names every offending variable. */
export function parseServerEnv(source: Record<string, unknown>): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    const names = [
      ...new Set(parsed.error.issues.map((issue) => issue.path.join("."))),
    ].join(", ");
    throw new Error(
      `Invalid or missing server environment variables: ${names}. Run \`pnpm bootstrap\` or see .env.example.`,
    );
  }
  return parsed.data;
}

let cached: ServerEnv | undefined;

/**
 * The server-only environment. Read lazily, at request time, so a build that
 * has only the public variables (CI) still succeeds.
 */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
