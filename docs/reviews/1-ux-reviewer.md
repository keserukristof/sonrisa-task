# Increment 1: UX review

- **Agent:** ux-reviewer
- **Reviewed:** `increment-1` at `0e7c963`, in a browser at 1280px and 360px (dev server and production build)
- **Date:** 2026-11-27 17:55

## Dispositions

| #   | Finding                                                                                          | Severity | Disposition    | Why                                                                                                                                                                                                                                      | Fixed in  |
| --- | ------------------------------------------------------------------------------------------------ | -------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Outline buttons have no border                                                                   | major    | accepted       | Confirmed in the built HTML. **The stated cause was wrong:** `cn` merges `border-transparent border-border` correctly (checked in node); `buttonVariants()` returned `cva`'s unmerged string, which links styled as buttons use directly | `e3d0790` |
| 2   | Delete confirm is a tint, not solid destructive                                                  | major    | accepted       | components.md: destructive is solid, danger is outline with destructive text                                                                                                                                                             | `e3d0790` |
| 3   | Not-found in the signed-in area: two headers, revealing titles, `/admin` redirect leaks the page | major    | accepted       | not-found.md: must not reveal whether the page exists                                                                                                                                                                                    | `e0888d5` |
| 4   | Simulate form loses category and severity after a failed submit                                  | major    | accepted       | An admin could send real email at the wrong severity                                                                                                                                                                                     | `e0888d5` |
| 5   | Focus drops to `<body>` when a submit button disables; sign-up errors not announced              | major    | accepted       | Keyboard and screen-reader users lose their place; includes the known #7 deviation                                                                                                                                                       | `e0888d5` |
| 6   | Focus rings faint (about 2.4:1)                                                                  | major    | accepted       | WCAG 1.4.11; the design asks for a 2px solid ring with offset                                                                                                                                                                            | `e3d0790` |
| 7   | Tab leaves the open mobile menu                                                                  | major    | accepted       | app-header.md: focus is trapped while open                                                                                                                                                                                               | `e0888d5` |
| m1  | #13 native radios; #8 dialog 384px                                                               | minor    | accepted as is | The reviewer accepts both deviations; the checked-option border goes with item 4                                                                                                                                                         |           |
| m2  | Sign-up clears the password on error                                                             | minor    | accepted       | The design shows it kept                                                                                                                                                                                                                 | `e0888d5` |
| m3  | Mobile menu Close is icon only, 28px                                                             | minor    | accepted       | Design has "×" and "Close"                                                                                                                                                                                                               | `e0888d5` |
| m4  | "Back to alerts" is a ghost button                                                               | minor    | accepted       | Design shows an underlined link                                                                                                                                                                                                          | `e0888d5` |
| m5  | Row "Edit" has no context in its name                                                            | minor    | accepted       | Delete already names the alert                                                                                                                                                                                                           | `e0888d5` |
| m6  | Category options equal width; severity select narrow (simulate)                                  | minor    | accepted       | Goes with item 4                                                                                                                                                                                                                         | `e0888d5` |
| m7  | Buttons weight 500, controls 32–36px                                                             | minor    | partly         | Weight is 600 now (`e3d0790`). Heights: rejected, components.md says 36px for page buttons and 32px in rows, which is what is built                                                                                                      | `e3d0790` |
| m8  | Landing hero centred; message pages sit high; pager layout                                       | minor    | accepted       | Match the design                                                                                                                                                                                                                         | `e0888d5` |
| m9  | Link-expired while signed in shows the signed-out header                                         | minor    | deferred       | Rare path (a signed-in user reusing a confirmation link); known limitation                                                                                                                                                               |           |
| m10 | Notices live in the URL and return on refresh                                                    | minor    | deferred       | A design decision from Contracts (`withNotice`); changing it means cookies for every notice. Known limitation                                                                                                                            |           |
| m11 | Same-text Send test result not re-announced                                                      | minor    | accepted       | Clear the status region while pending                                                                                                                                                                                                    | `e0888d5` |
| m12 | Notification grid missing under `next dev`                                                       | minor    | deferred       | The production build renders it; the dev server the reviewer used was likely started before `0e7c963` added the utility. To re-check after the fixes                                                                                     |           |
| m13 | Loading and error states not seen live                                                           | note     | deferred       | Too fast locally; the streamed skeleton markup was checked                                                                                                                                                                               |           |

