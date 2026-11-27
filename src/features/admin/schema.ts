import { z } from "zod";
import { CATEGORIES, SEVERITIES } from "@/lib/alerting/types";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));

/**
 * The simulate form. A news event is always low severity, whatever the form sent.
 */
export const simulateEventSchema = z
  .object({
    category: z.enum(CATEGORIES, "Choose a category."),
    severity: z.enum(SEVERITIES).default("high"),
    title: z
      .string()
      .trim()
      .min(1, "Enter a title for the event.")
      .max(200, "Use 200 characters at most."),
    summary: optionalText(1000, "Use 1000 characters at most."),
    url: optionalText(2000, "Use 2000 characters at most.").refine(
      (value) => value === null || /^https?:\/\/\S+$/i.test(value),
      "Enter a link that starts with https://",
    ),
  })
  .transform((event) =>
    event.category === "news" ? { ...event, severity: "low" as const } : event,
  );

export type SimulateEventInput = z.infer<typeof simulateEventSchema>;
export type SimulateEventField =
  "category" | "severity" | "title" | "summary" | "url";
