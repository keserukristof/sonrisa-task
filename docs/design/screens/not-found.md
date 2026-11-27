# Not found

- **Route:** any path that does not exist, and any path the visitor may not open: `/admin` and `/admin/simulate` for a non-admin or a signed-out visitor, and `/alerts/<id>/edit` for an alert that is not theirs.
- **Purpose:** say the page is not available without revealing whether it exists.
- **Primary action:** "Go to alerts".
- **Artboard:** [html/NotFound.dc.html](../html/NotFound.dc.html)

## Layout, top to bottom

1. **Header:** the wordmark only, linking to `/`. No navigation and no buttons, because the page renders the same for signed-in and signed-out visitors.
2. **Main**, at most 420px wide, centred, 48px from the header: one card with 24px padding, items 12px apart:
   - The `h1` in `title`.
   - A paragraph in `muted-foreground`.
   - The primary button, 8px further down.

## Copy

- **Heading:** Page not found
- **Paragraph:** This page doesn't exist, or you don't have access to it.
- **Button:** Go to alerts

"Go to alerts" links to `/alerts`; a signed-out visitor is then sent to sign in by the guard.

## States

Static.

## The other full-page error

The route error boundary (`error.tsx`) uses the same layout:

- **Heading:** Something went wrong
- **Paragraph:** The page couldn't be shown. Your alerts are not affected.
- **Button:** Try again

## Components

Header (wordmark only), a card, Button.

## Responsive

At 360px the page padding is 16px and the card fills the width.
