# Project Memory

## System Overview

**KlikForm** — SaaS form builder platform (Malaysian market). Users create forms, collect responses, generate e-certificates, build QR codes, and shorten URLs.

### Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Google Integration**: OAuth ("Connect with Google") + Manual Service Account keys
- **Payments**: BCL.my webhook-based payment system
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Edge Auth**: `proxy.ts` (renamed from `middleware.ts` per Next.js 16 convention)
- **Deployment**: Vercel
- **Monitoring**: Sentry (currently disabled in `next.config.ts`)

### App Routes
| Route Group | Path | Purpose |
|---|---|---|
| `(auth)` | `/login`, `/register` | Auth pages |
| `(dashboard)` | `/forms`, `/responses`, `/settings`, `/certificates`, `/certificates/builder`, `/qr-builder`, `/shortener` | Main dashboard (sidebar layout) |
| `(public)` | `/form/[id]`, `/check/[formId]`, `/verify/[id]`, `/s/[code]`, `/privacy`, `/terms`, `/about` | Public-facing (no auth) |
| `api` | `/api/auth/google/*`, `/api/cron/*`, `/api/payment/webhook`, `/api/proxy`, `/api/service-email` | API routes |
| `builder` | `/builder/[id]` | Form builder (outside dashboard layout) |
| Root | `/`, `/pricing`, `/refund` | Landing, pricing, refund pages |
| `products` | `/products/forms`, `/products/certificates`, `/products/shortener`, `/products/qr-codes` | Individual product feature pages |

### Key Folders
- **`actions/`** — Server actions: `forms.ts`, `certificates.ts`, `certificate-template.ts`, `qr-codes.ts`, `short-links.ts`, `auth.ts`, `user.ts`, `sheets.ts`
- **`lib/storage/`** — Supabase CRUD: `forms.ts`, `settings.ts`, `certificates.ts`, `qr-codes.ts`, `short-links.ts`, `subscription.ts`
- **`lib/types/`** — TypeScript interfaces: `forms.ts`, `certificates.ts`, `qr-codes.ts`, `subscription.ts`, `common.ts`, `index.ts`
- **`lib/`** — Utilities: `encryption.ts`, `rate-limit.ts`, `navigation.ts`, `email/`, `constants/`, `api/`
- **`components/`** — UI components: `dashboard/` (sidebar, form-card), `ui/` (shadcn), `pricing/`, `pricing-modal.tsx`
- **`utils/supabase/`** — Supabase clients: `client.ts` (browser), `server.ts` (SSR), `admin.ts` (service role)

### Database Tables (Supabase)
| Table | Purpose |
|---|---|
| `forms` | Form definitions (fields, settings, theme, `is_active`, `receive_email_notifications`) |
| `settings` | Google credentials per user (encrypted) |
| `subscriptions` | User tier (free/pro/enterprise), status, period |
| `usage` | Monthly usage tracking (forms created, submissions count) |
| `certificate_templates` | E-cert builder templates |
| `qr_codes` | QR code designs |
| `short_links` | URL shortener data |
| `transactions` | Payment records (BCL webhook) |

### Google Auth — Dual Method
1. **OAuth ("Connect with Google")** — Recommended. One-click auth, stores `googleAccessToken` + `googleRefreshToken` in settings. Auto-refreshes expired tokens.
2. **Manual Service Account** — Advanced. User configures `googleClientEmail` + `googlePrivateKey` in Settings → Service Account tab. Requires manual Google Sheet sharing.
- **Builder logic**: `useManualKeys = !!settings?.googleClientEmail` determines which UI to show.
- **Google Sheet URL input**: Always visible in builder if form has one.
- **Blue instruction box**: Hidden for manual key users (they already configured in Settings).

### Form Submission Flow (`submitFormAction`)
1. Rate limiting check
2. Honeypot detection (`_gotcha` field) — silently rejects bot submissions
3. Server-side validation (with ReDoS protection: 1000-char cap)
4. File uploads → Google Drive (if configured)
5. Send data → Google Sheets (if `googleSheetUrl` set AND credentials exist) — auto-syncs new headers
6. Increment `usage.total_submissions` counter
7. Email notification to form owner (fire-and-forget, gated by `receive_email_notifications`)

