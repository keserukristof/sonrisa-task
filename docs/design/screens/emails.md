# Emails

- **Sent by:** the email channel, to the account's own address, read when sending.
- **Purpose:** tell the user what happened, in a form they can act on from the inbox.
- **Primary action:** "View at source".
- **Artboard:** [html/Emails.dc.html](../html/Emails.dc.html): the alert email, the simulated one and the test email side by side

Emails are light-only: they do not follow a dark theme. Build them as plain HTML with inline styles and a table layout, at most 560px wide, with a plain-text alternative. Use the light token values from [tokens.md](../tokens.md) as literal colours, and the font stack `"Schibsted Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif`; do not load a web font. No images: the wordmark is the text "Heads-up" at weight 700.

## Alert email

**Subject:** `[<Severity>] <event title> · <alert name>`

Example: `[High] M 6.8 - 40 km S of Hualien, Taiwan · Pacific rim quakes`

**From name:** Heads-up

**Body, top to bottom**, 16px between blocks, 24px padding:

1. "Heads-up" at 16px, weight 700.
2. The event title at 18px, weight 600.
3. The event summary, when the event has one.
4. A two-column list, terms in `muted-foreground`:
   - Category: Natural disasters
   - Severity: High, in the severity colour at weight 600. The bars are optional in email; the word is required.
   - When: 27 Nov 2026, 13:42 UTC
   - Alert: Pacific rim quakes
5. A button, `primary` fill with `primary-foreground` text, 36px high, radius 5px: View at source. It links to the event's URL and is left out when the event has none.
6. A footer in 12px `muted-foreground`, above a `border` hairline: the credit, the reason, and a link.

**Footer copy:** Data: U.S. Geological Survey. You get this email because your alert "<alert name>" matched. Manage your alerts

- "Data: U.S. Geological Survey." appears only for events from the USGS source.
- "Manage your alerts" links to `/alerts` on the site.

**Plain-text alternative**, in the same order: the title, the summary, the four lines as "Category: …", the source URL on its own line, then the footer sentences and the alerts URL.

## Simulated event

Everything as above, with three differences:

- **Subject:** starts with `[SIMULATED] `: `[SIMULATED] [High] Test quake near Tokyo · Pacific rim quakes`
- **Banner:** between "Heads-up" and the title, a block with a `warning-muted` background, a `warning` 1px border and radius 5px: This is a simulated event created by an admin. Nothing happened.
- **Footer:** no data credit. "View at source" appears only when the admin gave a link.

The plain-text alternative opens with the banner sentence on its own line.

## Test email

**Subject:** Test from Heads-up

**Body:**

1. "Heads-up" at 16px, weight 700.
2. A heading at 18px, weight 600: This destination works
3. A paragraph: You sent this test from your destinations page on 27 Nov 2026 at 13:55 UTC. Notifications from your alerts arrive at this address.
4. A footer in 12px `muted-foreground`, above a hairline: Manage your destinations, linking to `/destinations`.

## Severity colours in email

Literal light values: Low `#3F6485`, Moderate `#8A6100`, High `#B8440F`, Critical `#A3121A`. Each holds at least 4.5:1 on white.

## Confirmation email

Sent by Supabase Auth, not by the email channel, so it is not designed here. Its template should use the subject "Confirm your Heads-up account", one sentence ("Open this link to confirm your email address and finish creating your account."), and a button "Confirm email address". Editing the template is a Contracts or ship task.