## Report, verbatim

## UX review, increment 1 (#3), branch `increment-1`

**How I checked it.** I started `next dev` on :3200, which you did not provide, and later `next start` on :3201, which served the existing production build of HEAD (`.next/BUILD_ID` 17:24, the time of the last commit). I stopped both when I finished. Every story in the brief was walked in Playwright at 1280px and 360px.

- **Sign-up:** a fresh account, `ux-review-<timestamp>@heads-up.test`, created through the real form and confirmed from the Mailpit link. I used it for the empty states and for create, edit, pause, delete and send test.
- **Seeded accounts:** I only read with `demo@heads-up.test`. With `admin@heads-up.test` I created one simulated Markets / Low event, which matches no demo alerts.
- **axe:** wcag2a/2aa/21a/21aa/22aa on 16 pages × 2 widths, against the production build. **0 violations.**
- **Screenshots:** 50 files at `/Users/kristof/Documents/sonrisa-task/docs/screenshots/1-ux-*.png`. The full-page sweep shots come from the production build. The interaction shots came from dev and show the Next dev-tools "N" badge in the bottom-left; ignore it.
- **Cleanup:** I deleted the stray `.playwright-mcp/` folder the MCP wrote into the repo root.

### Blocker

None. Every story can be finished with a mouse, with a keyboard, and at 360px.

### Major

1. **The "outline" button variant has no border anywhere.**
   - **Where:** Sign in on the landing page, Sign up in the header, Cancel, Edit, Send test, Next, Back to alerts.
   - **What I saw:** both widths, both builds. Computed `border-color` is `rgba(0,0,0,0)` and the fill matches the page background, so these buttons look like ghost buttons. Delete, the "danger" variant, renders as a pink fill.
   - **Cause:** the class string keeps both `border-transparent` (from the base) and `border-border` (from the variant). The `cn` package (`cn@0.5.2`, used through `src/lib/utils.ts`) does not merge them, and the transparent one wins in the CSS order.
   - **Design:** components.md "Button"; screens 1-main.png, 1-landing.png, 1-destinations.png.
   - **Fix:** in the Contracts layer, make `cn` resolve this conflict (switch to `clsx` + `tailwind-merge`, or fix the merge config), then re-check every variant. Make danger the outline style with `text-destructive`.
   - **Evidence:** `1-ux-landing-desktop.png`, `1-ux-alerts-desktop.png`, `1-ux-destinations-desktop.png`.

2. **The delete confirm button is a pale tint, not the solid destructive button.**
   - **Where:** delete dialog, desktop.
   - **What I saw:** "Delete alert" is pink with red text, and the footer is a grey band. The design has a solid red button on white. shadcn base-nova's `destructive` variant is the tint.
   - **Design:** 1-alerts-delete.png; components.md (destructive is solid).
   - **Fix:** make `destructive` `bg-destructive text-destructive-foreground` and keep the tint as the danger/outline style.
   - **Evidence:** `1-ux-alerts-delete-dialog-desktop.png`.

3. **The not-found page inside the signed-in area shows two headers.**
   - **Where:** `/alerts/<unknown id>/edit` and `/admin/simulate` as a non-admin, desktop and mobile.
   - **What I saw:** the full app header, then a second wordmark-only header. That gives two `<header>` landmarks.
   - **Leak:** on `/admin` the URL also redirects to `/admin/simulate` and the tab title reads "Simulate an event · Heads-up". That tells a non-admin the page exists.
   - **Known #8 deviation:** the edit route's title stays "Edit alert". Together with the above, I would not accept it as is.
   - **Design:** not-found.md (wordmark-only header; must not reveal whether the page exists).
   - **Fix:**
     - Render the not-found content without its own header when it sits inside the `(app)` layout, or move the auth/admin check so `notFound()` resolves to the root `not-found.tsx`.
     - Set the title to "Page not found" for both routes, e.g. `generateMetadata` that checks access.
   - **Evidence:** `1-ux-alert-edit-not-found-desktop.png`, `1-ux-admin-not-found-user-desktop.png`.