## Core Features & Fixes
- **Certificate Verification (e-Sijil)**: `checkCertificateByIC` checks for `googleAccessToken` (OAuth flow) first with auto-refresh, then falls back to Service Account credentials.
- **Mobile Certificate Template Fallback (2026-03-18)**: `getCertificateTemplatePublic()` uses `createAdminClient()` (service role) so RLS policies don't block unauthenticated visitors. `userId` stripped from response to prevent enumeration.
- **Service Account Google Credentials parsing**: `.trim()` and `formatPrivateKey()` applied to prevent trailing space errors.
- **IC Search Robustness**: Google Sheet column regex matches `IC`, `No IC`, `Kad Pengenalan`, etc.
- **Certificate Name Formatting**: Auto-uppercased in `CertificateTemplate` component for consistent ALL CAPS display.
- **IC Input UX**: Removed dashes from placeholder (`901234567890`) since dash-formatting isn't required.
- **Login Layout Optimization**: Compact `/login` UI for 14-inch laptops (down to 643px height) without viewport clipping.

## Rendering System (e-Sijil)
- **PDF/PNG Capture**: `html2canvas-pro` with `onclone` hook moves the off-screen (`top: -9999px`) element into the cloned sandbox only — no visual flash on user's DOM.
- **HD Output**: `scale: 3` for crisp rendering, `image/jpeg` at `0.7` quality with `'FAST'` compression for small file sizes.
- **Sub-pixel White Borders**: Forced `scrollY: 0`, `scrollX: 0` and `+2` overlapping pixels to override rounding gaps.
- **Portrait Orientation**: Dynamically bound `isPortrait` evaluations, proportional percentage constraints, shrinking canvas widths for tall elements.

## Builder Interface
- **NaN Input Prevention**: Number inputs use `Number(val) || 0` fallbacks to prevent `parseInt("") => NaN` crashes.
- **Orientation Persistence**: `width` and `height` added to `handleSave` payload to persist Portrait mode.
- **Auto-Save Indicator**: Debounced `useEffect` shows real-time `Menyimpan...` → `Tersimpan di awan` in sticky header.
- **Joyride Onboarding**: 5-step `react-joyride` tour (auto-plays once via `localStorage`). Sticky header dynamically downgraded to `z-0` while tour active. `scrollOffset: 150` mapped per-step (V3 requirement).

## Dashboard — Responses Tab
- Lists all user forms with Google Sheet links and "Open Sheet" / "Create Sheet" buttons.
- "Create Sheet" only for OAuth users (`hasGoogleOAuth` prop). Calls `createSheetForFormAction` which uses OAuth access token + handles refresh.
- Builder's blue instruction box hidden for manual key users.

## Public Form (Respondent UX)
- **Dynamic Progress Bar**: Top-edge bar + floating `X / Y Terjawab` badge.
- **Smart Auto-Scroll**: Typeform-style scroll-to-next on Radio/Rating selection.
- **Live Countdown Timer**: If `attendanceSettings.endTime` set, sticky red badge counts down then auto-locks form.
- **WhatsApp Share**: Toggle in Builder (`whatsappShareEnabled` + `whatsappShareMessage`); button on Thank You page using `wa.me` API.
- **Honeypot Anti-Bot**: Invisible `_gotcha` field; submissions with it filled return fake success.
- **Form Active/Inactive**: `is_active` boolean column + Builder toggle. Public form renders "Borang Ditutup" lock screen when off.

## Login Page
- **Hydration Mismatch Fix**: `mounted` state + `value={mounted ? activeTab : 'login'}` so server and client render the same initial Radix Tabs value.

