# #7: Sign up, confirm and sign in

- **State:** open
- **Opened:** 2026-11-27 14:19 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/7

## Body

## Parent

#3

## What to build

A visitor can sign up, see that their account is waiting for confirmation, confirm through the emailed link and land signed in on their alerts; a user can sign in, see clear errors, be returned to the page they asked for, and sign out. The signed-out landing page explains Heads-up.

Stories 1–7 of #3. Screens: `docs/design/screens/landing.md`, `sign-up.md`, `sign-up-confirm.md`, `sign-in.md`, `link-expired.md`.

## Acceptance criteria

- [ ] Everything under "Account (stories 1–7)" in #3's acceptance criteria
- [ ] Signing up with an existing address shows the same waiting page
- [ ] The confirmation link signs the visitor in and shows "Email confirmed." on `/alerts`; an expired or used link shows its page
- [ ] `next` accepts only a path on this site; anything else goes to `/alerts`
- [ ] Playwright spec with an axe scan: sign up, confirm through the local mail catcher, sign in, sign out; wrong password shows the error


## Contracts already in place

- `src/features/auth/schema.ts` has `signUpSchema` and `signInSchema`; `actions.ts` has `signIn` (with `next` and the `unconfirmed` code) and `signOut`; `sign-in-form.tsx` and the sign-in page work. Extend them; do not start over.
- The confirmation email (`supabase/templates/confirmation.html`) links to `<emailRedirectTo>?token_hash=…&type=email`. Sign-up must pass `emailRedirectTo` as this site's own origin plus `/auth/confirm`, built from the request's host, so it works on the dev port and on each e2e port. Local redirect URLs for any localhost port are allowed.
- The confirm route verifies the token hash with `supabase.auth.verifyOtp({ type: "email", token_hash })`, then redirects to `withNotice("/alerts", "email-confirmed")`, or to `/link-expired` on any failure.
- Passwords need 8 characters in Supabase Auth as well as in the schema. Confirmation is on locally; the email lands in the mail catcher with the subject "Confirm your Heads-up account".
- A new account gets its profile and email destination from a database trigger: nothing to create in the action.

## Owned paths

- `src/features/auth/**`
- `src/app/(auth)/**`
- `src/app/auth/confirm/route.ts` (new)
- `src/app/page.tsx` and `src/features/landing/**`
- `e2e/auth.spec.ts`, and the two landing tests in `e2e/smoke.spec.ts`

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, never write through the demo accounts, and read mail with `waitForEmail()` from `e2e/support/mailbox.ts`. Remove your page's `<Placeholder>`.


**Keep working for the other tickets:** the `signOut` export, the "Email" and "Password" labels, the "Sign in" button, and landing on `/alerts` after sign-in. The app layout and every other ticket's `signIn()` test helper depend on them. `e2e/contracts.spec.ts` is not yours.


**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in. The suite runs with reduced motion, so panels and dialogs are scanned fully open.


**After the security audit:** the confirm route takes no `next` parameter; it always lands on `/alerts`. Sign-up builds `emailRedirectTo` from the request's own origin only.

