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
## Bug Fix: Database Error on Account Creation (2026-06-05) ✅ SIAP

- [x] Identify root cause of database error on registration (trigger `handle_new_user` using incorrect column name `total_forms` and missing `month` column values)
- [x] Create a new migration file `supabase/migrations/20260605000000_fix_handle_new_user_trigger.sql` to fix `handle_new_user` trigger function
- [x] Test the build and lint of the project to ensure no regressions
- [x] Document the changes in `memory.md`, `lessons.md` and `task.md`

### Reviu Bug Fix:
- **Punca Masalah**: Trigger `on_auth_user_created` yang menjalankan fungsi `public.handle_new_user()` gagal kerana mencuba untuk `INSERT` ke `public.usage` menggunakan nama kolum `total_forms` (yang sepatutnya `forms_created`) serta tidak memasukkan nilai untuk kolum `month` yang mempunyai constraint `NOT NULL`. Hal ini menyebabkan transaction pendaftaran pengguna (sign up) terbatal dan memaparkan "database error" kepada pengguna.

## Bug Fix: Form Creation Block for Google OAuth Users (2026-06-05) ✅ SIAP

- [x] Identify root cause of form creation blocking (strict check on `googleClientEmail`/`googlePrivateKey` instead of allowing `googleAccessToken` OAuth config)
- [x] Update `createFormAction` in `actions/forms.ts` to allow either OAuth or Service Account configurations
- [x] Test the build and lint to ensure everything compiled correctly
- [x] Document the changes in `memory.md`, `lessons.md` and `task.md`

### Reviu Bug Fix:
- **Punca Masalah**: Ketika pengguna mahu mencipta borang baru (`createFormAction`), fungsi akan menyemak jika ada rekod tetapan yang sah. Namun, semakan sebelum ini hanya memeriksa kolum manual Service Account (`googleClientEmail` & `googlePrivateKey`). Ini menghalang pengguna yang menggunakan Google OAuth (yang hanya menyimpan `googleAccessToken`) daripada mencipta borang.
- **Penyelesaian**: Mengubah semakan di `createFormAction` untuk membenarkan penciptaan borang jika pengguna telah mengkonfigurasi sama ada Google OAuth (`googleAccessToken` wujud) ATAU manual Service Account.

## Redundant Trigger Cleanup (2026-06-05) ✅ SIAP
- [x] Identify redundant trigger `on_auth_user_created_subscription` executing `handle_new_user_subscription()` on `auth.users`
- [x] Update migration `20260605000000_fix_handle_new_user_trigger.sql` to drop the redundant trigger and function
- [x] Redeploy to Vercel to sync migration files


## Deployment: Update Back to Vercel (2026-06-05) ✅ SIAP

- [x] Check Vercel CLI version and link status
- [x] Deploy the application to Vercel using Vercel CLI
- [x] Document the deployment in `memory.md` and `task.md`


## Bug Fix: Forms Save Trigger error (2026-06-05) ✅ SIAP
- [x] Identify the root cause of forms 500 error (`record "new" has no field "slug"` trigger error on `forms` table because the database trigger was executing `generate_short_code` function which expected `NEW.slug`)
- [x] Create a new migration file `supabase/migrations/20260605001000_fix_forms_short_code_trigger.sql` to separate the forms trigger from the short_links trigger
- [x] Redeploy to Vercel to sync migration files





---

# Fasa B (mula) — Notifikasi Emel Responden (Auto-acknowledgement)

**Matlamat**: Selepas responden submit borang, hantar emel pengesahan automatik kepada responden (bukan hanya kepada pemilik borang). Guna semula infra Resend + corak pemilih medan emel yang sama macam Edit Link. Tiada jadual DB baharu — hanya satu lajur jsonb pada `forms`.

- [x] 1. Type `RespondentNotificationSettings` di `lib/types/forms.ts` (enabled, emailFieldId, message?, includeSummary?) + tambah ke `Form` + re-export di `lib/types/index.ts`.
- [x] 2. Migration `supabase/migrations/20260607010000_add_respondent_notification.sql` — tambah lajur `respondent_notification jsonb`.
- [x] 3. Pemetaan storage di `lib/storage/forms.ts` — 2× fromRow + 1× toRow (`respondent_notification`).
- [x] 4. Template emel `getRespondentConfirmationEmail(formTitle, message?, summary?)` di `lib/email/index.ts`.
- [x] 5. Hook fire-and-forget dalam `submitFormAction` selepas blok edit-link.
- [x] 6. UI builder `components/forms/respondent-notification-card.tsx` (cermin EditLinkCard) + mount di `app/builder/[id]/client.tsx`.
- [x] 7. Tests `tests/respondent-notification.test.ts` (template purity + ringkasan).
- [x] 8. Verifikasi: `npm run lint` (0) + `npm test` (94/94) + `npm run build` (bersih).

