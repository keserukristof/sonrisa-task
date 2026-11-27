# Waiting for confirmation

- **Route:** `/sign-up/confirm`, reached by redirect after sign-up, and from the sign-in error for an unconfirmed account.
- **Purpose:** tell the visitor their account is waiting for them to open the confirmation link.
- **Primary action:** none. One link: "Back to sign in".
- **Artboard:** [html/SignUpConfirm.dc.html](../html/SignUpConfirm.dc.html)

## Layout, top to bottom

1. **Signed-out header:** the wordmark; on the right "Sign in" (ghost, small).
2. **Main**, at most 420px wide, centred, 48px from the header: one card with 24px padding, items 12px apart:
   - A mail icon, 24px, in `primary`.
   - The `h1` in `title`.
   - A paragraph with the address at weight 600.
   - A paragraph in `muted-foreground`.
   - A link, 8px further down.

## Copy

- **Heading:** Check your inbox
- **Paragraph:** We sent a link to **you@example.com**. Open it to confirm your account.
- **Muted paragraph:** If it isn't there in a few minutes, look in your spam folder.
- **Link:** Back to sign in

When the page is opened without a known address (a direct visit), the paragraph reads: "We sent a link to your email address. Open it to confirm your account."

## What is deliberately absent

There is no "Resend email" button: decided in the Refine grill, to protect the 20 confirmation emails a day.

## States

Static. No loading, empty or error state.

## Components

Header (signed out), a card.

## Responsive

At 360px the page padding is 16px and the card fills the width.
