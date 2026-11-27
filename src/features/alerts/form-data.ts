import { alertSchema } from "./schema";

/** The alert form's posted fields, validated with the shared schema. */
export function parseAlertForm(formData: FormData) {
  const minSeverity = formData.get("minSeverity");
  return alertSchema.safeParse({
    name: formData.get("name") ?? "",
    category: formData.get("category") ?? undefined,
    minSeverity:
      typeof minSeverity === "string" && minSeverity !== ""
        ? minSeverity
        : null,
    keywords: formData.get("keywords") ?? "",
    destinationIds: formData.getAll("destinationIds"),
  });
}
