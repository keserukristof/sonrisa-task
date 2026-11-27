import "server-only";
import nodemailer from "nodemailer";
import { z } from "zod";
import { serverEnv } from "@/lib/env.server";
import type {
  Channel,
  DeliveryTarget,
  OutgoingNotification,
  SendOutcome,
} from "@/lib/alerting/types";
import { classifyResendResponse, classifySmtpError } from "./outcome";
import {
  renderAlertEmail,
  renderTestEmail,
  type RenderedEmail,
} from "./render";

const settingsSchema = z.object({});
type EmailSettings = z.infer<typeof settingsSchema>;

const SEND_TIMEOUT_MS = 15_000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

async function sendWithResend(
  apiKey: string,
  from: string,
  to: string,
  email: RenderedEmail,
): Promise<SendOutcome> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    const body: unknown = await response.json().catch(() => null);
    return classifyResendResponse({
      status: response.status,
      retryAfter: response.headers.get("retry-after"),
      body,
    });
  } catch (error) {
    return { kind: "retry", error: errorMessage(error) };
  }
}

async function sendWithSmtp(
  host: string,
  port: number,
  from: string,
  to: string,
  email: RenderedEmail,
): Promise<SendOutcome> {
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: false,
    ignoreTLS: true,
    connectionTimeout: SEND_TIMEOUT_MS,
    socketTimeout: SEND_TIMEOUT_MS,
  });
  try {
    await transport.sendMail({
      from,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    return { kind: "sent" };
  } catch (error) {
    if (error instanceof Error) {
      const details: { code?: string; responseCode?: number } = {};
      if ("code" in error && typeof error.code === "string") {
        details.code = error.code;
      }
      if ("responseCode" in error && typeof error.responseCode === "number") {
        details.responseCode = error.responseCode;
      }
      return classifySmtpError({ ...details, message: error.message });
    }
    return { kind: "retry", error: "Unknown error" };
  } finally {
    transport.close();
  }
}

async function deliver(to: string, email: RenderedEmail): Promise<SendOutcome> {
  const env = serverEnv();
  return env.RESEND_API_KEY
    ? sendWithResend(env.RESEND_API_KEY, env.EMAIL_FROM, to, email)
    : sendWithSmtp(env.SMTP_HOST, env.SMTP_PORT, env.EMAIL_FROM, to, email);
}

export const emailChannel: Channel<EmailSettings> = {
  type: "email",
  settingsSchema,
  send(
    notification: OutgoingNotification,
    target: DeliveryTarget<EmailSettings>,
  ) {
    return deliver(
      target.accountEmail,
      renderAlertEmail(notification, serverEnv().APP_URL),
    );
  },
  sendTest(target: DeliveryTarget<EmailSettings>, now: Date) {
    return deliver(
      target.accountEmail,
      renderTestEmail(now, serverEnv().APP_URL),
    );
  },
};
