# App header

- **Where:** at the top of every signed-in page: `/alerts`, `/alerts/new`, `/alerts/<id>/edit`, `/notifications`, `/destinations`, `/admin/simulate`.
- **Purpose:** show where the user is, move between the sections, and sign out.
- **Artboards:** [html/Main.dc.html](../html/Main.dc.html) (desktop), [html/MobileAlerts.dc.html](../html/MobileAlerts.dc.html) (collapsed), [html/MobileMenu.dc.html](../html/MobileMenu.dc.html) (menu open)

## Layout from 768px

One row, 56px high, `card` surface, a `border` hairline below, 24px horizontal padding, 24px between groups:

1. **Wordmark**, linking to `/alerts`: the trace mark (a seven-point polyline, 26 by 16px, stroke 2, in `primary`) and "Heads-up" at 16px, weight 700.
2. **Navigation** (`<nav aria-label="Main">`), links 4px apart, each filling the header's height with 10px horizontal padding:
   - Alerts → `/alerts`
   - Notifications → `/notifications`
   - Destinations → `/destinations`
   - Admin → `/admin/simulate`, rendered for admins only
3. **Right side**, pushed to the end: the account email in `muted-foreground`, then "Sign out" (ghost, small).

**Link states:** a link is `muted-foreground` at weight 500. The current section has `aria-current="page"`, `foreground` at weight 600, and a 2px `primary` underline flush with the bottom of the header. "Alerts" is current on the list, new and edit pages.

## Layout below 768px

1. The wordmark, with 16px horizontal padding.
2. On the right, one button: "Menu" (outline, small) with the menu icon and the word.

The navigation links, the email and "Sign out" move into the menu panel.

## Menu panel

A panel that slides in from the right over a dimmed page (shadcn `sheet`), 280px wide, `popover` surface, `shadow-overlay`, 16px padding:

1. A row with the heading "Menu" and a "Close" button (ghost, small, with the cross icon and the word).
2. The same links, one per row, 44px high, 16px text at weight 500. The current one has an `accent` fill and weight 600.
3. A hairline.
4. The account email in `muted-foreground`.
5. "Sign out", as a row like the links.

Choosing a link closes the panel. Escape and the dimmed area close it. Focus is trapped inside while it is open and returns to the "Menu" button when it closes.

## Copy

Alerts; Notifications; Destinations; Admin; Sign out; Menu; Close.

## Sign out

A Server Action: ends the session and redirects to `/`. Pending label: "Signing out…".

## The signed-out header

Landing, sign-up, sign-in and the two message pages use a simpler header: the wordmark linking to `/`, and on the right "Sign in" (ghost, small) and/or "Sign up" (outline, small), whichever is not the current page. Each screen's file says which. It does not collapse: it fits at 360px.

## Components

Header, Button, and `sheet` for the menu panel.

## Increment 2

- The Admin link (admins only) goes to `/admin`, the overview, and is current on every admin route.
- The mobile menu lists the same links.
