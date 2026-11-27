import { describe, expect, it } from "vitest";
import { classifyResendResponse, classifySmtpError } from "./outcome";

describe("classifyResendResponse", () => {
  it("is sent on 200", () => {
    expect(
      classifyResendResponse({
        status: 200,
        retryAfter: null,
        body: { id: "x" },
      }),
    ).toEqual({ kind: "sent" });
  });

  it("retries on 429 with the provider's wait", () => {
    expect(
      classifyResendResponse({
        status: 429,
        retryAfter: "12",
        body: { message: "Too many requests" },
      }),
    ).toEqual({
      kind: "retry",
      error: "Too many requests",
      retryAfterSeconds: 12,
    });
  });

  it("retries on 5xx without a wait", () => {
    expect(
      classifyResendResponse({ status: 503, retryAfter: null, body: null }),
    ).toEqual({ kind: "retry", error: "Resend answered 503." });
  });

  it("is broken on 403 with the provider's message", () => {
    expect(
      classifyResendResponse({
        status: 403,
        retryAfter: null,
        body: { message: "The domain is not verified" },
      }),
    ).toEqual({ kind: "broken", error: "The domain is not verified" });
  });

  it("is broken on 422 even when the body is not JSON", () => {
    expect(
      classifyResendResponse({ status: 422, retryAfter: null, body: "nope" }),
    ).toEqual({ kind: "broken", error: "Resend answered 422." });
  });
});

describe("classifySmtpError", () => {
  it("is broken when the server rejects the recipient permanently", () => {
    expect(
      classifySmtpError({ responseCode: 550, message: "No such user" }),
    ).toEqual({ kind: "broken", error: "No such user" });
  });

  it("retries on a 4xx reply", () => {
    expect(
      classifySmtpError({ responseCode: 451, message: "Try later" }),
    ).toEqual({ kind: "retry", error: "Try later" });
  });

  it("retries when the connection fails", () => {
    expect(
      classifySmtpError({ code: "ECONNECTION", message: "connect refused" }),
    ).toEqual({ kind: "retry", error: "connect refused" });
  });
});
