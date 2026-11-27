import { describe, expect, it } from "vitest";
import { originFrom } from "./origin";

describe("originFrom", () => {
  it("uses the request's host, over http for a local address", () => {
    expect(originFrom(new Headers({ host: "localhost:3123" }))).toBe(
      "http://localhost:3123",
    );
  });

  it("uses the forwarded protocol and host behind a proxy", () => {
    expect(
      originFrom(
        new Headers({
          host: "internal:3000",
          "x-forwarded-host": "heads-up.example",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe("https://heads-up.example");
  });

  it("ignores forwarded headers in production and uses the configured URL", () => {
    expect(
      originFrom(
        new Headers({
          host: "evil.example",
          "x-forwarded-host": "evil.example",
          "x-forwarded-proto": "https",
        }),
        { production: true, appUrl: "https://heads-up.example" },
      ),
    ).toBe("https://heads-up.example");
  });

  it("refuses a host that is not a plain host name", () => {
    expect(
      originFrom(new Headers({ host: "evil.example/path?x=" })),
    ).toBeNull();
    expect(originFrom(new Headers())).toBeNull();
  });
});
