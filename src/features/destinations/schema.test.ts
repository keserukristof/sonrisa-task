import { describe, expect, it } from "vitest";
import { addSlackDestinationSchema, removeDestinationSchema } from "./schema";

const production = addSlackDestinationSchema({ allowLocalStub: false });
const local = addSlackDestinationSchema({ allowLocalStub: true });
const url = "https://hooks.slack.com/services/T000/B000/abcdWXYZ";

function messageFor(
  schema: typeof production,
  input: unknown,
  field: string,
): string | undefined {
  const result = schema.safeParse(input);
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("addSlackDestinationSchema", () => {
  it("accepts a name and a Slack incoming webhook URL, trimmed", () => {
    expect(
      production.parse({ name: " Ops channel ", url: ` ${url} ` }),
    ).toEqual({ name: "Ops channel", url });
  });

  it("needs a name of at most 60 characters", () => {
    expect(messageFor(production, { name: "  ", url }, "name")).toBe(
      "Enter a name.",
    );
    expect(messageFor(production, { name: "n".repeat(61), url }, "name")).toBe(
      "Use at most 60 characters.",
    );
  });

  it("refuses a URL that is not on Slack's hooks host", () => {
    const message =
      "Paste a Slack incoming webhook URL. It starts with https://hooks.slack.com/services/.";
    for (const bad of [
      "https://hooks.slack.co/services/T000/B000/XXXX",
      "http://hooks.slack.com/services/T000/B000/XXXX",
      "https://hooks.slack.com.evil.test/services/T000",
      "https://hooks.slack.com/workflows/T000/B000",
    ]) {
      expect(messageFor(production, { name: "Ops", url: bad }, "url")).toBe(
        message,
      );
    }
  });

  it("accepts the local stub's URL only outside production", () => {
    const stub = "http://127.0.0.1:4100/slack/e2e-abc";
    expect(local.safeParse({ name: "Stub", url: stub }).success).toBe(true);
    expect(production.safeParse({ name: "Stub", url: stub }).success).toBe(
      false,
    );
  });
});

describe("removeDestinationSchema", () => {
  const destinationId = "6f9619ff-8b86-4011-b42d-00c04fc964ff";

  it("accepts an id and a name, trimmed", () => {
    expect(
      removeDestinationSchema.parse({ destinationId, name: " Ops " }),
    ).toEqual({ destinationId, name: "Ops" });
  });

  it("refuses an empty or over-long name and a missing one", () => {
    expect(
      removeDestinationSchema.safeParse({ destinationId, name: "  " }).success,
    ).toBe(false);
    expect(
      removeDestinationSchema.safeParse({ destinationId, name: "n".repeat(61) })
        .success,
    ).toBe(false);
    expect(removeDestinationSchema.safeParse({ destinationId }).success).toBe(
      false,
    );
  });
});
