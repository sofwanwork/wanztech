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

## System Improvements (2026-06-05 — Bug Fixes: Account Creation, OAuth Form Creation & Forms Save Trigger)
- **Account Creation Database Error**: Fixed a critical database error during user signup. The `handle_new_user()` trigger function on `auth.users` attempted to seed the `usage` table using the incorrect column name `total_forms` (should be `forms_created`) and omitted the `NOT NULL` column `month`, which caused the database transactions to abort. Created migration `supabase/migrations/20260605000000_fix_handle_new_user_trigger.sql` to resolve this.
- **Form Creation Block for OAuth Users**: Fixed a bug where users who connected their Google Account via Google OAuth ("Connect with Google") were blocked from creating a form and redirected back to Settings. The check in `createFormAction` in `actions/forms.ts` strictly demanded manual service account keys (`googleClientEmail` + `googlePrivateKey`). Rewrote the validation to allow form creation if either OAuth (`googleAccessToken` exists) or Service Account credentials exist.
- **Forms Save Trigger Error**: Fixed a 500 server error when creating/saving a form. The database trigger on the `forms` table executed the `generate_short_code` function, which had been modified to reference `NEW.slug` (for URL shortener links) instead of `NEW.short_code`, causing a `record "new" has no field "slug"` database abort. Created migration `supabase/migrations/20260605001000_fix_forms_short_code_trigger.sql` to separate the forms trigger function (`generate_form_short_code`) from the shortener trigger function.

### Build state
- `npm run lint` — 0 warnings.
- `npm test` — 87/87 pass across 10 suites.
- `npm run build` — clean, 43 routes.

### Files added / modified
- **Modified**: `actions/forms.ts`
- **Added**: `supabase/migrations/20260605000000_fix_handle_new_user_trigger.sql`, `supabase/migrations/20260605001000_fix_forms_short_code_trigger.sql`

### Production Deployment
- **Date**: 2026-06-05
- **Method**: Vercel CLI (`npx vercel --prod --yes`)
- **Production URL**: `https://www.klikform.com`
- **Deployment URL**: `https://klikform-7hnfgvwlr-sofwan-jailanis-projects.vercel.app`

## System Improvements (2026-06-07 — Production Load Speed Optimizations)
- **Vercel Serverless Region Optimization**: Ditetapkan region Singapore (`sin1`) di dalam `vercel.json` untuk menghapuskan latensi database (~250ms) dengan pelayan database Supabase.
- **Halaman Pemasaran Statik (SSG)**: 
  - Halaman `/`, `/pricing`, `/about`, `/products/forms`, `/products/certificates`, `/products/qr-codes`, `/products/shortener` ditukarkan daripada `ƒ (Dynamic)` kepada `○ (Static)`.
  - Mengalihkan logik auth checking ke klien-side di bawah komponen klien baharu `components/landing-header-auth.tsx` bagi mengelakkan halaman-halaman pemasaran tersebut tersekat di pelayan.
  - Membetulkan amaran linter `Unexpected any` dan `useEffect react-hooks/exhaustive-deps` di dalam `components/pricing/plan-card.tsx` dengan menyusun dependencies array [initialUser, plan] dan mengimport jenis `User` dari `@supabase/supabase-js`.
- **Pemasangan `@upstash/redis`**: Memasang pakej kebergantian `@upstash/redis` dalam `package.json` untuk menyokong rate limiting tanpa ralat amaran import dinamik.

### Build state
- `npm run lint` — 0 warnings.
- `npm test` — 87/87 pass across 10 suites.
- `npm run build` — clean, 43 routes (semua halaman pemasaran kini static ○).

### Files added / modified
- **Modified**: `vercel.json`, `package.json`, `app/page.tsx`, `app/pricing/page.tsx`, `app/about/page.tsx`, `app/products/forms/page.tsx`, `app/products/certificates/page.tsx`, `app/products/qr-codes/page.tsx`, `app/products/shortener/page.tsx`, `components/pricing/plan-card.tsx`
- **Added**: `components/landing-header-auth.tsx`







