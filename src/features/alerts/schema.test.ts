import { describe, expect, it } from "vitest";
import { alertSchema, parseKeywords } from "./schema";

const destination = "3f2c0c52-6a9e-4c59-9a4e-0d6f1f7a9b11";
const valid = {
  name: "Pacific rim quakes",
  category: "natural_disasters",
  minSeverity: "moderate",
  keywords: "japan, tsunami",
  destinationIds: [destination],
};

function messageFor(input: unknown, field: string): string | undefined {
  const result = alertSchema.safeParse(input);
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("parseKeywords", () => {
  it("trims, lowercases, de-duplicates and drops empty entries, keeping the order", () => {
    expect(parseKeywords(" Japan, tsunami ,, JAPAN,  ")).toEqual([
      "japan",
      "tsunami",
    ]);
  });

  it("returns an empty list for an empty field", () => {
    expect(parseKeywords("")).toEqual([]);
  });
});

describe("alertSchema", () => {
  it("returns the alert with its keywords as a list", () => {
    expect(alertSchema.parse(valid)).toEqual({
      name: "Pacific rim quakes",
      category: "natural_disasters",
      minSeverity: "moderate",
      keywords: ["japan", "tsunami"],
      destinationIds: [destination],
    });
  });

  it("refuses an alert without a destination", () => {
    expect(messageFor({ ...valid, destinationIds: [] }, "destinationIds")).toBe(
      "Choose at least one destination.",
    );
  });

  it("refuses a news alert with no keyword, saying why", () => {
    expect(
      messageFor({ ...valid, category: "news", keywords: " , " }, "keywords"),
    ).toBe(
      "News alerts need at least one keyword, or every article would notify you.",
    );
  });

  it("lets other categories have no keyword", () => {
    expect(alertSchema.safeParse({ ...valid, keywords: "" }).success).toBe(true);
  });

  it("drops the severity of a news alert", () => {
    expect(
      alertSchema.parse({ ...valid, category: "news" }).minSeverity,
    ).toBeNull();
  });

  it("needs a severity for markets and natural disasters", () => {
    expect(
      messageFor(
        { ...valid, category: "markets", minSeverity: null },
        "minSeverity",
      ),
    ).toBe("Choose a minimum severity.");
  });

  it("refuses an empty name and a name over 80 characters", () => {
    expect(messageFor({ ...valid, name: "   " }, "name")).toBe(
      "Enter a name for this alert.",
    );
    expect(messageFor({ ...valid, name: "x".repeat(81) }, "name")).toBe(
      "Use 80 characters at most.",
    );
  });

  it("asks for a category when none is chosen", () => {
    expect(messageFor({ ...valid, category: undefined }, "category")).toBe(
      "Choose a category.",
    );
  });

  it("refuses an eleventh keyword and says how many were entered", () => {
    expect(
      messageFor({ ...valid, keywords: "a,b,c,d,e,f,g,h,i,j,k" }, "keywords"),
    ).toBe("Use 10 keywords at most. You entered 11.");
  });

  it("refuses a keyword longer than 40 characters", () => {
    expect(messageFor({ ...valid, keywords: "k".repeat(41) }, "keywords")).toBe(
      "Keep each keyword to 40 characters or fewer.",
    );
  });
});