### Reviu
- **Keputusan reka bentuk**: guna lajur `jsonb` tunggal (`respondent_notification`) macam `edit_link_settings` untuk elak proliferasi lajur. Berasingan sepenuhnya daripada `receiveEmailNotifications` (notifikasi pemilik) — dua aliran emel berbeza, dua toggle berbeza.
- **Keselamatan**: nilai jawapan responden (subjek, ringkasan, mesej) di-escape HTML (`escapeHtml`) sebelum disuntik ke template emel, untuk halang HTML/markup injection dalam emel pengesahan. Kunci dalaman (`_submission_id` dll, prefix `_`) ditapis daripada ringkasan.
- **Ketahanan**: blok fire-and-forget — kegagalan emel tidak sesekali gagalkan submission (try/catch + `console.warn`). Sama corak dengan blok edit-link & notifikasi pemilik.
- **Nota (di luar skop)**: `getNewSubmissionEmail` (notifikasi pemilik sedia ada) TIDAK escape input pengguna — potensi HTML injection dalam emel pemilik. Tidak diubah dalam pass ini untuk kekal skop minimum; patut dibaiki berasingan.


---

# Fasa B (sambung) — Email escaping fix + baki feature

## Track 0 — Email HTML escaping (keselamatan)
- [x] Escape semua nilai pengguna dalam `getNewSubmissionEmail` (userName, formTitle, submissionData keys/values, googleSheetUrl href).
- [x] Escape `formTitle` dalam `getEditLinkEmail` untuk konsistensi.
- [x] `escapeHtml` (function declaration, hoisted) boleh guna oleh semua template dalam fail.

## Track 1 — PDPA Toolkit
- [x] Type `PdpaSettings { enabled, consentText, policyUrl? }` pada `Form` + barrel.
- [x] Migration `20260607020000_add_pdpa_settings.sql`: lajur `pdpa_settings jsonb`.
- [x] Storage mapping (2× fromRow + toRow).
- [x] Helper tulen `lib/forms/pdpa.ts` (`requiresPdpaConsent`, `isConsentGiven`, `isPdpaSubmissionAllowed`).
- [x] UI builder `pdpa-card.tsx` + mount selepas RespondentNotificationCard.
- [x] Public form: checkbox persetujuan wajib (block submit + disable butang jika tak tick); rakam `Persetujuan PDPA: Ya` dalam dbData.
- [x] Server-side: `submitFormAction` tolak jika PDPA enabled tapi consent tiada (tak boleh bypass via scripting).
- [x] Tests `tests/pdpa.test.ts` — 8 tests.

## Track 2 — Audit Log
- [x] Migration `20260607030000_add_audit_logs.sql`: jadual `audit_logs` + index + RLS owner-only SELECT + `prune_audit_logs()`.
- [x] Type `lib/types/audit.ts` + barrel.
- [x] `lib/storage/audit.ts` — `logAudit()` (resolve user, insert via admin) + `listAuditLogs()` (RLS).
- [x] Formatter tulen `lib/audit/format.ts` (`describeAuditAction`, `describeAuditLog`, `auditActionKind`).
- [x] Hook log pada `createFormAction` + `deleteFormAction` (sebelum redirect).
- [x] Dashboard `app/(dashboard)/audit/page.tsx` + pautan sidebar + route terlindung di `proxy.ts`.
- [x] Tests `tests/audit-format.test.ts` — 7 tests.

## Track 3 — Multi-page Forms
- [x] Jenis medan baharu `pagebreak` (pemisah) di `FormFieldType`.
- [x] Helper tulen `lib/forms/pagination.ts` (`splitIntoPages`, `isMultiPage`, `findAdjacentNonEmptyPage`, `lastNonEmptyPageIndex`).
- [x] Builder: dropdown jenis + butang "Add Page Break" + kecualikan pagebreak dari sumber syarat/required/conditional.
- [x] Public form: render satu page setiap kali + butang Kembali/Seterusnya/Submit + indikator "Halaman X / Y"; validasi per-page pada Next; PDPA + Submit di page akhir; guard Enter; skip page kosong (conditional).
- [x] `visibleFields` kecualikan pagebreak (tidak divalidasi/dihantar/dikira).
- [x] Tests `tests/pagination.test.ts` — 10 tests.

## Verifikasi akhir ✅
- [x] `npm run lint` — 0 warnings.
- [x] `npm test` — 121/121 pass across 14 suites (was 94).
- [x] `npm run build` — clean, 44 routes (+`/audit`).

