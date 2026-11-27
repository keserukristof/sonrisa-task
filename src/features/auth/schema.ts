import { z } from "zod";

export const signUpSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignUpField = keyof SignUpInput;

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address."),
  password: z.string().min(1, "Enter your password."),
});
export type SignInInput = z.infer<typeof signInSchema>;
export type SignInField = keyof SignInInput;
