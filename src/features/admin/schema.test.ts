import { describe, expect, it } from "vitest";
import { simulateEventSchema } from "./schema";

const valid = {
  category: "natural_disasters",
  severity: "critical",
  title: "Test quake near Tokyo",
  summary: "",
  url: "",
};

function messageFor(input: unknown, field: string): string | undefined {
  const result = simulateEventSchema.safeParse(input);
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("simulateEventSchema", () => {
  it("returns the event with empty optional fields as null", () => {
    expect(simulateEventSchema.parse(valid)).toEqual({
      category: "natural_disasters",
      severity: "critical",
      title: "Test quake near Tokyo",
      summary: null,
      url: null,
    });
  });

  it("forces a news event to low severity", () => {
    expect(
      simulateEventSchema.parse({ ...valid, category: "news" }).severity,
    ).toBe("low");
  });

  it("refuses an empty title and a title over 200 characters", () => {
    expect(messageFor({ ...valid, title: " " }, "title")).toBe(
      "Enter a title for the event.",
    );
    expect(messageFor({ ...valid, title: "x".repeat(201) }, "title")).toBe(
      "Use 200 characters at most.",
    );
  });

  it("refuses a link that is not http or https", () => {
    expect(messageFor({ ...valid, url: "ftp://example.com" }, "url")).toBe(
      "Enter a link that starts with https://",
    );
    expect(
      simulateEventSchema.parse({ ...valid, url: "https://example.com/report" })
        .url,
    ).toBe("https://example.com/report");
  });

  it("asks for a category when none is chosen", () => {
    expect(messageFor({ ...valid, category: undefined }, "category")).toBe(
      "Choose a category.",
    );
  });
});
