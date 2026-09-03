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