## System Improvements (2026-06-07 — Fasa B mula: Notifikasi Emel Responden)
- **Respondent Confirmation Email** dihantar — auto-acknowledgement kepada *responden* (berasingan daripada notifikasi pemilik yang dikawal `receiveEmailNotifications`).
  - Type baharu `RespondentNotificationSettings { enabled, emailFieldId?, message?, includeSummary? }` di `lib/types/forms.ts`; ditambah ke `Form` + re-export di `lib/types/index.ts`.
  - Migration `supabase/migrations/20260607010000_add_respondent_notification.sql` — lajur `respondent_notification jsonb` pada `forms` + `NOTIFY pgrst, 'reload schema'`.
  - Pemetaan storage `lib/storage/forms.ts`: `respondent_notification` ↔ `respondentNotification` (2× fromRow getFormById/getFormByShortCode + 1× toRow saveForm).
  - Template `getRespondentConfirmationEmail(formTitle, message?, summary?)` di `lib/email/index.ts` (tema hijau emerald untuk bezakan daripada edit-link biru). Tambah helper `escapeHtml()` — semua nilai responden (title, mesej, ringkasan) di-escape untuk halang HTML injection. Ringkasan dicap 12 baris.
  - Hook fire-and-forget dalam `submitFormAction` (`actions/forms.ts`) selepas blok edit-link. Resolusi emel guna `field.label` sebagai kunci `dbData` (sama macam edit-link). Ringkasan tapis kunci prefix `_` (cth `_submission_id`).
  - UI builder `components/forms/respondent-notification-card.tsx` (cermin `EditLinkCard`): toggle, pemilih medan emel, textarea mesej tersuai (1000 char), toggle sertakan ringkasan. Mount di `app/builder/[id]/client.tsx` selepas `EditLinkCard`.
  - Tests `tests/respondent-notification.test.ts` — 7 tests (subjek, mesej lalai vs tersuai, ringkasan on/off, HTML escaping anti-injection, cap 12 baris).
- **Nota teknikal**: `getNewSubmissionEmail` (notifikasi pemilik) masih TIDAK escape input pengguna — potensi HTML injection dalam emel pemilik. Belum dibaiki (luar skop pass ini); calon pembaikan keselamatan berasingan.

### Build state
- `npm run lint` — 0 warnings.
- `npm test` — 94/94 pass across 11 suites (was 87/87).
- `npm run build` — clean, 43 routes.

### Files added / modified
- **Added**: `components/forms/respondent-notification-card.tsx`, `supabase/migrations/20260607010000_add_respondent_notification.sql`, `tests/respondent-notification.test.ts`
- **Modified**: `lib/types/forms.ts`, `lib/types/index.ts`, `lib/storage/forms.ts`, `lib/email/index.ts`, `actions/forms.ts`, `app/builder/[id]/client.tsx`


## System Improvements (2026-06-07 — Fasa B sambung: Email escaping + PDPA + Audit Log + Multi-page)
Empat track dihantar dalam satu pass. Lint 0, 121/121 tests (14 suites), build clean 44 routes.

### Track 0 — Email HTML escaping (keselamatan)
- `lib/email/index.ts`: `escapeHtml()` (function declaration, hoisted) kini diguna merentas `getNewSubmissionEmail` (userName, formTitle, submissionData key+value, googleSheetUrl href), `getEditLinkEmail` (formTitle ×2), dan `getRespondentConfirmationEmail`. Tutup vektor HTML/markup injection daripada nilai responden dalam emel pemilik (isu yang dibangkitkan dalam pass sebelum).
- Tests ditambah ke `tests/respondent-notification.test.ts` (kini 9): escaping data submission + nama/title pemilik.

