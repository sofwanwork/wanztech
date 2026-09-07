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

---

# Form Title 2 Baris (Multi-line Support)

Membolehkan Form Title ditulis dan dipaparkan dalam 2 baris atau lebih.

- [x] 1. Tukar input Form Title di `app/builder/[id]/client.tsx` kepada `<Textarea>` dengan `rows={2}`.
- [x] 2. Kemas kini `app/(public)/form/[id]/client.tsx` dengan `whitespace-pre-line break-words` pada `<CardTitle>`.
- [x] 3. Kemas kini `components/dashboard/form-card.tsx` dan `app/(dashboard)/responses/client.tsx` dengan `line-clamp-2 break-words whitespace-pre-line`.
- [x] 4. Kemas kini komponen/halaman lain yang memaparkan tajuk borang (`check`, `verify`, `analytics`, `certificate-qr-card`) dan sanitasi nama metadata / muat turun / Sheet.
- [x] 5. Uji dengan `npm test`, `npm run lint`, `npm run typecheck` dan semak manual.

### Reviu
- **Form Builder**: Input tajuk borang kini menggunakan `<Textarea rows={2}>` yang membolehkan pengguna menekan Enter untuk memasukkan baris baru secara semulajadi.
- **Rendering**: Paparan tajuk pada borang awam, kad dashboard, semakan sijil, verifikasi dan analitik kini menyokong `whitespace-pre-line break-words` (dan `line-clamp-2` pada kad dashboard).
- **Sanitasi**: Tajuk yang digunakan pada tag metadata `<head>`, nama fail Google Sheets, fail muat turun QR kod, serta subjek emel disanitasi secara automatik untuk menukar `\n` kepada ruang kosong (` `) supaya tiada isu pemecahan header / karakter tidak sah.
- **Kualiti**: 206/206 ujian lulus, lint 0 ralat/amaran, typecheck bersih.

---

# Tajuk Program 2 Baris Pada Sijil & E-Cert

Membolehkan tajuk program dipaparkan dalam 2 baris atau lebih pada preview sijil, certificate builder, dan renderer e-cert.

- [x] 1. Kemas kini `components/certificates/renderer/index.tsx` untuk menyokong `whitespace-pre-line` dan `break-words` pada elemen teks dan placeholder.
- [x] 2. Kemas kini canvas di `app/(dashboard)/certificates/builder/[id]/client.tsx` dan `preview/page.tsx` untuk membuang `whitespace-nowrap` dan menambah sokongan baris baru.
- [x] 3. Kemas kini panel penyunting teks di `components/certificates/builder/properties.tsx` kepada `<Textarea rows={2}>`.
- [x] 4. Kemas kini semua 10 templat pra-bina (`ClassicTemplate`, `CorporateTemplate`, dsb.) dan templat warisan dengan `whitespace-pre-line break-words`.
- [x] 5. Jalankan verifikasi ujian automatik (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`).

### Reviu
- **Certificate Renderer & Canvas**: `whiteSpace: 'nowrap'` telah ditukar kepada dinamik (`pre-line` untuk teks & placeholder, `nowrap` untuk lain-lain) berserta `wordBreak: 'break-word'`, membolehkan tajuk program memaparkan 2 baris secara automatik atau mengikut `\n`.
- **Builder & Preview Page**: Kelas `whitespace-nowrap` pada canvas dan halaman preview digantikan dengan `whitespace-pre-line break-words`.
- **Properties Editor**: Input teks kini menggunakan `<Textarea rows={2}>` dengan kebolehan resize y untuk memudahkan pengguna memasukkan tajuk berbilang baris secara langsung.
- **Templat Sijil Pra-Bina**: Kesemua 10 templat sijil (`Classic`, `Corporate`, `Creative`, `Elegant`, `Minimalist`, `Modern`, `Nature`, `Premium`, `Royal`, `Vintage`) dan templat legasi dikemas kini dengan `whitespace-pre-line break-words`.
- **Pengesahan & Deployment**: 206 ujian unit lulus (termasuk ujian multi-line program identifier), 0 lint error, typecheck TypeScript bersih, dan berjaya dideploy ke pengeluaran Vercel (`https://www.klikform.com`).

---

# Auto-Scale Tajuk Panjang & Canva-Style Drag-To-Scale

Memperkemas paparan tajuk panjang pada sijil secara automatik dan menambah kawalan penskalaan interaktif seperti Canva pada E-Cert Builder.

- [x] 1. Cipta modul типоgrafi sijil dengan fungsi `getProgramFontSize` (`components/certificates/types.ts`).
- [x] 2. Kemas kini kesemua 10 templat sijil pra-bina dan templat legasi dengan `getProgramFontSize` dan `[text-wrap:balance]`.
- [x] 3. Kemas kini `components/certificates/renderer/index.tsx` dengan `textWrap: 'balance'` dan `maxWidth: '92%'`.
- [x] 4. Laksanakan pemegang penskalaan Canva (4 bucu + pemegang sisi) serta logik penskalaan fon dan dimensi dalam `app/(dashboard)/certificates/builder/[id]/client.tsx`.
- [x] 5. Tulis ujian unit di `tests/certificate-typography.test.ts` dan jalankan `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
---

# KlikBio — Ciri Linktree / Bio Links ✅ SIAP

Membina ciri mikro-landing page (Link-in-bio) lengkap untuk KlikForm dengan live preview mockup, drag-and-drop links, preset tema, pengurusan profil & media sosial, integrasi QR kod, dan halaman awam responsif.

- [x] 1. Cipta skrip migrasi pangkalan data Supabase `supabase/migrations/20260830000000_add_bio_links.sql` (`bio_pages` dan `bio_links` tables + RLS + indexes).
- [x] 2. Kemas kini jenis TypeScript di `lib/types/bio-links.ts`, `lib/types/subscription.ts`, `lib/constants/subscription-tiers.ts`, dan re-export di `lib/types/index.ts`.
- [x] 3. Cipta modul utiliti & tema di `lib/bio-links/themes.ts`.
- [x] 4. Cipta lapisan storan Supabase CRUD di `lib/storage/bio-links.ts`.
- [x] 5. Cipta Server Actions di `actions/bio-links.ts` (CRUD halaman, pautan, reorder, click tracking).
- [x] 6. Cipta halaman senarai profil dashboard di `app/(dashboard)/bio/page.tsx` dan `client.tsx`.
- [x] 7. Cipta halaman pembina profil interaktif di `app/(dashboard)/bio-builder/[id]/page.tsx` dan `client.tsx` (dengan live mobile preview & `@dnd-kit` sortable).
- [x] 8. Cipta halaman awam di `app/(public)/bio/[username]/page.tsx`, `client.tsx` dan laluan pintas `app/(public)/b/[username]/page.tsx`.
- [x] 9. Kemas kini menu bar sisi di `components/dashboard/sidebar.tsx` dan laluan kawalan keselamatan di `proxy.ts`.
- [x] 10. Tulis ujian unit di `tests/bio-links.test.ts` dan `tests/bio-storage.test.ts`.
- [x] 11. Jalankan pengesahan kualiti (`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`).
- [x] 12. Kemas kini `memory.md` dan `task.md`.

---

## Reviu Pelaksanaan KlikBio

**Skop & Ciri Utama Dihantar**:
1. **Pangkalan Data Supabase**: Jadual `bio_pages` dan `bio_links` dengan integriti kekunci asing (`ON DELETE CASCADE`), indeks laju pada `user_id`, `username`, dan `(bio_page_id, order_index)`, kawalan keselamatan RLS per-pemilik, serta trigger pengemaskinian `updated_at`.
2. **Preset Tema & Reka Bentuk Visual**: 8 tema warna profesional (`Emerald Luxe`, `Onyx Dark`, `Sunset Glow`, `Deep Ocean`, `Minimal Light`, `Lavender Dusk`, `Cyber Neon`, `Midnight Gold`) serta 6 gaya butang (`Full Pill`, `Rounded XL`, `Subtle Round`, `Outline Border`, `Elevated Shadow`, `Glassmorphism`).
3. **Penyusun Pautan Interaktif (Drag & Drop)**: Menggunakan `@dnd-kit` untuk susun atur kad pautan yang lancar, sokongan jenis pautan kustom, pautan terus WhatsApp (dengan mesej awal), pemilihan borang KlikForm secara dinamik, dan pemisah tajuk seksyen (*section header*).
4. **Live Mobile Mockup Preview**: Paparan telefon pintar masa nyata (*instant real-time mockup*) yang mengemas kini perubahan tajuk, bio, avatar, ikon media sosial, tema, dan urutan pautan secara automatik.
5. **Halaman Awam Responsif**: Laluan pantas `/bio/[username]` dan `/b/[username]` dengan metadata OpenGraph/Twitter dinamik, animasi `framer-motion`, penjejakan klik (*click tracking*), dan dialog perkongsian Kod QR.
6. **Kawalan Had Langganan**: Gating automatik (`maxBioPages: 1` untuk Pelan Percuma, `-1` tanpa had untuk Pro & Enterprise).
7. **Pengesahan & Ujian Kualiti**:
   - `npm run typecheck` — 0 ralat TypeScript.
   - `npm run lint` — 0 amaran ESLint.
   - `npm test` — 224 / 224 ujian lulus merentas 28 suite ujian.
   - `npm run build` — 49 laluan dikompilasi bersih dengan Next.js 16 (Turbopack).

---

# Bug Fix: Glassmorphism & Button Style Contrast (2026-09-03)

Isu: Bila pengguna memilih gaya butang "Glassmorphism" (terutamanya pada tema cerah "Minimal Light" dan pautan dengan "Highlight Animation"), teks tajuk pautan menjadi putih di atas latar belakang putih/lutsinar sehingga tidak kelihatan langsung ("tak nampak tulisan").

- [x] 1. Cipta fungsi penentu gaya butang pintar `getBioButtonClass` di `lib/bio-links/themes.ts` yang menyelaraskan warna teks dan tahap lutsinar latar belakang berasaskan tema (cerah vs gelap), bentuk butang, dan status highlight.
- [x] 2. Kemas kini `BUTTON_STYLES` di `lib/bio-links/themes.ts` untuk memastikan gaya `outline` dan `glass` mempunyai corner radius yang betul tanpa pertembungan warna teks.
- [x] 3. Kemas kini Live Mobile Mockup di `app/(dashboard)/bio-builder/[id]/client.tsx` untuk menggunakan `getBioButtonClass`.
- [x] 4. Kemas kini Halaman Awam KlikBio di `app/(public)/bio/[username]/client.tsx` untuk menggunakan `getBioButtonClass`.
- [x] 5. Tambah ujian unit di `tests/bio-links.test.ts` bagi mengesahkan kontras teks pada gaya `glass`, `outline`, dan tema cerah/gelap dengan atau tanpa highlight.
- [x] 6. Jalankan pengesahan kualiti (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`).
- [x] 7. Kemas kini `memory.md`, `lessons.md` dan `task.md`.