4. **The simulate form loses category and severity after a failed submit.**
   - **Where:** `/admin/simulate`, desktop.
   - **What I did:** chose Markets, severity Moderate, a title and a summary, then a bad link (`notaurl` or `ftp://…`), and submitted.
   - **What happened:** the link error shows and title and summary are kept, but no category is checked and severity is back to High.
   - **Risk:** an admin who fixes only the link can create an event with the wrong severity, and that event sends real emails.
   - **Rule:** ui.md "Keep what the user typed"; admin-simulate.md "typed values kept".
   - **Fix:** feed the submitted `category` and `severity` back from the action state as controlled values or `defaultChecked`/`defaultValue`, as the alert form already does.
   - **Evidence:** `1-ux-simulate-errors-desktop.png`.

5. **Focus falls to `<body>` whenever a submit button disables itself.**
   - **Where:** sign-up and sign-in (with and without errors), Send test, simulate success, delete confirm.
   - **What I saw:** the pending state disables the focused button, so focus drops to `<body>` and the next Tab starts again at the wordmark.
   - **Send test:** focus is gone within about 64 ms and never comes back.
   - **Sign-up:** the field errors are not announced either; no `role="alert"`, and focus is not moved. A screen-reader user hears nothing after submitting. This is the known #7 deviation, but its effect is worse than it sounds.
   - **What works:** the alert form recovers because it moves focus to the first invalid field.
   - **Rule:** ui.md Forms, and "Everything works with the keyboard alone".
   - **Fix:**
     - Use `aria-disabled` plus a guard instead of `disabled` while pending, or restore focus to the button after pending ends.
     - Move focus to the first invalid field on sign-up, sign-in and simulate, as the alert form does.
     - After a delete, move focus to the "Alert deleted." notice or the `h1`.

6. **Focus rings are faint.**
   - **What I saw:** buttons, inputs and the switch use `ring-ring/50`: teal at 50% over a light background, about 2.4:1 against it, below the 3:1 a focus indicator needs. On the category radio the halo hugs a 16px circle and is barely visible.
   - **Rule:** ui.md "visible focus ring", WCAG 1.4.11.
   - **Fix:** use a solid `ring-ring` (or a 2px `outline-ring` with offset) for focus-visible, and give the radio option card a focus-within border.
   - **Evidence:** `1-ux-alert-form-focus-radio-desktop.png`, `1-ux-alert-form-focus-cancel-desktop.png`.

7. **Focus leaves the mobile menu panel.**
   - **Where:** mobile menu, 360px.
   - **What I did:** opened Menu with the keyboard and tabbed.
   - **What happened:** Alerts → Notifications → Destinations → Sign out → Close → an invisible focus-guard span → `<body>` → the page's own "Heads-up" link, which is outside the panel.
   - **What works:** Escape and choosing a link close the panel and return focus to Menu.
   - **Delete dialog:** the trap holds, but each cycle adds one or two invisible stops (the guard span, then `<body>`).
   - **Rule:** app-header.md "Focus is trapped inside while it is open".
   - **Fix:** check the `Sheet`/`Dialog` wrapper is modal (`modal` prop, the page behind made `inert`), and that `Close` is not the last focusable before the guard. Re-test with Tab in a real browser.

### Minor

- **Known deviations I accept:**
  - #13, native radios on simulate: works and is keyboard-operable. But the checked option has no primary border, and once item 4 is fixed it should show the restored selection.
  - #8, dialog at 384px instead of 420px: fine.