### Track 1 — PDPA Toolkit
- Type `PdpaSettings { enabled, consentText?, policyUrl? }` di `lib/types/forms.ts` + `Form.pdpaSettings` + barrel.
- Migration `supabase/migrations/20260607020000_add_pdpa_settings.sql` — lajur `pdpa_settings jsonb` + NOTIFY pgrst.
- Storage `lib/storage/forms.ts`: `pdpa_settings` ↔ `pdpaSettings` (2× fromRow + toRow).
- Helper tulen `lib/forms/pdpa.ts`: `requiresPdpaConsent`, `isConsentGiven` (hanya string `'true'`), `isPdpaSubmissionAllowed`.
- Public form `app/(public)/form/[id]/client.tsx`: checkbox consent (state `pdpaConsent`, hanya bila bukan editMode), block `handleSubmit` + disable butang jika tak tick, append `_pdpa_consent='true'`. Server `submitFormAction` kuatkuasa (tolak jika enabled tapi consent ≠ true) — tak boleh bypass via scripting. Consent direkod sebagai lajur `Persetujuan PDPA: Ya/Tidak` dalam dbData (drop raw `_pdpa_consent`).
- UI builder `components/forms/pdpa-card.tsx` + mount selepas RespondentNotificationCard.
- Tests `tests/pdpa.test.ts` — 8.

### Track 2 — Audit Log
- Migration `supabase/migrations/20260607030000_add_audit_logs.sql` — jadual `audit_logs` (user_id FK auth.users ON DELETE CASCADE, action, entity_type, entity_id, metadata jsonb, created_at), index `(user_id, created_at DESC)`, RLS owner-only SELECT sahaja (TIADA polisi INSERT — immutable dari klien; tulis via service role), fungsi `prune_audit_logs()` (SECURITY DEFINER, search_path='', 365-hari retention).
- Type `lib/types/audit.ts` (`AuditAction`, `AuditLog`) + barrel. **Nota**: jangan padam eksport `TIER_LIMITS` bila edit barrel (hampir tersilap).
- Storage `lib/storage/audit.ts` (`import 'server-only'`): `logAudit()` resolve user dari auth lalu insert via admin client (fire-and-forget, swallow error); `listAuditLogs()` RLS-gated.
- Formatter tulen `lib/audit/format.ts`: `describeAuditAction` (label Melayu), `describeAuditLog` (gabung dengan metadata.title/name), `auditActionKind` (create/delete/update/other).
- Hook `logAudit` dalam `createFormAction` (selepas incrementFormCount, sebelum redirect) + `deleteFormAction` (fetch title dulu, lepas delete, sebelum redirect). updateFormAction TIDAK di-log (autosave terlalu bising).
- Dashboard `app/(dashboard)/audit/page.tsx` (`force-dynamic`) + pautan "Log Audit" (ikon ScrollText) di `components/dashboard/sidebar.tsx` + `/audit` ditambah ke protectedRoutes `proxy.ts`.
- Tests `tests/audit-format.test.ts` — 7.

### Track 3 — Multi-page Forms
- Jenis medan baharu `pagebreak` di `FormFieldType` (pemisah; tiada migration — guna array sedia ada, backward-compatible).
- Helper tulen `lib/forms/pagination.ts`: `splitIntoPages` (split di pagebreak, buang marker, sentiasa ≥1 page), `isMultiPage`, `findAdjacentNonEmptyPage` (skip page kosong akibat conditional), `lastNonEmptyPageIndex`.
- Public form: state `currentPage`; `visiblePages` = splitIntoPages.map(filter visible); render `currentPageFields`; butang Kembali/Seterusnya/Submit + "Halaman X / Y" (kira page non-kosong sahaja); validasi per-page pada Next; PDPA consent + Submit hanya di page akhir; guard Enter (multiPage && !isLastPage → goNext). **Penting**: `visibleFields` kini kecualikan `pagebreak` supaya tidak divalidasi/dihantar/dikira (elak lajur "Page Break" dalam Sheet).
- Builder `components/forms/fields-editor/index.tsx`: SelectItem "Page Break (Multi-page)", butang "Add Page Break", kecualikan pagebreak dari sumber syarat + sembunyi toggle required & conditional editor.
- Tests `tests/pagination.test.ts` — 10.

### Build state
- `npm run lint` — 0 warnings.
- `npm test` — 121/121 pass across 14 suites.
- `npm run build` — clean, 44 routes (+`/audit`).

