# Increment 1: security audit of the build

- **Agent:** security-auditor
- **Reviewed:** `a663772..increment-1` at `f0dda01` (tickets #7 to #14)
- **Date:** 2026-11-27 17:40

## Dispositions

| #   | Finding                                                                                            | Severity | Disposition | Why                                                                                                                        | Fixed in |
| --- | -------------------------------------------------------------------------------------------------- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | Confirmation redirect built from `x-forwarded-host`/`host`                                         | medium   | accepted    | The allow-list is not configured yet and is the only barrier; building from `APP_URL` in production removes the dependency | pending  |
| 2   | Raw provider errors stored where the owner can read them; Resend 401/403 marks destinations broken | low      | accepted    | One bad key or domain at deploy would break every user's destination permanently                                           | pending  |
| 3   | `setAlertActive`'s `active` argument not validated with Zod                                        | low      | accepted    | Non-negotiable 4, even with no exploit                                                                                     | pending  |
| N1  | USGS link scheme unchecked                                                                         | note     | accepted    | Same `^https?://` check as simulated events; one line                                                                      | pending  |
| N2  | No fetch timeout on USGS                                                                           | note     | accepted    | A hanging feed would stall the whole tick                                                                                  | pending  |
| N3  | Login CSRF on `/auth/confirm`                                                                      | note     | deferred    | Negligible impact, as the auditor says; Supabase's standard token-hash flow                                                |          |
| N4  | Strip CR/LF from the subject                                                                       | note     | accepted    | Cheap defence in depth; Resend's handling not verified                                                                     | pending  |
| N5  | Enumeration via "unconfirmed" on sign-in                                                           | note     | deferred    | Depends on GoTrue's check order; verified by one manual check at `/ship`                                                   |          |

## Report, verbatim

I found no critical or high findings in increment 1 as built (`a663772..increment-1`). There is one medium finding, which depends on how the hosted project is configured, and two low ones.

Four things checked out directly:

- No user page leaks another user's data to an admin.
- Every Server Action checks the user again.
- An admin cannot write another user's rows.
- The tick route is properly gated.

The `supabase/` diff is empty, so the database is exactly as the Contracts audit left it. `pnpm db:test` passes: 3 files, 74 checks. I ran the tests but did not re-read them for per-table coverage.

## Findings

### Medium (depends on hosted config): the confirmation redirect comes from request headers

`/Users/kristof/Documents/sonrisa-task/src/features/auth/origin.ts:7-10`, used at `/Users/kristof/Documents/sonrisa-task/src/features/auth/actions.ts:33-41`.

```ts
const host = headers.get("x-forwarded-host") ?? headers.get("host");
if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return null;
```

Any host name that is valid syntax is accepted, and it becomes `emailRedirectTo`. The confirmation template (`/Users/kristof/Documents/sonrisa-task/supabase/templates/confirmation.html`) puts `{{ .RedirectTo }}?token_hash=…` into the email. Only the hosted Auth redirect allow-list stands between an attacker and a token. That allow-list is not in the repository and is not set up yet: it is a `/ship` step in `/Users/kristof/Documents/sonrisa-task/docs/process/handover-03-build-increment-1.md`, under "For /ship".

- **Scenario:** an attacker sends the sign-up Server Action directly with `email=victim@example.com` and the header `X-Forwarded-Host: evil.example`.
  - The victim gets a genuine Heads-up email whose link points to `https://evil.example/auth/confirm?token_hash=…`.
  - If the victim clicks it, the attacker gets a valid token and confirms an account under the victim's address with a password the attacker chose.
  - The attacker then controls an account that sends alert email to the victim.
  - Separately, a real email from the trusted sender is a phishing vehicle.
  - Next.js's Server Action origin check does not stop this. It compares `Origin` to the same `X-Forwarded-Host`, and a non-browser client sets both.
- **It holds only if** the hosted allow-list accepts the spoofed origin (any wildcard such as `https://*.vercel.app/**`), or the platform passes a client-supplied `X-Forwarded-Host` through.
- **Verify at /ship:**
  - Whether Vercel overwrites `X-Forwarded-Host`.
  - Exactly how GoTrue matches `https://<prod>/auth/confirm` against the Site URL and the allow-list entries.
- **Smallest fix:** in production, build the redirect from `serverEnv().APP_URL`, which already exists and is already used for links in emails. Keep `originFrom(headers)` only when `NODE_ENV !== "production"`, or only for origins on a local allow-list, so the multi-port local and e2e runs keep working. Add a unit test showing a spoofed `x-forwarded-host` is ignored in production.
- **Related, configuration only:** if Supabase falls back to the Site URL, the template's bare `{{ .RedirectTo }}` drops `/auth/confirm`. The link then lands on the landing page with a `token_hash` that nothing verifies, so confirmation silently breaks. At /ship, set the hosted Site URL to the production origin, or allow-list `https://<prod>/auth/confirm` exactly. Then confirm one real sign-up end to end.

### Low: raw provider errors are stored where the owner can read them, and system-wide send failures mark a user's destination broken

`/Users/kristof/Documents/sonrisa-task/src/lib/alerting/channels/email/outcome.ts:20-34`, written at `/Users/kristof/Documents/sonrisa-task/src/lib/alerting/tick/deliver.ts:52-64` and `/Users/kristof/Documents/sonrisa-task/src/features/destinations/actions.ts:45-49`.

- Resend's `message`, or the SMTP error text, goes verbatim into `notifications.last_error`, `destinations.broken_reason` and `test_sends.error`.
- The owner can select all three through the API with the publishable key: `grant select (… broken_reason …)` on destinations, and full select on notifications and test_sends.
- The UI filters `last_error` through `KNOWN_FAILURE`, but the API does not.
- **Scenario:** a signed-in user queries `/rest/v1/destinations?select=broken_reason` or `/rest/v1/test_sends?select=error` and reads the provider's configuration messages, for example an unverified sending domain or a key problem.
- **Second effect, availability rather than access:** any Resend 4xx other than 408 and 429 is classified `broken`. That includes 401 and 403, which are failures of the system's key or domain, not of the user. One bad deploy would therefore permanently mark every user's email destination broken.
- **Smallest fix:** store a fixed sentence of your own ("The email provider rejected the message.") and log the raw text on the server only. Classify 401 and 403 from Resend as `retry`, or as a system failure that does not touch `destinations`.

### Low: a Server Action argument is not validated with Zod

`/Users/kristof/Documents/sonrisa-task/src/features/alerts/actions.ts:56-75`, `setAlertActive(alertId, active)`.

`alertId` is checked as a UUID, but `active` comes straight from the client. That breaks non-negotiable 4. No exploit follows from it:

- Row Level Security limits the update to the owner.
- The column grant allows only `active` and the alert's own fields.
- Postgres rejects a value that is not a boolean.

**Fix:** `z.boolean().safeParse(active)` before use.

## Notes (no concrete scenario)

- **Unchecked link scheme from USGS:** `/Users/kristof/Documents/sonrisa-task/src/lib/alerting/sources/usgs/map.ts:63` accepts `p.url` with any scheme, and it is rendered as `href` in the email. A simulated event's link is checked by both Zod and SQL; a USGS link is not. Add the same `^https?://` check.
- **No fetch timeout:** `/Users/kristof/Documents/sonrisa-task/src/lib/alerting/sources/usgs/index.ts:17` has none. A hanging USGS stalls the whole tick until the platform's function timeout. Add `AbortSignal.timeout(...)`.
- **Login CSRF:** `/Users/kristof/Documents/sonrisa-task/src/app/auth/confirm/route.ts` is a GET that signs the visitor in. An attacker could get a victim to open a link carrying the attacker's own token, signing the victim into the attacker's account. The victim might then create alerts whose names the attacker sees. The impact is negligible: no victim data is exposed beyond what they type, and email goes to the attacker's address.
- **Header injection:** settled for SMTP. In nodemailer 10.6.1 (`dist/cjs/mime-node/index.js`, `encodeHeaderValue`, default branch), CR and LF become spaces, so the subject cannot inject headers. Resend gets JSON and builds the MIME itself. I could not verify Resend's handling. Defense in depth: strip `[\r\n]` from the subject in `/Users/kristof/Documents/sonrisa-task/src/lib/alerting/channels/email/render.ts`. The `to` address comes from `auth.users` through the admin API, and `from` comes from the environment.
- **Account enumeration:** sign-in returns `code: "unconfirmed"` on `email_not_confirmed`. This is a problem only if GoTrue gives that answer before checking the password. `/Users/kristof/Documents/sonrisa-task/e2e/auth.spec.ts` does not test it either way. Worth one e2e check: an unconfirmed address with a wrong password should say "Email or password is incorrect."

## Checked and found sound

- **Admin data on user pages:** every user-page query filters by `user_id` even though the select policies let admins read all rows.
  - Covered: `getDestinationOptions`, `getAlerts`, `getAlert` in `src/features/alerts/queries.ts`; `listDestinations`; `getNotificationPage`.
  - Embedded resources hang off parent rows that are already filtered. The composite foreign keys on `alert_destinations` keep an alert's links inside one user.
  - `/alerts/<id>/edit` returns not-found the same way for an alert that does not exist and one that belongs to someone else.
  - The landing page, sign-up confirm page and simulate page read nothing cross-user. I found no other leak like the one `c27718a` fixed.
- **Admin writes:** an admin cannot change another user's rows.
  - `save_alert` is `security invoker`, so the owner-only update policy gives `v_id` null and it raises P0002 before any link is deleted.
  - `setAlertActive` and `deleteAlert` hit owner-only policies and treat zero rows as a failure.
- **Server Actions:** each one checks the user and validates input with Zod before touching data.
  - `signUp` and `signIn` validate with Zod.
  - `saveAlert` re-checks the user (`getCurrentUser`), parses the form with Zod and checks the id as a UUID.
  - `sendTest` re-checks the user and validates `destinationId` as a UUID. `claim_test_send` checks that the destination is the caller's, and its limits are serialised with an advisory lock. `finish_test_send` is limited to the caller's own unfinished row, and it sends to the email in the verified token, never to request data.
  - `simulateEvent` checks `isCurrentUserAdmin()`, the Zod schema with an `https?://` link, and `is_admin()` again inside the SQL plus the same scheme check. Every event it creates is marked simulated.
- **Identity:** always from `getClaims()`. There is no `getSession()` anywhere in `src`.
- **Redirects:** `safeNextPath` rejects `//`, `\` and control characters. `withNotice` accepts only fixed keys. `/auth/confirm` always goes to `/alerts`, with no `next` parameter.
- **Sign-up enumeration:** the response is the same whether or not the address already has an account. The address cookie is httpOnly, limited to `/sign-up`, and rendered escaped by React.
- **Tick route:** `/Users/kristof/Documents/sonrisa-task/src/app/api/tick/route.ts` compares the bearer token in constant time (SHA-256 then `timingSafeEqual`) against `TICK_SECRET`, which must be at least 32 characters. It is POST only and returns counts only. Errors are logged without detail.
- **Secret key:**
  - In app code, the secret key is read only in `src/lib/supabase/admin.ts`, which is `server-only`.
  - `createAdminClient` is imported only by the tick route.
  - The other references are tests, e2e support, fixtures used only by `run-tick.dbtest.ts`, and the setup scripts. None of them is a committed key.
  - No `NEXT_PUBLIC_` name holds a secret.
- **Email HTML:** every interpolated event, alert and URL value goes through `esc`, which covers `& < > "`, and all attributes use double quotes. The test email has no user input.
- **Client Components:** they receive DTOs only. `email-destination-row` gets `destinationId` and the user's own `accountEmail`. `settings` is never selected.
- **The UI:** notification history shows only the failure sentences the app writes itself (`KNOWN_FAILURE`).
- **Caching:** there is no `"use cache"` in the new code.
