# Expired or used link

- **Route:** shown by the confirmation route when the link's token is expired, already used or malformed.
- **Purpose:** explain why the link did nothing and send the visitor to sign in.
- **Primary action:** "Go to sign in".
- **Artboard:** [html/LinkExpired.dc.html](../html/LinkExpired.dc.html)

## Layout, top to bottom

1. **Signed-out header:** the wordmark; on the right "Sign in" (ghost, small).
2. **Main**, at most 420px wide, centred, 48px from the header: one card with 24px padding, items 12px apart:
   - The `h1` in `title`.
   - A paragraph in `muted-foreground`.
   - The primary button, 8px further down.

## Copy

- **Heading:** This link has expired or was already used
- **Paragraph:** If you already confirmed your address, sign in.
- **Button:** Go to sign in

## The successful case, for contrast

A valid link confirms the address, signs the visitor in and redirects to `/alerts`, which shows the success Notice "Email confirmed." above its content. See [alerts-list.md](alerts-list.md).

## States

Static.

## Components

Header (signed out), a card, Button.

## Responsive

At 360px the page padding is 16px and the card fills the width.