---

## Reviu Bug Fix: Glassmorphism Contrast
- **Punca Masalah**:
  1. `BUTTON_STYLES['glass'].class` sebelum ini mengandungi kelas `bg-white/10 border border-white/20` yang digabungkan terus secara rentetan (*string concatenation*) dengan `theme.highlightButtonClass` atau `theme.buttonClass`.
  2. Apabila tema cerah seperti "Minimal Light" (`bg-slate-100`) dipilih dan pautan mempunyai status highlight aktif (`highlight: true`), `highlightButtonClass` menyuntik `text-white` (kerana asalnya direka untuk butang legap gelap `bg-slate-900`).
  3. Kelas `bg-white/10` daripada Glassmorphism mengatasi warna latar belakang gelap, meninggalkan teks `text-white` di atas latar belakang butang putih separa lutsinar dan skrin kelabu cerah (#f1f5f9). Ini menyebabkan teks "klikform" berwarna putih tulen `rgb(255,255,255)` dan langsung tidak kelihatan.
- **Penyelesaian**:
  1. Dicipta fungsi `getBioButtonClass(theme, buttonStyle, isHighlight)` di `lib/bio-links/themes.ts` yang pintar mengira kelas Tailwind berasaskan kontras tema:
     - Untuk tema cerah (`minimal`), gaya `glass` kini menggunakan latar belakang kaca frosted berkontras tinggi (`bg-white/70` atau `bg-white/90`) dengan teks gelap yang jelas (`text-slate-900` atau `text-slate-950 font-bold`).
     - Untuk tema gelap, gaya `glass` mengekalkan frosted glass estetik (`bg-white/10` atau `bg-white/20`) dengan teks putih/aksen tema yang berkontras tinggi.
     - Gaya `outline` turut diselaraskan supaya tidak menghasilkan teks putih di atas latar lutsinar pada tema cerah.
  2. Kedua-dua komponen pemaparan (`MobileMockupView` di builder dan `PublicBioClient` di halaman awam) kini menggunakan `getBioButtonClass`.
  3. Ujian unit ditambah di `tests/bio-links.test.ts` untuk memastikan teks pada tema cerah tidak sesekali mengandungi `text-white`.
  4. 230 / 230 ujian unit lulus (28 suite ujian), 0 ralat lint, typecheck bersih, build Next.js 16 bersih.

---

# Bug Fix: Share / QR Modal Button Overflow (2026-09-03)

Isu: Butang "Copy Link" terkeluar (*overflow*) ke bahagian luar sebelah kiri modal "Share @username" pada paparan desktop.

- [x] 1. Baiki susun atur butang dalam Dialog Modal di `app/(public)/bio/[username]/client.tsx` dengan menggunakan grid `grid-cols-2` yang terhad di dalam kad modal, mengelakkan pertembungan kelas `DialogFooter` (`sm:flex-row sm:justify-end`).
- [x] 2. Baiki susun atur butang dalam Dialog Modal di `app/(dashboard)/bio/client.tsx` (kod serupa).
- [x] 3. Jalankan pengesahan kualiti (`npm run typecheck`, `npm run lint`, `npm test`).
- [x] 4. Kemas kini `lessons.md`, `memory.md`, dan `task.md`.
- [x] 5. Deploy perubahan ke Vercel Production.

---

## Reviu Bug Fix: Share / QR Modal Button Overflow
- **Punca Masalah**:
  1. `DialogFooter` daripada shadcn mengandungi kelas lalai `sm:flex-row sm:justify-end`.
  2. Komponen `Button` mempunyai kelas `shrink-0` (`flex-shrink: 0`), dan setiap butang di dalam dialog diberi kelas `w-full` (100% lebar).
  3. Dalam modal sempit `sm:max-w-xs` (320px), dua butang `w-full` dengan `shrink-0` memerlukan lebih 540px jika diletakkan bersebelahan secara mendatar (`sm:flex-row`).
  4. Oleh sebab `sm:justify-end` menyusun anak elemen ke kanan (`justify-content: flex-end`), butang kedua ("Save QR") berada di sebelah kanan di dalam dialog, manakala butang pertama ("Copy Link") ditolak sejauh ~260px melimpah keluar (*overflow*) ke sebelah kiri skrin.
- **Penyelesaian**:
  1. Menggantikan `DialogFooter` yang bersifat flex-end dengan grid semulajadi `<div className="grid grid-cols-2 gap-2 w-full pt-1">`.
  2. Meningkatkan saiz dialog daripada `sm:max-w-xs` (320px) kepada `sm:max-w-sm` (384px) untuk ruang bernafas dan susun atur yang lebih kemas.
  3. Memperbaiki kedua-dua fail: `app/(public)/bio/[username]/client.tsx` dan `app/(dashboard)/bio/client.tsx`.

---

# KlikBio — Corak Latar Belakang (Background Patterns)

Membolehkan pengguna memilih corak latar belakang (dots, grid, stripes, waves, crosses, stars, circuit, atau none) untuk halaman KlikBio mereka dengan sokongan kontras pintar bagi tema cerah dan gelap.

- [x] 1. Tambah `BioPattern` dalam `lib/types/index.ts` (barrel export).
- [x] 2. Kemas kini `lib/bio-links/themes.ts`: eksport `BIO_PATTERNS` dan `getBioPatternStyle(pattern, theme)`.
- [x] 3. Kemas kini `app/(dashboard)/bio-builder/[id]/client.tsx`:
  - Tambah bahagian pemilih corak latar belakang pada Tab "Design & Theme".
  - Paparkan corak latar belakang pada `MobileMockupView`.
- [x] 4. Kemas kini `app/(public)/bio/[username]/client.tsx`: paparkan corak latar belakang pada `PublicBioClient`.
- [x] 5. Tulis ujian unit di `tests/bio-links.test.ts` untuk `getBioPatternStyle`.
- [x] 6. Pengesahan kualiti: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- [x] 7. Commit conventional commit & deploy ke Vercel Production.
- [x] 8. Kemas kini `memory.md` dan `task.md`.

---

## Reviu Ciri Corak Latar Belakang KlikBio

**Ringkasan Pelaksanaan**:
1. **Pilihan Corak (8 Corak)**:
   - `none`: Latar belakang rata tanpa corak.
   - `dots`: Polka Dots halus (`radial-gradient`).
   - `grid`: Modern Grid (`linear-gradient`).
   - `stripes`: Diagonal Stripes (`repeating-linear-gradient`).
   - `waves`: Topography Waves (vektor kontur SVG data URI).
   - `crosses`: Minimal Crosses (tanda tambah geometri SVG data URI).
   - `stars`: Starry Sparkles (kerlipan bintang SVG data URI).
   - `circuit`: Tech Circuit (papan litar digital SVG data URI).
2. **Kawalan Kontras Pintar Berasaskan Tema**:
   - Fungsi `getBioPatternStyle(pattern, theme)` mengesan sama ada tema aktif adalah cerah (`minimal`) atau gelap/warna terang (`emerald`, `dark`, `sunset`, dll.).
   - Tema cerah menggunakan dakwat gelap legap rendah (`rgba(15, 23, 42, 0.04 - 0.09)`), manakala tema gelap menggunakan dakwat putih lembut (`rgba(255, 255, 255, 0.06 - 0.14)`).
   - Semua lapisan corak menggunakan `pointer-events-none` supaya tidak menghalang interaksi, klik pautan, mahupun skrol.
3. **Penyatuan UI Builder & Halaman Awam**:
   - Tab 2 (Design & Theme) di `bio-builder/[id]` dilengkapi kad interaktif "Background Patterns / Corak Latar" dengan preview langsung setiap corak menggunakan warna tema semasa pengguna.
   - `MobileMockupView` memaparkan corak latar secara langsung di skrin telefon mockup.
   - Halaman awam `/bio/[username]` memaparkan corak tetap (`fixed inset-0`) sebagai tekstur latar yang anggun.
4. **Pengesahan & Deployment**:
   - `npm test`: 235 / 235 ujian unit lulus (28 suite ujian).
   - `npm run typecheck`: 0 ralat TypeScript.
   - `npm run lint`: 0 amaran linter.
   - `npm run build`: Kompilasi Turbopack Next.js 16 bersih (49 laluan).
   - Git Commit: `5e6fbe7` dipush ke `origin master`.
   - Vercel Production: `dpl_7pV17fX4R8mjatScQiiDn7hYCiCh` (`https://www.klikform.com`).

---

# Bug Fix: 404 Page Not Found Bila Tekan Pautan Borang KlikForm di KlikBio (2026-09-06)

Isu: Pengguna mendapati bila menekan pautan borang KlikForm ("klikform form") pada halaman KlikBio, paparan menunjukkan ralat 404 "Page not found".

- [x] 1. Kenal pasti punca asal ralat 404 (laluan `/form/[id]` hanya menyokong UUID pangkalan data dan menolak `short_code`, manakala `bio-builder` menyimpan `/form/${chosenForm.shortCode}`).
- [x] 2. Bina helper `getFormByIdOrShortCode` dalam `lib/storage/forms.ts` (menggunakan `cache()` dan pengesanan regex UUID untuk mencari borang secara pintar mengikut ID UUID atau short code tanpa ralat PostgreSQL).
- [x] 3. Kemas kini `app/(public)/form/[id]/page.tsx` untuk menggunakan `getFormByIdOrShortCode` bagi `generateMetadata` dan `PublicFormPage`.
---

# Form Title 2 Baris (Multi-line Support)

Membolehkan Form Title ditulis dan dipaparkan dalam 2 baris atau lebih.

- [x] 1. Tukar input Form Title di `app/builder/[id]/client.tsx` kepada `<Textarea>` dengan `rows={2}`.
- [x] 2. Kemas kini `app/(public)/form/[id]/client.tsx` dengan `whitespace-pre-line break-words` pada `<CardTitle>`.
- [x] 3. Kemas kini `components/dashboard/form-card.tsx` dan `app/(dashboard)/responses/client.tsx` dengan `line-clamp-2 break-words whitespace-pre-line`.
- [x] 4. Kemas kini komponen/halaman lain yang memaparkan tajuk borang (`check`, `verify`, `analytics`, `certificate-qr-card`) dan sanitasi nama metadata / muat turun / Sheet.
- [x] 5. Uji dengan `npm test`, `npm run lint`, `npm run typecheck` dan semak manual.

### Reviu
- **Form Builder**: Input tajuk borang kini menggunakan `<Textarea rows={2}>` yang membolehkan pengguna menekan Enter untuk memasukkan baris baru secara semulajadi.
- **Rendering**: Paparan tajuk pada borang awam, kad dashboard, semakan sijil, verifikasi dan analitik kini menyokong `whitespace-pre-line break-words` (dan `line-clamp-2` pada kad dashboard).
- **Sanitasi**: Tajuk yang digunakan pada tag metadata `<head>`, nama fail Google Sheets, fail muat turun QR kod, serta subjek emel disanitasi secara automatik untuk menukar `\n` kepada ruang kosong (` `) supaya tiada isu pemecahan header / karakter tidak sah.
- **Kualiti**: 206/206 ujian lulus, lint 0 ralat/amaran, typecheck bersih.

---

# Tajuk Program 2 Baris Pada Sijil & E-Cert

Membolehkan tajuk program dipaparkan dalam 2 baris atau lebih pada preview sijil, certificate builder, dan renderer e-cert.

- [x] 1. Kemas kini `components/certificates/renderer/index.tsx` untuk menyokong `whitespace-pre-line` dan `break-words` pada elemen teks dan placeholder.
- [x] 2. Kemas kini canvas di `app/(dashboard)/certificates/builder/[id]/client.tsx` dan `preview/page.tsx` untuk membuang `whitespace-nowrap` dan menambah sokongan baris baru.
- [x] 3. Kemas kini panel penyunting teks di `components/certificates/builder/properties.tsx` kepada `<Textarea rows={2}>`.
- [x] 4. Kemas kini semua 10 templat pra-bina (`ClassicTemplate`, `CorporateTemplate`, dsb.) dan templat warisan dengan `whitespace-pre-line break-words`.
- [x] 5. Jalankan verifikasi ujian automatik (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`).

### Reviu
- **Certificate Renderer & Canvas**: `whiteSpace: 'nowrap'` telah ditukar kepada dinamik (`pre-line` untuk teks & placeholder, `nowrap` untuk lain-lain) berserta `wordBreak: 'break-word'`, membolehkan tajuk program memaparkan 2 baris secara automatik atau mengikut `\n`.
- **Builder & Preview Page**: Kelas `whitespace-nowrap` pada canvas dan halaman preview digantikan dengan `whitespace-pre-line break-words`.
- **Properties Editor**: Input teks kini menggunakan `<Textarea rows={2}>` dengan kebolehan resize y untuk memudahkan pengguna memasukkan tajuk berbilang baris secara langsung.
- **Templat Sijil Pra-Bina**: Kesemua 10 templat sijil (`Classic`, `Corporate`, `Creative`, `Elegant`, `Minimalist`, `Modern`, `Nature`, `Premium`, `Royal`, `Vintage`) dan templat legasi dikemas kini dengan `whitespace-pre-line break-words`.
- **Pengesahan & Deployment**: 206 ujian unit lulus (termasuk ujian multi-line program identifier), 0 lint error, typecheck TypeScript bersih, dan berjaya dideploy ke pengeluaran Vercel (`https://www.klikform.com`).

---

# Auto-Scale Tajuk Panjang & Canva-Style Drag-To-Scale

Memperkemas paparan tajuk panjang pada sijil secara automatik dan menambah kawalan penskalaan interaktif seperti Canva pada E-Cert Builder.

- [x] 1. Cipta modul типоgrafi sijil dengan fungsi `getProgramFontSize` (`components/certificates/types.ts`).
- [x] 2. Kemas kini kesemua 10 templat sijil pra-bina dan templat legasi dengan `getProgramFontSize` dan `[text-wrap:balance]`.
- [x] 3. Kemas kini `components/certificates/renderer/index.tsx` dengan `textWrap: 'balance'` dan `maxWidth: '92%'`.
- [x] 4. Laksanakan pemegang penskalaan Canva (4 bucu + pemegang sisi) serta logik penskalaan fon dan dimensi dalam `app/(dashboard)/certificates/builder/[id]/client.tsx`.
- [x] 5. Tulis ujian unit di `tests/certificate-typography.test.ts` dan jalankan `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
---

# KlikBio — Ciri Linktree / Bio Links ✅ SIAP

Membina ciri mikro-landing page (Link-in-bio) lengkap untuk KlikForm dengan live preview mockup, drag-and-drop links, preset tema, pengurusan profil & media sosial, integrasi QR kod, dan halaman awam responsif.

- [x] 1. Cipta skrip migrasi pangkalan data Supabase `supabase/migrations/20260830000000_add_bio_links.sql` (`bio_pages` dan `bio_links` tables + RLS + indexes).
- [x] 2. Kemas kini jenis TypeScript di `lib/types/bio-links.ts`, `lib/types/subscription.ts`, `lib/constants/subscription-tiers.ts`, dan re-export di `lib/types/index.ts`.
- [x] 3. Cipta modul utiliti & tema di `lib/bio-links/themes.ts`.
- [x] 4. Cipta lapisan storan Supabase CRUD di `lib/storage/bio-links.ts`.
- [x] 5. Cipta Server Actions di `actions/bio-links.ts` (CRUD halaman, pautan, reorder, click tracking).
- [x] 6. Cipta halaman senarai profil dashboard di `app/(dashboard)/bio/page.tsx` dan `client.tsx`.
- [x] 7. Cipta halaman pembina profil interaktif di `app/(dashboard)/bio-builder/[id]/page.tsx` dan `client.tsx` (dengan live mobile preview & `@dnd-kit` sortable).
- [x] 8. Cipta halaman awam di `app/(public)/bio/[username]/page.tsx`, `client.tsx` dan laluan pintas `app/(public)/b/[username]/page.tsx`.
- [x] 9. Kemas kini menu bar sisi di `components/dashboard/sidebar.tsx` dan laluan kawalan keselamatan di `proxy.ts`.
- [x] 10. Tulis ujian unit di `tests/bio-links.test.ts` dan `tests/bio-storage.test.ts`.
- [x] 11. Jalankan pengesahan kualiti (`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`).
- [x] 12. Kemas kini `memory.md` dan `task.md`.

---

## Reviu Pelaksanaan KlikBio

**Skop & Ciri Utama Dihantar**:
1. **Pangkalan Data Supabase**: Jadual `bio_pages` dan `bio_links` dengan integriti kekunci asing (`ON DELETE CASCADE`), indeks laju pada `user_id`, `username`, dan `(bio_page_id, order_index)`, kawalan keselamatan RLS per-pemilik, serta trigger pengemaskinian `updated_at`.
2. **Preset Tema & Reka Bentuk Visual**: 8 tema warna profesional (`Emerald Luxe`, `Onyx Dark`, `Sunset Glow`, `Deep Ocean`, `Minimal Light`, `Lavender Dusk`, `Cyber Neon`, `Midnight Gold`) serta 6 gaya butang (`Full Pill`, `Rounded XL`, `Subtle Round`, `Outline Border`, `Elevated Shadow`, `Glassmorphism`).
3. **Penyusun Pautan Interaktif (Drag & Drop)**: Menggunakan `@dnd-kit` untuk susun atur kad pautan yang lancar, sokongan jenis pautan kustom, pautan terus WhatsApp (dengan mesej awal), pemilihan borang KlikForm secara dinamik, dan pemisah tajuk seksyen (*section header*).
4. **Live Mobile Mockup Preview**: Paparan telefon pintar masa nyata (*instant real-time mockup*) yang mengemas kini perubahan tajuk, bio, avatar, ikon media sosial, tema, dan urutan pautan secara automatik.
5. **Halaman Awam Responsif**: Laluan pantas `/bio/[username]` dan `/b/[username]` dengan metadata OpenGraph/Twitter dinamik, animasi `framer-motion`, penjejakan klik (*click tracking*), dan dialog perkongsian Kod QR.
6. **Kawalan Had Langganan**: Gating automatik (`maxBioPages: 1` untuk Pelan Percuma, `-1` tanpa had untuk Pro & Enterprise).
7. **Pengesahan & Ujian Kualiti**:
   - `npm run typecheck` — 0 ralat TypeScript.
   - `npm run lint` — 0 amaran ESLint.
   - `npm test` — 224 / 224 ujian lulus merentas 28 suite ujian.
   - `npm run build` — 49 laluan dikompilasi bersih dengan Next.js 16 (Turbopack).

---

# Bug Fix: Glassmorphism & Button Style Contrast (2026-09-03)

Isu: Bila pengguna memilih gaya butang "Glassmorphism" (terutamanya pada tema cerah "Minimal Light" dan pautan dengan "Highlight Animation"), teks tajuk pautan menjadi putih di atas latar belakang putih/lutsinar sehingga tidak kelihatan langsung ("tak nampak tulisan").

- [x] 1. Cipta fungsi penentu gaya butang pintar `getBioButtonClass` di `lib/bio-links/themes.ts` yang menyelaraskan warna teks dan tahap lutsinar latar belakang berasaskan tema (cerah vs gelap), bentuk butang, dan status highlight.
- [x] 2. Kemas kini `BUTTON_STYLES` di `lib/bio-links/themes.ts` untuk memastikan gaya `outline` dan `glass` mempunyai corner radius yang betul tanpa pertembungan warna teks.
- [x] 3. Kemas kini Live Mobile Mockup di `app/(dashboard)/bio-builder/[id]/client.tsx` untuk menggunakan `getBioButtonClass`.
- [x] 4. Kemas kini Halaman Awam KlikBio di `app/(public)/bio/[username]/client.tsx` untuk menggunakan `getBioButtonClass`.
- [x] 5. Tambah ujian unit di `tests/bio-links.test.ts` bagi mengesahkan kontras teks pada gaya `glass`, `outline`, dan tema cerah/gelap dengan atau tanpa highlight.
- [x] 6. Jalankan pengesahan kualiti (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`).
- [x] 7. Kemas kini `memory.md`, `lessons.md` dan `task.md`.

---

## Reviu Bug Fix: Glassmorphism Contrast
- **Punca Masalah**:
  1. `BUTTON_STYLES['glass'].class` sebelum ini mengandungi kelas `bg-white/10 border border-white/20` yang digabungkan terus secara rentetan (*string concatenation*) dengan `theme.highlightButtonClass` atau `theme.buttonClass`.
  2. Apabila tema cerah seperti "Minimal Light" (`bg-slate-100`) dipilih dan pautan mempunyai status highlight aktif (`highlight: true`), `highlightButtonClass` menyuntik `text-white` (kerana asalnya direka untuk butang legap gelap `bg-slate-900`).
  3. Kelas `bg-white/10` daripada Glassmorphism mengatasi warna latar belakang gelap, meninggalkan teks `text-white` di atas latar belakang butang putih separa lutsinar dan skrin kelabu cerah (#f1f5f9). Ini menyebabkan teks "klikform" berwarna putih tulen `rgb(255,255,255)` dan langsung tidak kelihatan.
- **Penyelesaian**:
  1. Dicipta fungsi `getBioButtonClass(theme, buttonStyle, isHighlight)` di `lib/bio-links/themes.ts` yang pintar mengira kelas Tailwind berasaskan kontras tema:
     - Untuk tema cerah (`minimal`), gaya `glass` kini menggunakan latar belakang kaca frosted berkontras tinggi (`bg-white/70` atau `bg-white/90`) dengan teks gelap yang jelas (`text-slate-900` atau `text-slate-950 font-bold`).
     - Untuk tema gelap, gaya `glass` mengekalkan frosted glass estetik (`bg-white/10` atau `bg-white/20`) dengan teks putih/aksen tema yang berkontras tinggi.
     - Gaya `outline` turut diselaraskan supaya tidak menghasilkan teks putih di atas latar lutsinar pada tema cerah.
  2. Kedua-dua komponen pemaparan (`MobileMockupView` di builder dan `PublicBioClient` di halaman awam) kini menggunakan `getBioButtonClass`.
  3. Ujian unit ditambah di `tests/bio-links.test.ts` untuk memastikan teks pada tema cerah tidak sesekali mengandungi `text-white`.
  4. 230 / 230 ujian unit lulus (28 suite ujian), 0 ralat lint, typecheck bersih, build Next.js 16 bersih.

---

# Bug Fix: Share / QR Modal Button Overflow (2026-09-03)

Isu: Butang "Copy Link" terkeluar (*overflow*) ke bahagian luar sebelah kiri modal "Share @username" pada paparan desktop.

- [x] 1. Baiki susun atur butang dalam Dialog Modal di `app/(public)/bio/[username]/client.tsx` dengan menggunakan grid `grid-cols-2` yang terhad di dalam kad modal, mengelakkan pertembungan kelas `DialogFooter` (`sm:flex-row sm:justify-end`).
- [x] 2. Baiki susun atur butang dalam Dialog Modal di `app/(dashboard)/bio/client.tsx` (kod serupa).
- [x] 3. Jalankan pengesahan kualiti (`npm run typecheck`, `npm run lint`, `npm test`).
- [x] 4. Kemas kini `lessons.md`, `memory.md`, dan `task.md`.
- [x] 5. Deploy perubahan ke Vercel Production.

---

## Reviu Bug Fix: Share / QR Modal Button Overflow
- **Punca Masalah**:
  1. `DialogFooter` daripada shadcn mengandungi kelas lalai `sm:flex-row sm:justify-end`.
  2. Komponen `Button` mempunyai kelas `shrink-0` (`flex-shrink: 0`), dan setiap butang di dalam dialog diberi kelas `w-full` (100% lebar).
  3. Dalam modal sempit `sm:max-w-xs` (320px), dua butang `w-full` dengan `shrink-0` memerlukan lebih 540px jika diletakkan bersebelahan secara mendatar (`sm:flex-row`).
  4. Oleh sebab `sm:justify-end` menyusun anak elemen ke kanan (`justify-content: flex-end`), butang kedua ("Save QR") berada di sebelah kanan di dalam dialog, manakala butang pertama ("Copy Link") ditolak sejauh ~260px melimpah keluar (*overflow*) ke sebelah kiri skrin.
- **Penyelesaian**:
  1. Menggantikan `DialogFooter` yang bersifat flex-end dengan grid semulajadi `<div className="grid grid-cols-2 gap-2 w-full pt-1">`.
  2. Meningkatkan saiz dialog daripada `sm:max-w-xs` (320px) kepada `sm:max-w-sm` (384px) untuk ruang bernafas dan susun atur yang lebih kemas.
  3. Memperbaiki kedua-dua fail: `app/(public)/bio/[username]/client.tsx` dan `app/(dashboard)/bio/client.tsx`.

---

# KlikBio — Corak Latar Belakang (Background Patterns)

Membolehkan pengguna memilih corak latar belakang (dots, grid, stripes, waves, crosses, stars, circuit, atau none) untuk halaman KlikBio mereka dengan sokongan kontras pintar bagi tema cerah dan gelap.

- [x] 1. Tambah `BioPattern` dalam `lib/types/index.ts` (barrel export).
- [x] 2. Kemas kini `lib/bio-links/themes.ts`: eksport `BIO_PATTERNS` dan `getBioPatternStyle(pattern, theme)`.
- [x] 3. Kemas kini `app/(dashboard)/bio-builder/[id]/client.tsx`:
  - Tambah bahagian pemilih corak latar belakang pada Tab "Design & Theme".
  - Paparkan corak latar belakang pada `MobileMockupView`.
- [x] 4. Kemas kini `app/(public)/bio/[username]/client.tsx`: paparkan corak latar belakang pada `PublicBioClient`.
- [x] 5. Tulis ujian unit di `tests/bio-links.test.ts` untuk `getBioPatternStyle`.
- [x] 6. Pengesahan kualiti: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- [x] 7. Commit conventional commit & deploy ke Vercel Production.
- [x] 8. Kemas kini `memory.md` dan `task.md`.

---

## Reviu Ciri Corak Latar Belakang KlikBio

**Ringkasan Pelaksanaan**:
1. **Pilihan Corak (8 Corak)**:
   - `none`: Latar belakang rata tanpa corak.
   - `dots`: Polka Dots halus (`radial-gradient`).
   - `grid`: Modern Grid (`linear-gradient`).
   - `stripes`: Diagonal Stripes (`repeating-linear-gradient`).
   - `waves`: Topography Waves (vektor kontur SVG data URI).
   - `crosses`: Minimal Crosses (tanda tambah geometri SVG data URI).
   - `stars`: Starry Sparkles (kerlipan bintang SVG data URI).
   - `circuit`: Tech Circuit (papan litar digital SVG data URI).
2. **Kawalan Kontras Pintar Berasaskan Tema**:
   - Fungsi `getBioPatternStyle(pattern, theme)` mengesan sama ada tema aktif adalah cerah (`minimal`) atau gelap/warna terang (`emerald`, `dark`, `sunset`, dll.).
   - Tema cerah menggunakan dakwat gelap legap rendah (`rgba(15, 23, 42, 0.04 - 0.09)`), manakala tema gelap menggunakan dakwat putih lembut (`rgba(255, 255, 255, 0.06 - 0.14)`).
   - Semua lapisan corak menggunakan `pointer-events-none` supaya tidak menghalang interaksi, klik pautan, mahupun skrol.
3. **Penyatuan UI Builder & Halaman Awam**:
   - Tab 2 (Design & Theme) di `bio-builder/[id]` dilengkapi kad interaktif "Background Patterns / Corak Latar" dengan preview langsung setiap corak menggunakan warna tema semasa pengguna.
   - `MobileMockupView` memaparkan corak latar secara langsung di skrin telefon mockup.
   - Halaman awam `/bio/[username]` memaparkan corak tetap (`fixed inset-0`) sebagai tekstur latar yang anggun.
4. **Pengesahan & Deployment**:
   - `npm test`: 235 / 235 ujian unit lulus (28 suite ujian).
   - `npm run typecheck`: 0 ralat TypeScript.
   - `npm run lint`: 0 amaran linter.
   - `npm run build`: Kompilasi Turbopack Next.js 16 bersih (49 laluan).
   - Git Commit: `5e6fbe7` dipush ke `origin master`.
   - Vercel Production: `dpl_7pV17fX4R8mjatScQiiDn7hYCiCh` (`https://www.klikform.com`).

---

# Bug Fix: 404 Page Not Found Bila Tekan Pautan Borang KlikForm di KlikBio (2026-09-06)

Isu: Pengguna mendapati bila menekan pautan borang KlikForm ("klikform form") pada halaman KlikBio, paparan menunjukkan ralat 404 "Page not found".

- [x] 1. Kenal pasti punca asal ralat 404 (laluan `/form/[id]` hanya menyokong UUID pangkalan data dan menolak `short_code`, manakala `bio-builder` menyimpan `/form/${chosenForm.shortCode}`).
- [x] 2. Bina helper `getFormByIdOrShortCode` dalam `lib/storage/forms.ts` (menggunakan `cache()` dan pengesanan regex UUID untuk mencari borang secara pintar mengikut ID UUID atau short code tanpa ralat PostgreSQL).
- [x] 3. Kemas kini `app/(public)/form/[id]/page.tsx` untuk menggunakan `getFormByIdOrShortCode` bagi `generateMetadata` dan `PublicFormPage`.
- [x] 4. Kemas kini `app/(public)/s/[code]/page.tsx` untuk menggunakan `getFormByIdOrShortCode` supaya kedua-dua laluan `/form/...` dan `/s/...` menyokong kedua-dua format ID dan short code.
- [x] 5. Kemas kini `app/(dashboard)/bio-builder/[id]/client.tsx` untuk menjana pautan `/s/${shortCode}` secara piawai, dan membetulkan pengesanan pemilihan borang dalam dropdown.
- [x] 6. Kemas kini `app/(public)/bio/[username]/client.tsx` untuk membuka pautan borang dalam tab baharu (`target="_blank"`) bagi mengekalkan halaman bio pelawat.
- [x] 7. Tulis ujian unit dalam `tests/form-lookup.test.ts`.
- [x] 8. Pengesahan kualiti: `npm test` (239/239 lulus), `npm run typecheck` (0 ralat), `npm run lint` (0 amaran), `npm run build` (bersih).
- [x] 9. Commit conventional commit & deploy ke Vercel Production.
- [x] 10. Kemas kini `memory.md`, `lessons.md`, dan `task.md`.

---

## Reviu Pembaikan Ralat 404 Pautan Borang KlikBio

**Punca Masalah**:
1. Apabila pengguna memilih borang di bawah blok jenis "KlikForm Form" dalam Bio Builder, kod menetapkan pautan kepada `/form/${chosenForm.shortCode || chosenForm.id}`.
2. Kerana kebanyakan borang mempunyai `shortCode` (cth: `daftarkursus`), pautan yang dijana adalah `/form/daftarkursus`.
3. Di sisi pelayan, laluan `app/(public)/form/[id]/page.tsx` hanya memanggil `getFormById(id)` di mana lajur `forms.id` adalah jenis UUID PostgreSQL.
4. Nilai `short_code` bukan UUID, menyebabkan carian PostgreSQL gagal (ralat 22P02) dan mengembalikan `undefined`, lalu memicu `notFound()` yang memaparkan skrin 404 "Page not found".
5. Pautan borang sedia ada yang telah disimpan oleh pengguna dalam profil KlikBio mereka turut terjejas dengan ralat 404 ini.

**Penyelesaian & Pencegahan Menyeluruh**:
1. **Penyelesai Dwifungsi Pintar (`getFormByIdOrShortCode`)**:
   - Dicipta fungsi `getFormByIdOrShortCode(identifier)` dalam `lib/storage/forms.ts` dibungkus dengan React `cache()`.
   - Mengesan sama ada rentetan adalah format UUID menggunakan regex (`UUID_REGEX`). Jika UUID, carian ID dijalankan dahulu dengan fallback kepada short code; jika bukan UUID, carian short code dijalankan dahulu dengan fallback kepada ID.
   - Mengelakkan ralat PostgreSQL uuid syntax sama sekali.
2. **Kemas Kini Laluan Borang Awam**:
   - `app/(public)/form/[id]/page.tsx`: Kini menggunakan `getFormByIdOrShortCode` dalam kedua-dua `generateMetadata` dan `PublicFormPage`.
   - `app/(public)/s/[code]/page.tsx`: Turut menggunakan `getFormByIdOrShortCode` untuk fallback pencarian borang.
   - Hasilnya: Sama ada pelawat mengakses `/form/[short_code]`, `/form/[uuid]`, `/s/[short_code]`, atau `/s/[uuid]`, borang sentiasa ditemui dan dimuatkan serta-merta tanpa 404!
3. **Penyelarasan URL & UX Bio Builder**:
   - Di `app/(dashboard)/bio-builder/[id]/client.tsx`, pemilihan borang kini menjana pautan `/s/${shortCode}` secara piawai.
   - Pautan `type === 'link'` dinormalisasikan secara automatik dengan prefix `https://` jika pengguna tidak memasukkan protokol.
   - Di `app/(public)/bio/[username]/client.tsx`, pautan borang dibuka dalam tab baharu (`target="_blank"`) supaya pelawat tidak kehilangan direktori halaman bio asal mereka.
4. **Kualiti & Ujian**:
   - Ditambah ujian unit baharu di `tests/form-lookup.test.ts` (4 ujian).
   - `npm test`: 239/239 ujian unit lulus merentas 29 suite ujian.
   - `npm run typecheck` & `npm run lint`: 0 ralat / 0 amaran.
   - `npm run build`: Kompilasi Turbopack Next.js 16 bersih (49 laluan).
   - Deployment Vercel Production: `dpl_6AwDtoTQjEM2k9GKSfPAWeeQwGoz` (`https://www.klikform.com`).

---

# Penambahbaikan Menyeluruh E-Cert Builder (2026-09-07)

Penambahbaikan menyeluruh sistem penyunting sijil (E-Cert Builder) merangkumi pembaikan pautan navigasi, sokongan eksport PDF A4, pilihan templat permulaan, aset hiasan (cop emas, bingkai, dwi-tandatangan), font kaligrafi, placeholder tambahan, dan alat penjajaran pintar.

- [x] 1. **Navigasi & Eksport PDF A4 (Toolbar & Output)**
  - [x] 1.1 Baiki pautan toolbar: tukar `/ecert/builder` → `/certificates/builder` dan preview link.
  - [x] 1.2 Tambah fungsi dan butang `Eksport PDF (A4)` di sebelah Eksport PNG menggunakan `canvasToPdfBlob` / `jsPDF`.
  - [x] 1.3 Tambah toggle dan render garisan panduan sempadan cetakan selamat (*Print Safe Margin / Bleed Guide*).
- [x] 2. **Koleksi Templat Permulaan (Preset Templates)**
  - [x] 2.1 Bina modul definisi templat pra-bina `lib/certificates/presets.ts` (Blank, Royal Gold, Corporate Blue, Academic School, Modern Workshop, Luxury Dark).
  - [x] 2.2 Kemas kini `NewCertificateDialog` dengan galeri pilihan templat visual (kad templat, ikon, dan deskripsi).
  - [x] 2.3 Kemas kini `createCertificateTemplateAction` untuk menyuntik elemen reka bentuk lengkap daripada preset yang dipilih.
- [x] 3. **Aset Hiasan Rasmi Sijil & Font Kaligrafi**
  - [x] 3.1 Tambah pilihan Cop Rasmi / Lencana (Gold Seal Badges) dan Bingkai Sijil (Decorative Borders) dalam `sidebar.tsx`.
  - [x] 3.2 Tambah koleksi Google Fonts kaligrafi dan sijil (*Alex Brush, Pinyon Script, Great Vibes, Cormorant Garamond, Cinzel Decorative*) dalam `properties.tsx`.
  - [x] 3.3 Suntik Google Fonts stylesheet dalam kanvas editor, preview, dan renderer untuk paparan konsisten merentas peranti.
- [x] 4. **Placeholder Tambahan & Preset Dwi-Tandatangan**
  - [x] 4.1 Tambah jenis placeholder baharu: `{organisasi}`, `{peranan}`, `{gred}` dalam `lib/types/certificates.ts` dan `sidebar.tsx`.
  - [x] 4.2 Tambah fungsi dan butang pantas "Dwi-Tandatangan" (Dual Signatories) di sidebar.
  - [x] 4.3 Kemas kini `CertificateRenderer` dan `bulk/client.tsx` untuk menyokong pemetaan data placeholder baharu.
- [x] 5. **Alat Penjajaran Pintar Canva-Style (Align & Distribute)**
  - [x] 5.1 Tambah butang *Pusat ke Kanvas* (*Center Horizontally / Vertically*) dalam panel properties.
  - [x] 5.2 Tambah fungsi dan butang *Align & Distribute* bagi pilihan berbilang elemen (*multi-selection*).
- [x] 6. **Ujian Unit & Pengesahan Kualiti**
  - [x] 6.1 Tulis ujian unit baharu di `tests/certificate-presets.test.ts`.
  - [x] 6.2 Jalankan `npm test` (252 / 252 ujian lulus merentas 30 suites).
  - [x] 6.3 Jalankan `npm run typecheck` & `npm run lint` (0 ralat, 0 amaran).
  - [x] 6.4 Jalankan `npm run build` untuk mengesahkan kompilasi Next.js 16 (bersih, 49 laluan).

---

## Reviu Penambahbaikan Menyeluruh E-Cert Builder

**Skop & Ciri Utama Dihantar**:
1. **Navigasi & Sedia-Cetak PDF A4**:
   - Membetulkan pepijat pautan navigasi `Toolbar`: menggantikan `/ecert/builder` lapuk dengan `/certificates/builder` dan laluan preview yang sah.
   - Menambah butang `PDF (A4)` pada toolbar yang memproses snapshot HD kanvas (skala 3x) ke dalam dokumen A4 landskap (297mm x 210mm) dengan mampatan pantas JPEG 0.85 melalui `jsPDF`.
   - Menambah toggle sempadan selamat cetakan fizikal (*Safe Margin / Bleed Guide* 36px) dengan garisan amaran emas lembut yang tidak disertakan dalam cetakan/muat turun sebenar.
2. **Galeri Templat Pra-Bina (6 Preset Rasmi)**:
   - Dicipta modul `lib/certificates/presets.ts` dengan 6 templat reka bentuk sedia guna:
     - `Blank Canvas`: Kanvas kosong sedia untuk kustomisasi manual.
     - `Royal Gold Excellence`: Tema emas mewah klasik sesuai untuk anugerah cemerlang dan majlis konvokesyen.
     - `Corporate Blue Professional`: Tema biru korporat moden untuk sijil penghargaan organisasi dan syarikat.
     - `Academic Classic`: Reka bentuk bersempadan hijau zamrud untuk pencapaian persekolahan dan universiti.
     - `Modern Workshop`: Reka bentuk oren/amber cergas untuk latihan kemahiran, bengkel, dan seminar.
     - `Luxury Dark Edition`: Tema hitam-emas elegan untuk pengiktirafan VIP, penaja, dan malam gala.
   - Dialog "Cipta Templat Baharu" (`NewCertificateDialog`) dinaik taraf dengan tab visual yang memaparkan reviu mini, palet warna, dan penerangan kategori.
   - `createCertificateTemplateAction` menyuntik kesemua elemen preset secara automatik ke dalam pangkalan data.
3. **Aset Hiasan Rasmi & Tipografi Kaligrafi**:
   - Ditambah lencana/cop rasmi emas (*Gold Seal Badges*): Cop Emas Anugerah, Lencana Pengesahan Lulus, Perisai Sahih, dan Piala Penghargaan.
   - Ditambah butang pantas "Tambah Bingkai Sijil Emas" bersempadan berganda klasik.
   - Pilihan Google Fonts kaligrafi rasmi: *Alex Brush, Pinyon Script, Great Vibes, Cormorant Garamond, Cinzel Decorative, Dancing Script*.
   - Suntikan pautan Google Fonts secara global merentas editor, preview, dan renderer sijil.
4. **Placeholder Tambahan & Dwi-Tandatangan**:
   - Ditambah sokongan placeholder dinamik `{organisasi}`, `{peranan}`, dan `{gred}` merentas editor, preview, penyesuaian CSV pukal (*bulk generation*), dan renderer sijil.
   - Ditambah butang pintar "Preset Dwi-Tandatangan" untuk menghasilkan dua blok tandatangan seimbang (cth: Pengarah & Pengerusi) dengan satu klik.
5. **Alat Penjajaran Pintar Canva-Style (Align & Distribute)**:
   - Modul tulen `lib/certificates/alignment.ts` menyediakan penjajaran ke kanvas (Pusat X / Pusat Y) dan penjajaran berbilang elemen (Kiri, Pusat, Kanan, Atas, Tengah, Bawah, serta pengagihan jarak mendatar/menegak sama rata).
6. **Pengesahan & Kualiti**:
   - Ujian unit baharu di `tests/certificate-presets.test.ts` (13 ujian).
   - 252 / 252 ujian lulus (30 suites).
   - Typecheck TypeScript bersih (0 ralat).
   - ESLint bersih (0 amaran).
   - Next.js 16 build bersih (49 routes).

---

# Pengoptimuman E-Cert Builder Untuk Skrin Komputer Riba 14 Inci (2026-09-07)

Memperbaiki susun atur studio rekaan e-Sijil pada skrin 14 inci (dan komputer riba) dengan menyingkirkan halangan bar sisi luar, melaksanakan penskalaan muat skrin automatik (*fit-to-screen*), kawalan zum Canva-style, dan menghapuskan ralat *flexbox clipping* serta dwi-scrollbar.

- [x] 1. Cipta komponen pelindung `DashboardShell` di `components/dashboard/dashboard-shell.tsx` yang menyembunyikan `DashboardSidebar` & `SubscriptionBanner` serta membuang dwi-scrollbar apabila pengguna berada di studio builder `/certificates/builder/[id]` (100vw x 100vh).
- [x] 2. Kemas kini `app/(dashboard)/layout.tsx` untuk menggunakan `DashboardShell`.
- [x] 3. Kemas kini `app/(dashboard)/certificates/builder/[id]/client.tsx`:
  - Laksanakan `ResizeObserver` untuk mengukur bekas kerja dan mengira `fitScale` automatik.
  - Tetapkan dimensi kanvas berdasarkan saiz ruang supaya sijil (landskap & potret) sentiasa muat 100% tanpa perlu skrol.
  - Gantikan `items-center justify-center` dengan `m-auto` bagi menghalang *negative coordinate clipping* pada bahagian atas dan kiri sijil.
  - Tambah bar kawalan zum terapung Canva-style di bahagian bawah (`-`, `Muat Skrin`, `+`, `100%`).
  - Tambah togol sembunyi/buka bar sisi elemen (*collapsible sidebar*).
- [x] 4. Kemas kini `components/certificates/builder/toolbar.tsx` agar butang lebih responsif pada skrin sempit dan tambah butang togol bar sisi (`PanelLeft`).
- [x] 5. Kemas kini `actions/certificate-template.ts` agar koordinat elemen lalai `DEFAULT_ELEMENTS` berpusat tepat pada $X = 561$.
- [x] 6. Jalankan pengesahan kualiti (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`).
- [x] 7. Deploy ke Vercel Production dan sahkan hasil.

---

## Reviu Pengoptimuman E-Cert Builder Untuk Skrin Komputer Riba 14 Inci

**Punca Masalah**:
1. **Ruang Kerja Terhimpit**: Pada skrin komputer riba 14 inci (lazimnya 1280px atau 1366px lebar viewport), bar sisi navigasi utama KlikForm (`w-64` / 256px) kekal terpapar di sebelah kiri, memakan ruang kanvas dan memampatkan reka bentuk.
2. **Ketiadaan Penskalaan Muat Skrin (Fit-to-Screen)**: Kanvas sebelum ini menggunakan `w-full max-w-[800px]` (atau `max-w-[500px]`) dan `aspectRatio` tanpa sekatan ketinggian. Pada ketinggian skrin 14 inci (~450px - 530px ruang kerja bersih), kanvas potret dengan ketinggian 700px+ melimpah keluar secara menegak.
3. **Flexbox Clipping Sisi Negatif**: Pemusatan `items-center justify-center` bersama `overflow-auto` menyebabkan separuh daripada limpahan elemen ditolak ke koordinat $Y < 0$, menyebabkan teks atas dan bingkai atas terpotong secara kekal kerana pelayar web tidak membenarkan skrol ke ruang negatif.
4. **Dwi-Scrollbar Bertindih**: Ketinggian `h-screen` pada halaman berserta `SubscriptionBanner` dan `overflow-y-auto` pada `layout.tsx` menghasilkan dua bar skrol bertindih.

**Penyelesaian Yang Dilaksanakan**:
1. **Studio Shell 100vw x 100vh Pintar (`DashboardShell`)**:
   - Dicipta `components/dashboard/dashboard-shell.tsx` yang mengesan laluan `/certificates/builder/[id]` (termasuk `/preview` dan `/bulk`).
   - Menyembunyikan bar sisi papan pemuka luar (`DashboardSidebar`) dan amaran langganan secara automatik untuk memberikan kanvas keluasan studio 100% tanpa sebarang halangan atau dwi-scrollbar.
   - Apabila pengguna menekan butang `[ ← ]`, mereka kembali ke senarai sijil di mana bar sisi dashboard dipaparkan semula secara normal.
2. **Penskalaan Muat Skrin Pintar (*Auto Fit-to-Screen*)**:
   - `ResizeObserver` mengukur dimensi sebenar ruang kerja `containerRef`.
   - Mengira `fitScale = Math.min((availWidth / template.width), (availHeight / template.height))`.
   - Menetapkan kedua-dua `width` dan `height` kanvas secara dinamik. Keseluruhan sijil kini muat 100% di tengah skrin secara automatik tanpa perlu diskrol, sama ada dalam mod Landskap mahupun Potret!
3. **Penyelesaian Flexbox Safe Centering (`m-auto`)**:
   - Menggantikan `items-center justify-center` dengan `m-auto` pada anak flexbox. Jika saiz kanvas lebih kecil dari bekas, ia berpusat secara automatik; jika dizum melebihi skrin, ia berlabuh pada (0,0) dan membolehkan skrol semula jadi ke bawah dan ke kanan tanpa sebarang *clipping* pada bahagian atas atau kiri.
4. **Bar Kawalan Zum Terapung (Canva-Style)**:
   - Disediakan bar zum terapung di bahagian bawah:
     - `[ - ]`: Zum keluar (skala berkurang 10%).
     - `[ Muat Skrin (Fit) ]`: Menetapkan semula paparan muat skrin penuh optimum mengikut saiz tingkap semasa.
     - `[ + ]`: Zum masuk (skala bertambah 10%).
     - `[ 100% ]`: Paparan saiz sebenar 1:1.
5. **Togol Bar Sisi Elemen (*Collapsible Sidebar*)**:
   - Butang `PanelLeft` ditambah pada toolbar untuk membolehkan pengguna menyembunyikan/membuka bar sisi elemen pada bila-bila masa bagi ruang kerja yang lebih luas.
6. **Orientasi Pintar & Koordinat Berpusat**:
   - Pertukaran orientasi Landskap ↔ Potret kini menskalakan koordinat elemen ($X$ dan $Y$) secara berkadar terus supaya elemen kekal berpusat dan tidak terkeluar dari sempadan kanvas.
   - `DEFAULT_ELEMENTS` dikemas kini dengan koordinat berpusat tepat pada $X = 561$ (1123 / 2).
- [x] Pengindahan Gaya Hover & Pilihan Elemen (Hover & Selection Styling) di E-Cert Builder:
  - [x] 1. Rombak keadaan pilihan (*selected state*): Hapuskan pertindihan dwi/tiga garisan sempadan (buang `ring-2 ring-primary ring-offset-2` luar yang bertindih dengan kotak pilihan dalam).
  - [x] 2. Rombak gaya pemegang skala (*Canva-style handles*):
    - Pusatkan pemegang secara tepat pada bucu menggunakan `translate` (bukan koordinat *hardcoded*).
    - Gunakan pemegang bulatan putih bersih dengan sempadan nipis 1.5px dan bayang halus `shadow-sm`.
    - Gunakan pemegang pil menegak/mendatar yang kemas pada sisi kiri, kanan, atas, dan bawah.
  - [x] 3. Perhalusi elemen pemboleh ubah (*placeholder*):
    - Apabila dipilih (*selected*): buang kotak *dashed* dalam dan warna latar ungu supaya teks kelihatan bersih dalam bingkai pilihan.
    - Apabila tidak dipilih (*unselected*): gantikan kotak tebal kasar ungu dengan garisan *dashed* halus yang elegan (`border-dashed border-primary/30 bg-primary/[0.03]`).
    - Sembunyikan sempadan pemboleh ubah sepenuhnya sewaktu eksport PNG/PDF.
  - [x] 4. Tingkatkan keadaan *hover*: Tambah sorotan bingkai halus (*smooth primary outline/ring highlight*) dengan transisi lancar pada elemen yang tidak dipilih.
  - [x] 5. Sahkan kualiti (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`).
  - [x] 6. Deploy ke Vercel production dan kemas kini dokumentasi.
