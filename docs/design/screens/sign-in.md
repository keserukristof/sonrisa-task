# Sign in

- **Route:** `/sign-in`, with an optional `?next=<path>`. A signed-in user is redirected to `/alerts`.
- **Purpose:** sign in with email and password.
- **Primary action:** "Sign in".
- **Artboard:** [html/SignIn.dc.html](../html/SignIn.dc.html) (shown with the wrong-credentials error)

## Layout, top to bottom

1. **Signed-out header:** the wordmark; on the right "Sign up" (outline, small).
2. **Main**, at most 420px wide, centred, 48px from the header:
   - The `h1` in `title`, 24px above the card.
   - A card with 24px padding, items 20px apart:
     - An error Notice, only when sign-in failed.
     - **Email** field: `type="email"`, `autocomplete="email"`.
     - **Password** field: `type="password"`, `autocomplete="current-password"`.
     - The primary button, full width of the card.
   - Below the card, 16px: a line with a link to sign up.

## Copy

- **Heading:** Sign in
- **Labels:** Email; Password
- **Button:** Sign in. Pending: Signing in…
- **Below the card:** New here? Sign up

## States

- **Wrong credentials:** an error Notice at the top of the card, `role="alert"`: "Email or password is incorrect." It never says which one. The email stays filled; the password is cleared.
- **Unconfirmed account:** the same Notice position: "Your email address isn't confirmed yet. See what to do", where "See what to do" links to `/sign-up/confirm`.
- **Field errors:** an empty email or password shows "Enter your email address." or "Enter your password." under the field.
- **Pending:** the button is disabled and reads "Signing in…".
- **Success:** redirect to the `next` path when it is a path on this site starting with a single `/`; otherwise to `/alerts`.

There is no "Forgot password" link: password reset is out of scope.

## Components

Header (signed out), Field, Button, Notice.

## Responsive

At 360px the page padding is 16px and the card fills the width.
