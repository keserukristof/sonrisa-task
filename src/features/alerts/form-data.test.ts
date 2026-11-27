import { describe, expect, it } from "vitest";
import { parseAlertForm } from "./form-data";

const destination = "5b8e6c3a-0a53-4a43-8f55-9d3f3b0f6f11";

function form(entries: Array<[string, string]>): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("parseAlertForm", () => {
  it("reads a complete form into the alert input", () => {
    const result = parseAlertForm(
      form([
        ["name", "  Quakes in Japan "],
        ["category", "natural_disasters"],
        ["minSeverity", "high"],
        ["keywords", "Japan, tsunami, japan"],
        ["destinationIds", destination],
      ]),
    );
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: "Quakes in Japan",
      category: "natural_disasters",
      minSeverity: "high",
      keywords: ["japan", "tsunami"],
      destinationIds: [destination],
    });
  });

  it("drops the severity for news", () => {
    const result = parseAlertForm(
      form([
        ["name", "Headlines"],
        ["category", "news"],
        ["minSeverity", "high"],
        ["keywords", ""],
        ["destinationIds", destination],
      ]),
    );
    expect(result.data?.minSeverity).toBeNull();
  });

  it("names the fields of an empty form", () => {
    const result = parseAlertForm(
      form([
        ["name", ""],
        ["keywords", ""],
      ]),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => [i.path[0], i.message])).toEqual([
      ["name", "Enter a name for this alert."],
      ["category", "Choose a category."],
      ["destinationIds", "Choose at least one destination."],
    ]);
  });
});