### Migrations PENDING apply (supabase db push) sebelum produksi
- `20260607010000_add_respondent_notification.sql`
- `20260607020000_add_pdpa_settings.sql`
- `20260607030000_add_audit_logs.sql`

### Files added / modified (Fasa B sambung)
- **Added**: `lib/forms/pdpa.ts`, `lib/forms/pagination.ts`, `lib/audit/format.ts`, `lib/storage/audit.ts`, `lib/types/audit.ts`, `components/forms/pdpa-card.tsx`, `app/(dashboard)/audit/page.tsx`, `supabase/migrations/20260607020000_add_pdpa_settings.sql`, `supabase/migrations/20260607030000_add_audit_logs.sql`, `tests/pdpa.test.ts`, `tests/audit-format.test.ts`, `tests/pagination.test.ts`
- **Modified**: `lib/email/index.ts`, `lib/types/forms.ts`, `lib/types/index.ts`, `lib/storage/forms.ts`, `actions/forms.ts`, `app/(public)/form/[id]/client.tsx`, `components/forms/fields-editor/index.tsx`, `components/dashboard/sidebar.tsx`, `app/builder/[id]/client.tsx`, `proxy.ts`, `tests/respondent-notification.test.ts`

## Fasa B — STATUS: SIAP (4/4 feature: notifikasi responden, PDPA, audit log, multi-page forms). Fasa C masih pending.


## Production Deployment (2026-06-07 — Fasa B sambung)
- **Prasyarat**: 3 migration (respondent_notification, pdpa_settings, audit_logs) diapply ke DB produksi DAHULU (disahkan oleh pengguna "db dh settel") sebelum deploy — kerana `saveForm` upsert lajur baharu; deploy sebelum migration akan pecahkan simpan borang (PGRST204).
- **Method**: Vercel CLI (`npx vercel --prod --yes`).
- **Production URL**: `https://www.klikform.com`
- **Deployment URL**: `https://klikform-4turtui9x-sofwan-jailanis-projects.vercel.app`
- **Status**: Build completed (~1m), Ready in ~2m, aliased ke www.klikform.com. Lint 0, 121/121 tests, build clean 44 routes.


## UI Language Standardization (2026-06-07 — builder/dashboard → English)
- Builder convention is English (e.g. "E-Cert Settings", "Attendance & Location"). The Fasa A/B cards I added were in Malay, breaking consistency. Standardized all owner-facing UI to English:
  - `components/forms/webhooks-card.tsx` — descriptions, buttons (Add/Generate/Cancel/Add Webhook), toasts, confirms, aria-labels, empty state, locale `en-MY`.
  - `components/forms/edit-link-card.tsx` — "Response Edit Link" + all labels/placeholders/help text.
  - `components/forms/respondent-notification-card.tsx` — "Respondent Confirmation Email" + all strings.
  - `components/forms/pdpa-card.tsx` — "PDPA Consent" + labels; `DEFAULT_CONSENT` now English.
  - `components/forms/fields-editor/index.tsx` — "Add Page Break" title tooltip.
  - `app/(dashboard)/audit/page.tsx` — "Audit Log", "Recent Activity", empty state.
  - `lib/audit/format.ts` — `ACTION_LABELS` now English ("Form created", etc.); `tests/audit-format.test.ts` updated to match.
  - `components/dashboard/sidebar.tsx` — nav item "Audit Log".
  - `app/(public)/form/[id]/client.tsx` — PDPA consent default text + "Privacy Policy" link + consent toast + page nav buttons "Back"/"Next"/"Page X / Y".
  - `actions/forms.ts` — PDPA Sheet column renamed `Persetujuan PDPA` → `PDPA Consent`, value `Ya/Tidak` → `Yes/No`.
- **Deliberately kept Malay**: the email layer (`lib/email/index.ts` — `getRespondentConfirmationEmail` and ALL existing templates are Malay; translating only the new one would CREATE inconsistency) and the pre-existing public respondent form chrome ("Terjawab" badge, "Borang Ditutup", etc.). Only my newly-added public strings were aligned to English.
- Build state: lint 0, 121/121 tests, build clean 44 routes.


