import { describe, expect, it } from "vitest";
import { allowsLocalSlackStub, parseServerEnv } from "./env.server";

const required = {
  SUPABASE_SECRET_KEY: "sb_secret_test",
  TICK_SECRET: "0123456789abcdef0123456789abcdef",
};

describe("parseServerEnv", () => {
  it("fills the local defaults when only the required variables are set", () => {
    expect(parseServerEnv(required)).toEqual({
      SUPABASE_SECRET_KEY: "sb_secret_test",
      TICK_SECRET: "0123456789abcdef0123456789abcdef",
      APP_URL: "http://localhost:3000",
      EMAIL_FROM: "Heads-up <alerts@heads-up.test>",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: 54325,
      REAL_POLLING: false,
    });
  });

  it("turns real polling on only for the literal string true", () => {
    expect(
      parseServerEnv({ ...required, REAL_POLLING: "true" }).REAL_POLLING,
    ).toBe(true);
    expect(() =>
      parseServerEnv({ ...required, REAL_POLLING: "yes" }),
    ).toThrowError(/REAL_POLLING/);
  });

  it("refuses a tick secret shorter than 32 characters", () => {
    expect(() =>
      parseServerEnv({ ...required, TICK_SECRET: "short" }),
    ).toThrowError(/TICK_SECRET/);
  });

  it("names every missing variable in the error", () => {
    expect(() => parseServerEnv({})).toThrowError(
      /SUPABASE_SECRET_KEY, TICK_SECRET/,
    );
  });
});

describe("allowsLocalSlackStub", () => {
  it("allows the local Slack stub everywhere but Vercel's production", () => {
    expect(allowsLocalSlackStub(parseServerEnv(required))).toBe(true);
    expect(
      allowsLocalSlackStub(parseServerEnv({ ...required, VERCEL_ENV: "preview" })),
    ).toBe(true);
    expect(
      allowsLocalSlackStub(
        parseServerEnv({ ...required, VERCEL_ENV: "production" }),
      ),
    ).toBe(false);
  });
});
