import { expect } from "@playwright/test";

/** The local mail catcher (Mailpit), started with the local Supabase stack. */
const MAILBOX_URL = "http://127.0.0.1:54324";

export type CaughtEmail = {
  subject: string;
  text: string;
  html: string;
  /** Every http(s) link in the HTML body, in order. */
  links: string[];
};

type SearchResult = { messages: { ID: string; Subject: string }[] };
type Message = { Subject: string; Text: string; HTML: string };

/**
 * Waits for the newest email to `to` whose subject contains `subject`, and
 * returns it. Every test should use an address of its own (`uniqueEmail()`),
 * so it can only find its own mail.
 */
export async function waitForEmail(
  to: string,
  subject: string,
  timeout = 20_000,
): Promise<CaughtEmail> {
  let found: Message | undefined;

  await expect
    .poll(
      async () => {
        const query = encodeURIComponent(`to:"${to}" subject:"${subject}"`);
        const search = await fetch(
          `${MAILBOX_URL}/api/v1/search?query=${query}`,
        );
        if (!search.ok) return false;
        const result: SearchResult = await search.json();
        const first = result.messages[0];
        if (!first) return false;
        const message = await fetch(
          `${MAILBOX_URL}/api/v1/message/${first.ID}`,
        );
        if (!message.ok) return false;
        found = await message.json();
        return true;
      },
      {
        timeout,
        message: `an email to ${to} with "${subject}" in its subject`,
      },
    )
    .toBe(true);

  if (!found) throw new Error("The mail catcher returned no message.");
  return {
    subject: found.Subject,
    text: found.Text,
    html: found.HTML,
    links: [...found.HTML.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((match) =>
      (match[1] ?? "").replaceAll("&amp;", "&"),
    ),
  };
}