## Production Deployment (2026-06-07 — UI English standardization)
- **Method**: Vercel CLI (`npx vercel --prod --yes`). No schema change (UI/string-only), safe deploy.
- **Production URL**: `https://www.klikform.com`
- **Deployment URL**: `https://klikform-k6mxw0e9h-sofwan-jailanis-projects.vercel.app`
- **Status**: Build ~2m, Ready, aliased to www.klikform.com.


## Performance Fix (2026-06-07 — Forced reflow in certificate builder)
- **Symptom**: Chrome console `[Violation] Forced reflow while executing JavaScript took 33ms`.
- **Root cause**: `app/(dashboard)/certificates/builder/[id]/client.tsx` read `canvasRef.current.offsetWidth` inside `template.elements.map(...)` → one layout read per element per render → layout thrashing during drag/resize.
- **Fix**: Added `canvasWidth` state fed by a `ResizeObserver` on the canvas; `scale` now computed once per render (wrapped the element map in an IIFE) from `canvasWidth` instead of reading the DOM. Also fixes a latent bug where font preview didn't rescale on window resize.
- `getBoundingClientRect` in `handleMouseMove` left as-is (one read per event, not per render).
- Build state: lint 0, 121/121 tests, build clean.


## Google OAuth/Scope Least-Privilege Review (2026-06-07)
- **Context**: "Google hasn't verified this app" warning on "Connect with Google" — caused by requesting sensitive scopes without completing Google OAuth verification (process matter, not a code bug). Resolved via: keep app in Testing + add test users, OR submit for verification (privacy/terms pages already exist).
- **OAuth scopes** (`lib/api/google-auth.ts`): `drive.file` + `spreadsheets` + `userinfo.email` — all "sensitive" tier (NOT restricted; no annual security assessment needed). Already minimal for current features. Added justification comments to aid verification submission.
- **Least-privilege fix**: `lib/api/google-sheets.ts` service-account JWTs in `appendToSheet` + `updateSheetRow` previously requested full `drive` (RESTRICTED scope) + `spreadsheets`, but those functions only use the Sheets API (loadInfo/addRow/getRows/save) — never Drive. Narrowed to `['spreadsheets']` only. `createSpreadsheet` keeps `drive` (genuinely uses Drive API: files.create, about.get quota, permissions). Service-account scope narrowing is immediate (no re-consent) and doesn't affect the OAuth consent screen.
- **Open product decision (NOT applied)**: OAuth could drop `spreadsheets` and rely on `drive.file` alone IF the product only supports app-created Sheets (drive.file covers Sheets API for app-created files). Tradeoff: OAuth users could no longer connect a pre-existing sheet they made manually. Would reduce OAuth to a single sensitive scope (easiest verification). Left to user.
- Build state: lint 0, build clean. (Service-account scope change is scope-narrowing — provably correct since those paths call Sheets API only — but not runtime-tested against live Google here.)


## Repo Hygiene + Git Sync (2026-06-07)
- **Problem found**: git was stuck at Fasa A commit (`aa4dba7`); ALL Fasa B work + bug fixes + SSG load-speed + i18n + perf + scope changes were uncommitted (deployed via `vercel --prod` from working dir, so production was ahead of git — no history/rollback).
- **Resolved**: removed stale `build_full.log`/`build_output.log`, added `*.log` to `.gitignore`. Created branch `feat/fasa-b-improvements` and committed everything in 3 logical commits:
  - `c03b04c` chore: ignore *.log + remove stale logs
  - `8c0ef04` perf: SSG marketing pages + sin1 region + signup/forms trigger fixes (the earlier uncommitted production work)
  - `c297cf6` feat: Fasa B + email escaping + English UI + perf (ResizeObserver) + least-privilege scope
  - Pushed to `origin/feat/fasa-b-improvements`. Working tree clean.