## Security Posture (audit through 2026-04-02)
- All dashboard routes auth-gated via `getUser()` + RLS (`user_id` filter).
- `/api/service-email` requires authentication, returns 401 if not logged in.
- `submitFormAction`: IP-based rate limiting + server-side validation + quota check.
- `/api/proxy` domain whitelist (Google domains only).
- Builder ownership check (`user.id !== form.userId`).
- Public payloads strip sensitive tokens (`googleSheetUrl: undefined` to public clients).
- Sheet Injection Shield: `=`, `+`, `-`, `@` prefixed inputs forced to plaintext via `lib/api/google-sheets.ts`.
- ReDoS Protection: text strings capped at 1000 chars before regex.
- `getCertificateTemplatePublic` strips `userId` to prevent enumeration.
- `qr-codes.ts` `.ilike()` escapes `%`, `_`, `\`.
- `inactivity-check/route.ts` doesn't leak `String(error)` in response (server-side log only).
- `/api/auth/callback` validates `next` param to prevent open redirects (`//evil.com`).
- `lib/storage/short-links.ts` uses `maxShortLinks` from `TIER_LIMITS` (free: 5, pro/enterprise: -1).
- `components/certificate-qr-card.tsx` uses client-side `qrcode.react` (zero external API).
- BCL webhook signature verified via HMAC-SHA256.
- Public forms `dangerouslySetInnerHTML` sanitized.
- Open Redirects in `proxy.ts` validated (only relative paths accepted).
- `transactions` RLS policies tightened.
- CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy headers in `next.config.ts`.

## System Improvements Timeline
- **2026-02-24** — Loading skeletons, email notification on submission, auto-create Google Sheet (OAuth), Settings/Shortener mobile fixes, hydration suppress, landing page English translation.
- **2026-02-25** — Corporate `/about` page, 4 product pages (`/products/*`), gradient slowmo (8s), descender clipping fix (`pb-4`), email notification toggle, RLS performance indexes (`20260225154753_add_rls_performance_indexes.sql`), critical 42P01 fix (production schema sync + trigger `search_path` reset).
- **2026-02-26** — Final security release; production build clean, 0 errors.
- **2026-02-28** — Pricing page features synced with pricing modal; plan card layout fix.
- **2026-03-27** — Certificate creation infinite loading fix (Server Action returns structured `{ success, id }` JSON; redirect moved client-side via `useRouter().push()`).
- **2026-04-02** — Dynamic Google Sheet header syncing (auto-append missing headers); certificate verification by Email or IC (auto-detects `@` symbol); pricing sync (free tier honestly shows limited Pro features); Pro 50% promo (`RM 5 → RM 10`); BCL webhook plugged into Resend (`getPaymentSuccessEmail`, `getWelcomeProEmail`).
- **2026-04-17** — Form Builder Joyride onboarding, drag-and-drop UX polish, `is_active` toggle, honeypot anti-bot, WhatsApp share, auto-save indicator, public form progress bar + auto-scroll + countdown timer.
- **2026-05-28** — System cleanup pass:
  - ESLint warnings cleared (unused `getSubscription` import in `lib/storage/short-links.ts`; `<img>` annotation in `app/(public)/form/[id]/client.tsx` for proxied user-uploaded images).
  - Migrated `middleware.ts` → `proxy.ts` (Next.js 16 file convention). Function renamed `middleware` → `proxy`. Build now passes without deprecation warning. Earlier failed migration was due to misconfiguration, not platform support — `proxy.ts` IS supported by Next.js 16.

