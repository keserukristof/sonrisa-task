import { z } from "zod";

export const PAGE_SIZE = 25;

/** The admin_users() rows, as the database returns them. */
const rawSchema = z.object({
  user_id: z.string(),
  email: z.string().nullable(),
  role: z.enum(["admin", "user"]),
  created_at: z.string(),
  alert_count: z.number(),
  total_count: z.number(),
});

export type RawAdminUser = z.infer<typeof rawSchema>;

/** The rows, or null when they are not the expected shape. */
export function parseAdminUsers(data: unknown): RawAdminUser[] | null {
  const parsed = z.array(rawSchema).safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** `?page=` as a positive whole number; anything else is the first page. */
export function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^[1-9]\d{0,6}$/.test(value)) return 1;
  return Number(value);
}

export function alertsLabel(count: number): string {
  return `${count} ${count === 1 ? "alert" : "alerts"}`;
}

const date = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export type AdminUserRowData = {
  id: string;
  email: string;
  role: "Admin" | "User";
  signedUp: string;
  alerts: string;
};

export function toAdminUserRow(raw: RawAdminUser): AdminUserRowData {
  return {
    id: raw.user_id,
    email: raw.email ?? "No email",
    role: raw.role === "admin" ? "Admin" : "User",
    signedUp: date.format(new Date(raw.created_at)),
    alerts: alertsLabel(raw.alert_count),
  };
}