- **Deploy**: `npx vercel --prod` → `https://www.klikform.com` (deployment `klikform-69xm4jcm7`). Now production includes the perf + scope fixes too.
- **Security advisories (monitored, not fixed)**: `vitest <4.1.0` critical but dev-only (UI server unused; we run `vitest run`) — bumping is breaking, low value. `postcss <8.5.10` moderate via Next — awaiting upstream.
- **Still open (larger, not started)**: Fasa C (custom domain, workspaces, payments-in-form, templates gallery, AI generator, backup); integration tests for storage/action paths; a11y audit (axe-core in deps); consider git-based Vercel auto-deploy for traceability.


## Improvements Batch (2026-06-07 — pipeline, integration tests, a11y)
### Git-based deploy pipeline (#4)
- Vercel project already connected to GitHub repo `sofwanwork/wanztech` (verified via `vercel git connect` → "already connected"). Production branch = `master`.
- Root cause of "git out of sync": `master` was behind since Fasa A — everything was deployed via `vercel --prod` from the working dir, never merged to `master`. Fixed by fast-forwarding `master` to the feature branch and pushing → from now on, **push to `master` auto-deploys** (no more manual CLI needed).

### Integration tests (#2) — mocked Supabase clients
- `tests/audit-storage.test.ts` (8): logAudit insert shape, default null/{}, skip when no user, swallow errors; listAuditLogs no-user→[], row mapping, limit clamp (1..200), error→[].
- `tests/edit-token-storage.test.ts` (9): createEditToken 64-hex + expiry math + insert shape + throw on error; getEditToken not_found/used/expired/valid mapping + short-token guard; markEditTokenUsed update scope + never-throws.
- `tests/webhook-storage.test.ts` (5): listWebhooksForForm masks secret (never decrypts); listWebhooksForDispatch decrypts; createWebhook ownership rejection + encrypt-on-write + masked return.
- Pattern: `vi.hoisted` + `vi.mock` for `@/utils/supabase/server|admin` and `@/lib/encryption`; chainable builder mock (methods return builder; `.single()` + thenable resolve configurable results). Total tests now **143** (was 121).

### Accessibility (#3) — public form WCAG fixes
- `app/(public)/form/[id]/client.tsx`: associated each field `<Label>` with its control (`htmlFor`/`id` = `field-input-${id}`) for text/email/number/textarea/select; added `id`=`field-label-${id}` + `aria-labelledby` on select trigger and `role="group"` + `aria-labelledby` on checkbox & radio groups. Required marker: `aria-hidden` on the `*` + `sr-only` "(wajib)" text. Fixes WCAG 1.3.1 / 4.1.2 (label-control association).
- Note: full WCAG conformance still needs manual testing with assistive tech; this pass fixed the clear programmatic gaps. Automated axe testing would need jsdom + vitest-axe setup (not added to avoid dep bloat).

### Build state
- lint 0, **143/143 tests** (17 suites), build clean.
- Not done (per user): Fasa C.


## Sentry instrumentation fix + Smoke-test checklist (2026-06-07)
- **Bug found & fixed**: no `instrumentation.ts` at root → in Next.js 16 + @sentry/nextjs v10, `sentry.server.config.ts` / `sentry.edge.config.ts` were NEVER loaded, so server/edge errors went uncaptured even with a DSN set. Created:
  - `instrumentation.ts` — `register()` imports server/edge config per `NEXT_RUNTIME`; exports `onRequestError = Sentry.captureRequestError`.
  - `instrumentation-client.ts` — imports `./sentry.client.config` (single init) + exports `onRouterTransitionStart`.
  - All still no-op without `NEXT_PUBLIC_SENTRY_DSN`. Build verified clean.
- **To activate Sentry** (user action — secrets): set in Vercel env → `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`. next.config.ts only wraps withSentryConfig when DSN + AUTH_TOKEN present. Prod trace sampling already 10%.
- **`SMOKE_TEST.md`** created (user-requested): step-by-step manual checklist for prod flows that automated tests can't cover (Google connect, form submit → Sheet + emails, edit link, certificates, bulk, audit, analytics, payment, Sentry).
- Honest status given to user: lint/test/build green, but NOT provably bug-free — external-service flows (OAuth, live Sheets/Drive, Resend, BCL, cert render) are not runtime-tested; service-account scope narrowing not live-tested.


