# Sign up

- **Route:** `/sign-up`. A signed-in user is redirected to `/alerts`.
- **Purpose:** create an account with an email address and a password.
- **Primary action:** "Create account".
- **Artboard:** [html/SignUp.dc.html](../html/SignUp.dc.html) (shown with the password error)

## Layout, top to bottom

1. **Signed-out header:** the wordmark; on the right "Sign in" (ghost, small).
2. **Main**, at most 420px wide, centred, 48px from the header:
   - The `h1` in `title`, 24px above the card.
   - A card with 24px padding, fields 20px apart:
     - **Email** field: `type="email"`, `autocomplete="email"`.
     - **Password** field: `type="password"`, `autocomplete="new-password"`.
     - The primary button, full width of the card.
     - One line in `muted-foreground`.
   - Below the card, 16px: a line with a link to sign in.

## Copy

- **Heading:** Create your account
- **Labels:** Email; Password
- **Button:** Create account. Pending: Creating account…
- **Line in the card:** We email you a link to confirm this address before you can sign in.
- **Below the card:** Already have an account? Sign in

## States

- **Field errors**, each under its field, from the shared Zod schema:
  - Email empty or malformed: Enter a valid email address.
  - Password shorter than 8 characters: Use at least 8 characters.
- **Pending:** the button is disabled and reads "Creating account…".
- **Server error:** an error Notice directly above the button: "Couldn't create your account. Try again."
- **Success:** redirect to `/sign-up/confirm`. An address that already has an account gets the same redirect and the same page, so the response never reveals whether an account exists.

Typed values stay after a failed submit; focus moves to the first invalid field.

## Components

Header (signed out), Field, Button, Notice.

## Responsive

At 360px the page padding is 16px and the card fills the width. Nothing else changes.
