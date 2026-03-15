# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npx vitest           # Run all tests
npx vitest tests/lib/plans.test.ts  # Run a single test file
npm run email:dev    # React Email preview server
npm run ngrok        # Expose localhost:3000 for webhook testing
npm run stripe       # Stripe webhook listener (local dev)
```

## Architecture Overview

This is a **B2B SaaS restaurant management platform** built with Next.js 15 App Router, Supabase (PostgreSQL + Auth), and TypeScript.

### Multi-tenancy Model

```
Organization → Locations (sites) → [Menus, Bookings, Orders, Customers, etc.]
```

Users belong to an organization and can access one or more locations. RLS (Row-Level Security) enforces data isolation at the database level.

### Route Groups

| Group | Purpose |
|---|---|
| `app/(private)/(org)/` | Organization-level management (billing, collaborators, promotions) |
| `app/(private)/(site)/` | Location-level management (menus, reservations, analytics, settings) |
| `app/(private)/home/` | Dashboard home |
| `app/(admin)/` | Superadmin only |
| `app/(auth)/` | Login, register |
| `app/p/[locationSlug]/` | Public booking page |
| `app/m/[locationSlug]/[menuId]/` | Public menu page |
| `app/order/[locationSlug]/[tableId]/` | Public order page |

### Server Actions Pattern

All mutations go through Server Actions in `app/actions/`. They always return `ActionResult<T>` from `lib/action-response.ts`:

```typescript
import { ok, okWith, fail, type ActionResult } from "@/lib/action-response";

export async function doSomething(): Promise<ActionResult> {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return fail("Failed to delete item");
  revalidatePath(PATHS.SETTINGS);
  return ok();
}
```

Never throw in server actions — use `fail()`. Reserve throwing for webhook handlers and Trigger.dev tasks, where you use the custom error classes from `lib/errors.ts` (`NotFoundError`, `UnauthorizedError`, `UsageLimitError`, `ExternalServiceError`, `ValidationError`).

### Auth Context

Every server action or RSC that needs the current user calls `getAuthContext()` from `lib/auth.ts`:

```typescript
const { supabase, user, organizationId, organization, locations } = await getAuthContext();
```

This is the canonical way to get auth + org context. It throws if unauthenticated.

### Key Libraries

| Path | Purpose |
|---|---|
| `lib/auth.ts` | `getAuthContext()` — auth + org lookup for server actions |
| `lib/action-response.ts` | `ok()`, `okWith()`, `fail()` — server action response builders |
| `lib/errors.ts` | Custom error hierarchy for webhooks/background jobs |
| `lib/routes.tsx` | Sidebar nav structure and route definitions |
| `lib/plans.ts` | Subscription plan feature gates |
| `lib/queries/` | Reusable database query builders |
| `lib/validators/` | Input validation schemas |
| `lib/form-parsers.ts` | Type-safe FormData extraction |
| `lib/analytics/` | Analytics query and aggregation utilities |
| `utils/supabase/server.ts` | Server-side Supabase client |
| `utils/supabase/client.ts` | Client-side Supabase client |

### External Integrations

- **Stripe** — subscriptions, webhooks at `app/api/webhooks/stripe/`
- **Telnyx** — phone number purchasing, voice calls, webhooks at `app/api/webhooks/telnyx/`
- **WhatsApp Business API** — messaging, auto-reply bot, webhooks at `app/api/webhooks/whatsapp/`
- **Trigger.dev** — background jobs in `/trigger/` (booking verification, auto-replies, review requests)
- **OpenAI** — bot responses and content generation
- **Resend** — transactional emails via React Email templates in `/emails/`
- **Upstash Redis** — rate limiting (`lib/ratelimit.ts`) and feature limits (`lib/limiter.ts`)

### Database Migrations

Migrations live in `utils/supabase/migrations/`. The full schema is in `utils/supabase/sql/db.sql`. Run migrations via the Supabase CLI.

### State Management

- **Zustand** — client-side global state (location switcher store)
- **SWR** — client-side data fetching with revalidation
- **React Context** — org data, page title, nav state (`components/providers/`)
- No Redux; prefer server state via RSC + server actions over client state

### Testing

Tests live in `/tests/` mirroring the source structure. Uses Vitest + JSDOM + `@testing-library/react`. The `@` alias resolves to the repo root (matching tsconfig).
