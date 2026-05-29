# Fasa A — Quick Wins ✅ SIAP

Lima feature bebas konflik. Tiap satu mesti ada: jenis, storage, server action, UI builder/dashboard, integrasi, ujian.

## 1. Conditional Logic (richer rules) ✅

- [x] Extend `ConditionalConfig` di `lib/types/forms.ts` — tambah `rules: ConditionRule[]` dan `logic: 'all' | 'any'`. Backward compat: kalau `fieldId` + `value` legacy ada, normalize ke satu rule equals.
- [x] Tulis `lib/forms/conditions.ts` — fungsi tulen `evaluateConditional(field, formData, allFields)` + `normalizeConditional(legacy)`. Operator: `equals`, `not_equals`, `contains`, `not_contains`, `is_empty`, `is_not_empty`, `gt`, `lt`.
- [x] Replace UI di `components/forms/fields-editor/index.tsx` dengan editor multi-rule.
- [x] Wire `isFieldVisible` di `app/(public)/form/[id]/client.tsx` panggil `evaluateConditional`.
- [x] Tests: `tests/conditional-logic.test.ts` — 17 tests pass.

## 2. Outgoing Webhooks ✅

- [x] Migration: `form_webhooks` table (id, form_id, user_id, url, secret_encrypted, events, enabled, created_at). RLS owner-only.
- [x] Type `WebhookConfig` di `lib/types/webhooks.ts`.
- [x] `lib/storage/webhooks.ts` — CRUD (list per form, create, update, delete, recordResult).
- [x] `lib/webhooks/dispatch.ts` — sign HMAC-SHA256, fire with timeout, retry × 3 backoff.
- [x] `actions/webhooks.ts` — `createWebhookAction`, `updateWebhookAction`, `deleteWebhookAction`, `testWebhookAction`.
- [x] Hook into `submitFormAction` selepas `incrementSubmissionCount`.
- [x] Builder UI: `components/forms/webhooks-card.tsx`.
- [x] Tests: `tests/webhook-dispatch.test.ts` — 9 tests pass.

## 3. Response Edit Link ✅

- [x] Migration: `response_edit_tokens` + `forms.edit_link_settings` jsonb column.
- [x] Type `EditLinkSettings` (enabled, expiryDays, emailFieldId).
- [x] On submit (when enabled and email field present): create token row, email respondent dengan magic link.
- [x] New route `app/(public)/edit/[token]/page.tsx` — re-uses public form rendering with prefilled values.
- [x] Action `submitEditedResponseAction` — verify token, find sheet row by `_submission_id`, update Sheet row, mark token used.
- [x] Email template `getEditLinkEmail` di `lib/email/index.ts`.
- [x] Builder UI: `components/forms/edit-link-card.tsx`.
- [x] Tests: `tests/edit-token.test.ts` — 6 tests pass.

## 4. Bulk Certificate from CSV ✅

- [x] Refactor capture/blob helpers ke `lib/certificates/render.ts`.
- [x] Pure CSV parser `lib/csv/parse.ts` — handle quoted fields, BOM, CRLF, embedded newlines.
- [x] New dashboard page `app/(dashboard)/certificates/builder/[id]/bulk/page.tsx` + client.
- [x] Client-side bulk generator: loop entries, render `CertificateRenderer` each, capture, push to `JSZip`. Trigger download.
- [x] "Bulk Generate" sparkles button on certificate template card.
- [x] Tests: `tests/csv-parse.test.ts` — 13 tests pass.

## 5. Cross-form Analytics Dashboard Widget ✅

- [x] Tambah `aggregateUserAnalytics(rows, days)` di `lib/analytics/aggregate.ts`.
- [x] Add `getUserAnalyticsSummary(days)` di `actions/analytics.ts` — RLS-gated.
- [x] New component `components/dashboard/cross-form-analytics.tsx` — 4 stat cards + 30d sparkline + top-3 forms.
- [x] Mount di `app/(dashboard)/forms/page.tsx` antara `<DashboardStats>` dan page header.
- [x] Tests: `tests/cross-form-analytics.test.ts` — 6 tests pass.

## Verifikasi akhir ✅

- [x] `npm run lint` — 0 warnings
- [x] `npm test` — 87/87 pass across 10 suites (was 36/36)
- [x] `npm run build` — clean, 43 routes (Next 16.2.6, Turbopack)
- [x] Update `memory.md` dan `lessons.md`

---

## Reviu

**Skop dihantar**: 5/5 features. 51 ujian baru, 0 lint warnings, build clean.

**Keputusan reka bentuk**:
- **Conditional Logic** — ditolak shape baru penuh (rules[]) tetapi normalize legacy shape automatic, jadi tiada migration data perlu dijalankan untuk borang sedia ada. Pure evaluator senang ditest.
- **Webhooks** — rangkaian sama macam BCL inbound (HMAC-SHA256 hex), jadi pengguna boleh re-use receiver code corak yang sama. Per-attempt timeout 5s × 3 attempts dengan exponential backoff (500ms, 1s, 2s). 4xx short-circuit kerana receiver explicit reject.
- **Edit Link** — guna jsonb column `edit_link_settings` untuk elak proliferation. Token single-use untuk had blast radius leak. Edit mode skip file uploads, webhooks, owner email — sengaja senyap supaya owner tak banjir notif.
- **Bulk Certificate** — pure client-side via `jszip` (sudah dalam deps). Refactor `lib/certificates/render.ts` jadi reusable supaya tidak duplicate kod render. CSV parser hand-rolled kerana zero new deps.
- **Cross-form Analytics** — silently render nothing kalau tiada data, tak susahkan dashboard. Top-3 sahaja dalam widget — page analytics individu untuk drill-down.

**Lessons baru** ditambah ke `lessons.md`:
- `server-only` perlu di-stub dalam Vitest
- `z.ZodError` v4 guna `.issues[]` bukan `.errors[]`
- Type baru kena di-re-export dari `lib/types/index.ts`
- Bulk client-render perlu 2× `requestAnimationFrame` wait
- CSV empty check perlu `.trim()`
- Snapshot rekey label → id bila prefill
- Magic-link routes mesti `robots: { index: false }`

**Tinggal (Fasa B & C)** — lihat `memory.md`.
