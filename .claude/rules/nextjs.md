---
paths:
  - "src/app/**"
  - "src/features/**"
  - "src/lib/**"
  - "src/proxy.ts"
  - "next.config.ts"
---

# Next.js 16 rules

Source: the docs bundled at `node_modules/next/dist/docs/01-app/`. When this file and the docs disagree, the docs win; fix this file.

## Rendering: Cache Components is on

- A page is a **static shell** plus streamed holes. Anything request-time must render inside `<Suspense>`: `cookies()`, `headers()`, `params`, `searchParams`, and every uncached fetch or database call.
- **Push request-time access down.** Do not `await` it at the top of a page or layout. Keep the page synchronous and let a child component inside `<Suspense>` do the awaiting.
- Prefer a granular `<Suspense>` with a skeleton that matches the final layout over a route-wide `loading.tsx`.
- `pnpm build` fails with "uncached or runtime data during prerendering" when this is violated. Fix it with `<Suspense>`. Do not silence it with `export const instant = false`.
- The segment exports `dynamic`, `revalidate`, `fetchCache`, `dynamicParams` and `runtime` are removed. Do not write them.

```tsx
// src/app/projects/page.tsx
export default function ProjectsPage() {
  return (
    <main>
      <h1>Projects</h1>
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
      </Suspense>
    </main>
  );
}
```

## Caching

- **Per-user data is not cached.** The cookie-bound Supabase client cannot run inside `"use cache"`. Read it fresh behind `<Suspense>`.
- **Data that is the same for everyone** may be cached: use `createPublicClient()` inside a function marked `"use cache"`, with an explicit `cacheLife(...)` and a `cacheTag(...)`.
- Never call `cookies()`, `headers()` or `createClient()` from `@/lib/supabase/server` inside a `"use cache"` scope. It can pass the build and fail in production.
- Cache keys and tags are stored in plain text: no emails, tokens or other personal data in them.

## Server and Client Components

- Server Components by default. Add `"use client"` only at the leaf that needs state, effects or browser APIs.
- Props crossing to a Client Component must be serializable and minimal. Pass a DTO, never a database row with columns the UI does not show.
- Files that touch the database or secrets start with `import "server-only";`.

## Reading data: `queries.ts`

- One exported function per use case, in the feature's `queries.ts`. It gets the user from `getCurrentUser()` (`@/lib/auth/session`), queries through `createClient()`, and returns a typed DTO.
- Select explicit columns. Handle the `error` Supabase returns; do not let it become `undefined` data.
- Server Components call queries directly. Do not fetch your own Route Handlers from the server.

## Mutating data: `actions.ts`

Every Server Action follows the same order:

1. `"use server"` at the top of the file.
2. Authenticate: get the user; return an error result if there is none.
3. Validate: `schema.safeParse(...)` with the Zod schema from the feature's `schema.ts`.
4. Mutate through `createClient()`. RLS enforces ownership; never trust an id from the client to prove it.
5. Refresh the UI: `refresh()` from `next/cache` for uncached per-user reads, `updateTag(tag)` for tagged cached data.
6. Return a result object. Call `redirect()` last and outside any `try` block, because it throws.

- **Expected failures are return values, not exceptions**: `{ ok: false, fieldErrors, message }`. Throw only for bugs, and let `error.tsx` catch them.
- Forms use `useActionState` and show `pending` on the submit button.
- `revalidateTag` needs a second argument now; in actions prefer `updateTag` for read-your-own-writes.

## Route Handlers

Only for webhooks, external clients and the health probe. UI mutations go through Server Actions.

## Types and routing

- `params`, `searchParams`, `cookies()` and `headers()` are Promises. Await them, inside `<Suspense>`.
- Use the generated global helpers: `PageProps<"/projects/[id]">`, `LayoutProps<"/">`, `RouteContext<"/api/x/[id]">`. `pnpm typecheck` regenerates them.
- `typedRoutes` is on: `<Link href>` and `redirect()` only accept routes that exist. A route must be created before anything links to it, which is why the Contracts ticket creates every route skeleton.

## Errors and not-found

- `error.tsx` is a Client Component with props `{ error: unknown, retry: () => void }`. Narrow `error` before reading it.
- Call `notFound()` for a missing or inaccessible record. Do not reveal whether it exists.
- `forbidden()` and `unauthorized()` are experimental and not enabled here.

## Proxy

`src/proxy.ts` (the renamed middleware) only refreshes the Supabase session. It is not an authorization boundary and does no database work. Authorization happens in queries, actions and RLS.

## Environment

Read environment variables only through `src/lib/env.ts`. `NEXT_PUBLIC_*` values are inlined at build time and must be referenced literally.

## Metadata

Each page exports `metadata` (or `generateMetadata`) with a specific title. The root layout provides the title template.
