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
      error: "The email service asked us to slow down.",
      retryAfterSeconds: 12,
    });
  });

  it("retries on 5xx without a wait", () => {
    expect(
      classifyResendResponse({ status: 503, retryAfter: null, body: null }),
    ).toEqual({
      kind: "retry",
      error: "The email service had a problem on its side.",
    });
  });

  it("retries on 401 and 403: our credentials are a system failure", () => {
    for (const status of [401, 403]) {
      expect(
        classifyResendResponse({
          status,
          retryAfter: null,
          body: { message: "API key is invalid" },
        }),
      ).toEqual({
        kind: "retry",
        error: "The email service rejected our sending credentials.",
      });
    }
  });

  it("is broken on 422 with a sentence of ours, not the provider's text", () => {
    expect(
      classifyResendResponse({
        status: 422,
        retryAfter: null,
        body: { message: "Invalid `to` field" },
      }),
    ).toEqual({
      kind: "broken",
      error: "The email was rejected by the email service.",
    });
  });
});

describe("classifySmtpError", () => {
  it("is broken when the server rejects the recipient permanently", () => {
    expect(
      classifySmtpError({ responseCode: 550, message: "No such user" }),
    ).toEqual({
      kind: "broken",
      error: "The email was rejected by the mail server.",
    });
  });

  it("retries on a 4xx reply", () => {
    expect(
      classifySmtpError({ responseCode: 451, message: "Try later" }),
    ).toEqual({
      kind: "retry",
      error: "The email could not be delivered yet.",
    });
  });

  it("retries when the connection fails", () => {
    expect(
      classifySmtpError({ code: "ECONNECTION", message: "connect refused" }),
    ).toEqual({
      kind: "retry",
      error: "The email could not be delivered yet.",
    });
  });
});
