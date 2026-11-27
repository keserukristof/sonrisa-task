import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./schema";

describe("signUpSchema", () => {
  it("accepts an email address and a password of 8 characters", () => {
    expect(
      signUpSchema.safeParse({ email: "ada@example.com", password: "12345678" })
        .success,
    ).toBe(true);
  });

  it("refuses a password of 7 characters with the message the form shows", () => {
    const result = signUpSchema.safeParse({
      email: "ada@example.com",
      password: "1234567",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Use at least 8 characters.");
  });

  it("refuses a malformed email address", () => {
    const result = signUpSchema.safeParse({
      email: "ada@",
      password: "12345678",
    });
    expect(result.error?.issues[0]?.message).toBe(
      "Enter a valid email address.",
    );
  });
});

describe("signInSchema", () => {
  it("asks for the email address and the password when they are empty", () => {
    const result = signInSchema.safeParse({ email: " ", password: "" });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Enter your email address.",
      "Enter your password.",
    ]);
  });
});
