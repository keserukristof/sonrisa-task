---
paths:
  - "supabase/**"
  - "src/lib/supabase/**"
  - "src/lib/auth/**"
  - "src/features/**/queries.ts"
  - "src/features/**/actions.ts"
---

# Supabase rules

Look up current syntax with the Supabase docs (context7 or the Supabase MCP `search_docs`) before writing anything unfamiliar.

## Which client

| Situation                                      | Client                                              |
| ---------------------------------------------- | --------------------------------------------------- |
| Server Component, Server Action, Route Handler | `createClient()` from `@/lib/supabase/server`       |
| Data identical for all visitors, cacheable     | `createPublicClient()` from `@/lib/supabase/public` |
| Client Component (realtime, auth events only)  | `createClient()` from `@/lib/supabase/client`       |
| Proxy                                          | `updateSession()` from `@/lib/supabase/proxy`       |

- Create a server client per request. Never store one in a module-level variable.
- Identity comes from `getCurrentUser()`, which verifies the JWT with `auth.getClaims()`. Never authorize from `auth.getSession()`: its user object is read from a cookie and is not verified.
- The secret key bypasses RLS. It is not used by this app today. If a trusted server job ever needs it, it lives in exactly one `server-only` file, `src/lib/supabase/admin.ts`, and is never the fix for a failing policy.

## Migrations

- Create with `pnpm db:new <descriptive_name>`. One concern per migration.
- Never edit a migration that is already on `main`; add a new one. The cloud database has already applied it.
- After every migration: `pnpm db:reset`, then `pnpm db:types`, and commit the regenerated types together with the migration.
- **Schema changes belong to the Contracts ticket.** Implementation tickets run in parallel against one shared local database and must not add migrations or reset it.
- Agents never run `supabase link` or any database command with `--remote` or `--linked`. Those change the cloud project; the user approves them during `/ship`.

## Tables

- `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`, and `updated_at` where rows change.
- Use `timestamptz`, never `timestamp`. Use `text` with a `check` constraint or an enum for closed sets.
- Declare foreign keys with an explicit `on delete` behaviour, and index every foreign key column.
- Lowercase `snake_case` names, plural table names.

## Row Level Security

- `alter table ... enable row level security;` in the same migration that creates the table. A table without RLS is readable by anyone holding the publishable key.
- One policy per operation (`select`, `insert`, `update`, `delete`), each scoped with `to authenticated` or `to anon`. Avoid `for all`.
- Wrap auth calls so Postgres evaluates them once per statement: `using ((select auth.uid()) = user_id)`.
- `insert` and `update` policies need `with check`, not only `using`.
- Index the columns policies filter on.
- Each table gets pgTAP tests in `supabase/tests/`: the owner can, another user cannot, an anonymous visitor cannot.

```sql
create policy "Users read their own projects"
  on public.projects for select
  to authenticated
  using ((select auth.uid()) = user_id);
```

## Functions

`security invoker`, `set search_path = ''`, and fully qualified names inside the body. Revoke from `public` and grant `execute` to the roles that need it. Use `security definer` only with a written reason in the migration.

## Queries

- Select explicit columns, never `*`.
- Always check `error`. Return a typed DTO from `queries.ts`, not the raw response.
- Filter in the database, not in JavaScript. Paginate lists with `.range()`.
