import { z } from "zod";
import { CATEGORIES, SEVERITIES } from "@/lib/alerting/types";

export const MAX_KEYWORDS = 10;
export const MAX_KEYWORD_LENGTH = 40;

/**
 * Turns the comma-separated keywords field into the stored list: trimmed,
 * lowercased, without empty entries or duplicates, in the order typed.
 */
export function parseKeywords(text: string): string[] {
  const seen = new Set<string>();
  for (const part of text.split(",")) {
    const keyword = part.trim().toLowerCase();
    if (keyword !== "") seen.add(keyword);
  }
  return [...seen];
}

const keywordsField = z
  .string()
  .transform(parseKeywords)
  .superRefine((keywords, context) => {
    if (keywords.length > MAX_KEYWORDS) {
      context.addIssue({
        code: "custom",
        message: `Use ${MAX_KEYWORDS} keywords at most. You entered ${keywords.length}.`,
      });
    } else if (
      keywords.some((keyword) => keyword.length > MAX_KEYWORD_LENGTH)
    ) {
      context.addIssue({
        code: "custom",
        message: `Keep each keyword to ${MAX_KEYWORD_LENGTH} characters or fewer.`,
      });
    }
  });

/**
 * Why a news alert needs a keyword. The form shows it under Keywords, and the
 * database's `alerts_news_needs_keywords` check enforces the same rule, also
 * when a paused alert is resumed (add " Edit the alert to add one." there).
 */
export const NEWS_NEEDS_KEYWORDS =
  "News alerts need at least one keyword, or every article would notify you.";

/**
 * The alert form, as the form posts it. News has no severity: whatever the
 * form sent for it is dropped. Every other category needs one.
 */
export const alertSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter a name for this alert.")
      .max(80, "Use 80 characters at most."),
    category: z.enum(CATEGORIES, "Choose a category."),
    minSeverity: z.enum(SEVERITIES).nullable().default(null),
    keywords: keywordsField,
    destinationIds: z
      .array(z.uuid())
      .min(1, "Choose at least one destination."),
  })
  .transform((alert) =>
    alert.category === "news" ? { ...alert, minSeverity: null } : alert,
  )
  .superRefine((alert, context) => {
    if (alert.category === "news" && alert.keywords.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["keywords"],
        message: NEWS_NEEDS_KEYWORDS,
      });
    }
    if (alert.category !== "news" && alert.minSeverity === null) {
      context.addIssue({
        code: "custom",
        path: ["minSeverity"],
        message: "Choose a minimum severity.",
      });
    }
  });

export type AlertInput = z.infer<typeof alertSchema>;
export type AlertField =
  "name" | "category" | "minSeverity" | "keywords" | "destinationIds";
