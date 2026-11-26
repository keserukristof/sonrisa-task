---
name: ship
description: Ship phase. Deploys the application to production (Supabase cloud and Vercel), verifies the live deployment, and finishes the reviewer-facing README and the AI workflow write-up. Run when the Must scope is merged and green.
disable-model-invocation: true
---

# Ship

Reviewers get a live URL and a repo they can run in one command. Nothing here is finished until it has been checked against the live deployment.

**Every command that changes a cloud resource needs the user's explicit approval in this session, each time.** That covers `supabase db push --remote`, seeding the cloud database, and `vercel deploy --prod`. Show what will change, then ask.

The cloud targets: Supabase project `lrnzhnrxjwfckwwmtajn` (organisation `ai-task`, eu-west-1) and Vercel project `sonrisa-task`.

## 1. Preconditions

- The integration branch is merged to `main` and `main` is pushed.
- `pnpm verify:full` is green locally and CI is green on `main`.
- No open Must ticket. List any open Should or Could tickets for the README.

Stop and report if any of these fails.

## 2. Database

- The repo is linked to the cloud project (`supabase link`). With CLI 3.x, database commands target the **local** stack unless you pass `--remote`.
- Show the migrations the cloud project has not applied yet: `pnpm exec supabase db push --remote --dry-run`.
- With approval, run `pnpm exec supabase db push --remote`, then confirm with `pnpm exec supabase migration list --remote` that local and remote match.
- With approval, load the demo data reviewers need. Never run `db reset` with `--remote` or `--linked`.
- Run the Supabase advisors (MCP `get_advisors`, security and performance) and fix or explain every finding.

## 3. Application

- Confirm the Vercel project has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for production. They are inlined at build time, so a change needs a new build.
- With approval, deploy: `pnpm dlx vercel@latest deploy --prod --yes`. The folder is linked to the Vercel project `sonrisa-task` (production URL https://sonrisa-task.vercel.app). The GitHub repository is not connected to Vercel, so pushing to `main` does not deploy by itself.

## 4. Verify production

- `GET <url>/api/health` returns 200 with `"status":"ok"`.
- `E2E_BASE_URL=<url> pnpm e2e` passes against the live site.
- Walk the primary user story in the browser as the demo user, on desktop and mobile widths.

Fix what fails and redeploy before continuing.

## 5. README

Rewrite `README.md` for a reviewer who has ten minutes:

1. What the application does, in two sentences, with the live URL and demo credentials at the top
2. Run it locally: prerequisites, then `pnpm install`, `pnpm bootstrap`, `pnpm dev`
3. What was built, mapped to the task's requirements, and what was deliberately left out
4. Architecture in a short paragraph and the folder map, with links to the ADRs
5. How to run the tests
6. Known limitations and what would come next
7. A link to `docs/ai-workflow.md`

## 6. AI workflow write-up

Finish `docs/ai-workflow.md`. Keep it to one compact page of what was **actually used** in this project: fill the phase table from the real issues, pull requests and commits, link them, and delete any row that did not happen.

## 7. Report

Give the user the live URL, the repository URL, what was verified and how, and anything that is not done.