## System Improvements (2026-05-29)
- **Dependency cleanup**:
  - Removed `@prisma/client` (project uses Supabase, Prisma was unused dead weight).
  - Replaced `radix-ui` umbrella package with individual `@radix-ui/react-alert-dialog` and `@radix-ui/react-navigation-menu` (better tree-shaking; both files in `components/ui/` updated). All other Radix imports were already individual.
  - Pinned `next` from `^16.1.6` → `16.2.6` (exact pin) to control major-framework drift. The version bump also addresses postcss XSS + Next HTTP request smuggling advisories.
  - Stale CLI output artifacts (`build-log.txt`, `build_output.txt`, `lint_output.txt`, `tsc_output.txt`) added to `.gitignore` and removed from tracking. (`lint_output.txt` had been leaking a previous developer's path: `C:/Users/wanzo/...`.)
- **Test framework**: Added Vitest (`npm test`, `npm run test:watch`) with `vitest.config.ts` and 26 passing tests across 4 suites:
  - `tests/tier-limits.test.ts` — tier semantic correctness + `canCreateMore()` gating logic.
  - `tests/open-redirect.test.ts` — `getSafeRedirectPath()` rejects `//evil.com`, `https://`, `javascript:`, etc.
  - `tests/webhook-signature.test.ts` — BCL HMAC verification (timing-safe, tampered body, wrong secret, malformed sig).
  - `tests/sheet-injection.test.ts` — formula-injection guard (`=`, `+`, `-`, `@`).
- **Rate limiter consolidation**: Three duplicated in-memory rate-limit Maps (one in `actions/forms.ts`, one in `actions/certificates.ts`, one in `lib/rate-limit.ts`) collapsed into a single `lib/rate-limit.ts`. New API: `await checkRateLimit(ip, RATE_LIMITS.formSubmission, 'form-submit')`. Added optional Upstash Redis backend (auto-detected via `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`; falls back to in-memory if `@upstash/redis` not installed). Dynamic import via runtime string keeps `@upstash/redis` truly optional — TypeScript build doesn't complain when uninstalled.
- **Sentry re-enabled conditionally**: `next.config.ts` now wraps with `withSentryConfig` only when both `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` are present. Previously was hard-disabled (`export default nextConfig`) for Vercel build debugging. `sentry.{client,server,edge}.config.ts` only call `Sentry.init()` when DSN is set, and use 10% trace sampling in production (was 100%).
- **README.md**: Replaced default Next.js boilerplate with proper docs covering tech stack, env vars, DB setup, scripts, architecture, security posture, and deployment.
- **Trigger `search_path` proper fix** (`supabase/migrations/20260529000000_fix_trigger_search_path.sql`): Re-creates `generate_short_code`, `handle_new_user`, `get_email_by_username` with explicit `public.` schema-qualified table references AND `SET search_path = ''`. This eliminates the Supabase Security Advisor "mutable search path" warning while keeping triggers functional. Apply via `supabase db push` then run `NOTIFY pgrst, 'reload schema'` (the migration includes this NOTIFY).
- **Build state**: lint 0 warnings, 26/26 tests pass, production build clean (Next 16.2.6, Turbopack, 41 routes).

## Outstanding Optional Work
- 2 moderate-severity advisories remain (postcss XSS in Next-bundled postcss). Not exploitable in our usage (no user-supplied CSS parsing); awaiting upstream Next patch.
- Fasa B pending (multi-page forms, audit log, respondent email notify, PDPA toolkit). Fasa C pending (custom domain, workspaces, payments-in-form, templates gallery, AI generator, backup).

## System Improvements (2026-05-29 — Fasa 3 Analytics)
- **Form Analytics Dashboard** shipped:
  - Migration `supabase/migrations/20260529001000_add_form_events.sql` — new `form_events` table tracking `view`, `start`, `field_focus`, `submit`, `abandon` events. RLS enforces owner-only SELECT; INSERTs go through service role. Indexes on `(form_id, created_at DESC)`, `user_id`, and partial index on `visitor_hash` (for unique counts). Includes `prune_form_events()` SECURITY DEFINER function for 180-day retention.
  - Privacy: visitor IPs hashed via SHA-256 + daily-rotating salt (`ANALYTICS_HASH_SECRET`), so unique-visitor counts are accurate per day but no long-term tracking. User-Agent reduced to coarse device family (mobile/tablet/desktop/bot/unknown). No raw PII stored.
  - **Pure aggregation** in `lib/analytics/aggregate.ts` (sync, deterministic, fully unit-tested) — kept separate from `actions/analytics.ts` because Server Action modules require all exports to be async AND can't re-export types under Next.js 16 + Turbopack.
  - Server actions in `actions/analytics.ts`: `trackFormEvent` (rate-limited 100/min/IP via the `analytics` bucket; uses admin client to bypass RLS for anonymous writes; looks up form owner once and denormalises `user_id` onto each event row); `getFormAnalytics` (RLS-enforced owner-only fetch + aggregation).
  - Client hook `hooks/use-form-tracking.ts`: stable per-tab session id in `sessionStorage`; fires `view` once on mount, `start` on first field interaction, `field_focus` (deduped per field per session), `submit` on success, `abandon` on `pagehide` if user never submitted. All calls fire-and-forget — analytics never blocks the form.
  - Wired to public form via `onFocusCapture` on each field container in `app/(public)/form/[id]/client.tsx` and `trackSubmit()` after successful submission.
  - Dashboard at `app/(dashboard)/responses/[id]/analytics/`: page (server, ownership check + RLS double-check) + client (4 stat cards, 3 rate cards, 30-day daily chart, devices split, top-8 field engagement). Empty state when no data.
  - "Analytics" button added to each form card in `app/(dashboard)/responses/client.tsx`.
- **Tests**: added `tests/analytics.test.ts` — 10 tests covering aggregation correctness (zero state, view/start/submit/abandon counting, unique visitor dedup, conversion + completion rate math, average submit duration, field engagement sort order, device split, daily bucket placement). Total now 36/36 pass.
- **Build state**: lint 0 warnings, 36/36 tests pass, production build clean (Next 16.2.6, Turbopack, ~42 routes).

## System Improvements (2026-05-29 — Fasa A Quick Wins)
Five new product features shipped in one pass. All bebas-konflik dengan kerja sedia ada.

### 1. Conditional Logic (multi-rule)
- `lib/types/forms.ts` — `ConditionalConfig` extended with `rules[]` + `logic: 'all' | 'any'`. Legacy `{ fieldId, value }` shape still supported for backward compat (normalized at runtime).
- `lib/forms/conditions.ts` — pure evaluator: `evaluateConditional()`, `evaluateRule()`, `normalizeConditional()`. Operators: `equals`, `not_equals`, `contains`, `not_contains`, `is_empty`, `is_not_empty`, `gt`, `lt`. Coerces arrays/dates safely. Fails-open (visible) when a rule references a deleted field.
- `components/forms/fields-editor/index.tsx` — new `<ConditionalLogicEditor>` component with multi-rule editor, AND/OR toggle, dynamic operator → value input handling.
- `app/(public)/form/[id]/client.tsx` — `isFieldVisible` rewired to use the pure evaluator.
- Tests: `tests/conditional-logic.test.ts` — 17 tests (legacy compat, every operator, all/any logic, missing-field safety, array coercion).

### 2. Outgoing Webhooks
- Migration `supabase/migrations/20260529030000_add_form_webhooks.sql` — `form_webhooks` (id, form_id, user_id, url, secret_encrypted, events[], enabled, last_status, last_error, last_fired_at). Owner-only RLS. `updated_at` trigger with schema-qualified `public.` references and `SET search_path = ''` (per Security Advisor lesson).
- `lib/types/webhooks.ts` — `FormWebhook` and `WebhookSubmissionPayload` types.
- `lib/webhooks/dispatch.ts` — `signPayload`, `verifySignature` (timing-safe), `dispatchWebhook` (5s timeout, max 3 attempts, exponential backoff, 4xx short-circuits, 5xx + network errors retry). Header `x-klikform-signature` (HMAC-SHA256 hex). Unit-test injects `fetchImpl` + `sleepImpl`.
- `lib/storage/webhooks.ts` — CRUD: `listWebhooksForForm` (masked secret), `listWebhooksForDispatch` (admin client, decrypted, scoped by `form_id` AND `user_id`), `createWebhook`, `updateWebhook`, `deleteWebhook`, `recordWebhookResult`. Secrets encrypted via `lib/encryption.ts` (AES-256-CBC).
- `actions/webhooks.ts` — Zod-validated server actions: `listWebhooksAction`, `createWebhookAction`, `updateWebhookAction`, `deleteWebhookAction`, `testWebhookAction` (single-attempt, 5s timeout for fast feedback). **Note**: `z.ZodError` exposes `.issues[]`, not `.errors[]` in zod v4.
- `actions/forms.ts` — `submitFormAction` dispatches enabled webhooks in parallel after `incrementSubmissionCount`. Failures never bubble.
- `components/forms/webhooks-card.tsx` — Builder UI: list, add (URL + auto-generated 32-hex secret), enable/disable toggle, test fire, secret rotation, delete. Last-status indicator (green/red) + relative timestamp.
- Mounted in `app/builder/[id]/client.tsx` between Attendance card and Form Fields list.
- Tests: `tests/webhook-dispatch.test.ts` — 9 tests (signature stability, tamper rejection, wrong secret, malformed sig, single 4xx call, 3× 5xx retry, network-error recovery).

### 3. Response Edit Link (magic link)
- Migration `supabase/migrations/20260529040000_add_response_edit_tokens.sql` — `response_edit_tokens` (token unique, form_id, user_id, submission_id uuid, email, snapshot jsonb, expires_at, used_at). Owner-only RLS for SELECT (dashboard audit). Public path uses admin client scoped by token. `forms.edit_link_settings` jsonb column added (instead of three new flat columns).
- `lib/types/forms.ts` — `EditLinkSettings { enabled, expiryDays, emailFieldId? }`.
- `lib/storage/edit-tokens.ts` — `generateEditToken()` (64 hex chars from `randomBytes(32)`), `createEditToken()`, `getEditToken()` (returns reason: not_found / used / expired), `markEditTokenUsed()` (single-use semantics).
- `lib/email/index.ts` — `getEditLinkEmail(formTitle, editUrl, expiryDays)` template (sky-blue gradient, single-use warning).
- `lib/api/google-sheets.ts` — added `updateSheetRow(config, matchColumn, matchValue, data)` to update an existing Sheet row by hidden `_submission_id` column.
- `actions/forms.ts` — `submitFormAction` now generates `submissionId = uuidv4()` upfront, injects `dbData._submission_id`, then (if `editLinkSettings.enabled` + valid email) creates the token and emails the magic link. Origin resolved from `headers().origin` then `NEXT_PUBLIC_APP_URL` fallback.
- `actions/edit-response.ts` — `loadEditableResponse(token)` + `submitEditedResponseAction(token, formData)`. Uses `updateSheetRow` to rewrite the matched row, then marks token used. Skips file uploads (would orphan previous Drive files), webhooks, and owner-notification email — edits are deliberately quieter than new submissions. Reuses validation rules from `submitFormAction`.
- New route `app/(public)/edit/[token]/page.tsx` — re-renders `PublicFormClient` with `editMode={token}` + prefilled `initialValues` (re-keyed from label → field id). Renders block-screen card on invalid/expired/used tokens. `metadata.robots: { index: false, follow: false }` so search engines never crawl edit URLs.
- `app/(public)/form/[id]/client.tsx` — `PublicFormClient` extended with optional `editMode` and `initialValues` props. Analytics tracking disabled in edit mode (no fake `view`/`submit`). Submit branch picks the right action based on mode.
- `components/forms/edit-link-card.tsx` — Builder UI: master toggle, email-field selector (only `type === 'email'` fields), expiry-days input (1-365 clamp). Yellow warning when no email field exists yet.
- Mounted in builder right after Webhooks card.
- Tests: `tests/edit-token.test.ts` — 6 tests (token format, uniqueness, expiry math, email regex). DB-touching paths (createEditToken, getEditToken) covered by integration in production.

### 4. Bulk Certificate Generation (CSV → ZIP)
- `lib/csv/parse.ts` — minimal hand-rolled CSV parser. Handles BOM, CRLF, quoted commas, escaped `""`, embedded newlines, blank lines. Exports `parseCSV()` + `pickField()` (case-insensitive header lookup with candidate aliases).
- `lib/certificates/render.ts` — extracted shared rendering helpers from `app/(public)/check/[formId]/client.tsx`: `captureToCanvas(el, opts)` (html2canvas-pro, scale 3, `onclone` sandbox trick for hidden element), `canvasToPngBlob`, `canvasToPdfBlob`, `safeFilename`. Reusable across single + bulk flows.
- `app/(dashboard)/certificates/builder/[id]/bulk/page.tsx` + `client.tsx` — new dashboard route. Workflow: upload CSV (5MB cap) → auto-detect column mappings (name/program/date/IC) → user confirms or remaps → choose PNG/PDF → progress bar drives a per-row render-then-zip loop using `JSZip` (already in deps). Hidden full-size renderer mounts at `top: -9999px` and is captured via the same `onclone` sandbox technique. Two `requestAnimationFrame` waits before capture so React commits + browser paints first.
- "Bulk generate" sparkles icon button added to every `<CertificateTemplateCard>` linking to the new route.
- Tests: `tests/csv-parse.test.ts` — 13 tests (empty, simple, CRLF, BOM, blank lines, trailing-empty cells, quoted-with-comma, escaped quotes, embedded newlines, pickField case-insensitive + alias fallthrough + empty cell skip).

### 5. Cross-form Analytics Widget
- `lib/analytics/aggregate.ts` — added `aggregateUserAnalytics(rows, days)` + `UserAnalyticsRow` / `UserAnalyticsSummary` types. Pure: total views/submits, unique visitors, conv rate, top 5 forms (by submits with views as tiebreaker), 30-day daily totals.
- `actions/analytics.ts` — added `getUserAnalyticsSummary(days)` — RLS auto-restricts to caller's own forms; defensively `eq('user_id', user.id)` anyway.
- `components/dashboard/cross-form-analytics.tsx` — server component: 4 stat cards (Views, Unique visitors, Submits, Conv rate), 30-day sparkline (CSS-only, hover tooltip), top-3 forms list (each linking to per-form analytics page). Silently renders nothing when `totalViews === 0` so empty dashboards stay clean.
- Mounted in `app/(dashboard)/forms/page.tsx` between `<DashboardStats>` and the page header.
- Tests: `tests/cross-form-analytics.test.ts` — 6 tests (empty state, counting, top-form ranking + tiebreaker, 5-cap, daily bucket placement, out-of-window events drop from daily but stay in totals).

### Infrastructure / cross-cutting
- `vitest.config.ts` — added `'server-only'` alias to `tests/__mocks__/server-only.ts` (empty stub) so unit tests can import server-tagged modules without the real package's "RSC only" throw.
- New zod usage uses `.issues[]` (zod v4) not `.errors[]`.
- `lib/types/index.ts` — re-exports `ConditionOperator`, `ConditionRule`, `EditLinkSettings`.

### Build state
- `npm run lint` — 0 warnings.
- `npm test` — 87/87 pass across 10 suites (was 36/36).
- `npm run build` — clean, 43 routes (was ~42; +`/edit/[token]` and `/certificates/builder/[id]/bulk`).

### Files added (Fasa A)
```
actions/edit-response.ts
actions/webhooks.ts
app/(dashboard)/certificates/builder/[id]/bulk/client.tsx
app/(dashboard)/certificates/builder/[id]/bulk/page.tsx
app/(public)/edit/[token]/page.tsx
components/dashboard/cross-form-analytics.tsx
components/forms/edit-link-card.tsx
components/forms/webhooks-card.tsx
lib/certificates/render.ts
lib/csv/parse.ts
lib/forms/conditions.ts
lib/storage/edit-tokens.ts
lib/storage/webhooks.ts
lib/types/webhooks.ts
lib/webhooks/dispatch.ts
supabase/migrations/20260529030000_add_form_webhooks.sql
supabase/migrations/20260529040000_add_response_edit_tokens.sql
tests/__mocks__/server-only.ts
tests/conditional-logic.test.ts
tests/cross-form-analytics.test.ts
tests/csv-parse.test.ts
tests/edit-token.test.ts
tests/webhook-dispatch.test.ts
task.md
```
