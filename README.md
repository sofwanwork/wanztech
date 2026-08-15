# KlikForm

SaaS form builder platform for the Malaysian market. Create forms, collect responses to Google Sheets, generate e-certificates, build branded QR codes, and shorten URLs — all from a single dashboard.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database / Auth**: Supabase (PostgreSQL + RLS)
- **Edge Auth**: `proxy.ts` (Next.js 16 file convention)
- **Payments**: BCL.my (HMAC-signed webhooks)
- **Google Integration**: OAuth 2.0 + Manual Service Account (dual flow)
- **Email**: Resend
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Monitoring**: Sentry (optional, gated by env)
- **Rate limiting**: In-memory by default, optional Upstash Redis for multi-region
- **Tests**: Vitest

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev
```

App runs at http://localhost:3000.

## Required Environment Variables

See `.env.local.example` for the canonical list. At minimum:

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-only, bypasses RLS) |
| `RESEND_API_KEY` | Email delivery |
| `RESEND_FROM_EMAIL` | Verified sender address |
| `BCL_WEBHOOK_SECRET` | HMAC-SHA256 secret for BCL payment webhook |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting Google credentials in DB |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` | "Connect with Google" OAuth flow |

Optional:

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Enable Sentry. Build only wraps with Sentry when DSN + auth token are present. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Switch rate limiter from in-memory to Upstash. Requires `npm i @upstash/redis`. |

## Database Setup

Migrations live in `supabase/migrations/`. Apply them via the Supabase CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

Tables: `forms`, `settings`, `subscriptions`, `usage`, `certificate_templates`, `qr_codes`, `short_links`, `transactions`, `form_events`, `form_webhooks`, `response_edit_tokens`, `audit_logs`, `form_responses`.

> `form_responses` is the durable local copy of every submission (write-first). Google Sheets is synced asynchronously from it via `after()` + the `/api/cron/sync-responses` retry cron — a Sheets outage never loses a response.

## Scripts

```bash
npm run dev          # Local dev (Turbopack)
npm run build        # Production build
npm start            # Run built output
npm run lint         # ESLint
npm run lint:fix     # ESLint with autofix
npm run format       # Prettier
npm run typecheck    # tsc --noEmit
npm test             # Vitest suite
npm run test:watch   # Vitest watch mode
```

CI (`.github/workflows/ci.yml`) runs lint → typecheck → test → build on every push/PR to `master`.

## Architecture

```
actions/        Server actions (forms, certificates, QR, short-links, etc.)
app/            App Router routes — (auth), (dashboard), (public), api, builder
components/     UI components (dashboard sidebar, shadcn/ui, pricing, etc.)
features/       Feature-specific modules
hooks/          Reusable React hooks
lib/
  api/          External integrations (Google Sheets, Drive)
  constants/    Tier limits, pricing, etc.
  email/        Resend templates
  storage/      Supabase CRUD per resource
  types/        Shared TypeScript types
  encryption.ts AES-256-GCM helpers for storing Google creds
  rate-limit.ts In-memory + optional Upstash Redis limiter
  utils.ts      sanitizeHtml, etc.
proxy.ts        Edge auth (Next.js 16 — replaces middleware.ts)
supabase/       SQL migrations
tests/          Vitest test files
utils/supabase/ Supabase client factories — client / server / admin
```

## Security Posture

- All dashboard routes auth-gated via `getUser()` + Supabase RLS (`user_id` filter).
- BCL webhook verified via HMAC-SHA256 with timing-safe comparison (`app/api/payment/webhook/route.ts`), **idempotent** via `transactions.processed_at` (replays return 200 without re-granting), and uses the service-role client (provider webhooks carry no user session).
- Form submissions: IP rate limit + honeypot (`_gotcha`) + ReDoS protection (1000-char text cap) + client-generated idempotency key (`_submission_key`) so double-submits are swallowed server-side.
- Responses are written to `form_responses` (DB) FIRST, then synced to Google Sheets asynchronously (`after()` + retry cron) — no data loss on Sheets failure.
- Form submissions: IP rate limit + honeypot (`_gotcha`) + ReDoS protection (1000-char text cap).
- Google Sheets formula injection guard (`=`, `+`, `-`, `@` prefixed inputs forced to plaintext).
- Open redirect guards in `proxy.ts` and `/api/auth/callback` (relative paths only).
- Public certificate template endpoint strips `userId` from response.
- `ilike()` queries escape `%`, `_`, `\`.
- CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers in `next.config.ts`.
- Cron error responses hardened (no `String(error)` leaks; server-side log only).

## Deployment

Deployed on Vercel. The `proxy.ts` runs at the edge globally; API routes default to Node.js runtime. Sentry source-map upload is gated on `SENTRY_AUTH_TOKEN` being present in CI to keep PR previews fast.

## Contributing

Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).

Before pushing:

```bash
npm run lint
npm test
npm run build
```