## Sentry — ACTIVATED & VERIFIED (2026-06-07)
- `NEXT_PUBLIC_SENTRY_DSN` set in Vercel Production (DSN region: `.de`/EU) + added to local `.env.local`. (NEXT_PUBLIC bakes at build → required a redeploy to take effect.)
- **Verified working**: temporary `/sentry-test?throw=1` route triggered a server error that appeared in Sentry Issues ("KlikForm Sentry test error (server)") — confirms the `instrumentation.ts` server-capture fix works end-to-end. Test route then removed (commit `f73e141`).
- **Still optional for readable stack traces (source maps)**: set `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` in Vercel — only then does `next.config.ts` wrap with `withSentryConfig` to upload source maps. Currently DSN-only = capture works but traces are minified.
- Git: `master` at `f73e141`, working tree clean, auto-deploy on push confirmed working.


## Sentry — source maps enabled (2026-06-07)
- Set in Vercel Production: `SENTRY_ORG=wanz-tech-enterprise-v4`, `SENTRY_PROJECT=javascript-nextjs`, `SENTRY_AUTH_TOKEN` (org auth token, EU region). Now all 4 Sentry vars present → `next.config.ts` wraps with `withSentryConfig` and uploads source maps on build.
- Fresh prod build deployed (`klikform-5wvxvllif`, aliased www.klikform.com). Production errors now report with readable stack traces.
- Security note: auth token was shared in chat — user may rotate it in Sentry (Settings → Auth Tokens) if concerned.


## CSP fix for Sentry Session Replay (2026-06-07)
- **Console error**: "Creating a worker from 'blob:' violates CSP script-src ... worker-src not set". Sentry Replay creates a blob: Web Worker for compression; CSP lacked `worker-src` so it fell back to `script-src` (no blob:) and was blocked → Replay broken (error capture itself was fine).
- **Fix**: added `worker-src 'self' blob:` to the CSP in `next.config.ts`. Commit `3a97b58`, pushed to master (auto-deploy).
- **The repeated `monitoring?o=...&r=de ERR_BLOCKED_BY_CLIENT`** = the developer's own browser ad/privacy blocker blocking the `/monitoring` Sentry tunnel route. Environmental, not a code bug; real users without blockers are unaffected. Could rename `tunnelRoute` to evade blocklists if it becomes a problem.


## Multi-page page-break UX fix (2026-06-07)
- **User report**: "press Next → auto-submits." Root cause: the Next button (`type="button"`) can't submit — but a page break placed at the END of the form (the "Add Page Break" button appends to the bottom) created an empty trailing page, so the form showed **Submit** (not Next) on the content page, and pressing it submitted.
- **Fix (public form `app/(public)/form/[id]/client.tsx`)**: simplified pagination — `pages = splitIntoPages(...).map(filter visible).filter(non-empty)`. `multiPage = pages.length > 1`. Empty pages (leading/trailing pagebreaks or all-conditional-hidden) are now DROPPED entirely, so a stray pagebreak never creates a phantom page or premature Submit. Navigation is simple index ±1 over `pages`; `isFirstPage`/`isLastPage`/`displayCurrent`/`displayTotal` derived from it. Removed use of `findAdjacentNonEmptyPage`/`lastNonEmptyPageIndex`/`isMultiPage` in the component (helpers still exported + unit-tested).
- **Fix (builder `components/forms/fields-editor/index.tsx`)**: page break now early-returns a distinct **divider** UI ("── PAGE BREAK ──" + hint "Fields below this line start a new page") with drag handle + delete — no more confusing label/description/type inputs (this is why the user saw "no description"). Also removed the now-redundant `field.type !== 'pagebreak'` guards on the required toggle + conditional editor (TS narrowed the type after the early return → would've been a build type error; caught & fixed).
- Build state: lint 0, 143/143 tests, build clean (exit 0, type-check passes).