- **Sign-up password cleared on error.** The design shows it kept. Either keep it or record the decision. See `1-ux-sign-up-errors-desktop.png`.
- **Mobile menu Close is icon only.** The design has the × and the word "Close", and the button is 28px tall.
- **"Back to alerts" is a ghost button, not an underlined link.** On mobile it is also indented by the button padding. The design (1-alert-form.png) shows a plain underlined link aligned with the heading.
- **Edit link has no context.** Its accessible name is "Edit", while the delete button says "Delete <name>". Add an sr-only alert name.
- **Category options stretch to equal widths at desktop,** so "Natural disasters" wraps to two lines. The design sizes them to their content.
- **Simulate severity select is narrow;** the design has it full width.
- **Every button is weight 500;** the design uses 600. Controls are 32–36px tall against about 40px in the design.
- **Landing hero is vertically centred.** The design has it top-aligned with 72px of top padding.
- **Message pages sit high.** Link-expired and not-found are about 24px below the header instead of 48px.
- **Link-expired while signed in** still shows the signed-out header and "Go to sign in", which then bounces to `/alerts`.
- **Notices live in the URL** (`?notice=…`), so they come back on refresh or when the URL is shared.
- **Same-text test results are not re-announced.** A second "Delivered at 16:24 UTC" replaces the first with identical text, so the status region may stay silent. Clear it during pending.
- **Pager layout differs.** "Page 1" is centred and Next is borderless; the design has "Page 1" left and Next as an outline button. The border is item 1.
- **Grid missing under `next dev`.** The notification grid utility (`@utility grid-cols-notification-row`, used as `sm:grid-cols-notification-row`) is not in the dev CSS, so the table stacks into a single column at 1280px under `pnpm dev`. The production build has it and renders correctly (`1-ux-notifications-desktop.png`). Developers and reviewers running dev will see a broken page; worth a note or a stale-cache investigation.
- **Loading and error states were not seen live.** Local queries are too fast, and I did not break the database. The streamed markup shows the alerts skeleton with `role="status"`, `aria-busy`, "Loading alerts" and three rows.

### Flows walked and found sound

- **Sign-up and sign-in:**
  - The unconfirmed-account notice, with its link to `/sign-up/confirm`.
  - Confirmation link → `/alerts` with "Email confirmed."; reusing the link → the expired page.
  - Wrong credentials: generic `role="alert"`, email kept, password cleared.
  - Empty fields show field errors.
- **Guards:** signed-out `/notifications` goes to `/sign-in?next=…`; a signed-in user on `/` or `/sign-in` goes to `/alerts`.
- **Sign out:** lands on `/`, and Back does not show account data.
- **Alert form:**
  - Empty submit: errors on Name and Category, focus moves to Name.
  - Over 10 keywords: "Use 10 keywords at most. You entered 12."
  - No destination: group error.
  - Values kept after errors. News disables severity and shows the hint.
  - Keywords are normalised (" japan, Tsunami,,japan " → japan, tsunami).
  - "Creating…" pending label, then "Alert created."
- **Edit:** prefilled, keywords and severity survive a category round trip, then "Changes saved."
- **Switch:**
  - Toggles with Space, and the accessible name updates ("… is paused").
  - Persists across a reload, and the switch keeps focus.
- **Delete dialog:**
  - Exact copy, `alertdialog` role, Cancel focused on open.
  - Escape returns focus to the row's Delete; "Deleting…" pending label.
  - "Alert deleted." then the empty state.
- **Destinations:** "Account email", "can't be removed", Delivered at HH:MM UTC, then the 3-a-day refusal message with its icon.
- **Notifications:**
  - Empty state copy and link.
  - Desktop four-column grid in the production build.
  - Mobile stacked cards with the Alert/Destination list.
  - Simulated badge, Sent/Skipped/Failed with reasons, "Deleted alert", pager links, `?page=abc` falls back to page 1, credit line.
- **Admin:**
  - `/admin` redirects; Admin is marked current in the nav.
  - Empty and invalid-link errors.
  - News forces Low and disables severity, with its hint.
  - Success notice with its link, and the form resets.
- **Every page:** one `h1`, correct landmarks, no horizontal scroll at 360px, no axe violations.
