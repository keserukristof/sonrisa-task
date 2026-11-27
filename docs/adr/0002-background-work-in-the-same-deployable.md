# ADR-0002: Background work runs in the same deployable

- **Status:** accepted
- **Date:** 2026-11-27

## Context

The product polls sources, matches events against alerts and sends notifications. None of that is started by a user's request, so it is background work, and the usual home for background work is a separate backend service with its own process. ADR-0001 chose Next.js and Supabase for the request-driven part and did not cover this.

## Decision

Polling, matching and delivery run inside the Next.js application, in a route that a scheduler calls (ADR-0003). There is no separate backend service.

The alerting code imports nothing from `next/*`. The route is a thin entry point around it.

## Considered options

- **A separate backend service (NestJS) for polling and delivery.** Rejected: a second deployable to build, host, secure and keep in type-sync with the first, inside 24 hours and with one developer.
- **Supabase Edge Functions for the background work.** Added by the agent, not put to the user. Rejected: a second runtime (Deno) and a second place for the same domain code.

## Consequences

- Background work is bounded by what one serverless invocation can do. Work that does not fit in one invocation waits for the next one, so every step must be safe to repeat.
- Because the alerting code does not depend on the framework, moving it to a worker later is a change of entry point, not a rewrite.
- Revisit when any of these becomes true: delivery volume outgrows one batch a minute; a second client needs a public API; separate teams own backend and frontend; the organisation's standard is a dedicated backend.
