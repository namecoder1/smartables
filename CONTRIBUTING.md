# Contributing

## Setup

```bash
cp .env.example .env.local  # fill in required vars
npm install
npm run dev
```

## Workflow

1. Branch from `main`: `git checkout -b feat/your-feature`
2. Make changes, run checks: `npm run lint && npx vitest`
3. Open a PR — CI runs tsc + lint + vitest + build automatically

## Code Conventions

- **Server actions** always return `ActionResult<T>` via `ok()` / `fail()` — never throw.
- **Webhooks & Trigger.dev tasks** throw typed errors from `lib/errors.ts`.
- Auth in server actions → `requireAuth()`. Auth in RSC pages → `getAuthContext()`.
- New public endpoints must go through rate limiting (`lib/ratelimit.ts`).
- Add `captureError` / `captureCritical` on every external-service call that can fail.

## Testing

```bash
npx vitest                        # all tests
npx vitest tests/lib/plans.test.ts  # single file
npx vitest --coverage             # with coverage report
```

Tests live in `/tests/` mirroring the source tree.

## Environment Variables

See `.env.example` for all required and optional variables with descriptions.

## Database Migrations

Migrations: `utils/supabase/migrations/`. Full schema: `utils/supabase/sql/db.sql`.
Apply via the Supabase CLI: `supabase db push`.

## Reporting Vulnerabilities

See [SECURITY.md](./SECURITY.md).