## Reviu
- **Email escaping**: `escapeHtml` diguna merentas `getNewSubmissionEmail`, `getEditLinkEmail`, `getRespondentConfirmationEmail`. Nilai responden tak boleh lagi suntik markup ke emel.
- **PDPA**: gate dikuatkuasakan dua lapis (client UX + server enforcement) supaya tak boleh dipintas. Consent direkod sebagai lajur mesra Sheet. Logik diekstrak ke fungsi tulen untuk ujian.
- **Audit log**: jadual immutable dari sisi klien (tiada polisi INSERT; tulis via service role sahaja). Hanya log create/delete (bukan update autosave yang bising). Formatter tulen + `force-dynamic` page.
- **Multi-page**: guna `pagebreak` sebagai pemisah dalam array sedia ada — tiada migration, backward-compatible (borang tanpa pagebreak = 1 page). Page kosong (akibat conditional) dilangkau automatik. Semua logik pagination tulen & diuji.

---

# Fasa B (sambung) — UX Simplification for Non-Technical Users

**Matlamat**: Memudahkan antara muka Form Builder untuk pengguna bukan teknikal dengan menyembunyikan tetapan lanjutan ("Validation Rules" dan "Conditional Logic") secara lalai menggunakan Accordion.

- [x] 1. Import komponen Accordion di `components/forms/fields-editor/index.tsx`.
- [x] 2. Kemas kini `SortableField` untuk membungkus seksyen Validation dan Conditional dengan Accordion (collapsed by default).
- [x] 3. Tambah indikator lencana (badge) jika validation/conditional aktif supaya pengguna tahu ada peraturan aktif.
- [x] 4. Kemas kini `ConditionalLogicEditor` untuk membuang tajuk berganda.
- [x] 5. Uji secara manual dan jalankan `npm test` serta `npm run build` untuk memastikan tiada masalah.

---

# Fasa D — Hardening Batch (2026-07-01) ✅ SIAP

Sembilan pembetulan risiko/kualiti dari audit penuh (lihat `memory.md` untuk butiran reka bentuk).

## 1. form_responses — write-first, sync-async ✅
- [x] Migration `20260701010000_add_form_responses.sql` (jadual + partial index + prune + RLS owner-only SELECT).
- [x] `lib/storage/form-responses.ts` — insert (idempotent, 23505=duplicate), markSynced, markSyncFailed({final}), listPendingSyncResponses (join forms+settings).
- [x] `submitFormAction`: tulis DB dahulu → Sheets sync + webhooks + 3 emel dalam `after()`.
- [x] Cron `/api/cron/sync-responses` (*/10) + entri `vercel.json`.

## 2. Payment webhook idempotency ✅
- [x] Migration `20260701020000_payment_webhook_idempotency.sql` (`processed_at` + backfill + unique `provider_reference`).
- [x] Route: duplicate → 200 `{duplicate:true}` tanpa kesan sampingan; `processed_at` diset serentak dengan status; SEMUA DB via admin client (fix anon/RLS silent failure).
- [x] Initiate: `PRO_PRICE` + `KLIK-${randomUUID()}` + buang fake phone.

## 3. Conditional-required fix ✅
- [x] `lib/forms/validate-submission.ts` (pure) — reuse `evaluateConditional`, skip layout-only, ReDoS cap.
- [x] `submitFormAction` guna modul baharu.

## 4. Duplicate submit protection ✅
- [x] Client jana `_submission_key` (randomUUID per page-load, sessionStorage); action guna sebagai submission_id (unique constraint menelan double-submit).
- [x] Key dikosong selepas success ("Submit another response" dapat key baru).

## 5. CI ✅
- [x] `.github/workflows/ci.yml` — lint → typecheck → test → build (push/PR master).

## 6. Error boundaries ✅
- [x] `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`.

## 7. Konsolidasi harga ✅
- [x] `lib/constants/pricing.ts` (PRO_PRICE) — initiate, pricing page, modal, plan-card semua import dari satu tempat.

## 8. React cache() dedupe ✅
- [x] `getFormById` / `getFormByShortCode` dibalut `cache()`.

## 9. Tooling ✅
- [x] Skrip `typecheck`; deps pembangunan dipindah ke devDependencies.

## Verifikasi akhir ✅
- [x] `npm run lint` — 0 warnings
- [x] `npm run typecheck` — clean
- [x] `npm test` — 206/206 (25 suites; was 171)
- [x] `npm run build` — clean, 45 routes (+`/api/cron/sync-responses`)

### Reviu
- **Write-first**: DB ialah source of truth baharu; Sheet jadi "view" yang akhirnya konsisten (cron retry). Responden tidak pernah lagi kehilangan jawapan atau menunggu webhook lambat.
- **Idempotency**: ditetapkan sebelum sebarang geran supaya crash mid-handler tidak boleh double-grant; completed lama di-backfill `processed_at`.
- **Admin client fix**: webhook BCL tiada cookie — anon client + RLS owner-only = silent 404; service role satu-satunya pilihan betul.
- **Tinggal (Fasa E cadangan)**: Turnstile optional per-form, zod di semua action files, dekomposisi client.tsx (1,354 baris) + builder client (1,551 baris), responses dashboard baca form_responses, export/backup UI dari form_responses, a11y audit builder, i18n konsisten (lang="ms" pada page English), renewal/cancel flow.

