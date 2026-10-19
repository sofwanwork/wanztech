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
| `forms` | Form definitions (fields, settings, theme, `is_active`, `receive_email_notifications`, `redirect_buttons`) |
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
- **Public Certificate Preview UI & Gap Elimination (2026-10-19)**:
  - Eliminated "lopong putih" (white bands/gaps) caused by shadcn `Card` default `py-6 gap-6` by applying `p-0 gap-0 overflow-hidden` on the card container.
  - Replaced flat unstyled `bg-gray-200` canvas with a modern studio workbench featuring a subtle dot matrix (`radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)`).
  - Floating paper drop shadow (`shadow-[0_20px_50px_rgba(0,0,0,0.16),0_4px_16px_rgba(0,0,0,0.08)]`) and micro border ring (`ring-1 ring-black/10`).
  - Added interactive toolbar with Zoom Out (`-`), Fit (`Fit`), Zoom In (`+`), and Fullscreen HD Preview Modal (`Dialog`).
  - Added human-readable date formatting (`October 7, 2026` instead of raw ISO timestamp `2026-10-07T02:05:47.358Z`).
  - Added download generation spinners (`downloadingPdf` / `downloadingPng`) with instant tactile feedback.
  - Fixed "Download PNG" contrast issue in HD Preview Modal: Replaced `variant="outline"` (which injected white `bg-background` underneath `text-slate-200`) with high-contrast `bg-white text-slate-900 border border-slate-200 font-semibold`.
  - Added dedicated Zoom Out (`-`), Fit / 150%, and Zoom In (`+`) controls inside the HD Fullscreen Modal (`modalZoomMultiplier` up to 250%) for inspecting certificate details.
  - Balanced Header Typography: Eliminated orphaned words on line 2 (e.g. dangling `2026)`) by applying `[text-wrap:balance]`, `leading-snug sm:leading-tight`, and `max-w-3xl sm:max-w-4xl mx-auto` on the page heading (`app/(public)/check/[formId]/client.tsx` and `app/(public)/verify/[id]/client.tsx`).
  - Stealth Scrollbar Architecture (2026-10-19): Completely hid native Windows/Chromium scrollbars in HD Preview Modal, workbench canvas, and Dashboard Sidebar navigation (`no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain`) while preserving smooth touch/wheel panning; refined `baseModalScale` geometry and compact sidebar spacing (`py-5 px-3 space-y-1.5`) to eliminate visual clutter on 14-inch laptop viewports.
  - Form Card 14-Inch Grid & Date Wrap Polish (2026-10-19): Eliminated awkward 3-line vertical date wrapping ("Oct / 2, / 2026") on 14-inch laptop screens by adding `whitespace-nowrap shrink-0` to the date badge, tightening footer button padding (`px-3`), aligning the forms dashboard grid to `lg:grid-cols-3 2xl:grid-cols-4` (comfortable ~320px width per card on laptops, matching `/certificates` and `/bio`), and decoding raw HTML entities (`&nbsp;`, `&amp;`) in `stripHtml` for clean card previews.
  - Dialog Dual-Scrollbar Elimination (2026-10-19): Eliminated dual nested scrollbars in "Create New Certificate" modal (`components/certificates/new-certificate-dialog.tsx`) by equipping `DialogContent` with `overflow-hidden`, adding `min-h-0` to flex child containers (`form`, `Tabs`), suppressing inner `TabsContent` scrollbars with `no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain`, and injecting universal `no-scrollbar` into `components/ui/dialog.tsx`.
  - Multi-Day Date String Support (2026-10-19): Upgraded `CertificateTemplate` in `components/certificate-template.tsx` to safely handle custom/multi-day date strings (e.g. `7, 8 Oktober 2027` or `7 - 8 Oktober 2027`) by falling back to the raw string if `new Date(date)` is NaN, preventing `Invalid Date` crashes and allowing flexible event dates.
  - Explicit Date / Tarikh Google Sheet Column Priority for Certificates (2026-10-19): Upgraded `checkCertificateByICOrEmail` in `actions/certificates.ts` to prioritize explicit `tarikh` or `date` columns over the generic submission `timestamp` (which previously always matched at index 0 and masked user-added `Tarikh` columns in Google Sheets). The expiration check now isolates the submission `timestamp` to ensure custom multi-day strings (e.g. `7 & 8 Oktober 2026`) never fail expiration validation.
  - Vercel Production Deployment (2026-10-19): Deployment `dpl_FbNwhWi5jgxeGyipj3G78EHcqS2L` pushed live to `https://www.klikform.com` (`https://klikform-pypls9uzl-sofwan-jailanis-projects.vercel.app`). 393/393 unit tests passed across 40 suites, 0 lint/tsc errors, clean 58 routes. Commit `37f6352` active.
  - Multi-Day Attendance Certificate Claiming (2026-10-19): Shipped per-day certificate claiming for multi-day events in `app/(public)/check/[formId]/client.tsx`, `actions/certificates.ts`, and `lib/forms/attendance.ts`. When a form has `totalDays > 1` or a participant attends multiple days, `buildDailyCertificateOptions` generates individual day options (`Hari 1`, `Hari 2`, etc. with each day's specific date) plus a combined full-event option (`Semua Hari (Penuh)`). The check page displays interactive selector tabs and list cards allowing participants to preview and download distinct certificates for each day attended with tailored filenames (`Certificate_[Name]_Hari_1.pdf`) and toasts. Backed by 8 new unit tests in `tests/certificate-multiday-options.test.ts` (401/401 tests pass).
  - Vercel Production Deployment (2026-10-19): Deployment `dpl_ETVCkKYAQkCuSj4pLyX6zGjxvJ3Y` pushed live to `https://www.klikform.com` (`https://klikform-i96m66rdb-sofwan-jailanis-projects.vercel.app`). 401/401 unit tests passed across 41 suites, 0 lint/tsc errors, clean 58 routes. Commit `c43cb00` active.
  - Public Form Description Mobile View Polish (2026-10-19): Improved form description typography and paragraph layout on mobile viewports (`app/(public)/form/[id]/client.tsx`). Replaced `[&>p]:mb-0` (which stripped all paragraph margins and collapsed wrapped text into a confusing single block) with responsive paragraph spacing `[&>p:not(:last-child)]:mb-2.5 sm:[&>p:not(:last-child)]:mb-2`, `[&>p:empty]:h-2 [&>p:empty]:mb-0`, mobile-adapted font size and leading (`text-sm sm:text-base leading-relaxed text-slate-600 mt-3.5 sm:mt-4`), and high-contrast bold labels (`[&_strong]:font-bold [&_strong]:text-slate-900 [&_b]:font-bold [&_b]:text-slate-900`). Metadata details (Tarikh, Masa, Tempat) are now cleanly structured with clear visual breathing room on all screen sizes. Verified locally (401/401 unit tests, 0 lint/tsc errors, clean Next.js 16 build). Deployment held pending user confirmation.
  - Section Separator & Rating Scale Mobile Polish (2026-10-19): Improved mobile view layout for section separators and linear rating scales in `app/(public)/form/[id]/client.tsx`. (1) Created `lib/forms/scale-guide.ts` to detect user-typed ASCII scale diagrams (e.g. `1----------------------> 6 Sangat tidak setuju          Sangat Setuju`) and render an adaptive visual card `( 1 ) ────────► ( 6 )` with pill badges, connecting gradient arrow, and min/max labels below that never wraps or breaks into jagged hyphens on narrow mobile screens. Enhanced separator card with `border-l-4 border-l-primary/80` accent. (2) Fixed linear rating scales (`field.type === 'rating'`) by removing static `w-20` margin divs that squeezed rating circles into 112px; moved min/max labels beneath the scale (Google Forms standard), giving rating buttons 100% width with `justify-between sm:justify-center` and zero scrollbar/cut-offs on mobile. (3) Upgraded separator description in form builder (`components/forms/fields-editor/index.tsx`) to `<Textarea>` for multi-line instructions. 406/406 unit tests pass across 42 suites, 0 lint/tsc errors, clean Next.js 16 build. Deployment held pending user confirmation.
  - Public Form Mobile Scroll Lockdown & Vertical Height Optimization (2026-10-19): Fixed mobile horizontal wiggle ("scroll kiri-kanan") and excessive vertical height on short forms in `app/(public)/form/[id]/client.tsx`, `app/globals.css`, and `app/layout.tsx`. (1) Added `max-width: 100vw; overflow-x: hidden;` to `html, body` in `globals.css` and exported `viewport: Viewport = { width: 'device-width', initialScale: 1 }` in `layout.tsx`. Replaced `fixed top-0 left-0 w-full` with `fixed top-0 inset-x-0 z-50 pointer-events-none` (eliminating 100vw scrollbar width bleed) and removed `backgroundAttachment: 'fixed'` which caused WebKit viewport expansion bugs. (2) Eliminated 72px of shadcn `<Card>` ghost margin/padding (`py-6 gap-6`) by applying `p-0 gap-0 overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/80` to the fields card. Replaced `min-h-screen py-8` with `min-h-screen min-h-[100dvh] py-3 sm:py-8 md:py-12 px-3 sm:px-4`, compacted Header padding to `py-4 sm:py-8 px-4 sm:px-6`, field rows to `py-3.5 sm:py-5 px-4 sm:px-6`, `CardFooter` to `p-4 sm:p-6 gap-3 sm:gap-4`, and powered-by footer to `mt-4 sm:mt-8 pb-4 sm:pb-8`. Saved ~260px of unnecessary whitespace so short forms (1-4 questions) fit cleanly on 1 screen without scrolling, scrolling only when questions are numerous. 406/406 unit tests pass, 0 lint/tsc errors, clean Next.js 16 build (58 routes).
  - Vercel Production Deployment (2026-10-19): Deployment `dpl_4tDLv3tN1s4hBHuFAJQeD3QhAPY6` pushed live to `https://www.klikform.com` (`https://klikform-j1b0c3nak-sofwan-jailanis-projects.vercel.app`). 406/406 unit tests passed across 42 suites, 0 lint/tsc errors, clean 58 routes. Commit `edb2d02` active.
  - Multiple Choice Grid (Likert Scale / Matrix) Field Type (2026-10-19): Added full support for multiple choice scale grids (`type: 'grid'`) in Form Builder, Public Form respondent client, server validation, Google Sheets auto-sync, and edit link mode. (1) Defined `GridConfig` (`rows`, `columns`, `minLabel`, `maxLabel`) on `FormField` in `lib/types/forms.ts` and barrel `lib/types/index.ts`. (2) Created `lib/forms/grid.ts` with quick preset scales (1-5, 1-7, 1-10, Kepuasan 4 tahap, Persetujuan 4 tahap, Kekerapan 5 tahap), `formatGridRowKey`, `flattenGridResponses`, `unflattenGridResponses`, and completeness checkers. (3) Form Builder (`components/forms/fields-editor/index.tsx`) features interactive preset buttons, statement row editor (add/edit/delete), custom scale column editor, and min/max label inputs. (4) Public form respondent interface (`app/(public)/form/[id]/client.tsx`) provides dual-layout rendering: a clean symmetric matrix `<table>` with headers on desktop (`hidden md:block`), and an Adaptive Mobile Stack (`block md:hidden`) on mobile rendering touch-friendly buttons ($40px$ `h-10`, `w-full`, zero horizontal scroll/overflow, row progress counter). Connected to `validateField`, progress bar calculation, and smart auto-scroll upon grid completion. (5) Submission flattening emits `[Field Label] [Row Statement] = value`, auto-creating dedicated columns in Google Sheets. (6) Unified validation in `lib/forms/validate-submission.ts` and `actions/edit-response.ts`. (7) Reconstitution of grid responses from database snapshots in `app/(public)/edit/[token]/page.tsx`. Backed by 10 unit tests in `tests/grid-field.test.ts` (416/416 tests pass across 43 suites, 0 lint/tsc errors, clean Next.js 16 build). Deployment held pending user confirmation.
  - Google Sheets Multi-Day Attendance Date Override (2026-10-19): Fixed an issue where organizers editing or backdating attendance dates in Google Sheets for Day 2 (e.g. `Masa Masuk (Hari 2)`, `Masa Keluar (Hari 2)`, or `Tarikh (Hari 2)`) still saw the automated Supabase check-in timestamp on the certificate. (1) In `lib/forms/attendance.ts`, added `parseSheetDayColumn(header)` to detect the day number and prioritize columns (Explicit Date = 30, Check-In = 20, Check-Out = 10, Generic Day = 5, automated DB = 0). Updated `buildDailyCertificateOptions` so Google Sheet edits take precedence over automated check-in timestamps via `priorityMap`. (2) Enhanced `formatAttendanceDate` to strip trailing time/comma (`18/10/2026, 04:15 PM` -> `October 18, 2026`), support DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, normalize Malay month names (`Oktober`, `Mei`, `Disember`), and preserve multi-day range strings. (3) Updated `actions/certificates.ts` to forward all sheet row headers and use the updated daily certificate date. (4) Standardized `components/certificate-template.tsx` and `app/(public)/check/[formId]/client.tsx` to format dates consistently via `formatAttendanceDate`. Backed by 19 tests in `tests/certificate-multiday-options.test.ts` (427/427 tests pass across 43 suites, 0 lint/tsc errors, clean Next.js 16 build). Deployment held pending user confirmation.
  - Dedicated Daily Google Sheet Tabs for Multi-Day Attendance (2026-10-19): Upgraded multi-day attendance sync (`totalDays > 1`) so that attendance for Day 2 and subsequent days is recorded in dedicated daily tabs (e.g. `Hari 2`, `Hari 3`) instead of cluttering Sheet 0 with horizontal column proliferation (`Masa Masuk (Hari 2)`, `Masa Keluar (Hari 2)`). (1) In `lib/api/google-sheets.ts`, implemented `syncDailyAttendanceToSheet(params)`: queries or dynamically creates `doc.sheetsByTitle['Hari ' + dayNumber]` with standardized headers (`['Timestamp', 'Nama', 'No. IC', 'Masa Masuk', 'Masa Keluar', 'Jumlah Jam (Hours)', 'Status Kehadiran']`), appends/updates the attendee row, and simultaneously updates cumulative summary columns (`Status Kehadiran`, `Jumlah Masa Hadir`, `Jumlah Jam Keseluruhan (Total Hours)`) on Sheet 0. (2) Updated `submitAttendanceCheckInAction` and `submitAttendanceCheckOutAction` in `actions/attendance.ts`, as well as Scenario 2 in `actions/forms.ts`, to call `syncDailyAttendanceToSheet` when `dayNum >= 2`. (3) In `actions/certificates.ts`, upgraded `checkCertificateByICOrEmail` to scan daily tabs (`Hari 2`, `Hari 3`, `Day 2`, etc.) via `doc.sheetsByTitle || {}`, merging daily row records into `sheetRowData` (`Masa Masuk (Hari ${d})`) so `buildDailyCertificateOptions` generates per-day certificates with full support for sheet date overrides while retaining 100% backward compatibility for legacy single-sheet events. Backed by 7 unit tests in `tests/attendance-multiday-sheet-tabs.test.ts` (434/434 tests pass across 44 suites, 0 lint/tsc errors, clean Next.js 16 build). Deployment held pending user confirmation.
  - Form Field Label Accessibility & Broken `htmlFor` Elimination (2026-10-19): Fixed Chrome DevTools accessibility warning `Incorrect use of <label for=FORM_ELEMENT> (2)` on public forms. (1) Emitting `<Label htmlFor={`field-input-${field.id}`}>` unconditionally caused questions without a single input element (`rating`, `grid`, `checkbox`, `radio`, `file`, `product`) to reference a non-existent ID in the DOM. (2) Implemented `hasSingleInput`: single controls (`text`, `email`, `number`, `textarea`, `select`, `date`, `time`) retain `<Label htmlFor={`field-input-${field.id}`}>`, and both `DatePicker` and `TimePicker` were updated with an `id` prop attached to their trigger `<Button id={id}>`. (3) Composite / grouped questions now render their title as `<span id={`field-label-${field.id}`}>` without `htmlFor`, and their containers/tables are linked with `role="group"` and `aria-labelledby={`field-label-${field.id}`}` (`RadioGroup` for ratings, matrix container for grid, product container). Each individual option within the group retains its own valid `<Label htmlFor={optionId}>`. Backed by 5 unit tests in `tests/form-label-accessibility.test.ts` (439/439 tests pass across 45 suites, 0 lint/tsc errors, clean Next.js 16 build). Deployment held pending user confirmation.
  - Vercel Production Deployment (2026-10-19): Deployment `dpl_9SBeccgQ2nLzpdS1HEB9sEhmiqMe` pushed live to `https://www.klikform.com` (`https://klikform-3wsv84pz7-sofwan-jailanis-projects.vercel.app`). 439/439 unit tests passed across 45 suites, 0 lint/tsc errors, clean 58 routes. Commit `eabf1d8` active.
  - Certificate "Year 2001" Parsing Bug Fix (2026-10-19): Resolved an issue where participant certificates and public preview subtitles displayed year `2001` (e.g. `October 7, 2001` for Day 1 and `October 8, 2001` for Day 2) instead of the actual event year `2026`. (1) Root Cause: `formatAttendanceDate` in `lib/forms/attendance.ts` previously used naive comma-splitting (`if (datePart.includes(',')) datePart = datePart.split(',')[0].trim()`) to strip trailing time from Google Sheet cells like `"8/10/2026, 4:05 PM"`. However, when already-formatted English dates (`"October 8, 2026"`) were passed back into `formatAttendanceDate` by `<CertificateTemplate>` or the preview subtitle, the comma between the day and year caused `, 2026` to be chopped off, leaving `"October 8"`. The JavaScript V8 engine parses `"October 8"` (without a year) as `Sun Oct 08 2001 00:00:00` (year 2001 default). (2) Fix: Replaced naive `split(',')` with a non-destructive pattern-based regex `replace(/,?\s*\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?.*$/, '').trim()` that strictly removes trailing time indicators (`04:15 PM`, `16:30`) while preserving the year `, 2026` in standard formatted dates. (3) Multi-Day Range Synthesis: Refined `buildDailyCertificateOptions` so `Semua Hari (Penuh)` options synthesize clean human-readable date ranges (`"October 7, 2026 - October 8, 2026"`) instead of leaking raw single-day ISO submission timestamps (`"2026-10-07T02:05:47.358Z"`). Backed by 2 new unit tests in `tests/certificate-multiday-options.test.ts` (441/441 unit tests pass across 45 suites, 0 lint/tsc errors, clean Next.js 16 build).
  - Vercel Production Deployment (2026-10-19): Deployment `dpl_E2EqhAqkvzQEyuHfAiuWYTff7Ttb` pushed live to `https://www.klikform.com` (`https://klikform-ovdb5fgib-sofwan-jailanis-projects.vercel.app`). 441/441 unit tests passed across 45 suites, 0 lint/tsc errors, clean 58 routes. Commit `5ccb184` active.
  - Public Certificate Check Portal Redesign & Smart Email Header Detection (2026-10-19): Redesigned the public certificate verification portal (`app/(public)/check/[formId]/client.tsx`) and resolved false-negative "Email field not found in Google Sheet" errors. (1) Created `isEmailHeader` in `lib/certificates/headers.ts` matching all Malay and English variants (`email`, `e-mel`, `e-mail`, `emel`, `mail`, `alamat emel`, `email address`, and `/\b(email|emel|mail)\b/i`), with schema fallback in `actions/certificates.ts`. (2) Transformed the page into an ambient portal with subtle glow orbs, verified official badge, intelligent dynamic input icon (Mail on `@`, CreditCard on digits, Search default with 1-click `X` clear button). (3) Contextual error cards replacing raw red technical errors: amber card for missing email column with 1-click `[ Gunakan Nombor Kad Pengenalan ]`, blue card for missing IC column with 1-click `[ Gunakan Alamat E-mel ]`, and rose card for participant not found with formatting tips. (4) Redesigned result card and preview with modern `rounded-3xl` glassmorphic cards and digital verification footer. Backed by 10 unit tests in `tests/certificate-headers.test.ts` (465/465 unit tests pass across 46 suites, 0 lint/tsc errors, clean Next.js 16 build). Commit `56bd64c`.
  - Form Builder Page Break Drag Scaling Distortion Fix & DragOverlay (2026-10-19): Fixed distorted ghost preview when dragging Page Break elements in the Form Builder (`components/forms/fields-editor/index.tsx`). (1) Replaced `CSS.Transform.toString(transform)` with `CSS.Translate.toString(transform)` in `SortableField`, preventing `@dnd-kit/sortable` from applying an aspect-ratio stretching scale multiplier (`scaleY` ~700%) when dragging small ~40px elements over tall ~250px question cards. (2) Upgraded the Page Break element into an opaque card (`bg-white border-2 border-dashed border-primary/35 rounded-2xl`) with pill badge `Pemisah Halaman (Page Break)` and reduced opacity on active drag (`opacity-25 scale-[0.98]`). (3) Integrated `<DragOverlay dropAnimation={null}>` inside `<DndContext>` with `activeId` state, rendering an elevated floating card clone (`shadow-2xl ring-4 ring-primary/15 cursor-grabbing`) for both Page Break and question cards. 465/465 unit tests pass, 0 lint/tsc errors, clean Next.js 16 build (58 routes). Commit `7f2f503`.
  - Vercel Production Deployment (2026-10-19): Deployment `dpl_H5sUZyCfnXdLwqF3rBKGRgmFqdHv` pushed live to `https://www.klikform.com` (`https://klikform-p73m8oemh-sofwan-jailanis-projects.vercel.app`). 465/465 unit tests passed across 46 suites, 0 lint/tsc errors, clean 58 routes. Commit `7f2f503` active.
  - Contextual Page Break Insertion on Every Question (2026-10-19): Eliminated friction where creators had to add Page Breaks at the bottom of long forms and drag them all the way up through dozens of questions (`components/forms/fields-editor/index.tsx`). (1) Added `insertPageBreak(afterIndex)` in `FieldsEditor` using `splice(afterIndex + 1, 0, newField)` to inject a Page Break immediately below the targeted question. (2) Provided dual-access contextual triggers on every question card: a clean `[ + Pemisah Halaman ]` action button in `CardHeader` (next to Duplicate & Delete) and a quick shortcut prompt at the bottom of `CardContent` (`Mahu jadikan soalan seterusnya pada halaman baharu? [ + Tambah Pemisah di sini ]`). (3) Intelligent duplicate prevention: `hasNextPageBreak` detects if a Page Break is already adjacent below, dynamically switching the button into a verified badge (`✓ Pemisah Aktif`) and hiding bottom shortcuts. Backed by 2 unit tests in `tests/pagination.test.ts` (467/467 unit tests pass across 46 suites, 0 lint/tsc errors, clean Next.js 16 build). Deployment held pending user confirmation.





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

## System Improvements (2026-08-30 — Sijil & E-Cert Auto-Scaling Typography & Canva-Style Drag-To-Scale Builder)
- **Auto-Scaling Font Size Tajuk Program Panjang**:
  - Dicipta algoritma `getProgramFontSize` (`components/certificates/types.ts`) untuk mengira saiz fon optimum secara pintar berasaskan panjang teks, baris teks, dan kepanjangan baris terpanjang:
    - Tajuk pendek (<28 aksara, 1 baris): saiz penuh asas (36px - 44px).
    - Tajuk sederhana (28-44 aksara): skala ~88% (~32px - 38px).
    - Tajuk 2 baris / sederhana panjang (45-79 aksara): skala ~75% (~26px - 32px).
    - Tajuk sangat panjang (80+ aksara / 3 baris): skala ~58% (~20px - 24px).
  - Dilengkapi `[text-wrap:balance]`, `leading-tight` / `leading-snug`, dan `max-w-2xl mx-auto` merentas kesemua 10 templat sijil pra-bina (`Classic`, `Corporate`, `Creative`, `Elegant`, `Minimalist`, `Modern`, `Nature`, `Premium`, `Royal`, `Vintage`), templat sijil legasi (`components/certificate-template.tsx`), dan renderer tersuai (`components/certificates/renderer/index.tsx`).
- **Canva-Style Drag-To-Scale & Resize Handles dalam Certificate Builder**:
  - Menggantikan pemegang tunggal lama dengan sistem pemegang penskalaan Canva penuh (`app/(dashboard)/certificates/builder/[id]/client.tsx`):
    - 4 Pemegang Sudut Bulat (*Corner Handles*): Top-Left (`nw`), Top-Right (`ne`), Bottom-Left (`sw`), Bottom-Right (`se`).
    - Pemegang Sisi (*Pill Side Handles*): Middle-Left (`w`), Middle-Right (`e`), Middle-Top (`n`), Middle-Bottom (`s`).
  - **Penskalaan Teks**: Menarik mana-mana bucu teks/placeholder akan membesarkan/mengecilkan saiz font (`fontSize`) dan lebar kotak secara berkadar seiring gerakan tetikus (sama seperti Canva). Menarik pemegang sisi melaraskan lebar balutan teks (*text wrap width*).
  - **Penskalaan Imej & Bentuk**: Menarik bucu menskalakan dimensi dengan mengekalkan nisbah aspek dan berlabuh pada bucu bertentangan; menarik pemegang sisi melaraskan dimensi paksi tunggal.
- **Ujian & Kualiti**:
  - Ditambah ujian unit baharu di `tests/certificate-typography.test.ts`.
  - 211 / 211 ujian unit lulus merentas 26 suite ujian.
  - 0 ralat ESLint, 0 ralat TypeScript, kompilasi Next.js 16 bersih.
  - Berjaya dideploy ke pengeluaran Vercel (`https://www.klikform.com`, deployment `dpl_3q5feFFHarJGiYZ42n2tqNKzvTaV`) dan ditolak ke git `origin/master` (`f6db6c3`).

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


## Sheet bookkeeping columns gated behind Edit Link (2026-06-07)
- `_submission_id` AND `timestamp` are now only written to the Google Sheet when **Edit Link (magic link) is enabled** on the form. Forms without it get a clean sheet (just the respondent's answers).
- Implemented server-side in `submitFormAction` (`actions/forms.ts`): `const editLinkEnabled = !!form.editLinkSettings?.enabled;` → if enabled set `dbData._submission_id = submissionId`, else `delete dbData._submission_id` + `delete dbData.timestamp`. Done before the Sheet write so the edit-link token flow still has `_submission_id` available.
- Rationale: both columns are bookkeeping for the edit feature (locate the exact row to update). Useless clutter for simple forms.
- Note: existing forms that previously wrote these columns will leave them blank on NEW rows once Edit Link is off (historical rows keep their values). Commit `83217f6`, pushed → auto-deploy. lint 0, build clean.


## Category-based certificates (2026-06-07 — Fasa C item)
- **Feature**: a form can map a dropdown (`select`) field's answer → a different certificate template (e.g. Urusetia/Penganjur/Peserta each get a different cert). Falls back to the default template when a respondent's value has no mapping.
- Type `CertificateCategoryConfig { fieldId, map: Record<option,templateId> }` on `Form.eCertificateCategory` (+ barrel). Migration `20260607040000_add_certificate_category.sql` adds `e_certificate_category jsonb`. Storage mapping in `lib/storage/forms.ts` (2× fromRow + toRow).
- Pure helpers `lib/certificates/category.ts`: `resolveCategoryTemplateId(config, value, default)` + `collectTemplateIds(config, default)`. Tests `tests/certificate-category.test.ts` (9). Total 152.
- `actions/certificates.ts`: `CertificateCheckResult.category` added; `checkCertificateByICOrEmail` reads the category column (Sheet column keyed by the field's LABEL, case-insensitive) from the matched row. `getFormForCertificateCheck` returns `eCertificateCategory`.
- `check/[formId]/page.tsx`: prefetches default + all mapped templates (`collectTemplateIds`) into `templatesById`, passes `categoryConfig` + `templatesById` to client.
- `check/[formId]/client.tsx`: computes `activeTemplate` via `resolveCategoryTemplateId` after lookup; both preview + hidden-capture renders use `activeTemplate` instead of the single `customTemplateData`.
- Builder UI `components/forms/certificate-category-card.tsx` (`CertificateCategorySection`): toggle (needs a `select` field), pick category field, per-option template dropdown ("Use default template" = fallback). Mounted in the E-Cert card after the template grid (only when a default template is chosen). Uses `userCertificates` prop already available in builder.
- **PENDING**: apply migration `20260607040000_add_certificate_category.sql` to prod DB before this works (saveForm upserts `e_certificate_category`). lint 0, 152/152 tests, build clean. Commit `49f0599`, pushed.


## Response answer charts (2026-06-07 — Fasa C item)
- **Feature**: visualize the actual Google Sheet answers as charts (like Google Forms' Responses tab) — distribution per choice/rating question.
- Pure helper `lib/analytics/responses.ts`: `aggregateResponses(rows, fields)` + `isChartable()`. Charts `select/radio/checkbox/rating`. Checkbox answers split on commas; rating gets an average. Seeds declared options so 0-count options show; sorts by count desc; pct relative to respondents who answered. Tests `tests/response-summary.test.ts` (6). Total 158.
- `lib/api/google-sheets.ts`: added `readSheetRows(config)` — read-only, returns rows as objects keyed by header. Service-account uses `spreadsheets.readonly`.
- `actions/response-summary.ts`: `getFormResponseSummary(formId)` — owner-gated (auth + `form.userId === user.id`), resolves OAuth (with token refresh) or service account, reads sheet, aggregates. Returns `{ ok, summaries, totalResponses }`.
- UI `app/(dashboard)/responses/[id]/analytics/response-charts.tsx` (`ResponseChartsSection`): on-demand "Generate charts" button (avoids slow page load on big sheets), CSS bar charts per question, refresh button, empty/no-data states. Mounted on the analytics page under the events analytics.
- Also fixed pluralization: "1 focus" / "N focuses" in `analytics/client.tsx`.
- lint 0, 158/158 tests, build clean. Commit `2db33cf`, pushed.


## IC placeholder for e-cert (2026-06-07)
- Added `'ic'` to `PlaceholderType` (`lib/types/certificates.ts`). `CertificateData.ic` + renderer `data.ic` already existed, so `resolveContent` renders it automatically.
- Builder sidebar (`components/certificates/builder/sidebar.tsx`): new "No. Kad Pengenalan" placeholder button (Fingerprint icon) → inserts placeholder with `placeholderType: 'ic'`.
- `PLACEHOLDER_LABELS` in cert builder client gains `ic: '{No. KP}'` (canvas preview label).
- Value source: the check flow passes `ic={identifier}` (what the visitor searched with). So when searched by IC → shows IC. **Nuance**: if the visitor searched by EMAIL, the IC placeholder would show the email (identifier), not the real IC — would need to read the IC column from the sheet row to fix. Not done yet (basic placeholder shipped as requested). Bulk flow maps the CSV `ic` column already.
- lint 0, build clean. Commit `3ef6e62`, pushed.


## Certificate serial number placeholder (2026-06-07)
- Pure helper `lib/certificates/serial.ts`: `generateCertSerial(formId, identifier)` → `SIJIL-XXXXXXXX` (FNV-1a 32-bit hash → 8 hex). Deterministic (same form+person → same code; different form/person → different); returns '' when no identifier (avoids a shared code). Tests `tests/certificate-serial.test.ts` (6). Total 164.
- `'serial'` added to `PlaceholderType`; `CertificateData.serial` + renderer data type already wired via `resolveContent` (data[placeholderType]).
- `components/certificate-template.tsx`: computes `serial: generateCertSerial(formId, ic)` in the customTemplateData branch. (Note: serial uses the search identifier — IC if searched by IC; the same email-search nuance as the IC placeholder applies.)
- Bulk: `bulk/client.tsx` passes `serial: generateCertSerial(template.id, ic)` (no formId in bulk context, so keyed by template id).
- Builder sidebar: new "Nombor Siri" placeholder button (Hash icon) → `placeholderType: 'serial'`. `PLACEHOLDER_LABELS.serial = '{No. Siri}'`.
- lint 0, 164/164 tests, build clean. Commit `1afffb9`, pushed.
- ~~Outstanding migration pending~~: `20260607040000_add_certificate_category.sql` — **DONE** (applied to production, confirmed 2026-06-11).


## "Default" badge on selected certificate template (2026-06-11)
- `app/builder/[id]/client.tsx` (~line 992): added a "Default" badge (top-right, primary pill + `CheckCircle2` icon) on the selected cert template card in the "Select Certificate Template" gallery. Shows only when `form.eCertificateTemplate === cert.id`. Makes the default-template selection explicit beyond the existing blue border/ring.
- `CheckCircle2` already imported from lucide-react. tsc --noEmit clean.


## Fix: {No. KP} / serial showed email when searching by email (2026-06-11)
- Root cause: `check/[formId]/client.tsx` passed `ic={identifier}` (raw search input). When a visitor searched by EMAIL, the IC placeholder + serial used the email, not the real IC.
- `actions/certificates.ts`: added `ic?` to `CertificateCheckResult`; extracted `isIcHeader()` helper (reused for IC search + email-search IC lookup). On match, resolve `icColumnIndex` regardless of search method and return the real IC from the sheet row.
- `check/[formId]/client.tsx`: both `<CertificateTemplate>` instances (preview + hidden capture) now use `ic={result.ic || identifier}` — real IC when available, falls back to identifier.
- Serial (`generateCertSerial(formId, ic)`) is now stable per person regardless of search method. tsc clean, 164/164 tests pass.


## Default-template UX nice-to-haves (2026-06-11)
- `app/builder/[id]/client.tsx`:
  - "Default" badge now has a native `title` tooltip explaining it applies to participants without a specific category.
  - Added `handleSelectTemplate(templateId)` + `applyTemplate(templateId)` helpers. Clicking a cert card now goes through `handleSelectTemplate`: if `form.eCertificateCategory?.map` has any entries (category mappings exist), it opens an AlertDialog confirmation before changing the default; otherwise applies directly. No-op if same id.
  - New state `pendingTemplateId`. AlertDialog (controlled) imported from `@/components/ui/alert-dialog`, rendered after `</main>`. Copy clarifies existing category mappings stay intact.
- No new deps (used native title + existing radix alert-dialog). lint 0, tsc clean, 164/164 tests.


## Form background image feature (2026-06-11)
- Added `backgroundImage?: string` to `FormTheme` (`lib/types/forms.ts`, after `backgroundPattern`). Stored in the existing `theme` jsonb column — **no DB migration needed** (saveForm already persists whole theme; all read paths map theme back).
- Public render `app/(public)/form/[id]/client.tsx`: destructured `backgroundImage` from theme; added `getBackgroundStyle()` helper that layers color + optional pattern + optional photo. Photo uses `getProxiedImageUrl` (Google Drive support), `background-size: cover`, `background-attachment: fixed`. When a pattern is also set, pattern gradient overlays the photo (`repeat, no-repeat`). Wrapper div now uses `getBackgroundStyle()` instead of inline color+pattern.
- Builder `app/builder/[id]/client.tsx`: added "Background Image URL" field + live preview + Remove button in the Theme Settings card (after Background Pattern), matching the cover-image URL-input pattern.
- URL-input approach (no uploader) — consistent with cover image & logo. Verified: tsc clean, lint 0, 164/164 tests, production build clean.


## Fix: portrait certificate broken in check-page live preview + download (2026-06-11)
- Bug: `app/(public)/check/[formId]/client.tsx` hardcoded landscape `1123x794` in 3 places — preview box, Tailwind `scale-[...]` breakpoints, and the hidden capture container. Portrait certs (height > width) rendered distorted, and PNG/PDF download used wrong orientation (the old DOM-offset `isPortrait` check always read landscape because dims were forced).
- Root: the `CertificateRenderer` itself is orientation-agnostic (percent-based, `100%`), and the cert builder has a portrait/landscape toggle (`toolbar.tsx`). Only the check page assumed landscape.
- Fix: derive orientation from `activeTemplate.width/height` → `isPortrait`, `captureWidth/captureHeight`. Replaced fragile `scale-[...]` breakpoints with a measured scale: `previewWrapperRef` + `ResizeObserver` computes `previewScale = availableWidth / captureWidth`; wrapper height = `captureHeight * previewScale`. Hidden capture container + both download handlers now use `captureWidth/Height`; jsPDF uses the component-level `isPortrait`.
- Verified: tsc clean, lint 0, 164/164 tests, production build clean.


## Fix follow-up: portrait cert overflowing the preview card (2026-06-11)
- After the orientation fix, portrait certs still overflowed because `previewScale` was width-only (`availableWidth / captureWidth`), making tall portrait certs taller than the card.
- Fix: scale now "contains" within BOTH width and a capped max height: `maxHeight = min(520, innerHeight*0.6)`, `previewScale = min(available/captureWidth, maxHeight/captureHeight)`. Added window resize listener (in addition to ResizeObserver) and `captureHeight` to the effect deps.
- Verified: tsc clean, lint 0, 164/164 tests, production build clean.


## Google Sheet URL field: copy + lock-to-edit (2026-06-11)
- `app/builder/[id]/client.tsx` (~line 570): Google Sheet Share URL `<Input>` is now `readOnly` by default (muted bg) to prevent accidental edits/deletion that break Sheet access. Wrapped in a flex row with two icon buttons: Copy (uses existing `copyToClipboard(form.googleSheetUrl)`, disabled when empty) and an Edit/Lock toggle (`sheetUrlEditable` state — Pencil when locked, Lock when editable). Added `Pencil` + `Lock` lucide imports and a helper caption.
- Verified: tsc clean, lint 0, 164/164 tests, production build clean.


## Fix: magic edit-link returns Google 401 on submit (2026-06-11)
- Symptom: respondent opens magic edit link, edits, submits → "Google API error - [401] Request had invalid authentication credentials. Expected OAuth 2 access token...".
- Root cause: `actions/edit-response.ts` passed the stored `settings.googleAccessToken` straight to `updateSheetRow` with NO refresh. Google OAuth access tokens live ~1h; a magic link is opened later, so the token is dead. `updateSheetRow`/`appendToSheet` check `if (config.accessToken)` FIRST, so a stale token short-circuits the service-account fallback → 401. The normal `submitFormAction` works only because it refreshes the token first.
- Fix: added shared helper `getValidAccessToken({accessToken, refreshToken, tokenExpiry, userId})` in `lib/api/google-auth.ts` — refreshes when expiring within 5 min and persists the new token to the owner's settings row (dynamic imports of admin client + encrypt to keep it server-safe). `edit-response.ts` now calls it before `updateSheetRow`.
- Deliberately did NOT refactor the working `submitFormAction`/cert-check inline refresh blocks (avoid regressions on the critical submit path); the helper exists for future consolidation.
- Verified: tsc clean, lint 0, 164/164 tests, production build clean.


## Fix: magic-link (edit-link) email not sent on submit (2026-06-11)
- Symptom: user submits form, no email when magic link (edit link) is ON. Submission still succeeds.
- Two likely root causes addressed (couldn't confirm which fired in prod without logs):
  - (C) Silent missing `emailFieldId`: builder let owner toggle ON without picking an email field (Select defaulted to ''), so server guard `editCfg.enabled && editCfg.emailFieldId` short-circuited with no send/warning.
  - (A) `createEditToken` throws (migration/RLS/service-key) → jumped to `catch` that only `console.warn`'d; email never attempted.
- Fixes:
  - `actions/forms.ts` (~514): guard now `editCfg?.enabled` only; resolves email field as `find(id === emailFieldId) || find(type === 'email')` (fallback to first email field). Added explicit warns for no-field / invalid-email, surfaced `sendEmail` failure via `console.error`, and upgraded the catch to `console.error`.
  - `components/forms/edit-link-card.tsx`: new `handleToggle` auto-selects the first email field when enabling if none chosen.
- Note for prod: check server logs for `[edit-token] create error:` to confirm whether the `response_edit_tokens` migration (`20260529040000_add_response_edit_tokens.sql`) + `SUPABASE_SERVICE_ROLE_KEY` are correctly applied in the failing env. If token creation is the failure, the email still won't send (the link needs the token) — that's a config/migration issue, not code.
- Verified: tsc clean, lint 0, 164/164 tests, production build clean.


## Email redesign: minimalist single-color (indigo) (2026-06-11)
- User wanted a premium, minimalist, single-theme-color look (no more per-email colored gradient headers).
- Rewrote `lib/email/index.ts` design system: ONE accent (`BRAND #4f46e5` indigo) + neutral ink/whitespace on a light `#f4f4f5` bg. White card, 1px hairline border, soft shadow, 4px indigo top accent strip, plain wordmark header (no big emoji headers). Shared helpers: `eyebrow()` (uppercase accent label), `heading()`, `para()`, `button()` (bulletproof single-color CTA), `note()` (accent-tinted box), `caption()`, `kvRow()/kvTable()`, `bulletList(items, 'check'|'dot')`, `cardBody()`. All 10 templates rebuilt on these.
- Subjects keep a single leading emoji for inbox scannability (body stays emoji-free). Confirmation subject MUST start with ✅ (test spec).
- Test-driven constraints rediscovered: `getRespondentConfirmationEmail` subject must match `/^✅/` AND the escaped `formTitle` must appear in the HTML (tests/respondent-notification.test.ts). Fix: kept ✅ in subject + render `formTitle` (escaped) as a "Borang: …" line in the body. Also the custom-message test forbids the default phrase leaking — preheader uses `customMessage || default`.
- Updated the 3 Supabase auth templates (`supabase/templates/*.html`) to match the new light minimalist design (confirm-signup, reset-password, magic-link). Same indigo accent, must be pasted into Supabase dashboard.
- Removed unused `divider()` helper (lint). Verified: tsc clean, lint 0, 164/164 tests, production build clean.
- (History) An earlier pass added preheaders + a darker gradient wrapper; that has been SUPERSEDED by this minimalist single-color redesign. `supabase/templates/README.md` exists with paste instructions; `{{ .ConfirmationURL }}` is the Supabase variable used.


## Form Builder Advanced Settings UI Simplification (2026-06-11)
- **Feature**: Collapsed the advanced "Validation Rules" and "Conditional Logic" settings inside each question card in the Form Builder by default to clean up the interface for non-technical users.
- **Accordion Integration**: Wrapped both sections in a multi-expandable `<Accordion type="multiple">` from `@/components/ui/accordion`.
- **Active Badges**: Added dynamic visual badges (`"active"` for validation; `"{N} rule(s)"` for conditional logic) to the accordion triggers, allowing builders to see at a glance if a question has active rules/conditions without expanding it.
- **Clean Layout**: Removed duplicate headings and dividers from both sections, optimizing space when expanded.
- **Verified**: `npm run lint` clean (0 warnings), `npm test` clean (164/164 tests passing), and production build `npm run build` clean.

## Added NRIC/IC Regex Pattern Preset (2026-06-18)
- **Feature**: Added a pre-made "IC (MY)" regex validation pattern preset (`^[0-9]{6}-[0-9]{2}-[0-9]{4}$|^[0-9]{12}$`) in `components/forms/fields-editor/index.tsx`.
- This enables form creators to easily enforce Malaysian IC format (either 12 digits or with dashes) without writing custom regular expressions.
- **Verification**: Verified using `npm test` (all 164 tests passed).

## Malaysian IC Input Auto-Formatting (2026-06-18)
- **Feature**: Added automatic dash-formatting (`XXXXXX-XX-XXXX`) to fields labeled "IC", "No IC", "No. IC", "Kad Pengenalan", or "NRIC" (or fields using the IC regex pattern preset) in the public form client (`app/(public)/form/[id]/client.tsx`).
- Prefilled/initial values and live user typing are both formatted automatically.
- **Verification**: Verified using `npm test` (all 164 tests passed).

## Malaysian NRIC/IC Certificate Preview Dash Formatting (2026-06-18)
- **Feature**: Automatically formats the `{No. KP}` (IC placeholder) value to include dashes (`XXXXXX-XX-XXXX`) in the certificate generator renderer (`components/certificates/renderer/index.tsx`). This ensures that generated certificates and public check page previews always display the IC with dashes even if stored without them in the source sheet.
- **Mock Data**: Updated the mock preview value in the builder preview page (`app/(dashboard)/certificates/builder/[id]/preview/page.tsx`) to `901234-56-7890`.
- **Verification**: Verified via local compilation (`npm run build`) and test suite runs (`npm test`).

## Case-Insensitive Category-Based Certificate Matching (2026-06-18)
- **Fix**: Updated `resolveCategoryTemplateId` in `lib/certificates/category.ts` to look up category mappings case-insensitively. This fixes the issue where sheet values like "peserta" or "urusetia" (lowercase or varying casing) failed to match mappings in the builder (such as "Peserta" or "Urusetia").
- **Verification**: Added unit test in `tests/certificate-category.test.ts` verifying case-insensitive resolution. All 165 tests passed, and local build was verified clean.

## Fix: Email displayed instead of IC on Certificate (2026-06-18)
- **Bug**: When searching a certificate by email, if the IC column in the Google Sheet wasn't detected, the check page fell back to the search input (`identifier`), printing the respondent's email address on the certificate's `{No. KP}` placeholder.
- **Fix (Utility)**: Created [headers.ts](file:///c:/Users/Sofwan/Desktop/klikform/lib/certificates/headers.ts) with `isIcHeader(h: string)`. It extends matching to common Malaysian abbreviations (`kp`, `no kp`, `no. kp`, `no.kp`, `nombor kp`) and uses word-boundary regexes (`/\bkp\b/`, `/\bic\b/`) to match compound headers (e.g. `IC/Passport`, `No. KP/Passport`) securely without false positives on other fields like `office` or `timestamp`.
- **Fix (Frontend)**: Updated [client.tsx](file:///c:/Users/Sofwan/Desktop/klikform/app/(public)/check/[formId]/client.tsx) to prevent email addresses from being passed as `ic`. The template now uses `ic={result.ic || (identifier.includes('@') ? '' : identifier)}`.
- **Verification**: Created [certificate-headers.test.ts](file:///c:/Users/Sofwan/Desktop/klikform/tests/certificate-headers.test.ts) covering matches, boundary cases, and negative cases. All 171 tests passed, and `tsc --noEmit` compiles cleanly.

## Custom Redirect Buttons on Thank You Page (2026-06-19)
- **Feature**: Added a redirect button configuration that appears on the Thank You page after successful form submission, supporting multiple redirect links.
- **Database Schema**: Added nullable `redirect_buttons` JSONB column to the `forms` table in Supabase. Created migration `supabase/migrations/20260619144800_add_redirect_settings.sql` which drops the single-link columns and introduces the JSONB column.
- **Builder UI**: Added a settings card "Custom Thank You Buttons" under the custom thank you message in `app/builder/[id]/client.tsx` that manages an array of button records (label and URL) with list controls.
- **Public Form Submitted View**: Loops over and displays configured redirect buttons in the card footer of the success page.
- **Formatting**: Implemented `formatRedirectUrl` helper in `app/(public)/form/[id]/client.tsx` to sanitize custom redirect URLs.
- **Verification**: Verified using `npm test` (all 171 tests passed) and `npm run build` (compiled successfully).

## Forced Malaysia Time (UTC+8) for Attendance Restrictions (2026-06-23)
- **Feature**: Standardized the form opening/closing time restrictions (Attendance & Location feature) to evaluate against the Malaysia Timezone (UTC+8 / Asia/Kuala_Lumpur) rather than the local device timezone of the respondent.
- **Implementation**:
  - Added `parseMalaysiaTime` and `formatInMalaysiaTime` helper functions in [client.tsx](file:///c:/Users/Sofwan/Desktop/klikform/app/(public)/form/[id]/client.tsx).
  - Modified the time checks (startTime and endTime) to parse dates with a forced UTC+8 offset if no timezone offset is specified.
  - Custom-formatted the access-denied date strings in the Malaysia Time timezone.
  - Rewrote the Countdown Timer target date computation to utilize the forced UTC+8 offset.
- **Verification**: Verified using `npm test` (all 171 tests passed) and `npm run build` (compiled successfully).

## Fasa D — Hardening Batch (2026-07-01)

Sembilan pembetulan risiko/kualiti dari audit penuh sistem. Semua verified: lint 0, typecheck clean, 206/206 tests, build clean (45 routes).

### 1. form_responses — write-first, sync-async (data loss fix)
- **Masalah**: respons hanya hidup dalam Google Sheets; `appendToSheet` gagal = respons hilang selamanya (mesej "Saved locally but failed to sync" adalah palsu).
- **Migration** `20260701010000_add_form_responses.sql`: jadual `form_responses` (submission_id UNIQUE, data jsonb, sheet_sync_status pending/synced/failed) + partial index untuk cron + `prune_form_responses()` (400 hari) + RLS owner-only SELECT (tulis via service role sahaja, corak audit_logs).
- **Storage** `lib/storage/form-responses.ts`: `insertFormResponse` return `'inserted' | 'duplicate' | 'error'` (duplicate = unique violation 23505), `markResponseSynced`, `markResponseSyncFailed(id, err, {final})`, `listPendingSyncResponses` (join forms+settings sekali).
- **submitFormAction** tulis ke DB SEBELUM Sheets; Sheets sync + webhooks + 3 emel berpindah ke `after()` (responden tak lagi menunggu ~15s webhook; tiada lagi risiko serverless timeout).
- **Cron baharu** `/api/cron/sync-responses` (*/10 minit di vercel.json): retry row 'pending', refresh OAuth token, kekal gagal selamanya ditanda `final` (tiada sheet URL / tiada kredensial).
- Baseline migrasi: sedia ada `processed_at` juga di-backfill untuk transaksi completed supaya replay pertama selepas deploy tidak double-process.

### 2. Payment webhook idempotency + admin client
- **Masalah**: replay webhook = +1 bulan percuma + emel berulang. JUGA bug tersembunyi: route guna `createClient()` (anon, tiada cookie) tetapi RLS transactions/subscriptions owner/service_role sahaja — webhook gagal jumpa transaksi secara senyap dalam production.
- **Migration** `20260701020000_payment_webhook_idempotency.sql`: kolum `processed_at` + backfill completed + unique index `provider_reference`.
- **Route**: `processed_at` diset DALAM update yang sama dengan status completed (crash mid-handler tak boleh double-grant); duplicate → `{success:true, duplicate:true}` 200 tanpa sebarang kesan sampingan; SEMUA query DB kini melalui `createAdminClient()`.
- **Order number**: `KLIK-${randomUUID()}` (tidak boleh berlanggar) menggantikan Date.now()+random(0-999).
- Fake phone `+60123456789` → placeholder `+60110000000` yang jelas.

### 3. Conditional-required fix server-side
- **Masalah**: field wajib yang disembunyikan oleh conditional logic ditolak server-side ("X is required") walaupun responden tak pernah nampak medan itu.
- **Modul tulen** `lib/forms/validate-submission.ts` (`validateSubmission`, `isLayoutOnlyField`): guna semula `evaluateConditional` yang sama dengan client, re-key input label→id, skip layout-only fields, kekalkan ReDoS cap 1000 aksara. `submitFormAction` + test suite penuh (12 ujian) menggunakan modul ini.

### 4. Duplicate submit protection (idempotency)
- Client jana `crypto.randomUUID()` sekali per page-load (sessionStorage `klikform-sub-key-<formId>`), hantar sebagai `_submission_key`; action terima parameter ketiga `clientSubmissionId` dan guna ia sebagai submission_id → unique constraint menelan double-click/double-send secara senyap (return success tanpa re-sync/re-email). Key dikosongkan selepas success supaya "Submit another response" dapat key baharu.

### 5. CI GitHub Actions
- `.github/workflows/ci.yml`: lint → typecheck → test → build pada setiap push/PR ke master, npm cache, placeholder env. Fail quality gate tak lagi bergantung pada disiplin manual.

### 6. Error boundaries + not-found
- `app/error.tsx` (reset + digest ref), `app/global-error.tsx` (inline styles, html/body sendiri), `app/not-found.tsx` (404 branded). Sebelum ini runtime error = skrin crash default Next.

### 7. Konsolidasi harga
- `lib/constants/pricing.ts` (`PRO_PRICE`) jadi satu-satunya sumber harga; digunakan oleh initiate route, pricing page, pricing modal, plan-card. Habis era harga hardcoded di 3 tempat + TIER_PRICING mati.

### 8. React cache() dedupe
- `getFormById`/`getFormByShortCode` dibalut `cache()` — public form page (generateMetadata + render) kini satu query + satu tier lookup sebelum dua.

### 9. Tooling
- Skrip `typecheck` baharu; `@eslint/eslintrc`, `@types/uuid`, `typescript-eslint`, `cross-env` dipindah ke devDependencies (ia ada dalam dependencies sebelum ini).

## System Improvements (2026-08-30 — Sokongan Form Title 2 Baris / Multi-line)

Membolehkan pengguna memasukkan tajuk borang (Form Title) dalam 2 baris atau lebih dengan menekan Enter dalam Form Builder serta memastikan rendering merentas semua muka surat dipaparkan dengan betul.

- **Form Builder (`app/builder/[id]/client.tsx`)**:
  - Medan input tajuk ditukar daripada `<Input>` (single-line) kepada `<Textarea rows={2} className="resize-y min-h-[60px]">` supaya pengguna boleh menekan Enter untuk baris kedua.
  - Nama fail muat turun QR kod disanitasi (`replace(/\r?\n/g, ' ')`) untuk mengelakkan newline dalam nama fail.
- **Borang Awam (`app/(public)/form/[id]/client.tsx`)**:
  - Ditambah kelas Tailwind `whitespace-pre-line break-words` pada `<CardTitle>` utama supaya line breaks (`\n`) dipaparkan pada baris baharu secara semulajadi.
  - Atribut `alt` pada imej disanitasi.
- **Papan Pemuka & Kad Borang (`components/dashboard/form-card.tsx` & `app/(dashboard)/responses/client.tsx`)**:
  - `CardTitle` dikemas kini daripada `truncate` kepada `line-clamp-2 break-words whitespace-pre-line` supaya kad borang boleh memaparkan sehingga 2 baris tajuk.
- **Komponen & Muka Surat Berkaitan**:
  - `components/certificate-qr-card.tsx`: Ditambah `line-clamp-2 break-words whitespace-pre-line` pada tajuk dan sanitasi nama fail muat turun QR.
  - `app/(public)/check/[formId]/client.tsx`: Ditambah `whitespace-pre-line break-words` pada tajuk semakan sijil.
  - `app/(public)/verify/[id]/client.tsx`: Ditambah `whitespace-pre-line break-words` pada tajuk verifikasi sijil.
  - `app/(dashboard)/responses/[id]/analytics/page.tsx`: Ditambah `whitespace-pre-line break-words` pada tajuk analitik.
  - `actions/sheets.ts`: Tajuk Google Sheet spreadsheet baru disanitasi dengan membuang newline.
  - `app/(public)/form/[id]/page.tsx` & `app/(public)/s/[code]/page.tsx`: `generateMetadata` disanitasi untuk membuang newline pada tag `<title>` / OpenGraph.
  - `lib/email/index.ts`: Subjek dan preheader email disanitasi bagi mengelakkan karakter newline dalam header emel.
- **Verifikasi**:
  - `npm test`: 206/206 lulus (25 test suites).
  - `npm run lint`: 0 ralat / amaran.
  - `npm run typecheck`: Bersih (0 errors).
  - `npm run build`: Bersih (Next 16.2.6, Turbopack, 45 laluan).
- **Deployment**:
  - Berjaya dideploy ke Vercel Production: `https://klikform-j7rwf9o0k-sofwan-jailanis-projects.vercel.app` (Deployment ID: `dpl_Ekc5nK9r81i7frCCUKrTWMeGc3C5`).
  - Aliased terus ke domain pengeluaran: `https://www.klikform.com`.
  - Cron `sync-responses` di `vercel.json` dilaraskan ke harian (`0 10 * * *`) untuk menepati had pelan Vercel Hobby.

## System Improvements (2026-08-30 — Sokongan Tajuk Program 2 Baris Pada Preview Sijil & E-Cert)

Membolehkan tajuk program (program name / `{PROGRAM_NAME}`) pada sijil digital (e-cert), pratonton pembina sijil (*Certificate Builder*), dan halaman pratonton sijil (*Preview*) dipaparkan dengan sempurna dalam 2 baris atau lebih apabila mengandungi baris baru (`\n`) atau teks panjang.

- **Certificate Renderer (`components/certificates/renderer/index.tsx`)**:
  - Menukar `whiteSpace: 'nowrap'` kepada dinamik: `whiteSpace: el.type === 'text' || el.type === 'placeholder' ? 'pre-line' : 'nowrap'` dan `wordBreak: el.type === 'text' || el.type === 'placeholder' ? 'break-word' : undefined`.
  - Menambah kelas `whitespace-pre-line break-words` pada bekas render teks & placeholder.
- **Canvas Pembina Sijil (`app/(dashboard)/certificates/builder/[id]/client.tsx`)**:
  - Menggantikan `whitespace-nowrap` pada elemen teks dan placeholder dengan `whitespace-pre-line break-words`.
- **Halaman Pratonton Sijil (`app/(dashboard)/certificates/builder/[id]/preview/page.tsx`)**:
  - Menggantikan `whitespace-nowrap` pada elemen teks dan placeholder dengan `whitespace-pre-line break-words`.
- **Panel Ciri Pembina Sijil (`components/certificates/builder/properties.tsx`)**:
  - Menukar `<Input>` teks kepada `<Textarea rows={2} className="resize-y min-h-[60px]">` supaya pengguna boleh menekan Enter untuk memasukkan teks berbilang baris secara langsung.
- **Templat Sijil Pra-Bina & Legasi (`components/certificates/templates/*.tsx` & `components/certificate-template.tsx`)**:
  - Mengemas kini tajuk `{program}` dan `{name}` dengan kelas `whitespace-pre-line break-words` pada semua 10 templat pra-bina (`Classic`, `Corporate`, `Creative`, `Elegant`, `Minimalist`, `Modern`, `Nature`, `Premium`, `Royal`, `Vintage`) dan templat URL legasi.
- **Verifikasi**:
  - `npm test`: 206/206 lulus (25 test suites, termasuk ujian pensijilan multi-line).
  - `npm run lint`: 0 ralat / amaran.
  - `npm run typecheck`: Bersih (0 errors).
  - `npm run build`: Bersih (Next 16.2.6, Turbopack, 45 laluan).
- **Deployment**:
  - Berjaya dideploy ke Vercel Production: `https://klikform-3k76l654y-sofwan-jailanis-projects.vercel.app` (Deployment ID: `dpl_AJDoeTBJrfnNEdmnd2gN4MFHwPZF`).
  - Aliased terus ke domain pengeluaran: `https://www.klikform.com`.

## System Improvements (2026-08-30 — Ciri KlikBio: Linktree-Style Bio Links / Kad Pautan)

Membina ciri mikro-landing page lengkap (*Link-in-bio*) yang membolehkan pengguna mengumpulkan borang KlikForm, pautan WhatsApp, pautan tersuai, dan media sosial dalam satu URL profil peribadi (cth: `klikform.com/bio/username` dan `klikform.com/b/username`).

- **Pangkalan Data Supabase (`supabase/migrations/20260830000000_add_bio_links.sql`)**:
  - `bio_pages`: `id`, `user_id`, `username` (unique), `title`, `bio`, `avatar_url`, `theme`, `theme_config`, `social_links`, `is_active`, `views`, timestamps.
  - `bio_links`: `id`, `bio_page_id`, `user_id`, `type` (`link`, `whatsapp`, `form`, `header`), `title`, `url`, `icon`, `highlight`, `is_active`, `clicks`, `order_index`, timestamps.
  - Indeks prestasi pada `(user_id)`, `(username)`, `(bio_page_id, order_index)`.
  - Polisi RLS: Pemilik ada akses CRUD penuh; pelawat awam dibenarkan SELECT pada halaman & pautan yang `is_active = true`.
  - Trigger `updated_at` dengan `security definer` dan `set search_path = ''`.
- **Modul Tema & Utiliti (`lib/bio-links/themes.ts`)**:
  - 8 Tema visual pra-bina: `Emerald Luxe` (signature KlikForm), `Onyx Dark`, `Sunset Glow`, `Deep Ocean`, `Minimal Light`, `Lavender Dusk`, `Cyber Neon`, `Midnight Gold`.
  - 6 Gaya bentuk butang: `Full Pill`, `Rounded XL`, `Subtle Round`, `Outline Border`, `Elevated Shadow`, `Glassmorphism`.
  - Fungsi penentu URL media sosial pintar `resolveSocialUrl` (format nombor WhatsApp ke `wa.me`, handle IG/TikTok/FB/X/Telegram/YouTube/LinkedIn/GitHub/Email/Website).
  - Validasi dan sanitasi slug username (`isValidBioUsername`, `cleanBioUsername`).
- **Lapisan Storan & Server Actions (`lib/storage/bio-links.ts` & `actions/bio-links.ts`)**:
  - `getBioPages`, `getBioPageById`, `getBioPageByUsername` (menggunakan service role admin client untuk pelawat awam bagi melepasi RLS), `createBioPage`, `updateBioPage`, `deleteBioPage`.
  - `createBioLink`, `updateBioLink`, `deleteBioLink`, `reorderBioLinks`, `incrementBioPageView`, `incrementBioLinkClick`.
  - Gating had pelan langganan (`maxBioPages: 1` untuk Free, `-1` untuk Pro/Enterprise).
- **Dashboard & Interactive Builder (`app/(dashboard)/bio/` & `app/(dashboard)/bio-builder/[id]/`)**:
  - `/bio`: Kad profil bio, statistik jumlah paparan (*views*), penunjuk status draf/aktif, dialog Kod QR segera (SVG & muat turun PNG bersaiz tinggi), butang Salin Pautan.
  - `/bio-builder/[id]`: Pembina interaktif 2 lajur. Lajur kiri mengandungi tab Pautan (dengan `@dnd-kit` drag-and-drop sortable, jenis WhatsApp direct, Form picker KlikForm), tab Reka Bentuk (8 preset tema & 6 bentuk butang), tab Profil & Media Sosial (11 platform sosial), dan tab Kongsi & Kod QR. Lajur kanan memaparkan **Live Interactive Mobile Mockup** yang responsif terhadap sebarang perubahan masa nyata.
- **Halaman Awam (`app/(public)/bio/[username]/` & `app/(public)/b/[username]/`)**:
  - Paparan ultra-responsif untuk pelawat awam dengan metadata dinamik OpenGraph dan Twitter card.
  - Animasi lancar `framer-motion`, penjejakan klik (*click tracking*), butang kongsi terapung (*floating share button*), dan lencana *Powered by KlikForm*.
- **Ujian & Kualiti**:
  - Ujian unit di `tests/bio-links.test.ts` dan `tests/bio-storage.test.ts`.
  - 224 / 224 ujian unit lulus merentas 28 suite ujian.
  - 0 ralat ESLint, 0 ralat TypeScript, 49 laluan dikompilasi bersih dalam Next.js 16 (Turbopack).
- **Deployment**:
  - Berjaya dideploy ke Vercel Production: `https://klikform-6eput2cxt-sofwan-jailanis-projects.vercel.app` (Deployment ID: `dpl_25xXEjJvuysBQvhCkw1hW1FMQFwA`).
  - Aliased terus ke domain pengeluaran: `https://www.klikform.com`.

---

## 2026-09-03 — Pembaikan Kontras Glassmorphism & Outline Butang KlikBio
- **Laporan Masalah Pengguna**:
  - Pengguna melaporkan "bila tekan dekat glassmorphism jadi tak nampak tulisan" (disertai tangkapan skrin telefon mockup dalam `/bio-builder/[id]`).
  - Analisis piksel membuktikan teks butang "klikform" berwarna putih tulen `rgb(255,255,255)` di atas butang frosted putih `rgb(242,246,250)` dengan latar belakang halaman Minimal Light `rgb(241,245,249)` (`#f1f5f9`), menyebabkan teks tidak kelihatan.
- **Punca Asal**:
  1. `BUTTON_STYLES['glass'].class` mengandungi kelas `bg-white/10 border border-white/20`.
  2. Apabila digabungkan dengan pautan yang mempunyai status highlight (`isHighlight: true`) pada tema Minimal Light, `highlightButtonClass` menetapkan `text-white`.
  3. Kelas `bg-white/10` menindih latar gelap, meninggalkan teks putih di atas latar lutsinar putih.
- **Penyelesaian Dilaksanakan**:
  1. Membina fungsi `getBioButtonClass(theme, buttonStyle, isHighlight)` dalam `lib/bio-links/themes.ts` untuk mengira padanan warna dan kelegapan butang berasaskan tema secara kontekstual:
     - Tema Cerah (`Minimal Light`):
       - Normal: `rounded-2xl backdrop-blur-xl bg-white/70 hover:bg-white/85 text-slate-900 font-medium border border-white/80 shadow-sm`
       - Highlight: `rounded-2xl backdrop-blur-xl bg-white/90 hover:bg-white text-slate-950 font-bold border-2 border-slate-900/30 shadow-md ring-2 ring-slate-900/10`
     - Tema Gelap:
       - Normal: `rounded-2xl backdrop-blur-xl bg-white/10 hover:bg-white/20 ${glassTextColor} font-medium border border-white/20 shadow-lg`
       - Highlight: `rounded-2xl backdrop-blur-xl bg-white/20 hover:bg-white/25 ${highlightText} font-bold border-2 shadow-xl shadow-black/30 ring-2`
     - Gaya Outline turut diperbaharui dengan kawalan kontras tema serupa bagi menghalang teks pudar.
  2. Mengemas kini `MobileMockupView` di `app/(dashboard)/bio-builder/[id]/client.tsx` dan `PublicBioClient` di `app/(public)/bio/[username]/client.tsx` untuk menggunakan `getBioButtonClass`.
  3. Menambah suite ujian unit baharu `KlikBio — Button Class Generator & Contrast Guard` di `tests/bio-links.test.ts`.
  4. Pengesahan Kualiti:
     - `npm test`: 230 / 230 ujian lulus (28 suite ujian).
     - `npm run lint`: 0 amaran & 0 ralat.
     - `npm run typecheck`: 0 ralat TypeScript.
     - `npm run build`: Kompilasi Turbopack Next.js 16 bersih (49 laluan).
  5. **Deployment Vercel Production**:
     - Commit Git: `5eea096` (`fix(bio-links): resolve invisible text on light themes with glassmorphism and outline buttons`) dipush ke `origin master`.
     - Vercel Production Deployment: `https://klikform-ghepqc36q-sofwan-jailanis-projects.vercel.app` (Deployment ID: `dpl_5DytASE63J4HLvo6u6kV7nGJutCN`).
     - Aliased terus ke domain pengeluaran: `https://www.klikform.com`.

### 2026-09-03: Pembaikan Butang Melimpah Keluar (Overflow) Dalam Modal Share & QR
- **Punca Isu**:
  - `DialogFooter` daripada shadcn mengandungi kelas lalai `sm:flex-row sm:justify-end`.
  - Komponen `Button` mempunyai `shrink-0` (`flex-shrink: 0`), dan kedua-dua butang diberi `w-full` (100% lebar).
  - Dalam modal sempit `sm:max-w-xs` (320px lebar), jumlah lebar 2 butang melebihi 540px. Apabila disusun secara mendatar (`sm:flex-row`) dengan penjajaran kanan (`sm:justify-end`), butang pertama ("Copy Link") ditolak ~260px melimpah keluar ke sebelah kiri modal dialog ke kawasan skrin gelap.
- **Penyelesaian**:
  - Menggantikan `DialogFooter` dengan `<div className="grid grid-cols-2 gap-2 w-full pt-1">` yang membahagikan kedua-dua butang secara seimbang 50%-50% di dalam bekas dialog.
  - Menaik taraf kelebaran dialog daripada `sm:max-w-xs` (320px) kepada `sm:max-w-sm` (384px) untuk ruang dalaman yang lebih kemas dan selesa.
  - Memperbaiki kedua-dua fail: `app/(public)/bio/[username]/client.tsx` dan `app/(dashboard)/bio/client.tsx`.
  - Pengesahan: `npm test` lulus 230/230 ujian, 0 ralat TypeScript (`tsc`), 0 amaran lint.
  - Deployment Vercel: Commit `975d98e` berjaya dideploy ke Production (`dpl_62TxGvtsTnU5T7oyv8snzYFZ6iWA`) & aliased ke `https://www.klikform.com`.

---

## 2026-09-06: Pembaikan Dropdown Tajuk Borang Panjang Melimpah Keluar Modal (Overflow Fix)
- **Laporan Isu Pengguna**:
  - Pengguna melaporkan "kenapa jadi macam ni ya. bila choose klikform form tu panjang sgt" beserta gambar modal "Add New Link / Block" yang melimpah keluar ke kanan melepasi kotak modal (semua elemen borang seperti grid Block Type, Button Title, dan Highlight Animation tertarik melintang ke luar modal).
- **Punca Asal (Root Causes)**:
  1. Komponen `SelectTrigger` (`components/ui/select.tsx`) menggunakan kelas lalai `w-fit`, `whitespace-nowrap`, dan `*:data-[slot=select-value]:flex *:data-[slot=select-value]:line-clamp-1`. Dalam CSS, `display: flex` mengatasi `display: -webkit-box`, menyebabkan `line-clamp-1` tidak berfungsi dan teks tidak terpotong (tidak berlaku ellipsis).
  2. Apabila tajuk borang sangat panjang (cth: "PROGRAM SAMBUTAN HARI METEOROLOGI SEDUNIA 2026 SERTA PERASMIAN SISTEM MODEL AIR QUALITY MONITORING..."), `w-fit` mengembangkan `SelectTrigger` kepada kelebaran semula jadi teks (~1000px).
  3. `DialogContent` (`components/ui/dialog.tsx`) adalah CSS Grid container yang secara lalai mempunyai `min-width: auto` pada setiap elemen anak. Tanpa `min-w-0 max-w-full` atau `overflow-x-hidden`, elemen `<form>` mengembang mengikut kelebaran `SelectTrigger`, menyebabkan semua grid `grid-cols-2`, input, dan kad pilihan ditarik melimpah keluar melepasi kotak putih dialog.
- **Penyelesaian**:
  1. `components/ui/select.tsx`:
     - Menukar `SelectTrigger` daripada `w-fit` kepada `w-full min-w-0`.
     - Menggantikan konflik `flex` pada `select-value` kepada `truncate min-w-0 text-left flex-1`.
     - Memastikan ikon panah ke bawah mengekalkan `shrink-0`.
     - Mengemas kini `SelectValue` dengan `truncate min-w-0 text-left` dan `SelectItem` dengan `truncate min-w-0`.
     - Menetapkan `max-w-[calc(100vw-2rem)]` pada `SelectContent`.
  2. `components/ui/dialog.tsx`:
     - Menambah `overflow-x-hidden` pada `DialogContent` sebagai benteng keselamatan CSS.
  3. `app/(dashboard)/bio-builder/[id]/client.tsx`:
     - Mengemas kini kedua-dua `AddLinkDialog` dan `EditLinkDialog` dengan `max-h-[90vh] overflow-y-auto` dan `<form className="min-w-0 max-w-full">`.
     - Menetapkan `<SelectTrigger className="w-full">` dan `<SelectContent position="popper" className="max-w-[var(--radix-select-trigger-width)]">`.
     - Menambah `truncate` dan atribut `title={f.title}` pada setiap `<SelectItem>` untuk pengalaman tooltip asli yang kemas.
- **Pengesahan**:
  - `npm run lint`: 0 ralat, 0 amaran.
  - `npm test`: 230/230 ujian lulus (28 test suite).
  - `npm run build`: Kompilasi Turbopack Next.js 16 bersih (49 routes).
- **Deployment Vercel Production**:
  - Git Commit: `0498847` (`fix(bio): prevent modal overflow when selecting forms with long titles`) dipush ke `origin master`.
  - Vercel Production Deployment: `https://klikform-nyx8rtk36-sofwan-jailanis-projects.vercel.app` (Deployment ID: `dpl_2eeofcarS91f7rT2yYnG54Ab4MWt`).
  - Aliased terus ke domain pengeluaran: `https://www.klikform.com`.

---

## 2026-09-06: Penggantian Avatar URL Kepada Muat Naik Terus Supabase Storage (Mirrored QR Builder)
- **Pertanyaan & Keperluan Pengguna**:
  - Pengguna bertanya mengapa meletakkan URL gambar avatar tidak memaparkan imej, dan meminta sama ada boleh digantikan dengan muat naik fail ke storage seperti yang terdapat pada bahagian muat naik logo QR Builder.
- **Punca Avatar URL Gagal**:
  - Pautan imej luaran yang disalin pengguna (cth. Google Drive viewer links, Facebook/Instagram CDNs) bukanlah fail gambar terus (.png/.jpg) dan menyekat *hotlinking* (CORS / `Cross-Origin-Resource-Policy: same-origin`).
  - Elemen `<img>` tidak mempunyai pengendali ralat `onError` untuk memaparkan avatar gantian (fallback) jika imej gagal dimuat.
- **Penyelesaian & Ciri Dilaksanakan**:
  1. **Muat Naik Gambar Profil Menggunakan Supabase Storage** (`app/(dashboard)/bio-builder/[id]/client.tsx`):
     - Membina sistem muat naik berpandukan corak QR Builder:
       - Memampatkan imej di sisi klien menggunakan `compressImage(file, 1)` (maksimum 1MB, format web optimum).
       - Memuat naik ke bucket awam Supabase Storage (`qr_logos`) di bawah folder pengguna (`${userId}/bio-avatar-${uuid}.${ext}`).
       - Mendapatkan URL awam secara kekal dan menyimpan terus ke profil via `handleSavePage({ avatarUrl: publicUrl })`.
       - Menghapuskan imej avatar lama daripada storan (`deleteOldAvatar`) secara automatik apabila digantikan atau dibuang.
     - Menyediakan kad UI dengan paparan thumbnail avatar bulatan 14x14, butang "Upload Photo" / "Change Photo", dan butang "Remove".
     - Menyimpan pilihan "Paste URL instead" bagi pengguna yang masih ingin menggunakan pautan imej luar.
  2. **Pengendali Ralat & Fallback Elegan (`onError`)**:
     - Dilengkapi pada `MobileMockupView` (`bio-builder`), `PublicBioClient` (`/bio/[username]`), dan `BioPageCard` (`/bio`).
     - Jika imej avatar gagal dimuat atas apa jua sebab, paparan secara automatik kembali kepada bulatan avatar huruf awal (*initial letter*) tanpa menampilkan ikon gambar rosak.
- **Pengesahan**:
  - `npm run lint`: 0 ralat, 0 amaran.
  - `npx tsc --noEmit`: 0 ralat TypeScript.
  - `npm test`: 230 / 230 ujian lulus (28 test suites).
  - `npm run build`: Kompilasi Turbopack Next.js 16 berjaya (49 routes).
- **Deployment Vercel Production**:
  - Git Commit: `c1f8f42` (`feat(bio): add direct storage image upload for avatar with automatic compression`) dipush ke `origin master`.
  - Vercel Production Deployment: `https://klikform-kb5f2s8qc-sofwan-jailanis-projects.vercel.app` (Deployment ID: `dpl_4LrasAe3KSNFyrE1SRXudY26KxE4`).
  - Aliased terus ke domain pengeluaran: `https://www.klikform.com`.

---

## 2026-09-06: Ciri Corak Latar Belakang KlikBio (Background Patterns)
- **Pertanyaan / Keperluan Pengguna**:
  - "yg background tu boleh ke nak ada corak2?"
  - Memerlukan sokongan pilihan corak latar belakang estetik (dots, grid, stripes, waves, crosses, stars, circuit, atau none) untuk menghiasi halaman profil KlikBio dengan kontras warna pintar mengikut tema cerah atau gelap.
- **Penyelesaian & Ciri Dilaksanakan**:
  1. **Jenis & Konfigurasi** (`lib/types/bio-links.ts` & `lib/types/index.ts`):
     - Menambah jenis `BioPattern` (`'none' | 'dots' | 'grid' | 'stripes' | 'waves' | 'crosses' | 'stars' | 'circuit'`).
     - Menambah medan pilihan `pattern?: BioPattern` di dalam `BioThemeConfig` (disimpan secara automatik dalam kolum `jsonb` `bio_pages.theme_config` tanpa memerlukan migrasi pangkalan data).
     - Di-re-export daripada barrel types `lib/types/index.ts`.
  2. **Penjana Corak & Kontras Pintar** (`lib/bio-links/themes.ts`):
     - Menyediakan definisi `BIO_PATTERNS` untuk 8 corak:
       - `none`: Plain theme background without texture.
       - `dots`: Polka Dots halus (`radial-gradient`).
       - `grid`: Modern Grid (`linear-gradient`).
       - `stripes`: Diagonal Stripes (`repeating-linear-gradient`).
       - `waves`: Topography Waves (kontur SVG data URI).
       - `crosses`: Minimal Crosses (tanda tambah SVG data URI).
       - `stars`: Starry Sparkles (kerlipan bintang SVG data URI).
       - `circuit`: Tech Circuit (garisan papan litar SVG data URI).
     - Fungsi `getBioPatternStyle(pattern, theme)` mengesan kecerahan tema:
       - Tema cerah (`minimal`): menggunakan warna dakwat gelap legap rendah (`rgba(15, 23, 42, ...)`).
       - Tema gelap/vibrant: menggunakan warna dakwat putih lembut (`rgba(255, 255, 255, ...)`).
  3. **Antara Muka Pengguna Builder** (`app/(dashboard)/bio-builder/[id]/client.tsx`):
     - Di bawah Tab 2 ("Design & Theme"), ditambah bahagian kad interaktif "Background Patterns / Corak Latar".
     - Setiap pilihan corak memaparkan thumbnail pratonton dinamik menggunakan latar belakang tema semasa yang aktif, dengan cincin hijau dan lencana penunjuk aktif bagi corak yang dipilih.
     - `MobileMockupView` dilengkapi lapisan overlay corak dengan `pointer-events-none` dan `z-0` di bawah kandungan profil.
  4. **Halaman Awam Responsif** (`app/(public)/bio/[username]/client.tsx`):
     - Dilengkapi lapisan `fixed inset-0 pointer-events-none z-0` dengan gaya corak yang dipilih supaya corak kekal rata sebagai wallpaper estetik semasa skrol tanpa mengganggu klik pautan atau butang.
  5. **Ujian Unit & Pengesahan Kualiti**:
     - Ditambah suite ujian unit `KlikBio — Background Patterns & Contrast Generator` dalam `tests/bio-links.test.ts`.
     - `npm test`: 235 / 235 ujian lulus (28 suite ujian).
     - `npm run typecheck`: 0 ralat TypeScript.
     - `npm run lint`: 0 amaran linter.
     - `npm run build`: Kompilasi Turbopack Next.js 16 berjaya (49 routes).
  6. **Deployment Vercel Production**:
     - Git Commit: `5e6fbe7` dipush ke `origin master`.
     - Vercel Production Deployment: `https://klikform-6tfzvb627-sofwan-jailanis-projects.vercel.app` (Deployment ID: `dpl_7pV17fX4R8mjatScQiiDn7hYCiCh`).
     - Aliased ke: `https://www.klikform.com`.

---

## 2026-09-06: Pembaikan Ralat 404 Bila Tekan Pautan Borang KlikForm di Halaman Bio (Dual UUID/ShortCode Lookup)
- **Laporan Isu Pengguna**:
  - Pengguna melaporkan "kenapa jadi macam ni ya bila tekan klikform form" bersama tangkapan skrin 404 "Page not found: The page you are looking for doesn't exist, may have been removed, or the link is incorrect...".
- **Punca Asal (Root Cause)**:
  1. Dalam Bio Builder (`app/(dashboard)/bio-builder/[id]/client.tsx`), apabila pengguna memilih borang akaun mereka di bawah blok "KlikForm Form", kod menetapkan URL sebagai `/form/${chosenForm.shortCode || chosenForm.id}`.
  2. Kebanyakan borang dijana dengan `short_code` (cth: `daftarkursus`), menghasilkan URL `/form/daftarkursus`.
  3. Namun, laluan Next.js `app/(public)/form/[id]/page.tsx` hanya menjalankan `getFormById(id)` di mana kolum `forms.id` dalam Supabase PostgreSQL adalah jenis data `UUID`.
  4. Apabila PostgreSQL menerima carian rentetan bukan-UUID (`eq('id', 'daftarkursus')`), ia menghasilkan ralat `22P02 invalid input syntax for type uuid`, menyebabkan `getFormById` mengembalikan `undefined` dan Next.js memanggil `notFound()` (skrin 404).
  5. Mana-mana pautan borang yang telah disimpan sebelum ini dalam pangkalan data `bio_links` dengan format `/form/${shortCode}` turut gagal dimuatkan.
- **Penyelesaian & Pencegahan**:
  1. **Helper Carian Dwi-Moden (`getFormByIdOrShortCode`)** (`lib/storage/forms.ts`):
     - Menggunakan `cache()` daripada React untuk deduping metadata dan render halaman.
     - Menggunakan regex `UUID_REGEX` untuk mengesan sama ada parameter adalah UUID sah:
       - Jika UUID: mencari mengikut `id` terlebih dahulu; jika tidak dijumpai, mencuba `short_code`.
       - Jika bukan UUID: mencari mengikut `short_code` terlebih dahulu; jika tidak dijumpai, mencuba `id`.
     - Menghapuskan ralat sintaks UUID PostgreSQL sama sekali.
  2. **Kemas Kini Laluan Awam (`/form/[id]` & `/s/[code]`)**:
     - `app/(public)/form/[id]/page.tsx`: Menggunakan `getFormByIdOrShortCode(id)` untuk `generateMetadata` dan `PublicFormPage`. Ini serta-merta membetulkan SEMUA pautan sedia ada `/form/[short_code]` tanpa memerlukan pengguna mengedit semula pautan bio mereka.
     - `app/(public)/s/[code]/page.tsx`: Menggunakan `getFormByIdOrShortCode(code)` sebagai fallback supaya kedua-dua laluan menyokong kedua-dua ID dan short code secara saling bertukar ganti.
  3. **Piawaian URL Bio Builder & UX Klik Awam**:
     - Di `app/(dashboard)/bio-builder/[id]/client.tsx`, pautan dijana sebagai `/s/${shortCode}` secara piawai.
     - Di `app/(public)/bio/[username]/client.tsx`, pautan jenis `form` dibuka dalam tab baharu (`target="_blank"`) supaya pelawat tidak terkeluar dari halaman direktori bio mereka.
  4. **Ujian Unit & Kualiti**:
     - Ditambah fail ujian unit baharu `tests/form-lookup.test.ts` (4 ujian: UUID lookup, short_code lookup, UUID fallback, empty identifier guard).
     - `npm test`: 239 / 239 ujian unit lulus (29 suite ujian).
     - `npm run typecheck` & `npm run lint`: 0 ralat / 0 amaran.
     - `npm run build`: Kompilasi Turbopack Next.js 16 bersih (49 routes).
  5. **Deployment Vercel Production**:
     - Git Commit: `1a55b52` dipush ke `origin master`.
     - Vercel Production Deployment: `https://klikform-hzi80coui-sofwan-jailanis-projects.vercel.app` (Deployment ID: `dpl_6AwDtoTQjEM2k9GKSfPAWeeQwGoz`).
     - Aliased terus ke domain pengeluaran: `https://www.klikform.com`.

---

## 2026-09-07: Penambahbaikan Menyeluruh E-Cert Builder Suite (Presets, PDF A4, Fonts, Seals, Alignment)
- **Permintaan Pengguna**:
  - "dekat E-cert builder tu apa yg boleh ditambah baik?" & "tambah baik kesemuanya"
- **Penyelesaian & Ciri Dilaksanakan**:
  1. **Navigasi & Sedia-Cetak PDF A4**:
     - Memperbetulkan pautan usang pada Toolbar: menggantikan `/ecert/builder` kepada `/certificates/builder` dan laluan preview yang sah.
     - Melaksanakan eksport `PDF (A4)` landskap (297mm x 210mm) bersebelahan butang PNG sedia ada menggunakan `jsPDF` dan `html2canvas-pro` (skala 3x, mampatan FAST JPEG).
     - Menambah toggle sempadan cetakan selamat (*Print Safe Margin / Bleed Guide* 36px) dengan garisan amaran emas lembut yang tidak disertakan dalam dokumen akhir.
  2. **Galeri Templat Pra-Bina (6 Preset Sedia Guna)** (`lib/certificates/presets.ts`):
     - `Blank Canvas`: Reka bentuk asas untuk reka bentuk tersuai dari awal.
     - `Royal Gold Excellence`: Tema mewah anugerah kecemerlangan dengan bingkai ganda dan aksen emas.
     - `Corporate Blue Professional`: Tema korporat moden untuk sijil penghargaan organisasi/syarikat.
     - `Academic Classic`: Sijil bersempadan hijau zamrud klasik untuk institusi pendidikan dan sekolah.
     - `Modern Workshop`: Reka bentuk oren/amber cergas untuk latihan kemahiran dan bengkel teknikal.
     - `Luxury Dark Edition`: Tema hitam-emas eksklusif untuk pengiktirafan VIP, penaja, dan malam gala.
     - Dialog "Cipta Templat Baharu" (`NewCertificateDialog`) dinaik taraf dengan reviu kad visual, palet warna, dan deskripsi kategori.
     - `createCertificateTemplateAction` menyuntik elemen preset secara automatik ke dalam database.
  3. **Aset Hiasan Rasmi & Tipografi Kaligrafi**:
     - Ditambah 4 lencana/cop rasmi emas (*Gold Seal Badges*): Cop Emas Anugerah, Lencana Pengesahan Lulus, Perisai Sahih, dan Piala Penghargaan.
     - Ditambah butang pantas "Tambah Bingkai Sijil Emas" bersempadan berganda klasik.
     - Pilihan Google Fonts kaligrafi rasmi: *Alex Brush, Pinyon Script, Great Vibes, Cormorant Garamond, Cinzel Decorative, Dancing Script*.
     - Suntikan stylesheet Google Fonts secara global merentas editor canvas, preview, dan renderer sijil.
  4. **Placeholder Tambahan & Dwi-Tandatangan**:
     - Menambah placeholder dinamik `{organisasi}`, `{peranan}`, dan `{gred}` merentas editor, preview, penjanaan CSV pukal (*bulk generation*), dan renderer sijil.
     - Menambah butang pintar "Preset Dwi-Tandatangan" untuk menyusun dua blok tandatangan seimbang (cth: Pengarah & Pengerusi) secara automatik.
  5. **Alat Penjajaran Pintar Canva-Style (Align & Distribute)** (`lib/certificates/alignment.ts`):
     - Membolehkan penjajaran ke kanvas (Pusat X / Pusat Y) dan penjajaran berbilang elemen terpilih (Kiri, Pusat, Kanan, Atas, Tengah, Bawah, serta pengagihan jarak mendatar/menegak sama rata).
  6. **Pengesahan & Kualiti**:
     - Ujian unit baharu di `tests/certificate-presets.test.ts` (13 ujian).
     - `npm test`: 252 / 252 ujian lulus merentas 30 suites.
     - `npm run typecheck` & `npm run lint`: 0 ralat / 0 amaran.
     - `npm run build`: Kompilasi Next.js 16 (Turbopack) bersih (49 routes).

---

## 2026-09-07: Pengoptimuman E-Cert Builder Untuk Skrin Komputer Riba 14 Inci
- **Laporan Isu Pengguna**:
  - Pengguna melaporkan "untuk screen 14 inch jadi macam ni" bersama tangkapan skrin yang menunjukkan kanvas potret terhimpit di antara 3 bar sisi, terpotong di bahagian atas/bawah, serta dwi-scrollbar bertindih.
- **Punca Masalah (Root Causes)**:
  1. Bar sisi papan pemuka utama KlikForm (`w-64` / 256px) kekal terpapar di sebelah kiri pada laluan `/certificates/builder/[id]`, memakan 20% lebar skrin 14 inci dan memampatkan ruang kanvas.
  2. Kanvas menggunakan `w-full max-w-[800px]` (atau `max-w-[500px]`) dan `aspectRatio` tanpa had ketinggian, menyebabkan kanvas (terutamanya mod potret) melimpah secara menegak melebihi ketinggian tetingkap (~450px - 530px).
  3. Pemusatan `items-center justify-center` bersama `overflow-auto` dalam flexbox menolak limpahan anak elemen ke koordinat negatif ($Y < 0$), menyebabkan bahagian atas sijil terpotong dan mustahil diskrol oleh pelayar.
  4. Susunan `h-screen` berserta `SubscriptionBanner` dan `overflow-y-auto` pada layout dashboard menghasilkan dwi-scrollbar menegak bertindih.
- **Penyelesaian & Ciri Dilaksanakan**:
  1. **Studio Shell 100vw x 100vh Pintar (`DashboardShell`)**:
     - Dicipta `components/dashboard/dashboard-shell.tsx` yang membungkus layout dashboard.
     - Menyembunyikan `DashboardSidebar` dan `SubscriptionBanner` secara automatik apabila berada di laluan studio `/certificates/builder/[id]` (termasuk `/preview` dan `/bulk`), memberikan kanvas keluasan 100vw x 100vh tanpa sebarang halangan atau dwi-scrollbar.
     - Menekan butang kembali `[ ← ]` memaparkan semula bar sisi papan pemuka secara lancar.
  2. **Penskalaan Muat Skrin Pintar (*Auto Fit-to-Screen*)**:
     - `ResizeObserver` mengukur ruang kerja `containerRef` dan mengira `fitScale` automatik.
     - Mengira dimensi render kanvas (`renderedWidth` & `renderedHeight`) secara langsung berdasarkan skala.
     - 100% keseluruhan sijil (Landskap & Potret) sentiasa muat di tengah skrin secara automatik tanpa perlu diskrol.
  3. **Penyelesaian Flexbox Safe Centering (`m-auto`)**:
     - Menggantikan `items-center justify-center` dengan `m-auto` pada kanvas di dalam bekas skrol. Menghalang sebarang pemotongan (*clipping*) pada bahagian atas atau kiri sijil.
  4. **Bar Kawalan Zum Terapung (Canva-Style)**:
     - Bar zum moden di bahagian bawah tengah:
       - `[ - ]`: Zum keluar (skala -10%).
       - `[ Muat Skrin (Fit) ]`: Menetapkan semula ke muat skrin automatik mengikut saiz tingkap semasa.
       - `[ + ]`: Zum masuk (skala +10%).
       - `[ 100% ]`: Paparan saiz sebenar 1:1.
  5. **Togol Bar Sisi Elemen (*Collapsible Sidebar*)**:
     - Butang `PanelLeft` ditambah pada toolbar untuk membuka/menutup bar sisi elemen bagi memaksimumkan ruang rekaan.
  6. **Orientasi Berpusat & Skala Elemen**:
     - Pertukaran orientasi Landskap ↔ Potret kini menskalakan koordinat elemen ($X$ dan $Y$) secara berkadar terus supaya elemen kekal berpusat.
     - Koordinat lalai `DEFAULT_ELEMENTS` dikemas kini ke pusat tepat $X = 561$ (1123 / 2).
  7. **Pengesahan Kualiti**:
     - `npm test`: 252 / 252 ujian lulus merentas 30 suites.
     - `npm run typecheck` & `npm run lint`: 0 ralat / 0 amaran.
     - `npm run build`: Kompilasi Next.js 16 (Turbopack) bersih (49 routes).

---

## 2026-09-07: Pengindahan Gaya Hover & Pilihan Elemen (Canva/Figma Grade) di E-Cert Builder
- **Permintaan Pengguna**:
  - "cantikkan hover boleh ke, bila tekan apa2 element, bagi kemas sikit" bersama tangkapan skrin bulatan merah pada elemen `{Nama Peserta}` yang menonjolkan masalah sempadan berlapis dan pemegang skala yang comot.
- **Punca Masalah Visual (Root Causes)**:
  1. **Pertindihan Tiga Lapis Garisan Sempadan**:
     - Pembungkus elemen luar mempunyai `ring-2 ring-primary ring-offset-2`.
     - Lapisan pilihan dalam mempunyai `border border-primary inset-0`.
     - Komponen pemboleh ubah (*placeholder*) mempunyai `border-2 border-dashed border-primary/40 bg-primary/5`.
     - Ketiga-tiga sempadan ini bertindih serentak apabila sesuatu elemen dipilih, menghasilkan paparan yang sangat berserabut dan comot.
  2. **Kotak Wayar Kekal pada Elemen Pemboleh Ubah**:
     - Semua placeholder (`{No. Siri}`, `{Nama Program}`, `{No. KP}`) sentiasa memaparkan kotak ungu bergaris putus-putus (*dashed*) tebal dan berlatarbelakangkan ungu walaupun tidak dipilih.
  3. **Keadaan Tetikus (*Hover*) Kusam**:
     - Menggunakan `hover:ring-1 hover:ring-gray-300` yang terlalu samar dan tidak responsif.
  4. **Pemegang Skala (*Resize Handles*) Kasar & Tidak Berpusat**:
     - Pemegang sudut menggunakan koordinat luar `-top-1.5 -left-1.5` yang tidak tepat mengikut resolusi skrin, serta sempadan 2px tebal yang menenggelamkan bulatan putih.
     - Pemegang sisi (*width pills*) kelihatan seperti gumpalan tebal yang tidak simetri.
- **Penyelesaian Dilaksanakan**:
  1. **Bingkai Pilihan Tunggal Yang Bersih (*Single Crisp Bounding Box*)**:
     - Membuang `ring-2 ring-offset-2` luar daripada elemen terpilih.
     - Menggunakan satu garisan bingkai bersih `-inset-0.5 border-[1.5px] border-primary z-30 rounded-[2px]` yang memberikan ruang lega 2px di sekeliling elemen tanpa menyentuh teks atau grafik.
     - Mengendalikan pilihan pelbagai (*multi-select*) secara berasingan dengan garisan `border-dashed border-primary/80` yang kemas.
  2. **Perapian Elemen Pemboleh Ubah (*Clean Placeholders*)**:
     - **Apabila Dipilih**: Garisan sempadan *dashed* dalam dan warna latar belakang ungu dipadamkan sepenuhnya (`border-transparent bg-transparent`), membolehkan pengguna melihat reka bentuk tipografi sebenar di dalam bingkai pilihan.
     - **Apabila Tidak Dipilih**: Garisan digantikan dengan sempadan halus elegan (`border-dashed border-primary/30 bg-primary/[0.03]`) yang lembut pada pandangan mata.
     - **Sewaktu Eksport PNG/PDF**: Sebarang garisan *dashed* pemboleh ubah dimatikan secara automatik (`isSelected || exporting || exportingPdf`) untuk hasil muat turun sedia cetak yang sempurna.
  3. **Pemegang Skala Canva-Grade (*Mathematically Centered Handles*)**:
     - 4 pemegang bucu kini diletakkan berpusat tepat di atas bucu bingkai menggunakan transformasi `translate` (`top-0 left-0 -translate-x-1/2 -translate-y-1/2` dll.).
     - Berukuran `w-2.5 h-2.5` (10px) dengan latar putih bersih, sempadan nipis 1.5px ungu jenama Klikform, dan bayang halus `shadow-sm`.
     - Pemegang sisi pil menegak (`w-1.5 h-4`) dan mendatar (`h-1.5 w-4`) berpusat tepat pada garisan sempadan dengan kursor dan animasi skala responsif (`hover:scale-125`).
  4. **Sorotan Hover Moden & Lembut**:
     - Elemen yang tidak dipilih kini mempunyai sorotan lembut `hover:ring-1 hover:ring-primary/60 hover:ring-offset-1 rounded-sm` dengan transisi lancar 150ms.
- **Pengesahan & Kualiti**:
  - `npm test`: 252 / 252 ujian lulus merentas 30 suites.
  - `npm run typecheck` & `npm run lint`: 0 ralat / 0 amaran.
  - `npm run build`: Kompilasi Next.js 16 (Turbopack) bersih (49 routes).

---

## 2026-09-14: Revamp Laman Utama (Landing Page) — Minimalist, Framer Motion & Kandungan Ciri Semasa
- **Permintaan Pengguna**:
  - "website tu boleh ke nak style frame motion pastu minimalist dan content tu update ikut features semasa"
- **Seni Bina & Pendekatan**:
  1. **Minimalist Aesthetic (Linear / Vercel Grade)**:
     - Latar putih bersih (`bg-white`) dengan sentuhan grid halus `radial-gradient` dot pattern.
     - Tipografi berkontras tinggi (`text-slate-900`, `tracking-tight`, `[text-wrap:balance]`).
     - Kad Bento Grid dan showcase moden dengan garisan mikro `border-slate-200/80` dan bayang halus `shadow-xs`.
  2. **Animasi Framer Motion**:
     - Hero staggered reveal (animasi kemasukan berturutan untuk lencana, tajuk utama, subteks, butang CTA, dan bukti sosial).
     - Mockup aplikasi interaktif dengan penukar tab produk (`Borang Pintar`, `Studio E-Sijil`, `Google Sheets`, `KlikBio`) menggunakan `layoutId="heroTabBubble"` dan `AnimatePresence`.
     - Skrol viewport reveal (`whileInView`, `viewport={{ once: true }}`) untuk Bento Grid, Showcase, Use Cases, dan Comparison.
     - Deep-dive showcase interaktif dengan tab animatif (`layoutId="showcaseActivePill"`).
  3. **Kandungan Mengikut Ciri-Ciri Terkini (*Features Semasa*)**:
     - **Borang Pintar**: Penyelarasan Google Sheets masa nyata tanpa webhook pihak ketiga, Formula Injection Shield, Multi-page (Page Breaks), Conditional Logic (Skip Logic), Attendance timer & GPS location, Response Edit Magic Link, dan pengesahan PDPA.
     - **Studio E-Sijil Canva-Style**: Pereka sijil kanvas penuh dengan pemegang penskalaan 4 bucu, 10+ templat pra-bina, Google Fonts kaligrafi, dan Auto-Scaling Typography untuk tajuk program panjang.
     - **Penjanaan Pukal (Bulk CSV to ZIP)**: Import fail CSV peserta dan eksport ratusan sijil PDF/PNG berasingan dalam fail ZIP dalam beberapa saat.
     - **Portal Semakan Awam & Kod QR Sah**: Semakan status sijil menggunakan No. IC/Pasport atau emel berserta Kod QR keselamatan.
     - **KlikBio**: Mikro-landing page (`/bio/[username]`) dengan 8 tema warna, 8 corak latar belakang, pautan WhatsApp terus, dan borang pendaftaran.
     - **Analitik Mesra Privasi**: Penjejakan drop-off medan borang tanpa menyimpan IP mentah.
  4. **Komponen Modular & Pengekalan SSG**:
     - `app/page.tsx` kekal sebagai **Server Component** dengan `metadata` penuh dan Static Site Generation (`○ (Static)`).
     - Komponen animasi diasingkan ke dalam folder baharu `components/landing/`:
       - `components/landing/landing-hero.tsx`
       - `components/landing/landing-features-bento.tsx`
       - `components/landing/landing-showcase.tsx`
       - `components/landing/landing-use-cases.tsx`
       - `components/landing/landing-comparison.tsx`
       - `components/landing/landing-cta.tsx`
       - `components/landing/landing-footer.tsx`
  5. **Endpoint Kesihatan & Pembersihan Amaran**:
     - Ditambah endpoint pelayan `app/health/route.ts` memulangkan `200 OK` bagi melayan semakan probe IDE/sistem luaran.
  6. **Perapian Kolum Perbandingan & Pembersihan Lencana Terapung**:
     - Membuang lencana terapung "KENAPA PILIH KLIKFORM?" dan "SATU PLATFORM" yang mengganggu pemandangan.
     - Menjadikan tajuk kolum KlikForm, Google Forms, dan Canva tulen, ringkas dan rata mengikut reka bentuk minimalist sebenar tanpa lencana serabut.
     - Membersihkan lencana-lencana tajuk seksyen terapung di seluruh halaman bagi menghasilkan rupa bentuk yang bersih, tenang, dan profesional.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 amaran / 0 ralat ESLint.
  - `npm test`: 252 / 252 ujian unit lulus merentas 30 suites ujian.
  - `npm run build`: Kompilasi Next.js 16 (Turbopack) bersih (50 laluan).

---

## 2026-09-14: Revamp Halaman Pricing (Pricing Page) — Estetika Minimalist & Polishing Kad Pelan
- **Permintaan Pengguna**:
  - "page pricing ni bagi cantikkan sikit" berdasarkan rupa bentuk kad pelan asal yang kelihatan rata dan kurang hierarki visual.
- **Punca Masalah Visual & UX**:
  1. Kad pelan harga sebelumnya (`components/pricing/plan-card.tsx`) kelihatan rata, dengan sempadan yang tegar dan jurang putih tidak seimbang antara kad pelan percuma dan pro.
  2. Lencana "Paling Popular" pada pelan Pro tidak cukup menonjol sebagai pilihan utama.
  3. Bahagian bawah kad dan butang tindakan tidak tersusun secara simetri merentas ketiga-tiga pelan.
  4. Halaman `app/pricing/page.tsx` kekurangan sentuhan estetik moden (tiada jaminan pembeli, tiada FAQ interaktif, dan footer legasi).
- **Penyelesaian Yang Dilaksanakan**:
  1. **Kad Pelan Moden Rounded-3xl (`components/pricing/plan-card.tsx`)**:
     - Membina kad dengan bucu membulat anggun (`rounded-3xl`), bayang lembut, dan peralihan transisi `hover:-translate-y-1`.
     - Pelan Pro (Paling Popular) ditinggikan dengan lencana gradien elegan (`bg-gradient-to-r from-purple-600 to-indigo-600`), bayang ungu berkilau (`shadow-purple-500/10`), dan sempadan primer ungu.
     - Paparan harga diperkemas dengan tanda harga besar `tracking-tight font-extrabold`, label harga asal yang dipotong (`line-through text-slate-400`), dan lencana diskaun hijau "Jimat 50%".
     - Ikon semakan bulat hijau emerald (`bg-emerald-50 text-emerald-600`) yang mesra pengguna.
     - Mematuhi peraturan susun atur kad flexbox (`flex-1` pada bekas ciri bawah) supaya butang tindakan sentiasa berlabuh sejajar di bahagian bawah kad tanpa mengira perbezaan bilangan ciri.
  2. **Susun Atur Halaman Pricing Minimalist (`app/pricing/page.tsx`)**:
     - Latar belakang putih bersih dengan corak grid halus `radial-gradient` yang seragam dengan landing page.
     - Bar jaminan ketenangan minda: "Batal bila-bila masa", "Bayaran selamat BCL / FPX (Perbankan Online)", dan "Sedia digunakan serta-merta".
     - Seksyen Soalan Lazim (FAQ) interaktif berasaskan Radix UI Accordion merangkumi persoalan pembayaran, pembatalan langganan, had respons, dan kaedah pembayaran FPX.
     - Menyatukan `LandingFooter` minimalist di bahagian kaki halaman.
     - Mengekalkan status Static Site Generation (`○ (Static)`) Next.js 16.
- **Pengesahan & Kualiti**:
  - `npm run lint`: 0 amaran / 0 ralat.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm test`: 252 / 252 lulus merentas 30 suites ujian (termasuk `tests/pricing.test.ts`).
  - `npm run build`: Kompilasi Turbopack Next.js 16 bersih (50 laluan).

---

## 2026-09-14: Punca `npm run dev` Terputus Tiba-Tiba (Konflik `next build` Serentak)
- **Isu**: Pengguna mendapati `npm run dev` tiba-tiba terputus kembali ke prompt `C:\Users\Sofwan\Desktop\klikform>` tanpa ralat sejurus selepas request `GET /health 200`.
- **Punca Utama (Root Cause)**:
  - Pada masa pengguna sedang menguji `/pricing` di pelayar, ejen menjalankan arahan verifikasi pengeluaran `npm run build` di latar belakang.
  - Next.js (`next build`) membersihkan (`wipe/delete`) keseluruhan folder `.next` pada langkah *Creating an optimized production build*.
  - Apabila direktori `.next` dipadam dan fail-fail dikunci oleh `next build`, proses `next dev` (Turbopack) kehilangan *cache state* dan secara automatik keluar secara bersih (*graceful exit*) tanpa memaparkan stack trace ralat.
- **Tindakan**:
  - Menambah peraturan baharu dalam `lessons.md` untuk mengelakkan pelaksanaan `next build` serentak semasa dev server aktif.
  - Memastikan port 3000 bebas daripada proses tersangkut supaya pengguna boleh menjalankan `npm run dev` semula dengan lancar.

---

## 2026-09-14: Pengubahsuaian Lebar Kotak Pricing (Widened Layout)
- **Permintaan Pengguna**: "kotak pricing tu lebarkan sikit boleh tak" bersama tangkapan skrin yang menunjukkan kad harga sempit di tengah skrin pada paparan desktop.
- **Punca**: Grid sebelum ini terhad pada `max-w-6xl` (1152px), menyebabkan 3 kad mampat sekitar ~340px setiap satu dengan ruang kosong yang besar di kiri dan kanan skrin.
- **Penyelesaian**:
  - Memperluas bekas utama dan grid di `app/pricing/page.tsx` dari `max-w-6xl` (1152px) kepada `max-w-[1320px]` / `max-w-[1360px]`.
  - Mengemaskini *inner padding* kad di `components/pricing/plan-card.tsx` kepada `p-7 sm:p-8 lg:p-9` untuk imbangan visual yang lebih lega dan selesa.
  - Pengesahan: `npm run lint` (0 ralat), `npm run typecheck` (0 ralat), `npm test` (252/252 lulus).

---

## 2026-09-14: Penyelesaian Isu `next dev` Terputus Senyap di Windows (Migrasi Turbopack ke Webpack)
- **Isu**: Pengguna melaporkan `npm run dev` mati/terputus secara tiba-tiba tanpa menekan `Ctrl + C` dan tanpa memaparkan sebarang mesej ralat (sejurus selepas request `GET /health 200` atau beberapa request laluan).
- **Punca Sebenar (Root Cause)**:
  1. Pada Next.js 16, arahan `next dev` secara lalai menggunakan enjin **Turbopack** berasaskan binari Rust natif.
  2. Pada sistem operasi Windows (NTFS), Turbopack mempunyai pepijat kritikal penguncian fail (*file locking / STATUS_ACCESS_VIOLATION*) apabila menulis fail cache `.next`.
  3. Apabila kegagalan ini berlaku dalam proses natif Rust, ia tidak menghasilkan stack trace JavaScript. Proses anak (*worker process*) terhenti secara senyap, dan skrip induk `next-dev.js` menangkap `child.on('exit')` lalu memanggil `process.exit(0)` ke terminal prompt.
- **Penyelesaian Dilaksanakan**:
  1. Mengemas kini skrip `"dev": "next dev --webpack"` dalam `package.json` untuk menggunakan enjin Webpack yang terbukti matang dan stabil di Windows tanpa masalah *silent crash*.
  2. Memadam folder cache `.next/` sepenuhnya untuk membuang sebarang artifak cache Turbopack yang rosak.
  3. Mengesahkan semula: `npm run typecheck` (0 ralat), `npm run lint` (0 ralat).

---

## 2026-09-14: Pengemaskinian Harga Pelan Pro kepada RM 15 Sebulan
- **Permintaan Pengguna**: "tukar ke RM15 sebulan" bersama tangkapan skrin blok harga Pro (menolak teks promosi lama RM 5/10 dan lencana Jimat 50%).
- **Penyelesaian Dilaksanakan**:
  1. **Konstanta Harga Tunggal (`lib/constants/pricing.ts`)**:
     - Mengubah `amount` kepada `15.0` (caj BCL.my).
     - Menetapkan `display` kepada `'RM 15'`, `period: '/ month'`, `priceDetail: 'Batal bila-bila masa'`, dan `description: 'KlikForm Pro Plan - Monthly Subscription (RM 15/month)'`.
     - Mentakrifkan `interface PricingConfig` agar tiada isu penyempitan jenis `never` pada `periodDetail`.
  2. **Kad Pelan Harga (`components/pricing/plan-card.tsx`)**:
     - Menghapuskan lencana promosi lama `Jimat 50%` dan teks potong `RM 10`.
     - Memaparkan paparan harga bersih: **RM 15 / month**.
     - Subteks diperkemas: "RM 15 sebulan • Akses penuh tanpa had" dan "Batal bila-bila masa • Tiada caj tersembunyi".
  3. **Halaman Penentuan Harga (`app/pricing/page.tsx`)**:
     - Mengemaskini soalan FAQ #2 kepada soalan harga langganan tetap Pro (RM 15/bulan) menggantikan soalan promosi 3 bulan lama.
  4. **Ujian Unit & Pengesahan**:
     - Mengemaskini `tests/pricing.test.ts` untuk menguji harga RM 15.
     - `npm test`: 251 / 251 ujian lulus.
     - `npm run typecheck`: 0 ralat TypeScript.
     - `npm run lint`: 0 amaran / 0 ralat ESLint.

---

## 2026-09-14: Revamp Menu Dropdown Produk Navbar (Mega-Menu Style & 6 Produk Terkini)
- **Permintaan Pengguna**: "dekat sini pun update product baru, pastu buat style baru yg lebih menarik" (berdasarkan tangkapan skrin menu dropdown "Products" di navbar landing page).
- **Punca & Keperluan**:
  1. Menu dropdown "Products" lama di navbar desktop (`components/landing-navbar.tsx`) hanya menyenaraikan 4 produk asal secara asas (Forms, Certificates, Shortener, QR Codes) dalam kotak dropdown kecil tanpa mencerminkan ekosistem penuh KlikForm 2026.
  2. KlikForm kini mempunyai 6 produk: Borang Pintar (Google Sheets sync), Studio E-Sijil Canva-Style, KlikBio (Link-in-Bio), Jana Sijil Pukal (CSV → ZIP), Kod QR Dinamik, dan URL Shortener.
  3. Reka bentuk menu lama kelihatan pudar berbanding laman utama minimalist moden yang baharu.
- **Penyelesaian Dilaksanakan**:
  1. **Mega-Menu Moden Rounded-3xl (`components/landing-navbar.tsx`)**:
     - Kotak menu diperluas (`w-[520px] md:w-[680px] lg:w-[720px]`) dengan bucu membulat anggun (`rounded-3xl`) dan bayang terapung moden `shadow-[0_20px_50px_rgba(15,23,42,0.12)]`.
     - Susun atur kad 2-kolum memaparkan kesemua 6 produk:
       1. **Online Forms** (ikon spreadsheet biru, Google Sheets sync, Formula Injection Shield)
       2. **Studio E-Sijil Canva** (ikon sijil ungu, pereka drag-to-scale, 10+ templat)
       3. **KlikBio (Link-in-Bio)** (ikon bintang emerald, lencana `BARU`, 8 tema warna & WhatsApp)
       4. **Jana Sijil Pukal (CSV → ZIP)** (ikon lapisan ambar, lencana `HOT`, eksport ratusan sijil serentak)
       5. **Kod QR Dinamik** (ikon QR rose ceria, resolusi tinggi)
       6. **URL Shortener** (ikon pautan indigo, penjejakan lawatan)
     - Setiap item dilengkapi bekas ikon squircle berona lembut yang bertukar menjadi berona pekat dan cerah semasa hover tetikus.
     - Ditambah **Trust & Action Bar** di bahagian bawah menu: memaparkan lencana jaminan verifikasi sijil awam berserta pautan pantas "Lihat Pelan & Harga" ke `/pricing`.
  2. **Penyelarasan Menu Navigasi Mudah Alih (`components/landing-mobile-menu.tsx`)**:
     - Memasukkan kesemua 6 produk dengan ikon kontras tinggi serta lencana `BARU` dan `HOT` dalam drawer menu telefon.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 amaran / 0 ralat ESLint.
  - `npm test`: 251 / 251 ujian lulus merentas 30 suites ujian.

---

## 2026-09-14: Pengindahan Kesan Hover & Pembetulan Susun Atur Mendatar Navbar Dropdown
- **Isu**: Pengguna memaklumkan "tak lawa bila hover" berserta tangkapan skrin yang menunjukkan kad menu "KlikBio":
  1. Ikon berada di atas tajuk secara menegak (*vertical stacking*) dan bukan di sebelah kiri.
  2. Semasa hover, sempadan kelabu tegar (`border-slate-200/60`) muncul secara mendadak menyerupai kotak kaku.
  3. Ikon hijau lembut bertukar menjadi blok hijau gelap pekat (`bg-emerald-600 text-white`) yang garang.
  4. Teks tajuk bertukar menjadi ungu (`text-purple-600`), bertembung dengan warna ikon hijau dan lencana hijau `BARU`.
- **Punca Sebenar (Root Cause)**:
  - Komponen `NavigationMenuLink` dalam `components/ui/navigation-menu.tsx` mengandungi kelas lalai `flex flex-col gap-1 hover:bg-accent`. Apabila digabungkan menerusi `asChild`, `flex-col` menolak susun atur anak menjadi menegak.
  - Keadaan hover asal menggunakan `group-hover:bg-emerald-600` (terlalu gelap) dan `group-hover:text-purple-600` untuk semua produk tanpa memadankan identiti warna masing-masing.
- **Penyelesaian Dilaksanakan**:
  1. **Pembetulan Susun Atur Mendatar**:
     - Membersihkan `components/ui/navigation-menu.tsx` daripada kelas `flex flex-col gap-1 hover:bg-accent` agar anak elemen mengawal susun atur sepenuhnya.
     - Menguatkuasakan `flex flex-row items-start gap-3.5` pada `ProductItem` di `components/landing-navbar.tsx` supaya ikon sentiasa berada kemas di sebelah kiri, manakala teks tajuk, lencana, dan penerangan berada di sebelah kanan.
  2. **Pengindahan Kesan Hover**:
     - Menyingkirkan garisan sempadan kelabu kaku (`border-slate-200/60`).
     - Menggunakan latar belakang lembut berona warna produk (`hover:bg-emerald-50/40`, `hover:bg-blue-50/40`, dll.) yang memberikan rasa sentuhan sutera yang lancar dan premium.
     - Ikon squircle mengekalkan latar pastelnya dengan sedikit pendalaman warna (`bg-100/80` & `text-700`) berserta penskalaan mikro `group-hover:scale-105` yang hidup tanpa warna hitam/pekat.
     - Warna teks tajuk semasa hover diselaraskan mengikut produk masing-masing (KlikBio bertukar menjadi emerald yang padan, Forms ke biru, Studio ke ungu, dsb.).
  3. **Penyelarasan Menu Mobile**:
     - Mengemaskini `components/landing-mobile-menu.tsx` dengan gaya hover senada.
  4. **Pembuangan Bar Bawah (*Bottom Action/Trust Bar*)**:
     - Membuang bar bawah `Portal Semakan Awam & Kod QR Sah disertakan automatik` dan butang `Lihat Pelan & Harga` daripada menu dropdown desktop di `components/landing-navbar.tsx` mengikut permintaan pengguna agar menu kekal minimalis, bersih, dan memfokuskan kepada kad-kad produk sahaja.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat.
  - `npm run lint`: 0 amaran/ralat.
  - `npm test`: 251 / 251 ujian lulus (30 suites).

---

## 2026-09-14: Penyediaan Halaman Khusus 6 Produk (Dedicated Product Pages)
- **Konteks & Permintaan Pengguna**: "setiap ni ada page masing2" (berdasarkan paparan menu dropdown dengan 6 produk).
- **Penemuan Seni Bina**:
  - Sebelum ini, hanya 4 produk mempunyai halaman pemasaran awam: `/products/forms`, `/products/certificates`, `/products/qr-codes`, `/products/shortener`.
  - Produk baharu **KlikBio** sebelum ini dipautkan terus ke `/bio` (laluan dashboard terlindung auth), manakala **Jana Sijil Pukal** berkongsi laluan `/products/certificates` dengan Studio Sijil Canva.
- **Penyelesaian Dilaksanakan**:
  1. **Cipta Halaman Pameran KlikBio (`app/products/bio/page.tsx` → `/products/bio`)**:
     - Memaparkan ciri-ciri 8 tema warna profesional, 8 corak latar belakang estetik, pautan WhatsApp terus, live mobile mockup preview, kod QR perkongsian, dan analitik klik.
  2. **Cipta Halaman Pameran Jana Sijil Pukal (`app/products/bulk-certificates/page.tsx` → `/products/bulk-certificates`)**:
     - Memaparkan keupayaan import CSV & auto-detect lajur, eksport ratusan sijil PDF/PNG ke fail ZIP dalam beberapa saat, auto-scaling typography, serta kod QR keselamatan.
  3. **Penyelarasan Pautan**:
     - `components/landing-navbar.tsx`: Mengemaskini pautan KlikBio ke `/products/bio` dan Jana Sijil Pukal ke `/products/bulk-certificates`.
     - `components/landing-mobile-menu.tsx`: Mengemaskini pautan yang sama untuk drawer telefon pintar.
     - `components/landing/landing-footer.tsx`: Mengemaskini pautan footer produk.
  4. **Pengesahan Penuh**:
     - Kesemua 6 produk kini mempunyai halaman khusus `○ (Static)` Next.js 16:
       1. `/products/forms` (Online Forms)
       2. `/products/certificates` (Studio E-Sijil Canva)
       3. `/products/bio` (KlikBio Link-in-Bio)
       4. `/products/bulk-certificates` (Jana Sijil Pukal CSV → ZIP)
       5. `/products/qr-codes` (Kod QR Dinamik)
       6. `/products/shortener` (URL Shortener)
     - `npm run typecheck`: 0 ralat.
     - `npm run lint`: 0 amaran/ralat.
     - `npm test`: 251 / 251 ujian lulus.





---

## 2026-09-14: Translasi Penuh Laman Web & Sistem ke Bahasa Inggeris (Full English Localization)
- **Permintaan Pengguna**: "sy nak website dan sistem semua dalam bahasa inggeris" (berikutan persediaan platform untuk standard antarabangsa dan keselarasan menyeluruh).
- **Strategi & Keputusan Seni Bina**:
  - Mengalihkan keseluruhan teks pemasaran, navigasi mega-menu, pameran produk, penetapan harga, papan pemuka, pembina (Form & Certificate Builders), borang awam responden, dan kesemua templat emel ke Bahasa Inggeris profesional.
  - Mengekalkan elemen pasaran tempatan Malaysia yang penting: mata wang `RM 15` / `RM 0`, integrasi perbankan FPX / BCL.my, serta medan `IC / ID` agar pengguna tempatan tetap selesa dan operasi kewangan berjalan lancar.
- **Penyelesaian & Modifikasi**:
  1. **Laman Pemasaran & Navigasi**:
     - `app/layout.tsx`: Diselaraskan kepada `<html lang="en">` dengan metadata OpenGraph & deskripsi Bahasa Inggeris.
     - `components/landing-navbar.tsx` & `components/landing-mobile-menu.tsx`: Kesemua 6 produk diterjemahkan dengan lencana moden `NEW` dan `HOT`.
     - Komponen landing page (`landing-hero.tsx`, `landing-features-bento.tsx`, `landing-showcase.tsx`, `landing-use-cases.tsx`, `landing-comparison.tsx`, `landing-cta.tsx`, `landing-footer.tsx`): Ditulis semula dalam Bahasa Inggeris standard, bersih dan elegan.
  2. **Halaman Pameran Produk Khusus (`app/products/*`)**:
     - Ditransformasikan kepada Bahasa Inggeris merentas `/products/bio`, `/products/bulk-certificates`, `/products/forms`, `/products/certificates`, `/products/qr-codes`, dan `/products/shortener`.
  3. **Halaman Pricing & Kad Pelan**:
     - `app/pricing/page.tsx`: Tajuk, subteks jaminan ketenangan minda ("Cancel anytime", "Instant activation", "Secure FPX / BCL payment"), dan 5 soalan FAQ akordion.
     - `components/pricing/plan-card.tsx`: Lencana ("Most Popular", "Coming Soon"), butang tindakan ("Get Started Free", "Upgrade to Pro", "Processing..."), senarai ciri, dan jaminan tanpa caj tersembunyi.
     - `lib/constants/pricing.ts`: Salinan deskripsi pelan harga diselaraskan.
  4. **Papan Pemuka & Studio Pembina**:
     - `components/dashboard/cross-form-analytics.tsx`: Metrik 30 hari ("Unique visitors", "Submissions", "Conversion rate", "Top forms").
     - `components/builder-tour.tsx`: Kesemua 5 langkah Joyride Onboarding dalam Bahasa Inggeris berserta butang ("Skip", "Next", "Back", "Finish").
     - `app/builder/[id]/client.tsx`: Status autosave ("Saving...", "Saved to cloud"), nota bantuan medan terkunci, togol status borang ("Active / Closed"), dialog tukar templat lalai, dan mesej toast.
     - Studio Sijil & Bulk Generator (`certificates/builder/[id]/client.tsx` & `bulk/client.tsx`): Kawalan zum Canva-style ("Zoom In", "Zoom Out", "Fit to Screen", "Actual Size"), pengesanan lajur CSV, pemetaan, dan muat turun ZIP.
  5. **Borang Awam & Notifikasi Emel**:
     - `app/(public)/form/[id]/client.tsx`: Progres respons ("X / Y Answered", "Closes in: X"), skrin borang ditutup ("Form Closed"), had akses ("Access Restricted"), dan tindakan borang siap ("Visit Link", "Share on WhatsApp").
     - `lib/email/index.ts`: Kesemua 10 templat emel transaksi (`getNewSubmissionEmail`, `getEditLinkEmail`, `getRespondentConfirmationEmail`, `getSubscriptionReminderEmail`, `getGracePeriodStartedEmail`, `getAccountBlockedEmail`, `getWelcomeProEmail`, `getPaymentSuccessEmail`, `getInactivityReminderEmail`, `getAccountDeletionWarningEmail`) diselaraskan kepada Bahasa Inggeris dengan struktur HTML `<html lang="en">` dan perlindungan `escapeHtml`.
     - `tests/respondent-notification.test.ts`: Ujian unit diselaraskan untuk mengesahkan frasa Bahasa Inggeris emel.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 251 / 251 ujian unit lulus merentas 30 suites ujian.

---

## 2026-09-14: Pengoptimuman Prestasi & Penghapusan Lag Drag E-Cert Builder
- **Isu / Pertanyaan Pengguna**: "kenapa dekat e cert builder tu macam lag sikit bila drag"
- **Punca Asal Ralat (Root Cause)**:
  1. **Interpolasi CSS 150ms (`transition-all duration-150`)**: Pembungkus elemen kanvas mengandungi kelas `transition-all duration-150`. Setiap kali koordinat `left` dan `top` dikemas kini sewaktu tetikus bergerak, pelayar web tidak meletakkan elemen serta-merta, sebaliknya menganimasikan pergerakan tersebut perlahan-lahan selama 150ms. Ini menyebabkan elemen sentiasa "tertinggal" di belakang kursor.
  2. **Forced Synchronous Layout Reflow (`getBoundingClientRect`)**: Pada setiap pergerakan tetikus (`mousemove`), fungsi memanggil `canvasRef.current.getBoundingClientRect()` untuk mengira skala kanvas. Panggilan DOM ini memaksa enjin pelayar mengira semula geometri skrin berulang kali dalam satu sesaat (menyebabkan amaran reflow di konsol pelayar).
  3. **Event Unthrottled**: Event tetikus berfrekuensi tinggi (125Hz-1000Hz) memanggil `setTemplate` dan `setAlignmentGuides` secara berterusan tanpa diselaraskan dengan kitaran bingkai paparan (*refresh rate*).
  4. **Canvas-Bound Mouse Listeners**: Event `onMouseMove` dan `onMouseLeave` diletakkan pada `div` kanvas sahaja. Apabila pengguna menyeret tetikus secara laju, kursor bergerak melepasi sempadan kanvas dan mencetuskan `onMouseLeave` yang serta-merta membatalkan seretan.
- **Penyelesaian Dilaksanakan (`app/(dashboard)/certificates/builder/[id]/client.tsx`)**:
  1. Menyingkirkan `transition-all` dan menggunakan `transition-[box-shadow,opacity] duration-150` berserta `transition-none` apabila `isDragging || isResizing` aktif.
  2. Menambah akselerasi GPU `willChange: 'left, top'` semasa seretan/ubah saiz aktif.
  3. Menggunakan nilai `currentScale` yang sedia ada tanpa memanggil `getBoundingClientRect()` pada setiap event `mousemove`.
  4. Melaksanakan `requestAnimationFrame` (rAF) batching untuk memastikan kemas kini koordinat diselaraskan dengan sempurna pada 60/120 FPS tanpa sebarang *frame drops*.
  5. Memindahkan event listener `mousemove` dan `mouseup` ke peringkat `window` semasa seretan aktif, mengunci kursor global kepada `move` dan mematikan `userSelect`.
  6. Menggunakan `hasMovedRef` agar sejarah Undo/Redo hanya direkodkan jika elemen benar-benar digerakkan, mengelakkan entri kosong semasa klik pemilihan biasa.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 amaran / 0 ralat ESLint.
  - `npm test`: 251 / 251 ujian lulus.

---

## 2026-09-28: Ciri Kehadiran Pintar 1 QR (Smart Check-In & Check-Out Duration Tracking)
- **Permintaan Pengguna**: "sistem ni boleh tak bila scan qr, pastu boleh tahu berapa jam dia dlm program tu, ada idea tak? ... sy berminat dengan nombor 1 (1 QR Pintar: Check-In & Check-Out serentak)".
- **Seni Bina & Pelaksanaan**:
  1. **Konfigurasi & Jenis Data (`lib/types/forms.ts`, `lib/types/attendance.ts`, `lib/types/index.ts`)**:
     - Ditambah `CheckInOutConfig` ke dalam `AttendanceSettings` (`enabled`, `identifierFieldId`, `minDurationMinutes`, `breakMinutes`).
     - Ditakrifkan `AttendanceRecord`, `AttendanceStatus`, dan `AttendanceSummary`.
  2. **Modul Pengiraan Tulen (`lib/forms/attendance.ts`)**:
     - `cleanIdentifier()`: Menyeragamkan nombor KP / Emel dengan menyingkirkan tanda sengkang, ruang kosong, dan menyelaraskan huruf kecil.
     - `calculateAttendanceDuration()`: Mengira jumlah minit, pecahan jam & minit, perpuluhan jam, tolak waktu rehat (`breakMinutes`), dan teks berformat ("8 Jam 15 Minit").
     - `canPerformCheckOut()`: Menguatkuasakan had masa tunggu minimum (`minDurationMinutes`) untuk menghalang peserta daripada mendaftar keluar secara tidak sengaja sebaik sahaja mendaftar masuk.
     - `formatAttendanceTime()` & `formatAttendanceDateTime()`: Format masa standard tempatan Malaysia (`Asia/Kuala_Lumpur`).
  3. **Pangkalan Data & Storan (`supabase/migrations/20260928000000_add_attendance_records.sql` & `lib/storage/attendance.ts`)**:
     - Jadual baharu `attendance_records` dengan indeks `(form_id, identifier_value)`, `(form_id, created_at DESC)`, dan `(user_id, created_at DESC)`.
     - Polisi RLS: Pemilik borang sahaja dibenarkan SELECT (`user_id = auth.uid()`). Penulisan awam dilakukan melalui *service-role admin client*.
  4. **Tindakan Pelayan (`actions/attendance.ts` & `actions/forms.ts`)**:
     - `checkAttendanceStatusAction`: Menyemak status kehadiran peserta mengikut borang dan pengenal pasti unik dengan perlindungan *rate limiting*.
     - `submitFormAction`: Pengesanan togol Check-In; jika aktif, mencipta rekod `attendance_records` dan menyelaraskan masa masuk ke Google Sheets serta `form_responses`.
     - `submitAttendanceCheckOutAction`: Merekod masa keluar, mengira durasi masa, mengemas kini status ke `completed`, dan menyelaraskan Google Sheet menerusi `updateSheetRow`.
  5. **Antara Muka Pembina (`app/builder/[id]/client.tsx`)**:
     - Kad *Attendance & Location* dilengkapi togol interaktif "1-QR Smart Check-In & Check-Out", pemilih medan unik (Identifier Field), had minit minimum, dan tolak waktu rehat.
  6. **Borang Awam Responden (`app/(public)/form/[id]/client.tsx`)**:
     - Mengesan No. IC secara langsung (debounced) dan memaparkan kad status "🟢 Sedang Hadir" dengan butang pantas "Daftar Keluar Sekarang (Check-Out)".
     - Butang borang berubah kepada "Daftar Masuk (Check-In)" untuk pendaftaran pertama.
     - Skrin siap dinamik memaparkan masa masuk, masa keluar, dan jumlah jam/minit program yang dihadiri.
- **Pengesahan & Kualiti**:
  - `npm test`: 274 / 274 ujian lulus merentas 33 suite ujian (termasuk suite baharu `tests/attendance.test.ts`, `tests/attendance-storage.test.ts`, dan `tests/attendance-actions.test.ts`).
  - `npm run typecheck`: 0 ralat TypeScript (`tsc --noEmit`).
  - `npm run lint`: 0 ralat / 0 amaran ESLint.

### Production Deployment
- **Date**: 2026-09-28
- **Git Commit**: `600bfe7` ("feat(attendance): add 1-QR smart check-in and check-out duration tracking")
- **Method**: Vercel CLI (`npx vercel --prod --yes`) & GitHub Push (`origin/master`)
- **Production URL**: `https://www.klikform.com`
- **Deployment URL**: `https://klikform-7zwmro0qc-sofwan-jailanis-projects.vercel.app`
- **Deployment ID**: `dpl_AKrgQtjDRVxmMmfgKZRuJ1H1iQJr`
- **Status**: Ready, 53 routes built successfully, 0 errors.

---

## 2026-09-28: Perlindungan Anti-Tipu Kehadiran (PIN Check-Out & Live Rotating QR Code)
- **Permintaan Pengguna**: Mengatasi penipuan kehadiran di mana peserta mengambil gambar kod QR pada waktu pagi, balik ke rumah, dan mengimbas foto pada waktu petang untuk check-out palsu ("proceed dengan solution 2 dan 3").
- **Seni Bina & Pelaksanaan**:
  1. **Solusi 2: Kod PIN / Passcode Rahsia Pentas**:
     - Ditambah `checkOutPasscode?: string` pada `CheckInOutConfig` (`lib/types/forms.ts`).
     - Medan input "Check-Out Passcode / PIN" dalam Form Builder di bawah Smart Check-In/Out.
     - Diperiksa hanya semasa Check-Out (Check-In kekal terbuka tanpa geseran pendaftaran pagi).
     - Borang awam memaparkan medan PIN apabila penganjur menetapkan kod rahsia. Pelayan menolak cubaan check-out dengan mesej mesra jika PIN tidak padan.
  2. **Solusi 3: Kod QR Berputar Langsung Masa Nyata (*Live Rotating QR*)**:
     - Enjin kriptografi HMAC-SHA256 (`lib/forms/rotating-qr.ts`):
       - Berasaskan konsep TOTP (*Time-based One-Time Password*) berputar setiap 30 saat (`?rq_w=...&rq_sig=...`).
       - Stateless (sifar beban penulisan pangkalan data) dan kalis manipulasi.
       - Menyokong *grace period* 1 tetingkap (30–60 saat) bagi mengelakkan peserta tersekat akibat latensi rangkaian atau fokus kamera, tetapi menolak foto daripada minit/jam terdahulu.
  3. **Laman Projektor Dewan (`app/(public)/present/[id]/page.tsx` & `client.tsx`)**:
     - Paparan skrin penuh mesra projektor/TV dengan reka bentuk gelap berimpak tinggi (*ambient glow*, tajuk besar, jam digital UTC+8, kod QR saiz besar ~380px, bar kemajuan kira detik 30 saat).
     - Pintasan papan kekunci: **F** untuk skrin penuh, **P** untuk tayang/sembunyi PIN pentas.
     - Pendaftaran laluan di `proxy.ts` sebagai laluan awam (`/present`).
  4. **Penguatkuasaan Pelayan**:
     - `actions/attendance.ts`: Tindakan pelayan `getRotatingQrLiveTokenAction` membekalkan token autoritatif pelayan ke skrin projektor. Semakan `passcode` dan `rotatingQrParams` dalam `submitAttendanceCheckOutAction`.
     - `actions/forms.ts`: Pengesanan togol `rotatingQr.enabled` dalam `submitFormAction`. Menolak cubaan pendaftaran jika token luput atau tiada. Menapis parameter dalaman `_rq_w` dan `_rq_sig` daripada `dbData` sebelum disimpan ke Google Sheets.
  5. **Borang Awam (`app/(public)/form/[id]/client.tsx` & `page.tsx`)**:
     - Membaca `searchParams` dari SSR dan URL. Jika mod rotating QR aktif tetapi token tiada, memaparkan amaran amaran anti-fraud dan menyekat penghantaran.
- **Ujian & Kualiti**:
  - `npm test`: 281 / 281 lulus merentas 34 suite ujian.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm run build`: Kompilasi Next.js 16 Turbopack bersih (54 laluan).

### Production Deployment
- **Date**: 2026-09-28
- **Git Commit**: `e20b46d` ("feat(attendance): add checkout passcode and live rotating qr projector mode")
- **Method**: Vercel CLI (`npx vercel --prod --yes`) & GitHub Push (`origin/master`)
- **Production URL**: `https://www.klikform.com`
- **Deployment URL**: `https://klikform-dpjh4or1k-sofwan-jailanis-projects.vercel.app`
- **Deployment ID**: `dpl_C5qeEbTonUL32bKrubnL8gQTpRth`
- **Status**: Ready, 54 routes built successfully, 0 errors.

---

## 2026-09-28: Syarat Minimum Jam Kehadiran untuk Tebus E-Sijil & Amaran Awal Check-Out
- **Permintaan Pengguna**: Menguatkuasakan syarat kehadiran minima sebelum e-Sijil boleh ditebus ("selagi tak cukup jam selagi tu tak boleh tebus sijil") serta cara menangani peserta yang tidak cukup jam ("kalau orang yg tak cukup jam macam mana?").
- **Seni Bina & Pelaksanaan**:
  1. **Model Data & Konfigurasi (`lib/types/forms.ts`, `lib/types/attendance.ts`)**:
     - Ditambah `minHoursForCertificate?: number` ke dalam `CheckInOutConfig`.
     - Ditambah `checkInAtIso`, `minHoursForCertificate`, `isEarlyCheckOut`, `earlyCheckOutShortfallText` ke dalam `AttendanceSummary`.
  2. **Modul Pengiraan Tulen (`lib/forms/attendance.ts`)**:
     - Fungsi `checkCertificateAttendanceEligibility(record, minHoursRequired, breakMinutes)`: menyemak sama ada peserta mempunyai rekod kehadiran, telah selesai check-out, dan memenuhi jumlah jam minima (dengan penolakan waktu rehat). Menghasilkan perincian masa hadir, baki kekurangan jam/minit, dan mesej telus.
     - Fungsi `isEarlyCheckOut(checkInAt, nowTime, minHoursRequired, breakMinutes)`: mengesan jika percubaan check-out dibuat sebelum memenuhi jam pensijilan minimum.
  3. **Penguatkuasaan Pelayan (`actions/certificates.ts`)**:
     - Semasa peserta menyemak sijil di portal awam `/check/[formId]`, sistem mencari rekod kehadiran (`attendance_records`) menggunakan No. IC atau Emel.
     - Jika borang mempunyai `minHoursForCertificate` (> 0):
       - Jika tiada rekod: menyekat muat turun dengan mesej tiada rekod Check-In.
       - Jika masih `checked_in`: menyekat muat turun dan meminta peserta mendaftar keluar petang terlebih dahulu.
       - Jika `completed` tetapi jam kurang (cth: 3 jam < 6 jam): menyekat muat turun dan memulangkan `{ found: false, attendanceIneligible: true, attendanceDetails, error }`.
     - `getFormForCertificateCheck` memulangkan `minHoursRequired` untuk rujukan UI portal semakan.
  4. **Amaran Awal Semasa Check-Out (`app/(public)/form/[id]/client.tsx`)**:
     - Apabila peserta klik "Daftar Keluar Sekarang (Check-Out)", jika unjuran jam mereka belum mencukupi, sistem memaparkan modal pengesahan `AlertDialog`:
       - Menunjukkan baki masa yang kurang dan memberi amaran bahawa mereka tidak akan dapat menebus e-Sijil jika keluar sekarang.
       - Butang: `[Batal & Terus Hadir]` atau `[Tetap Daftar Keluar]`.
  5. **Antara Muka Pembina Borang (`app/builder/[id]/client.tsx`)**:
     - Medan input "Minimum Hours for E-Certificate (Syarat Jam Minimum E-Sijil)" dalam kad Smart Check-In/Out.
  6. **Paparan Portal Tebus Sijil Awam (`app/(public)/check/[formId]/page.tsx` & `client.tsx`)**:
     - Lencana syarat jam minima dipaparkan di bahagian atas halaman semakan (cth: *"Syarat Kehadiran: Minimum 6 Jam"*).
     - Kad amaran berona jingga kemas dengan perincian masa hadir vs baki masa yang kurang, bersama nota menghubungi urusetia jika mempunyai pelepasan khas.
- **Ujian & Kualiti**:
  - Ujian unit di `tests/attendance.test.ts` (23/23 lulus) dan suite baharu `tests/certificate-attendance-gating.test.ts` (7/7 lulus).
  - Jumlah keseluruhan: 297 / 297 ujian lulus merentas 35 suite ujian.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.

---

## 2026-09-28: Pembaikan Pertindihan Visual Kad Profil Bio (`BioPageCard`)
- **Isu**: Dalam papan pemuka Bio Pages (`/bio`), lencana tema (`[Lavender Dusk]`) di sudut kiri atas banner bertindih dengan bulatan avatar pengguna (`w-14`) yang mempunyai margin negatif `-mt-10`. Teks tajuk dan pemegang (`@username`) di sebelah avatar juga mengalami penjajaran menegak yang janggal kerana `pt-6`.
- **Punca**: Banner hanya setinggi `h-16` (64px) dengan padding `p-4`, meninggalkan ruang 32px sahaja. Lencana tema di kiri atas terpaksa berkongsi zon Y yang sama dengan cincin avatar (`ring-4 ring-white`), menyebabkan cincin avatar memotong ke dalam sempadan lencana tema.
- **Penyelesaian**:
  - Fail: `app/(dashboard)/bio/client.tsx`.
  - Pelaksanaan format **Bento Profile**:
    - Ketinggian banner diperluas kepada `h-22` (88px) dengan kecerunan tema penuh.
    - Lencana nama tema diletakkan di sudut kiri atas banner, manakala togol status `[Active / Draft]` di sudut kanan atas.
    - Bulatan avatar diletakkan pada baris berasingan dengan `-mt-9`, terapung anggun merentasi garisan banner tanpa menyeret elemen teks.
    - Maklumat profil (Tajuk, `@username`, dan Bio) diletakkan di bawah avatar sepenuhnya di atas latar putih kad dengan ruang lebar penuh (`space-y-0.5`).
    - Menghapuskan sama sekali isu teks berhimpit atau bertembung dengan sempadan banner gelap, memberikan rupa eksekutif dan moden.
- **Ujian & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 297/297 ujian lulus.
  - `npm run build`: Kompilasi Turbopack Next.js 16 bersih (54 laluan).

### Production Deployment
- **Date**: 2026-09-28
- **Git Commit**: `3add4a4` ("feat(bio): refine BioPageCard layout to Bento Profile structure")
- **Method**: Vercel CLI (`npx vercel --prod --yes`) & GitHub Push (`origin/master`)
- **Production URL**: `https://www.klikform.com`
- **Deployment URL**: `https://klikform-hzl41jkmi-sofwan-jailanis-projects.vercel.app`
- **Deployment ID**: `dpl_Hsmxnk5Sbe2mokEtE5J3RaLnGKRt`
- **Status**: Ready, 54 routes built successfully, 0 errors.

---

## 2026-09-29: Pembaikan Bug 1-QR Smart Check-In & Check-Out (Dua Entri Masa Masuk di Google Sheets)
- **Isu / Aduan Pengguna**: Pengguna mendapati apabila menggunakan ciri 1-QR Smart Check-In & Out, selepas check-in dan kemudian check-out, Google Sheets menerima dua baris data berasingan di mana kedua-duanya masuk ke 'Masa Masuk (Check-In)' dan tiada data pada 'Masa Keluar (Check-Out)'.
- **Punca Asal Ralat (Root Causes)**:
  1. **UI Responden Tidak Terkunci (Gating Absence)**: Di `app/(public)/form/[id]/client.tsx`, apabila peserta telah `checked_in`, sistem hanya memaparkan banner kecil di bahagian atas borang. Semua medan input borang dan butang `[ Daftar Masuk (Check-In) ]` masih terpapar di bawah. Peserta mudah alih menatal ke bawah dan menekan semula butang `[ Daftar Masuk ]` sewaktu keluar, memanggil `submitFormAction` dan bukannya `submitAttendanceCheckOutAction`.
  2. **Tiada Pengawal Pendua di Pelayan (Missing Server Guard)**: Dalam `submitFormAction` (`actions/forms.ts`), sistem tidak menyemak sama ada peserta telah berstatus `checked_in`. Sebarang panggilan baru ke `submitFormAction` akan mengecop masa masuk baharu dan memanggil `appendToSheet`, menghasilkan baris pendua.
  3. **Token Google OAuth Luput Semasa Check-Out**: Tindakan pelayan `submitAttendanceCheckOutAction` (`actions/attendance.ts`) menggunakan token akses Google sedia ada tanpa memanggil `getValidAccessToken()`. Memandangkan check-out berlaku beberapa jam selepas pendaftaran (melebihi tempoh hayat token ~1 jam), panggilan kemas kini helaian gagal senyap dengan ralat 401.
  4. **Pemadanan Lajur Google Sheet yang Terlalu Tegar**: `updateSheetRow` dalam `lib/api/google-sheets.ts` menggunakan semakan kesamaan string tegar tanpa menghapuskan tanda sengkang (contohnya `010203-04-0506` vs `010203040506`), dan hanya memeriksa `_submission_id` tanpa fallback kepada lajur No. IC atau Emel.
- **Penyelesaian Dilaksanakan**:
  1. **Gating Antara Muka Borang Awam (`app/(public)/form/[id]/client.tsx`)**:
     - Apabila status dikesan `checked_in`, keseluruhan kad medan pendaftaran dan butang submit disembunyikan sepenuhnya. Digantikan dengan **Kad Check-Out Khusus** dengan butang utama `[ Daftar Keluar Sekarang (Check-Out) ]`.
     - Apabila status peserta `completed`, dipaparkan **Kad Kehadiran Lengkap** bersama statistik masa masuk, masa keluar, dan durasi penuh tanpa sebarang borang.
     - Menyimpan No. IC peserta ke dalam `localStorage` (`klikform_attendance_${formId}`) selepas pendaftaran pertama. Apabila peserta mengimbas QR kod yang sama pada waktu petang menggunakan telefon yang sama, borang serta-merta mengecam peserta dan terus bersedia untuk daftar keluar.
     - Menambah butang pautan "Bukan anda? [Daftar Peserta Lain]" untuk kemudahan peranti yang dikongsi.
     - Menambah pengawal pada `handleSubmit`: jika peserta menekan Enter semasa berstatus `checked_in`, ia secara automatik memanggil fungsi `handleCheckOut()`.
  2. **Pengawal Auto-Tukar di Pelayan (`actions/forms.ts`)**:
     - Dalam `submitFormAction`, ditambah semakan `existingRecord = await getAttendanceRecord(form.id, cleanId)`.
     - Jika peserta didapati telah berstatus `checked_in`, pelayan secara automatik membatalkan penciptaan baris check-in kedua dan mengalihkan tindakan kepada proses Check-Out, mengemas kini rekod pangkalan data dan mengemas kini Google Sheet sedia ada menerusi `updateSheetRow` dalam blok `after()`.
  3. **Penyelarasan Google Sheets & Pembaharuan Token OAuth (`actions/attendance.ts`)**:
     - `submitAttendanceCheckOutAction` kini memanggil `getValidAccessToken()` sebelum memulakan kemas kini ke Google Sheets.
     - Melaksanakan sandaran berperingkat (*tiered fallback*) untuk mencari baris: mula-mula menerusi `_submission_id`, kemudian menerusi `record.identifierLabel`, dan seterusnya menerusi senarai alias lajur IC lazim (`No. Kad Pengenalan`, `No IC`, `IC`, `No KP`, `Email`, dll.).
  4. **Penskalaan Pemadanan Fleksibel Alfanumerik (`lib/api/google-sheets.ts`)**:
     - `updateSheetRow` kini memadankan nilai secara fleksibel dengan menyingkirkan tanda sengkang, ruang kosong, dan perbezaan huruf (`normalizeVal`), membolehkan format IC `010203-04-0506` sepadan dengan rekod `010203040506`.
- **Pengesahan & Kualiti**:
  - `npm test`: 298 / 298 ujian unit lulus merentas 35 suite ujian (termasuk ujian unit fallback di `tests/attendance-actions.test.ts`).
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.

### Production Deployment
- **Date**: 2026-09-29
- **Git Commit**: `f706c51` ("fix(attendance): prevent duplicate check-in entries and enforce check-out UI gating")
- **Method**: Vercel CLI (`npx vercel --prod --yes`) & GitHub Push (`origin/master`)
- **Production URL**: `https://www.klikform.com`
- **Deployment URL**: `https://klikform-k2jplq85w-sofwan-jailanis-projects.vercel.app`
- **Deployment ID**: `dpl_EUpXv2p2jtKqooMXkXWQs2FFWE4y`
- **Status**: Ready, 54 routes built successfully, 0 errors.

---

## 2026-09-29: Format Nama Peserta Pada Sijil (1 Baris Untuk Nama Pendek & Max 2 Baris Untuk Nama Panjang)
- **Permintaan Pengguna**: "sy nak dua line sahaja max, tapi kalau nama pendek satu line sahaja" bersama gambar sijil di mana nama "SOFWAN BIN MOHD JAILANI" terbelah kepada 2 baris ("SOFWAN BIN" di baris 1 dan "MOHD JAILANI" di baris 2).
- **Punca Asal Ralat (Root Causes)**:
  1. Dalam `components/certificates/renderer/index.tsx`, `placeholderType === 'name'` tiada fungsi auto-scaling (berbeza dengan `program` yang mempunyai `getProgramFontSize`).
  2. Bounding box `el.width` pada elemen nama dihadkan kepada dimensi tetap tertentu (contohnya ~450px) yang lebih sempit daripada kelebaran sebenar nama pada saiz fon asas (46px - 60px).
  3. Div dalaman mengandungi kelas `whitespace-pre-line break-words [text-wrap:balance]` yang memaksa teks membalut dan menyeimbangkan aksara kepada dua baris walaupun nama tersebut sederhana pendek.
  4. Untuk nama yang sangat panjang (45+ aksara), ketiadaan penskalaan fon menyebabkan nama melimpah ke 3 atau 4 baris dan bertindih dengan teks di bawahnya.
- **Penyelesaian Dilaksanakan**:
  1. **Helper Tipografi Nama Pintar (`components/certificates/types.ts`)**:
     - `isShortName(name)`: Mengesan nama pendek/sederhana (<= 28 aksara tanpa `\n`). Contoh: `"SOFWAN BIN MOHD JAILANI"` (23 aksara) dikelaskan sebagai nama pendek.
     - `getNameFontSize(name, baseSize)`:
       - Nama pendek (<= 28 aksara): Mengekalkan saiz fon asas (dicap pada maks 52px jika saiz asas terlalu besar).
       - Nama sederhana panjang (29-43 aksara): Skala ke ~78% saiz asas untuk muat 2 baris kemas.
       - Nama sangat panjang (44+ aksara): Skala ke ~62% saiz asas (min 18px) supaya muat dalam 2 baris tanpa terpotong.
  2. **Kemas Kini Renderer Sijil (`components/certificates/renderer/index.tsx`)**:
     - Nama Pendek: Menguatkuasakan `whiteSpace: 'nowrap'`, `width: max(el.width, max-content)`, `maxWidth: '92%'`. Ini membolehkan nama pendek mengambil kelebaran semula jadi dan kekal dalam **1 baris tunggal**.
     - Nama Panjang: Menguatkuasakan `display: '-webkit-box'`, `WebkitLineClamp: 2`, `overflow: 'hidden'`, dan `width: 88%` supaya dihadkan kepada **maksimum 2 baris sahaja**.
  3. **Penyelarasan Templat Warisan & Pra-Bina (`components/certificate-template.tsx`, `ClassicTemplate.tsx`, `CorporateTemplate.tsx`)**:
     - Mengintegrasikan fungsi penskalaan yang sama untuk konsistensi merentas semua jenis templat.
  4. **Ujian Unit & Pengesahan**:
     - Ujian unit di `tests/certificate-typography.test.ts` (14/14 lulus).
     - Keseluruhan ujian suite: 307 / 307 ujian lulus merentas 35 suite ujian.
     - `npm run typecheck` & `npm run lint`: 0 ralat.

### Production Deployment
- **Date**: 2026-09-29
- **Git Commit**: `bc777e1` ("feat(certificates): enforce 1-line for short names and max 2-lines for long names with smart auto-scaling")
- **Method**: Vercel CLI (`npx vercel --prod --yes`) & GitHub Push (`origin/master`)
- **Production URL**: `https://www.klikform.com`
- **Deployment URL**: `https://klikform-ikjnxl1pk-sofwan-jailanis-projects.vercel.app`
- **Deployment ID**: `dpl_Bm4TpjSfpkpmQpyNmZk8kC5QtVSt`
- **Status**: Ready, 54 routes built successfully, 0 errors.

## System Improvements (2026-10-02 — E-Pamphlet & Buku Program Digital Viewer)
- **Modul E-Pamphlet & Buku Program Digital Dilancarkan**:
  - Dicipta produk baharu untuk membolehkan penganjur majlis (sekolah, seminar, sukan, korporat) mencipta dan mengedarkan buku program digital dengan paparan interaktif.
  - **Tiga Mod Paparan Pintar**:
    - **3D Flipbook**: Mensimulasikan helaian buku fizikal dengan bayang lipatan tengah (*spine shadow*), kesan lengkungan helaian (*sheen gradient*), dan paparan 2-muka surat serentak pada desktop (*two-page spread*) serta 1-muka surat pada telefon pintar.
    - **Touch Slider**: Leretan sentuhan mendatar menggunakan `framer-motion` dengan pengesanan leret laju (*swipe gesture*).
    - **Continuous Vertical Scroll**: Skrol menegak berterusan dengan integrasi `IntersectionObserver` untuk mengesan muka surat aktif secara automatik.
  - **Ciri Interaktif Lengkap**:
    - Kawalan Zum pintar (Zoom In, Zoom Out, Reset 100%) sehingga 250% untuk membaca teks tentatif yang kecil.
    - Bilah pratonton muka surat (*Filmstrip Thumbnails Drawer*) di bahagian bawah untuk navigasi pantas.
    - Kesan bunyi selak kertas lembut (*paper turn rustle*) berasaskan Web Audio API sintetik tanpa aset luaran.
    - Mod Skrin Penuh (*Fullscreen Mode*).
    - Butang tindakan acara bersepadu: Muat Turun PDF asal, Kongsi ke WhatsApp (`wa.me`), Salin Pautan, dan butang tindakan khusus (Check-In Kehadiran, Tebus E-Sijil).
    - Empat tema suasana ambien: Cinema Dark, Clean Studio, Warm Ivory Paper, dan Royal Emerald.
  - **Papan Pemuka & Studio Penyunting**:
    - Papan pemuka di `/pamphlets` dengan statistik tontonan dan dialog penjanaan Kod QR beresolusi tinggi (PNG 1000px) sedia cetak pada gegantung (bunting) dewan.
    - Studio penyunting di `/pamphlet-builder/[id]` dengan muat naik imej berganda serentak, penyusunan muka surat (*drag/move order*), dan pratonton langsung (*live interactive preview*) mengikut saiz Desktop dan Mobile.
    - Laluan awam di `/p/[slug]` dan `/p/demo` (contoh interaktif segera).
  - **Seni Bina & Keselamatan**:
    - Migrasi jadual `public.pamphlets` (`supabase/migrations/20261002000000_add_pamphlets.sql`) dengan polisi RLS selamat dan carian bypass RLS awam melalui admin client.
    - Perlindungan ralat 42P01 dengan fallback selamat jika jadual belum dimigrasi.
    - Laluan `/p/` dan `/pamphlet` didaftarkan dalam `publicRoutes` di `proxy.ts`, dan `/pamphlets` serta `/pamphlet-builder` dalam `protectedRoutes`.
  - **Ujian & Kualiti**:
    - Ditambah ujian unit di `tests/pamphlet.test.ts` dan `tests/pamphlet-storage.test.ts`.
    - 317 / 317 ujian unit lulus merentas 37 suite ujian.
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat/amaran ESLint.
    - Binaan pengeluaran Next.js 16 bersih (58 laluan).
- **2026-10-02 (Pembaikan Ketahanan: PostgREST PGRST205 Table Missing Fallback)**:
  - **Punca Ralat**: Log pelayan `Error fetching pamphlets: Object` dikesan di konsol pelayar apabila melawat `/pamphlets`. Ini berlaku kerana PostgREST v12 memulangkan kod `PGRST205` (`Could not find the table 'public.pamphlets' in the schema cache`), bukannya kod mentah Postgres `42P01`. Pemeriksaan awal hanya menyemak `error.code === '42P01'`, menyebabkan ralat tidak ditangkap dan dilemparkan ke konsol.
  - **Penambahbaikan**:
    - Memperluas `isMissingTableError` dalam `lib/storage/pamphlets.ts` untuk mengendalikan `PGRST205`, `42P01`, `PGRST204`, `PGRST200`, dan padanan frasa `schema cache` / `does not exist`.
    - `getPamphlets()` mengembalikan `[]` secara selamat tanpa sebarang `console.error` yang mengganggu.
    - `createPamphlet`, `updatePamphlet`, dan `deletePamphlet` memberikan mesej penjelasan yang jelas (`PAMPHLET_TABLE_MISSING_MESSAGE`) yang membimbing pengguna untuk menjalankan migrasi SQL.
    - Menambah fungsi semakan `isPamphletsTableReady()` dan komponen pintar `PamphletDatabaseNotice` pada papan pemuka `/pamphlets` dengan butang 1-klik "Salin Skrip SQL" serta pendedahan kod SQL lengkap.
    - Ditambah 4 ujian unit baharu dalam `tests/pamphlet-storage.test.ts` untuk memastikan ketahanan ralat ini berterusan.
- **2026-10-02 (Pembaikan Visual & Enjin: 3D Page Flipbook & Kontras Butang Toolbar)**:
  - **Punca Isu Butang**: Butang tindakan atas menggunakan `variant="outline"` tanpa kelas warna teks khusus, lalu mewarisi `text-emerald-100` daripada bekas bar navigasi bertema zamrud. Menghasilkan teks hijau cair pada butang putih yang tidak kelihatan.
  - **Punca Isu 3D Flip**: Paparan dwi-halaman (desktop spread) sebelum ini hanya menggunakan `<div>` statik tanpa animasi `rotateY`, dan indeks spread membeku di antara halaman 2 dan 3 kerana kedua-duanya memetakan ke spread yang sama.
  - **Penyelesaian Dilaksanakan**:
    - `components/pamphlet/viewer/toolbar.tsx`: Butang tindakan kini mempunyai kontras tinggi yang jelas (`text-slate-900 font-semibold`, sempadan kemas, ikon terang) dan butang WhatsApp hijau rasmi `#25D366`. Turut ditambah popover tindakan untuk skrin telefon/tablet.
    - `components/pamphlet/viewer/flipbook-view.tsx`: Dibina semula dengan enjin *3D physical turning leaf* (`perspective: 2500px`, `transformStyle: 'preserve-3d'`, putaran 180 darjah melintasi tulang buku), bayang helaian dinamik, dan sokongan klik muka surat untuk selak.
    - `components/pamphlet/viewer/index.tsx`: Diselaraskan navigasi spread supaya setiap klik atau pintasan anak panah membalikkan helaian demi helaian tanpa tersekat.
    - Penunjuk bar navigasi bawah kini memaparkan penunjuk spread pintar (`2-3 / 6`).
    - 321 / 321 ujian unit lulus, 0 ralat TypeScript, 0 ralat ESLint.
- **2026-10-02 (Pembaikan Kestabilan Geometri & Penghapusan Jitter/Pergerakan Flipbook)**:
  - **Punca Isu "Bergerak-gerak / Tak Statik"**:
    - Pada paparan asal, muka hadapan (Cover) dipaparkan dalam kontena selebar 1 halaman sahaja, manakala halaman dalaman dipaparkan dalam kontena dwi-halaman selebar 2 halaman. Apabila beralih dari Halaman 1 ke 2-3, saiz kontena melompat dua kali ganda secara mengejut, menyebabkan keseluruhan bingkai buku mengembang dan menganjak ke kiri dan kanan.
    - Penggunaan nisbah aspek dinamik dalam kontena flexbox menyebabkan pelayar mengira semula reka letak (*layout recalculation*) pada setiap bingkai animasi 3D, mengakibatkan getaran/goncangan (jitter).
  - **Penyelesaian Kejuruteraan Reka Bentuk Statik**:
    - **Dimensi Berkunci**: Kontena pentas buku dikunci secara mutlak kepada formula CSS nisbah aspek tetap (`height: min(76vh, 650px)` dan `width: calc(min(76vh, 650px) / 1.414 * 2)` untuk desktop).
    - **Pancang Tulang Buku Kekal**: Tulang belakang buku (*spine*) dipancang tepat di tengah (`left: 50%`) secara mutlak.
    - **Slot Helaian Asas Kekal**: Slot kiri (0% hingga 50%) dan slot kanan (50% hingga 100%) tidak pernah dinyah-lekap (*unmount*). Semasa paparan Muka Hadapan (Page 1), slot kiri memaparkan bayangan kulit dalam buku (*inside cover binder*), mengekalkan kelebaran buku sentiasa 2 halaman tanpa pernah berubah saiz.
    - **Lapisan Helaian Selakan Tindanan (*Overlay Turning Leaf*)**: Helaian berputar hanya muncul sebagai lapisan tindanan di atas tulang buku semasa animasi selakan 520ms dan lesap sebaik sahaja selesai mendarat, mengelakkan sebarang rombakan reka letak DOM.
    - **Penyegerakan Navigasi Penuh (`forwardRef`)**: Mendedahkan `flipbookRef.current.flipNext()` dan `flipPrev()` menerusi `useImperativeHandle` supaya sebarang input (anak panah papan kekunci, butang bar navigasi bawah, butang terapung tepi, dan klik helaian) memacu animasi selakan 3D yang sama secara seragam.
    - **Mod Telefon Pintar (Mobile 3D Peel)**: Menggunakan lengkungan 3D mesra peranti mudah alih (`rotateY: -80deg`, `x: -22%`, bayangan gradien kertas) dengan penyingkapan helaian asas yang kekal di tengah skrin telefon tanpa terkeluar daripada sempadan.
  - **Ujian & Kualiti**:
    - 321 / 321 ujian unit lulus (37 suites).
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.
- **2026-10-02 (Pembaikan Jarak Butang Dialog Cipta E-Pamphlet)**:
  - **Punca Masalah**: `DialogFooter` pada modal `CreatePamphletDialog` (`app/(dashboard)/pamphlets/client.tsx`) mengandungi kelas `sm:gap-0` yang membatalkan jarak antara butang `Batal` dan `Seterusnya →` pada skrin desktop, menyebabkannya melekat rapat.
  - **Penyelesaian**: Menggantikan `gap-2 sm:gap-0` dengan `className="pt-2 gap-2 sm:gap-3"` untuk memastikan jurang 12px mendatar yang seimbang dan kemas antara butang tindakan.
  - 321 / 321 ujian unit lulus, 0 ralat TypeScript, 0 ralat ESLint.
- **2026-10-02 (Pembaikan Kesinambungan Bayang Tulang Buku 3D Flipbook — Menghapuskan Isu Shadow Hilang Dulu Baru Ada)**:
  - **Punca Masalah**: Bayangan lipatan tulang buku (*spine crease shadow*) sebelum ini hanya diletakkan pada halaman tapak (*base pages*). Apabila helaian selakan (*turning leaf*) dipasang di lapisan atas (`z-30`), ia menutup halaman tapak tanpa membawa sebarang bayangan tulang buku pada engselnya. Akibatnya pada saat `t=0` (mula selak), bayangan tulang buku hilang serta-merta, dan hanya muncul semula secara mengejut pada `t=520ms` apabila helaian dinyah-lekap.
  - **Penyelesaian Dilaksanakan**:
    - **Bayangan Tulang Buku Kekal**: Menambah bayangan lipatan tulang buku secara kekal pada kedua-dua muka helaian selakan (*front face* dan *back face*) pada sisi engsel yang sepadan dengan kedudukan tulang buku asal.
    - **Peningkatan Z-Index Alur Tulang Buku**: Meningkatkan `z-index` alur tengah tulang buku kepada `z-40` supaya tidak ditenggelami oleh helaian selakan (`z-30`).
    - **Pencahayaan Semula Jadi Helaian**: Menyelaraskan animasi pencahayaan gradien supaya helaian memalap secara lancar (`opacity: 0 -> 0.35`) sewaktu terangkat menegak dan mencerah semula (`opacity: 0.35 -> 0`) sewaktu mendarat mendatar.
    - **Bayangan Tindanan Lembut Halaman Tapak**: Menambah bayangan tindanan lembut (*soft ambient cast shadow*) pada halaman tapak di bawah helaian berputar.
  - 321 / 321 ujian unit lulus, 0 ralat TypeScript, 0 ralat ESLint.
- **2026-10-02 (Pembaikan Pengalaman Pengguna (UX) 3D Flipbook Pada Paparan Telefon Pintar / Mobile View)**:
  - **Punca Isu ("mobile view macam pelik 3d flipbook")**:
    - Dua butang bulat anak panah terapung gergasi (`<` dan `>`) berada di atas dokumen dan menutup 20-30% kandungan teks/imej risalah pada skrin telefon sempit.
    - Penunjuk nombor halaman bar navigasi bawah memaparkan format dwi-halaman desktop `2-3 / 6` pada skrin satu halaman mudah alih dan terbelah kepada 2 baris ("2-3" di atas, "/ 6" di bawah) akibat kekurangan `whitespace-nowrap`.
    - Nisbah aspek kontena mudah alih terlalu tinggi (`min(76vh, 580px)` vs `maxWidth: 92vw`), menghasilkan ruang kosong putih yang besar di atas dan bawah gambar risalah.
    - Animasi selakan mudah alih (`rotateY: -80deg, x: '-22%'`) melepaskan helaian daripada engsel tulang dan menerbangkannya secara pepenjuru ke luar skrin secara tidak semulajadi.
    - Ketiadaan sokongan leretan sentuh (*touch swipe gestures*).
    - Jalur bayang lipatan tulang buku terlalu gelap dan tebal (`w-8 from-black/30`), kelihatan seperti tompokan kotoran pada halaman telefon yang sempit.
  - **Penyelesaian Dilaksanakan**:
    - **Paparan Penuh Tanpa Gangguan**: Butang bulat terapung disembunyikan pada mod mudah alih (`hidden lg:flex`) dan hanya dipaparkan pada desktop (>= 1024px) di margin luar.
    - **Kunci Nisbah Aspek Tegar A4**: Formula CSS dinamik `height: min(calc(100dvh - 160px), calc(88vw * 1.414))` dan `width: calc(height / 1.414)` mengunci nisbah 1 : 1.414 secara tepat dengan mengambil kira ruang bar atas dan bar navigasi bawah, menghapuskan ruang kosong putih sepenuhnya.
    - **Sokongan Leretan Skrin Sentuh Pintar (*Touch Swipe*)**: Menggunakan penjejakan `onTouchStart` dan `onTouchEnd` dengan ambang mendatar minimum 35px — leret ke kiri untuk helaian seterusnya, leret ke kanan untuk helaian sebelumnya.
    - **Animasi Selakan Mudah Alih Seimbang**: Helaian meluncur dan melipat dengan lengkungan halus 3D (`rotateY: -20 / 20`, `x: -105% / 105%`, tempoh 0.38s), menampakkan helaian seterusnya/sebelumnya di lapisan tapak dengan lancar.
    - **Jalur Bayangan Tulang Buku Lembut**: Dikecilkan kepada `w-4 bg-gradient-to-r from-black/15 to-transparent` untuk rupa lipatan kertas yang anggun.
    - **Penunjuk Muka Surat Bar Navigasi Bawah**: Memaparkan nombor tunggal `1 / 6` pada skrin mudah alih dan dwi-halaman `2-3 / 6` pada komputer meja, dengan `whitespace-nowrap shrink-0` agar sentiasa kekal 1 baris.
  - **Ujian & Kualiti**:
    - 321 / 321 ujian unit lulus (37 suites).
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / amaran ESLint.
- **2026-10-02 (Sokongan Penuh Orientasi Landskap / Melintang Untuk E-Pamphlet & 3D Flipbook)**:
  - **Latar Belakang & Keperluan**: Pengguna memerhatikan bahawa paparan sebelum ini dioptimumkan untuk nisbah A4 Potret (Menegak) dan menanyakan tentang sokongan untuk dokumen/buku program Landskap (Melintang / Horizontal, contohnya slaid perbentangan atau buku program majlis format landskap).
  - **Penyelesaian Kejuruteraan Dilaksanakan**:
    - **Geometri Nisbah Aspek 3D Flipbook Landskap**:
      - Pada Komputer Meja (Desktop): Satu halaman landskap mempunyai nisbah $1.414 : 1$. Dua halaman bersebelahan (spread) membentuk nisbah ultra-lebar $2.828 : 1$. Menggunakan formula `height: min(56vh, calc(90vw / 2.828))` dan `width: calc(height * 2.828)` mengelakkan limpahan skrin (> 1800px) pada komputer riba 1080p/768p dan memaparkan buku secara seimbang tanpa sempadan hitam (*letterboxing*).
      - Pada Telefon Pintar (Mobile): Menggunakan formula kad mendatar `width: min(calc((100dvh - 160px) * 1.414), 88vw)` dan `height: calc(width / 1.414)`.
    - **Mod Paparan Lain**:
      - `SliderView`: Beralih daripada `aspect-[1/1.414]` kepada `aspect-[1.414/1] max-w-[92vw]` secara automatik.
      - `VerticalView`: Beralih daripada `aspect-[1/1.414] max-w-2xl` kepada `aspect-[1.414/1] max-w-4xl`.
      - `ThumbnailsStrip`: Menggunakan kad lakaran kecil mendatar `w-24 sm:w-28 aspect-[1.414/1]`.
    - **Penyimpanan Skema Kalis Masa Depan (Zero-Migration JSONB Pattern)**:
      - Jenis data `PamphletOrientation = 'portrait' | 'landscape'` ditambah pada `Pamphlet` dan `PamphletPageItem`.
      - Disimpan di dalam objek JSONB `pages` sedia ada bagi mengelakkan ralat ketiadaan lajur Supabase `PGRST204`.
      - `getPamphletOrientation(pamphlet)` mengekstrak orientasi dengan selamat daripada parameter atau halaman pertama dengan fallback `'portrait'`.
    - **Pengesanan Pintar Klien & Antaramuka Pembina (`client.tsx`)**:
      - Muat naik gambar memeriksa `naturalWidth` dan `naturalHeight` imej. Jika nisbah lebar/tinggi > 1.05, orientasi ditukar secara automatik kepada Landskap.
      - Togol manual Orientasi Buku Program (`[ 📱 Potret (Menegak) ]` vs `[ 💻 Landskap (Melintang) ]`) disediakan di Tab Halaman.
      - Butang contoh demo 1-klik "Contoh Landskap" (`getSampleLandscapePamphlet()`) bersama 6 helaian resolusi tinggi.
  - **Ujian & Kualiti**:
    - 323 / 323 ujian vitest lulus (termasuk 8 ujian menyeluruh di `tests/pamphlet.test.ts`).
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.
- **2026-10-02 (Pengoptimuman Kebolehbacaan Skrin Kecil, Zum Pintar & Penyingkiran Gangguan Butang 3D Flipbook)**:
  - **Latar Belakang & Punca Isu ("tak nampak sgt utk screen kecik")**:
    - Pengguna melaporkan teks risalah terperinci sukar dibaca pada skrin kecil / komputer riba / panel pratonton builder (`media_1790934120002.png`), dan butang anak panah terapung bulat `<` dan `>` bertindih tepat di atas perenggan teks risalah.
    - Punca teknikal: `FlipbookView` sebelum ini hanya menyemak `window.innerWidth >= 1024` secara global. Dalam antaramuka pembina yang dibahagi dua, ruang pratonton sebenar hanya berkelebaran ~650px - 750px. Memaksa paparan dwi-halaman (2-page spread) dalam ruang sempit mengecilkan muka surat kepada ~300px, mengakibatkan teks terlalu halus. Di samping itu, kedudukan mutlak `right-3` pada butang terapung menyebabkan ia terdorong ke dalam permukaan dokumen.
  - **Penyelesaian Kejuruteraan Dilaksanakan**:
    - **Penyesuaian Responsif Berasaskan Kontena (`ResizeObserver`)**: Membaca dimensi sebenar kontena pentas buku. Jika lebar kontena < 880px, sistem secara automatik mengaktifkan **Mod 1 Muka Surat (Single Page)**, membesarkan muka surat untuk memenuhi ruang paparan sepenuhnya dan menjadikan teks **hampir 70% lebih besar & jelas**.
    - **Pengawal Margin Sisi (Side Margin Guard)**: Butang terapung `<` dan `>` hanya dirender jika terdapat ruang kosong sekurang-kurangnya 56px di sisi buku (`sideMargin >= 56`). Jika ruang sempit, butang disembunyikan supaya teks tidak sesekali terhalang.
    - **Ciri Dwi-Klik Zum & Seret Bebas (Drag-to-Pan)**: Pengguna boleh mendwi-klik di mana-mana bahagian muka surat untuk zum segera ke 1.85x, dan menyeret tetikus/jari untuk menatal ke mana-mana sudut risalah dengan lancar. Dwi-klik sekali lagi atau tekan butang "Reset" pada pill terapung untuk kembali ke 100%.
    - **Togol 1 Halaman vs 2 Halaman**: Disediakan butang `[ 📄 1 Halaman ]` / `[ 📖 2 Halaman ]` pada palang alat bawah untuk membolehkan pembaca memilih mod paparan pilihan pada bila-bila masa.
    - **Kembangkan Pratonton Builder**: Ditambah butang `[ ⛶ Skrin Penuh ]` di bar pembina bagi membolehkan penganjur menyembunyikan panel tepi dan menyemak buku program dalam paparan penuh dengan 1 klik.
    - **Penyelarasan Simulasi Telefon**: Majukan `forceMobile={previewDevice === 'mobile'}` ke `PamphletViewer` untuk menjamin rendering satu halaman yang tepat dalam simulator telefon.
  - **Ujian & Kualiti**:
    - 323 / 323 ujian vitest lulus merentas 37 suite ujian.
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.





- **2026-10-02 (Pembaikan Isu Risalah "Nampak Separuh", Kunci Saiz Dokumen 2-Muka Surat & Centering Kulit Buku 3D Flipbook)**:
  - **Latar Belakang & Punca Isu ("kenapa nampak separuh ya")**:
    - Pengguna memuat naik risalah promosi 2-muka surat berorientasi Landskap ("SAMBUNGAN RAHNU", `media_1790936304474.png`).
    - Pada skrin komputer riba/desktop yang mencukupi lebar (>= 880px), sistem secara automatik mengaktifkan mod dwi-halaman (2-page spread).
    - Dalam pengiraan `computeSpread(1)`, sistem menganggap Halaman 1 sebagai Muka Hadapan (Cover) novel/buku berbilang bab dan meletakkannya di slot kanan (`left: 50%`), manakala slot kiri (`left: 0%` hingga `50%`) dibiarkan kosong sebagai siluet dalaman buku ("Buku Program Digital").
    - Akibatnya, pada risalah 2-muka surat (depan & belakang), helaian Halaman 1 terhimpit pada 50% kawasan skrin di sebelah kanan, menjadikan pengguna berasa hairan mengapa risalah mereka hanya "nampak separuh". Apabila diselak ke Halaman 2, giliran slot kanan pula menjadi kosong.
    - Selain itu, pill penunjuk zum (`Zum 105% • Seret untuk tatal`) menggunakan kedudukan `fixed top-14 left-1/2` terhadap keseluruhan tetingkap pelayar, menyebabkan ia terkeluar daripada kanvas pratonton dan bertindih tepat di atas tab pembina (`Maklumat`, `Gaya & Butang`). Ketinggian `PamphletViewer` yang tegar pada `h-screen` (100vh) turut melimpah melebihi kontena pembina.
  - **Penyelesaian Kejuruteraan Dilaksanakan**:
    - **Logik Khas Dokumen 1 & 2 Muka Surat**:
      - Bagi dokumen dengan $\le 2$ muka surat, mod automatik kini sentiasa mengunci paparan kepada **Mod 1 Muka Surat (Single Page)**. Risalah dipaparkan penuh di tengah skrin (nisbah landskap 1.414 : 1) pada saiz maksimum tanpa sebarang slot kosong di kiri atau kanan.
      - Apabila diselak, Halaman 1 melipat secara 3D dengan lancar ke Halaman 2 yang juga dipaparkan penuh di tengah skrin.
      - Sekiranya pengguna menukar mod secara manual kepada `[ 📖 2 Halaman ]`, fungsi `computeSpread` memaparkan Halaman 1 di sebelah kiri dan Halaman 2 di sebelah kanan serentak, membolehkan kedua-dua helaian dilihat bersebelahan tanpa sebarang ruang kosong.
    - **Pemusatan Kulit Muka Hadapan & Belakang (`stageShiftX`)**:
      - Bagi buku berbilang muka surat ($> 2$ muka surat), kulit hadapan (Halaman 1) dipusatkan tepat di tengah skrin dengan menganjakkan pentas buku ke kiri sebanyak 25% kelebaran (`stageShiftX = -bookWidth * 0.25`) dan menyembunyikan slot kiri yang kosong.
      - Apabila dibuka (selak ke Halaman 2&3), pentas buku meluncur secara lancar (`transition: transform 520ms cubic-bezier(0.25, 1, 0.5, 1)`) kembali ke kedudukan tengah (`stageShiftX = 0`) serentak dengan putaran helaian 3D.
    - **Pembetulan Kedudukan Terapung UI**:
      - Pill Zum: Ditukar kepada `absolute top-3 left-1/2 -translate-x-1/2` di dalam kontena pemapar pentas buku, menghapuskan pertindihan dengan tab pembina.
      - Bar Navigasi Bawah: Ditukar kepada `absolute bottom-4 left-1/2 -translate-x-1/2`, memastikan ia sentiasa berada di tengah kontena pemapar (termasuk pada simulator telefon pintar).
      - Ketinggian Pemapar: `previewMode ? 'h-full' : 'h-screen min-h-[100dvh]'` menghalang limpahan ketinggian dalam antaramuka pembina.
  - **Ujian & Kualiti**:
    - 326 / 326 ujian vitest lulus (termasuk 3 ujian baharu untuk `computeSpread` di `tests/pamphlet.test.ts`).
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

- **2026-10-03 (Pembaikan Ralat Hydration Mismatch FlipbookView `/p/[slug]`)**:
  - **Punca Masalah**:
    - Ralat konsol pelayar `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties`.
    - Di `FlipbookView` (`components/pamphlet/viewer/flipbook-view.tsx`), `containerDimensions` diinisialisasi dalam `useState` menggunakan `typeof window !== 'undefined' ? window.innerWidth : 1024` dan `window.innerHeight : 768`.
    - Pada pelayan (SSR), ketiadaan `window` menyebabkan dimensi rujukan 1024x768 digunakan menghasilkan inline style `height: 658px; width: 930px`.
    - Pada klien semasa hydration pas pertama, `window` sudah wujud menyebabkan React merender dengan resolusi skrin sebenar klien (cth: `height: 801px; width: 1133px`). Percanggahan atribut inline style ini mencetuskan ralat hydration mismatch.
    - Di `components/pamphlet/viewer/index.tsx`, `isTwoPageSpread` turut menilai `typeof window !== 'undefined' && window.innerWidth >= 880` secara langsung dalam JSX yang mengubah teks butang dan format nombor halaman toolbar antara pelayan dan klien.
  - **Penyelesaian Dilaksanakan**:
    - `flipbook-view.tsx`: Mengunci nilai permulaan `containerDimensions` kepada `{ width: 1024, height: 768 }` secara deterministik pada pelayan dan klien. Dimensi sebenar dikemas kini sepenuhnya selepas mount menerusi `useEffect`, `updateSize()`, dan `ResizeObserver`.
    - `index.tsx`: Menggantikan percabangan `typeof window` dengan state `isWideScreen` (lalai `true`) yang diselaraskan dalam `useEffect`.
    - Menambah `suppressHydrationWarning` pada kontena pentas dan buku sebagai benteng pertahanan tambahan.
  - **Ujian & Kualiti**:
    - 326 / 326 ujian vitest lulus merentas 37 suite ujian.
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

- **2026-10-03 (Penyelarasan Label Butang Toolbar & Penghapusan Ruang Putih Bingkai Landskap `FlipbookView`)**:
  - **Latar Belakang & Punca Isu**:
    1. *Kekeliruan Butang ("sepatutnya 1 halaman bukan 2 halaman")*:
       - Pada bar navigasi pemapar (`components/pamphlet/viewer/toolbar.tsx`), label butang sebelum ini memaparkan tindakan sasaran seterusnya (*action target*) dan bukannya status aktif semasa (*current status*).
       - Apabila pembaca sedang melihat Mod 1 Halaman, butang memaparkan `[ 📖 2 Halaman ]` (bermaksud klik untuk ke mod 2 halaman). Pengguna mentafsirkan lencana ini sebagai penunjuk status dan menyangka pembaca tersilap mengaktifkan mod 2 halaman.
    2. *Ruang Putih Atas/Bawah Bingkai Landskap ("kenapa ada putih ya dekat atas frame landscape tu")*:
       - `FlipbookView` mengunci nisbah aspek dokumen landskap secara tegar kepada format A4 (1.414 : 1).
       - Risalah atau poster grafik pengguna (cth: "PANDUAN MUDAH URUS EMAS & SURAT AR-RAHNU") direka bentuk dalam nisbah 16:9 ($1.778 : 1$) yang jauh lebih lebar daripada A4.
       - Apabila imej 1.778 diletakkan di dalam kontena 1.414 dengan latar belakang putih (`bg-white`) dan `object-contain`, kontena menjadi terlalu tinggi (~115px lebih tinggi), menyebabkan jalur putih kosong (letterboxing) selebar ~58px kelihatan jelas di bahagian atas dan bawah bingkai dokumen.
  - **Penyelesaian Dilaksanakan**:
    1. *Penyelarasan Label & Ikon Butang Toolbar*:
       - Apabila sedang memaparkan 1 Halaman (`!isTwoPageSpread`): memaparkan `[ 📄 1 Halaman ]` dengan tooltip `"Sedang dipaparkan dalam 1 Halaman (Klik untuk tukar ke 2 Halaman)"`.
       - Apabila sedang memaparkan 2 Halaman (`isTwoPageSpread`): memaparkan `[ 📖 2 Halaman ]` dengan tooltip `"Sedang dipaparkan dalam 2 Halaman (Klik untuk tukar ke 1 Halaman)"`.
    2. *Pengesanan Nisbah Aspek Dinamik Dokumen*:
       - Menambah pengesanan saiz semula jadi imej (`img.naturalWidth / img.naturalHeight`) menerusi `onLoad` ke dalam state `detectedRatios`.
       - Pengiraan dimensi pentas buku (`bookWidth` & `bookHeight`) kini mengutamakan nisbah sebenar imej:
         `pageRatio = detectedRatio || page.aspectRatio || (isLandscape ? 1.414 : 0.707)`.
       - Kontena buku melaraskan ketinggian dan kelebaran tepat mengikut saiz imej 16:9, menghapuskan sepenuhnya jurang putih letterbox atas dan bawah.
       - Penyelarasan turut diaplikasikan ke atas `SliderView` dan `VerticalView`.
  - **Ujian & Kualiti**:
    - 326 / 326 ujian vitest lulus merentas 37 suite ujian.
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

- **2026-10-03 (Pembaikan Saiz Edge-to-Edge: Rapatkan Gambar ke Sisi Skrin / Hapuskan Gap Kiri & Kanan `FlipbookView`)**:
  - **Latar Belakang & Punca Isu ("ada yg tak sambung rapat gambar tu")**:
    - Pengguna memuat naik tangkap layar telefon (`media_1790958536125.jpg`) yang menunjukkan risalah landskap 16:9 ("SAMBUNGAN RAHNU") mempunyai ruang kosong/jurang ~51px di sebelah kiri dan kanan, menyebabkan gambar tidak mencecah tepi skrin.
    - Punca utama:
      (1) Elemen pentas buku mempunyai padding `p-2 sm:p-4 md:p-6` yang menolak gambar ke dalam;
      (2) Formula kelebaran menolak 24px secara manual dan mengenakan had `availW * 0.94` yang memotong 6% kelebaran secara buatan;
      (3) Inline style `maxWidth: '96vw'` memaksa jurang minimum 2vw di kedua-dua belah skrin;
      (4) Ketinggian `availH` menolak 110px daripada kawasan `main` (yang sebenarnya sudah mengecualikan header), mengecilkan ketinggian dan secara langsung mengecilkan kelebaran gambar berkadar ($W = H \times 1.778$).
  - **Penyelesaian Dilaksanakan**:
    - `flipbook-view.tsx`:
      (1) Dalam mod 1 Halaman, formula kelebaran menggunakan 100% lebar kontena (`singleAvailW = containerDimensions.width`) tanpa pemotongan tiruan `0.94` atau penolakan 24px;
      (2) Ketinggian `singleAvailH` dilaraskan secara anjal (`containerDimensions.height - 44` untuk landskap);
      (3) Sekiranya kelebaran dokumen hampir memenuhi skrin (< 64px) dan ketinggian masih muat, gambar dilebarkan terus ke 100% lebar skrin (`targetW = singleAvailW`);
      (4) Padding kontena pentas ditukar kepada `p-0` untuk mod landskap 1 halaman;
      (5) Had kelebaran kontena ditukar daripada `maxWidth: '96vw'` kepada `maxWidth: '100%'`;
      (6) Apabila gambar mencecah sempadan tepi skrin (`bookWidth >= containerDimensions.width - 4`), kelas kontena bertukar secara automatik kepada `rounded-none`, dan bayangan tulang belakang (`spine crease shadow`) di sebelah kiri disembunyikan untuk helaian landskap rata;
      (7) `SliderView` (`slider-view.tsx`) diselaraskan dengan `p-0 sm:p-3` dan `max-w-full`.
  - **Ujian & Kualiti**:
    - 326 / 326 ujian vitest lulus merentas 37 suite ujian.
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

- **2026-10-03 (Pembaikan Isu Kelipan Saiz Semasa Muat Semula Halaman / Penghapusan FOUC Layout Snap `FlipbookView`)**:
  - **Latar Belakang & Punca Isu ("kenapa bila refresh dia macam ni dulu" `media_1790960033460.png`)**:
    - Pengguna bertanya mengapa semasa menekan muat semula (refresh) pada pelayar, paparan risalah pada mulanya kelihatan bersaiz kecil ($666 \times 374\text{px}$) dengan bucu bulat dan jurang margin kiri-kanan sebelum mengembang ke saiz penuh.
    - Punca berpunca daripada kitaran hayat reka letak tak segerak (asynchronous lifecycle):
      (1) Semasa SSR dan mount awal di klien, `containerDimensions` dimulakan dengan saiz rujukan deterministik 1024x768 bagi mencegah ketidaksepadanan hydration;
      (2) State `detectedRatios` bermula kosong `{}` dan perlu menunggu acara `onLoad` imej atau ukuran `ResizeObserver` sebenar;
      (3) Pada saat awal pemuatan, komponen memaparkan dokumen pada nilai permulaan tersebut (atau formula terdahulu sebelum hot-reload disegerakkan), menghasilkan kelipan visual (layout shift / FOUC) apabila saiz sebenar diselaraskan beberapa milisaat kemudian.
  - **Penyelesaian Dilaksanakan**:
    - Memperkenalkan state `isMounted` (lalai `false`) pada `FlipbookView`.
    - Kontena pentas disembunyikan secara bersih (`opacity-0 pointer-events-none`) semasa pas pertama.
    - Di dalam `useEffect`, `updateSize()` membaca dimensi tepat DOM secara serta-merta, dan sebarang imej yang telah selesai dimuat turun / sedia ada dalam cache pelayar (`img.complete && img.naturalWidth > 0`) diimbas untuk mengaktifkan nisbah aspek sebenar tanpa menunggu `onLoad`.
    - `setIsMounted(true)` diaktifkan bersama transisi `transition-opacity duration-200` (`opacity-100`).
    - Hasilnya, dokumen memudar masuk (*fade in*) dengan lancar pada saiz penuh yang tepat dari detik pertama tanpa sebarang gegaran atau lompatan saiz.
  - **Ujian & Kualiti**:
    - 326 / 326 ujian vitest lulus merentas 37 suite ujian.
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

- **2026-10-03 (Penukaran Tema Lalai E-Pamphlet kepada Clean Studio / Light)**:
  - **Latar Belakang & Permintaan Pengguna**:
    - Pengguna meminta untuk menggunakan tema "Clean Studio" sebagai tema lalai ("kalau tema tu boleh tak guna clean studio utk default").
    - Tema Clean Studio (`light`) membawakan latar belakang studio galeri moden yang cerah, bersih dan profesional (`bg-gradient-to-b from-slate-100 via-slate-50 to-zinc-200 text-slate-900`) serta toolbar putih jernih separa lutsinar (`bg-white/85 backdrop-blur-md border-slate-200 text-slate-800`), menggantikan suasana gelap pekat (Cinema Dark / Royal Emerald).
  - **Penyelesaian Dilaksanakan**:
    - `lib/pamphlets/themes.ts`: Menukar pemalar teras `DEFAULT_PAMPHLET_THEME` daripada `'dark'` kepada `'light'` (Clean Studio).
    - `lib/storage/pamphlets.ts`: Mengemas kini `mapPamphletFromRow` dan `createPamphlet` untuk menggunakan `DEFAULT_PAMPHLET_THEME` (`'light'`) sebagai fallback berpusat.
    - `app/(dashboard)/pamphlets/client.tsx`: Menyelaraskan `CreatePamphletDialog` supaya menetapkan tema lalai baharu secara automatik kepada `DEFAULT_PAMPHLET_THEME` (`'light'`).
    - `components/pamphlet/viewer/index.tsx`, `toolbar.tsx`, `thumbnails-strip.tsx`: Menyelaraskan fallback pemapar kepada `DEFAULT_PAMPHLET_THEME` (`'light'`).
    - Pangkalan Data Supabase: Mengemas kini rekod pamphlet sedia ada pengguna untuk slug `test` (`/p/test`) terus daripada `theme: 'emerald'` kepada `theme: 'light'` (Clean Studio).
  - **Ujian & Kualiti**:
    - 327 / 327 ujian vitest lulus merentas 37 suite ujian (termasuk ujian unit baharu untuk `DEFAULT_PAMPHLET_THEME === 'light'` di `tests/pamphlet.test.ts`).
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

- **2026-10-03 (Penyelarasan Saiz Lalai Bersahaja: Zoom Out Sikit & Elak Pertindihan Toolbar Bawah)**:
  - **Latar Belakang & Permintaan Pengguna ("zoom sgt la pulak default, zoom out sikit" `media_1790961742536.png`)**:
    - Pengguna memaklumkan bahawa saiz paparan 1 halaman pada skrin komputer/laptop kelihatan terlalu besar secara lalai (*oversized/zoomed-in*), sehingga melekat rapat ke tepi skrin dan bahagian bawah dokumen (seperti teks item 10 dan lukisan watak) ditutupi oleh palang navigasi bawah terapung (`absolute bottom-4`).
    - Puncanya berpunca daripada pemaksaan kelebaran 100% dan penolakan ketinggian yang tidak mencukupi (hanya 44px) yang melonjakkan ketinggian dokumen sehingga menyentuh zon toolbar.
  - **Penyelesaian Dilaksanakan**:
    - `flipbook-view.tsx`:
- **2026-10-03 (Penghapusan Kesan Pulse / Kelipan Bayang Pada Animasi 3D Flipbook)**:
  - **Latar Belakang & Punca Isu ("kenapa setiap kali 3d flip ni keluar macam pulse" `media_1790962096804.png`)**:
    - Pengguna bertanya mengapa semasa selakan helaian 3D flipbook dijalankan, terdapat kesan denyutan atau kelipan hitam (*pulse*) yang timbul setiap kali muka surat beralih.
    - Punca berpunca daripada gabungan 4 lapisan bayangan tiruan yang berlebihan:
      (1) Halaman tapak statik mempunyai animasi keyframe `animate={{ opacity: [0, 0, 0.25, 0] }}` dengan `times: [0, 0.4, 0.85, 1]` di mana bayangan gelap melonjak naik sehingga 25% kelegapan di tengah-tengah selakan sebelum jatuh mendadak, menghasilkan gelombang denyutan (*black pulse*) merentasi dokumen;
      (2) Halaman tapak bertentangan mempunyai `initial={{ opacity: 0.3 }} animate={{ opacity: 0 }}` dan `bg-black/30` pada mod 1 halaman yang serta-merta melompat ke 30% kegelapan pada milisaat pertama klik (menghasilkan kilatan hitam / *strobe flash*);
      (3) Helaian berputar (`turningLeaf`) mempunyai pencahayaan yang terlalu gelap (`black/30` pada 0.35 - 0.40) menghasilkan tompokan hitam legam;
      (4) Bayangan luar bucu helaian `shadow-2xl` (50px blur) terpotong dalam ruang 3D dan tiba-tiba hilang apabila helaian dinyah-lekap pada milisaat ke-520.
  - **Penyelesaian Dilaksanakan**:
    - `flipbook-view.tsx`:
      (1) Membuang kesemua lapisan bayang tiruan `[0, 0, 0.25, 0]` dan lonjakan awal `0.3 / 0.35` daripada halaman tapak statik (kiri, kanan, dan single page) agar halaman latar kekal bersih dan stabil;
      (2) Melembutkan pencahayaan helaian berputar kepada kelegapan maksimum 0.15 dengan gradien halus `via-black/5 to-black/15` untuk simulasi pencahayaan kertas semulajadi;
      (3) Menggantikan `shadow-2xl` dengan `shadow-lg` pada helaian berputar untuk peralihan tanpa lompatan bayang;
      (4) Selakan 3D kini berputar dengan lancar, realistik (*buttery smooth*), tanpa sebarang kilatan atau denyutan bayang.
  - **Ujian & Kualiti**:
    - 327 / 327 ujian vitest lulus merentas 37 suite ujian.
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

- **2026-10-03 (Penghapusan Mutlak Isu Pulse / Pop & Naik Taraf Animasi 3D Flipbook)**:
  - **Latar Belakang & Punca Isu Lanjutan ("masih lagi sama" berikutan "keluar macam pulse")**:
    - Pengguna memaklumkan bahawa kesan "pulse" masih dirasai. Siasatan audit mendalam mendapati 5 punca teknikal saling bertindih:
      (1) **Impuls Bunyi White Noise (`playPageTurnSound`)**: Fungsi audio Web Audio API dipanggil secara **tanpa syarat** pada setiap selakan dalam `flipbook-view.tsx` (mengabaikan `soundEnabled === false`), menghasilkan bunyi letusan audio 80ms (*audio click/pop*) yang didengar sebagai denyutan elektrik;
      (2) **Animasi 1 Halaman Meluncur Sisi & Menghilang**: Dokumen 2-muka surat (seperti `/p/test`) beroperasi dalam mod 1 halaman secara lalai. Animasi selakan lama meluncurkan helaian secara mendatar ke `x: '-105%'` sambil melesapkan `opacity: 0`, manakala imej tapak di bawah melompat serta-merta ke Halaman 2 di t=0, menghasilkan sentakan / kelipan visual;
      (3) **Penggelembungan Perspektif 3D ("Keluar")**: Nilai `perspective: 2500px` (dan `2000px`) menyebabkan helaian selebar 500px mengembang 25% mendekati mata pengguna pada sudut 90 darjah, kelihatan seperti tersembul keluar;
      (4) **Denyutan Bayangan Hitam**: Lapisan `<motion.div>` yang menganimasikan kelegapan gradien hitam 0 -> 0.15 -> 0 mencetuskan gelombang denyutan warna hitam merentasi permukaan helaian;
      (5) **Ketidakstabilan Nisbah Aspek**: Pengiraan saiz berdasarkan `currentPage` menyebabkan perbezaan ukuran piksel antara muka surat yang mencetuskan animasi saiz CSS 520ms sewaktu mendarat.
  - **Penyelesaian Dilaksanakan**:
    - `flipbook-view.tsx` & `index.tsx`:
      (1) Menambah prop `soundEnabled` dan menyekat kesemua 4 panggilan `playPageTurnSound()` dengan `if (soundEnabled)` (lalai senyap);
      (2) Mengunci `documentRatio` utama supaya kelebaran dan ketinggian buku kekal 100% stabil tanpa sebarang getaran dimensi;
      (3) Meningkatkan nilai `perspective` kepada `5000px` untuk kesan 3D isometrik yang tenang dan rata tanpa penggelembungan;
      (4) Membuang kesemua lapisan tindanan gradien hitam animasi agar warna dokumen kekal terang dan tulen;
      (5) Membina semula selakan 1 halaman kepada **Putaran Kad 3D Dwi-Muka Sejati (*True 3D Double-Sided Card Flip*)**: tapak bawah kekal memaparkan helaian semasa, kad selakan berputar 180 darjah pada paksi tengah (`transformOrigin: 'center center'`, `transformStyle: 'preserve-3d'`), muka hadapan memaparkan helaian semasa (`rotateY: 0deg`), dan muka belakang memaparkan helaian sasaran (`rotateY: 180deg`), membolehkan helaian berpaling secara fizikal dan mendarat dengan lancar tanpa sebarang lompatan atau kelipan.
  - **Ujian & Kualiti**:
    - 327 / 327 ujian vitest lulus merentas 37 suite ujian.
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

- **2026-10-03 (Penghapusan Garis di Tengah Semasa Animasi 3D Flipbook)**:
  - **Latar Belakang & Punca Isu ("kenapa ya bila 3d flip setiap helaian garis akan muncul di tengah")**:
    - Pengguna bertanya mengapa semasa selakan helaian 3D dijalankan, terdapat satu garisan tegak yang muncul tepat di tengah-tengah dokumen pada setiap helaian ("setiap helaian garis akan muncul di tengah").
    - Siasatan mendapati dua punca geometri dan penggayaan CSS:
      (1) **Mod Satu Halaman (Single-Page Mode - Dokumen 2-Muka Surat / Telefon)**:
          - Kad 3D dwi-muka berputar pada paksi tengah (`transformOrigin: 'center center'`).
          - Pada sudut 90 darjah (`rotateY: -90deg`), satah 2D menguncup menjadi ketebalan sifar (*edge-on view*) tepat di garisan menegak tengah skrin (`x = 50%`).
          - Sempadan kad (`border-black/15`) dan sisi piksel pada paksi tengah ini secara harfiah dilihat oleh mata sebagai garisan tegak tajam yang memotong dokumen pada setiap selakan.
      (2) **Mod Dwi-Halaman (Two-Page Spread Mode)**:
          - Elemen pembahagi tulang buku tiruan `w-2 z-40 bg-gradient-to-r from-black/50...` diaktifkan secara tiba-tiba (`opacity-100`) semasa `isFlipping === true`.
          - Sempadan dalaman `border-r` dan `border-l` serta bayangan `shadow-inner` pada halaman kiri dan kanan bergabung membentuk jalur sempadan hitam tebal di tengah.
          - Bayangan lipatan tulang kasar `w-10 from-black/40` memotong helaian landskap di tengah.
  - **Penyelesaian Dilaksanakan**:
    - `components/pamphlet/viewer/flipbook-view.tsx`:
      (1) **Selakan 1 Halaman Berengsel Tepi Tulang (*Spine-Hinged Flip*)**: Menukar paksi putaran kepada tepi tulang buku: `transformOrigin: 'left center'`. Apabila beralih ke *Next*, helaian berayun dari kanan ke tulang kiri (`rotateY: 0 -> -85deg`, `opacity: [1, 1, 0]`) sambil halaman sasaran telah siap sedia di bawah tapak. Apabila beralih ke *Prev*, helaian berayun turun dari tulang kiri ke kanan (`rotateY: -85 -> 0deg`, `opacity: [0, 1, 1]`). Tiada satah yang pernah berserenjang di tengah skrin, menghapuskan sepenuhnya artifak garisan tengah;
      (2) **Pembersihan Dwi-Halaman**: Membuang sepenuhnya jalur tulang `w-2 z-40`, mengasingkan sempadan luar daripada dalam (`border-r-0` dan `border-l-0`), membuang `shadow-inner` daripada kedua-dua tapak halaman, membuang `border-r`/`border-l` daripada placeholder kulit, dan menyekat bayangan lipatan tulang kasar bagi dokumen landskap (`!isLandscape`).
  - **Ujian & Kualiti**:
    - 327 / 327 ujian vitest lulus merentas 37 suite ujian.
    - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

## System Improvements (2026-10-03 — Pembaikan Butang Togol 1 Halaman vs 2 Halaman Pamphlet)
- **Punca Isu Klik Kali Pertama Tiada Tindak Balas**:
  - Pengguna melaporkan butang togol halaman di toolbar bawah ("1 Halaman") apabila ditekan satu kali tidak berlaku apa-apa dan hanya bertukar kepada 2 halaman selepas klik kali kedua.
  - Siasatan mendapati:
    (1) State `pageSpreadMode` bermula dengan `'auto'`.
    (2) Pada dokumen 2 muka surat (`totalPages === 2`), mod `'auto'` memaparkan 1 halaman secara berpusat (`isTwoPageSpread = false`), maka toolbar memaparkan butang `[ 📄 1 Halaman ]`.
    (3) Logik togol asal: `setPageSpreadMode((prev) => (prev === 'single' ? 'double' : 'single'))`.
    (4) Apabila `prev` adalah `'auto'`, syarat `prev === 'single'` mengembalikan `false`, lalu menetapkan `pageSpreadMode = 'single'`.
    (5) Kerana mod `'single'` dan mod awal `'auto'` menghasilkan paparan yang sama (`isTwoPageSpread = false`), klik pertama langsung tidak mengubah paparan visual (klik mati). Hanya pada klik kedua (apabila `prev === 'single'`), ia bertukar ke `'double'`.
- **Penyelesaian Kejuruteraan**:
  - `components/pamphlet/viewer/index.tsx`:
    - Mengira `isCurrentlyDouble` di dalam `setPageSpreadMode((prev) => ...)`: jika sedang memaparkan 1 halaman (walaupun `prev` ialah `'auto'`), klik pertama serta-merta bertukar kepada `'double'`. Jika sedang memaparkan 2 halaman, klik bertukar kepada `'single'`.
    - Mengintegrasikan `isTwoPageSpread` secara memoized dan bersih ke dalam prop `PamphletToolbar`.
  - `components/pamphlet/viewer/toolbar.tsx`:
    - Menambah semakan pertahanan `totalPages >= 2` agar togol spread hanya dipaparkan jika risalah mempunyai sekurang-kurangnya 2 muka surat.
- **Ujian & Kualiti**:
  - Ditambah ujian unit khusus togol 1-klik di `tests/pamphlet.test.ts`.
  - 330 / 330 ujian vitest lulus merentas 37 suite ujian.
  - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

## System Improvements (2026-10-04 — Penyelarasan Saiz Touch Slider & Skrol Menegak Pamphlet)
- **Penyelarasan Saiz Touch Slider (`SliderView`)**:
  - `components/pamphlet/viewer/slider-view.tsx` dinaik taraf menggunakan `ResizeObserver` dan algoritma dimensi pintar yang sama persis dengan `3D Flipbook`:
    - Had ketinggian dokumen landskap: maksimum 560px (potret 700px).
    - Kelegaan bawah: 108px (desktop) dan 88px (mudah alih) supaya bar navigasi terapung (`bottom-4`) tidak sesekali bertindih dengan teks bahagian bawah dokumen.
    - Saiz kekal stabil dan konsisten semasa menukar antara mod 3D Flipbook dan Touch Slider tanpa melompat saiz atau kelihatan terlalu "zoom".
    - Pengesanan nisbah aspek dinamik imej (`detectedRatios` pada `img.onLoad`).
- **Penyelarasan Saiz Skrol Menegak (`VerticalView`)**:
  - `components/pamphlet/viewer/vertical-view.tsx` dihadkan kelebarannya secara santai kepada `max-w-[min(90vw,780px)]` (landskap) dan `max-w-[min(88vw,540px)]` (potret) berbanding `max-w-4xl` (896px) yang terlalu gergasi.
  - Ditambah padding bawah `pb-28 sm:pb-32` agar helaian terakhir boleh dibaca sepenuhnya tanpa terlindung di sebalik toolbar bawah.
- **Klarifikasi Diagnostik Konsol Pelayar**:
  - Mesej amaran `The resource ... was preloaded using link preload...` dan `Slow execution detected: 118ms` disahkan sebagai amaran prapemuatan aset CSS dalam mod pembangunan Next.js (`localhost:3000`), bukannya ralat sistem sebenar (konsol menunjukkan 0 ralat).
- **Ujian & Kualiti**:
  - 330 / 330 ujian vitest lulus merentas 37 suite ujian.
  - 0 ralat TypeScript (`tsc --noEmit`), 0 ralat / 0 amaran ESLint.

## System Improvements (2026-10-04 — Penukaran Keseluruhan Antaramuka Sistem ke Bahasa Inggeris / Malay to English Global Standardization)
- **Objektif**: Memenuhi permintaan pengguna ("yg mana ada bahasa melayu, tukarkan semua ke bahasa inggeris"), menukar kesemua teks antaramuka pengguna (UI), mesej ralat, modal dialog, tooltip, metadata, preset templat, dan mesej ralat pelayan/storan yang masih dalam Bahasa Melayu kepada Bahasa Inggeris secara profesional, rapi, dan konsisten merentas seluruh platform KlikForm.
- **Komponen & Modul yang Ditukar**:
  1. **E-Pamphlet & 3D Flipbook**:
     - `components/pamphlet/viewer/toolbar.tsx`: Headers, butang navigasi, pemilih mod paparan ("3D Flipbook", "Touch Slider", "Vertical Scroll"), menu perkongsian ("Share Pamphlet", "Copy Link", "Share via WhatsApp"), togol muka surat ("1 Page", "2 Pages"), kawalan zum, tooltip, dan toasts ("Link copied to clipboard").
     - `components/pamphlet/viewer/flipbook-view.tsx`, `slider-view.tsx`, `vertical-view.tsx`, `thumbnails-strip.tsx`, `index.tsx`: Label mod zum/pan, butang selakan (Next/Previous Page), siluet penghujung buku (Cover / End of Book), teks alternatif imej (Page X of Y), jalur thumbnail, dan keadaan kosong ("No pages added yet").
     - `app/(dashboard)/pamphlets/page.tsx`, `client.tsx`: Metadata, kad statistik, keadaan kosong, dialog padam risalah ("Delete E-Pamphlet"), modal QR ("Pamphlet QR Code", "Scan to open digital pamphlet"), banner migrasi pangkalan data.
     - `app/(dashboard)/pamphlet-builder/[id]/page.tsx`, `client.tsx`: Metadata, tab studio (Pages, Event Info, Theme), pemuat naik imej & PDF ("Upload Pages", "Drag & drop your files here"), senarai susunan helaian, borang maklumat acara, pemilih tema visual, butang tindakan (Save, Preview).
     - `lib/pamphlets/themes.ts`, `lib/pamphlets/utils.ts`: Keterangan tema, tajuk sampel lalai ("Excellence Awards Program Book", "Digital Innovation Conference Program"), tajuk muka surat sampel, label butang tindakan ("Event Location", "Event Schedule", "Official Website").
  2. **Sistem Kehadiran (Smart Attendance) & Semakan Sijil Awam**:
     - `lib/forms/attendance.ts`: Format teks durasi kehadiran ("X Hours Y Minutes", "X Minutes", "X Seconds") dan mesej kelayakan e-Sijil.
     - `actions/certificates.ts`: Mesej ralat rate limit, carian borang, semakan Google Sheet, pengesahan tarikh, dan kelayakan kehadiran.
     - `app/(public)/form/[id]/client.tsx`: Toasts daftar keluar, amaran anti-penipuan QR berputar ("Anti-Fraud Security", "Please rescan the latest live QR code from the screen"), kad kejayaan daftar masuk & keluar, modal input PIN pengesahan, dialog amaran daftar keluar awal ("Early Check-Out Warning"), status butang serahan ("Submitting...", "Submit").
     - `app/(public)/present/[id]/page.tsx`, `client.tsx`: Metadata, skrin projektor langsung QR berputar ("Live Attendance Check-In"), locale jam (`en-US`), ralat token tamat tempoh, arahan imbasan, togol PIN pentadbir.
     - `app/(public)/check/[formId]/client.tsx`: Lencana syarat jam minimum kehadiran dan kad perincian kekurangan masa kehadiran ("Attendance Requirement Not Met").
     - `app/(public)/edit/[token]/page.tsx`: Metadata dan paparan mesej ralat pautan tidak sah / telah luput / telah digunakan.
  3. **Modul E-Sijil & Builder**:
     - `lib/certificates/presets.ts`: Kesemua 6 templat sijil pra-bina (Classic, Minimalist, Elegant, Modern, Corporate, Golden Border) ditukar tajuk, penerangan, dan teks elemen kanvas (Certificate of Achievement, Leadership Training Program, This is proudly presented to, etc.).
     - `components/certificates/new-certificate-dialog.tsx`: Penerangan kategori, tajuk dialog ("Create New Certificate"), tab (Presets / Custom Studio), toasts, dan butang tindakan.
     - `components/certificates/delete-certificate-button.tsx`: Tajuk dialog ("Delete Certificate?"), penerangan, butang ("Cancel", "Yes, Delete").
     - `components/certificates/certificate-template-card.tsx`: Format tarikh (`en-US`), tooltip butang jana pukal ("Bulk generate certificates (CSV to ZIP)").
     - `components/certificate-qr-card.tsx`: Nama fail muat turun (`certificate-qr-code.png`), toasts, status butang ("Downloading...", "Open").
     - `components/certificates/builder/properties.tsx`: Keadaan kosong ("Select an element to edit properties"), koordinat posisi & saiz, butang pusatkan ke kanvas (Center Horizontally, Center Vertically), penjajaran & pengagihan pelbagai elemen, warna & ketebalan ikon, info URL pengesahan automatik, sifat teks & fon, pengumpulan fon Google, butang gaya teks.
     - `components/certificates/builder/sidebar.tsx`: Toasts muat naik latar belakang, tab Tambah Elemen (Text, Image, Shape, Line), butang medan ruang letak dinamik (Participant Name, Program Name, ID / IC Number, Serial Number, Organization / School, Role / Position, Grade / Training Hours, Date, Expiry Date), lencana & mohor (Gold Seal, Pass Badge, Verified Shield, Award Trophy), pratetap pantas (Add Classic Gold Border, Dual Signature Preset), label warna & imej latar.
     - `components/certificates/builder/toolbar.tsx`: Tooltip kawalan (Back, Sidebar, Undo, Redo, Orientation, Show Grid, Snap to Grid, Print Margin), status butang simpan & eksport (Exporting... PNG, Generating... PDF, Saving... Save).
     - `app/(dashboard)/certificates/builder/[id]/client.tsx`: Pemegang penskalaan Canva, `PLACEHOLDER_LABELS` kanvas, toasts penjajaran & pengagihan, toasts simpan templat, nama sandaran eksport (`certificate.png`, `certificate.pdf`), toasts muat turun.
     - `app/(dashboard)/certificates/builder/[id]/preview/page.tsx`: Label ruang letak olok-olok (Johnathan Doe, Leadership Training Program, en-US dates, Global Leadership Academy, etc.).
     - `components/certificate-template.tsx`: Format tarikh dipiawaikan ke `en-US`.
  4. **Banner Langganan, Server Actions & Mesej Ralat Storan**:
     - `components/dashboard/subscription-banner.tsx`: Amaran langganan Pro tamat tempoh, kiraan hari tangguh (*grace days*), notis akaun terhad, butang tindakan ("Renew Now", "Renew and Unlock").
     - `app/(dashboard)/bio-builder/[id]/client.tsx`: Toasts ralat muat naik avatar, kejayaan, dan buang avatar.
     - `lib/storage/pamphlets.ts`: `PAMPHLET_TABLE_MISSING_MESSAGE` dan kesemua mesej `throw new Error(...)` ditukar ke Bahasa Inggeris.
     - `lib/storage/bio-links.ts`: Pengesahan nama pengguna, had kuota tier, konflik nama pengguna sedia ada, mesej ralat CRUD halaman bio & pautan.
     - `lib/storage/subscription.ts`: Mesej had kuota borang, had penyerahan bulanan, had templat sijil, had kod QR.
     - `lib/storage/short-links.ts`: Pengesahan URL dan mesej had pautan pendek.
     - `actions/forms.ts`: Mesej ralat rate limit, borang tidak aktif, persetujuan PDPA, kod QR berputar tamat tempoh, dan kegagalan simpanan.
     - `actions/attendance.ts`: Ralat semakan status, pengesahan check-out, ralat PIN, ralat QR berputar, dan ralat kemas kini baris.
     - `actions/certificate-template.ts`: Mesej had tier, nama templat lalai ("New Certificate"), ralat ID, ralat pangkalan data.
     - `actions/pamphlets.ts`: Mesej ralat tindakan cipta, kemas kini, dan padam.
     - `actions/bio-links.ts`: Mesej ralat tindakan cipta, kemas kini, padam, dan susun semula pautan bio.
     - `actions/edit-response.ts`: Mesej rate limit, pautan luput/digunakan/tidak sah, borang tidak dijumpai, dan ralat penyegerakan Google Sheet.
     - `actions/response-summary.ts`: Mesej ketiadaan Google Sheet, URL tidak sah, ketiadaan konfigurasi, dan ralat bacaan.
     - `actions/webhooks.ts`: Mesej pengesahan skema Zod (URL, Secret) dan mesej ralat tindakan CRUD webhook.
     - `components/forms/certificate-category-card.tsx`: Contoh dropdown kategori ("Committee / Organizer / Participant").
     - `lib/forms/conditions.ts`: Label pengendali logik syarat (equals, does not equal, contains, does not contain, is empty, is not empty, greater than, less than).
     - `app/builder/[id]/client.tsx`: Mesej tamat tempoh sijil dan penerangan jam minimum kehadiran.
     - `app/(dashboard)/responses/[id]/analytics/response-charts.tsx`: Toasts ralat muat ringkasan jawapan.
  5. **Metadata SEO & JSON-LD**:
     - `app/layout.tsx`: Keterangan aplikasi dalam JSON-LD `@graph` Schema.org Application.
     - `app/page.tsx`: Metadata tajuk ("KlikForm - Next-Gen Online Forms & Automated E-Certificates") dan deskripsi.
     - `app/(public)/p/[slug]/page.tsx`: Metadata laluan awam risalah digital ("Program Book Not Found", "Digital Program Book", "View the official digital program book for...").
  6. **Penyelarasan Ujian Vitest**:
     - `tests/attendance.test.ts` & `tests/certificate-attendance-gating.test.ts`: Penyelarasan format durasi masa dan mesej kelayakan kehadiran.
     - `tests/pamphlet-storage.test.ts`: Penyelarasan mesej ralat storan risalah.
     - `tests/bio-storage.test.ts`: Penyelarasan mesej ralat panjang nama pengguna dan had kuota tier percuma.
     - `tests/pamphlet.test.ts`: Penyelarasan slug sampel risalah bahasa Inggeris.
     - `tests/attendance-actions.test.ts`: Penyelarasan format durasi ("Hour") dan ralat rekod kehadiran ("Check-in record not found").
- **Pemeliharaan Keserasian Spreadsheet Tempatan**:
  - Kolum pemetaan fail luaran seperti `lib/certificates/headers.ts` (`isIcHeader`), `actions/certificates.ts` (carian lajur `tarikh`, `no ic`, `kad pengenalan`), dan `lib/forms/attendance.ts` sengaja dikekalkan bagi memastikan fail Excel/Google Sheet pengguna sedia ada diproses dengan lancar tanpa ralat.
- **Pengesahan & Kualiti Menyeluruh**:
  - `npm run typecheck`: 0 ralat TypeScript (`tsc --noEmit`).
  - `npm run lint`: 0 ralat, 0 amaran ESLint.
  - `npm test`: 330 / 330 ujian lulus (100%) merentas kesemua 37 suite ujian.

## System Improvements (2026-10-04 — Penetapan Tema "Clean Studio" Sebagai Tema Lalai Preview E-Pamphlet)
- **Konteks & Permintaan Pengguna**: Pengguna memohon agar pratonton e-pamphlet / buku program menggunakan tema "Clean Studio" (latar belakang cerah, moden dan kemas) secara lalai menggantikan "Royal Emerald" (`emerald`).
- **Penyelesaian Dilaksanakan**:
  1. `lib/pamphlets/utils.ts`:
     - `getSamplePamphlet()`: Menukar `theme: 'emerald'` kepada `theme: 'light'` ("Clean Studio").
     - `getSampleLandscapePamphlet()`: Menukar `theme: 'dark'` kepada `theme: 'light'` ("Clean Studio").
  2. `components/pamphlet/viewer/index.tsx`:
     - Menambah penyegerakan reaktif `useEffect` bagi `pamphlet.theme` supaya pemapar (*viewer*) serta-merta mengemas kini tema latar apabila `pamphlet.theme` bertukar atau disetkan.
  3. `lib/storage/pamphlets.ts`:
     - Menyelaraskan teks DDL SQL dalam `PAMPHLET_TABLE_MISSING_MESSAGE` kepada `theme text not null default 'light'`.
  4. `tests/pamphlet.test.ts`:
     - Mengemas kini asersi ujian tema sampel kepada `expect(sample.theme).toBe('light')`.
- **Ujian & Kualiti**:
  - `npm test`: 330 / 330 ujian vitest lulus (37 test suites).
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat, 0 amaran ESLint.

## System Improvements (2026-10-04 — Pembersihan Menyeluruh Emoji Antaramuka untuk Estetika Reka Bentuk Minimalis)
- **Permintaan Pengguna**: "ada emoji, kalau boleh buang emoji sbb sy suka minimalist" (merujuk kepada lencana orientasi buku `💻 Landscape (Horizontal)` / `📱 Portrait (Vertical)` dan sebarang emoji dalam antaramuka).
- **Tindakan Pembersihan & Piawaian Minimalis**:
  1. `app/(dashboard)/pamphlet-builder/[id]/client.tsx`:
     - Membuang emoji `💻` dan `📱` pada pill penunjuk status orientasi buku: ditukar kepada `Landscape (Horizontal)` / `Portrait (Vertical)`.
  2. `app/(public)/edit/[token]/page.tsx`:
     - Menggantikan emoji `⛔` dengan bekas ikon SVG monokromatik Lucide `<AlertCircle className="w-6 h-6 text-rose-600" />` di dalam kontena bulat lembut `rounded-full bg-rose-50`.
  3. `app/(public)/form/[id]/client.tsx`:
     - Menggantikan emoji `🚫` dengan ikon Lucide `<ShieldAlert className="h-6 w-6 text-red-600" />`.
     - Menggantikan emoji `🔒` dengan ikon Lucide `<Lock className="h-6 w-6 text-slate-600" />`.
     - Menggantikan emoji `📌` dengan ikon Lucide `<Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />`.
     - Menggantikan emoji `⏳` dengan ikon Lucide `<Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />`.
  4. `components/dashboard/stats.tsx`:
     - Membuang emoji parti `🎉` pada penunjuk kuota borang: ditukar kepada teks bersih `Unlimited forms`.
  5. `app/(dashboard)/forms/page.tsx`:
     - Menggantikan emoji amaran `⚠️` dengan ikon Lucide `<AlertCircle className="w-4 h-4 text-red-600 shrink-0" />`.
  6. `components/forms/certificate-category-card.tsx`, `edit-link-card.tsx`, `respondent-notification-card.tsx`:
     - Menggantikan emoji `⚠️` dengan ikon Lucide `<AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />`.
  7. `components/landing/landing-hero.tsx` & `landing-footer.tsx`:
     - Menggantikan emoji `💬` dengan ikon Lucide `<MessageCircle className="h-3.5 w-3.5 text-emerald-600" />`.
     - Menggantikan emoji `❤️` dengan ikon Lucide `<Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />`.
## System Improvements (2026-10-04 — Pengoptimuman Antaramuka Pemapar E-Pamphlet untuk Peranti Mudah Alih & Simulator Telefon)
- **Permintaan Pengguna**: "view dekat phone ni kurang cantik sikit" bersama tangkapan skrin yang menunjukkan risalah landskap A4 dalam simulator telefon dengan ruang kosong luas di bawah dan toolbar desktop yang padat.
- **Punca Masalah Visual**:
  1. Toolbar bawah memuatkan kawalan desktop (`[ 1 Page ]` toggle, zoom stepper `- 100% +`), menjadikannya terlalu lebar dan sesak (~360px) di dalam skrin telefon (390px-400px).
  2. Simulator telefon pada desktop tidak menghantar prop `forceMobile` ke `PamphletToolbar`, menyebabkan semakan CSS/JS lebar skrin menyangka ia berada di desktop, lantas memaparkan teks label ("Flipbook"), pemilih tema, dan suis bunyi pada bar atas (header) yang memotong tajuk buku program kepada `IG...`.
  3. Dokumen landskap pada skrin telefon menegak meninggalkan ruang menegak yang terasa janggal tanpa panduan interaksi atau perimbangan komposisi.
- **Penyelesaian & Naik Taraf Seni Bina**:
  1. `components/pamphlet/viewer/toolbar.tsx`:
     - Menghubungkan `isMobileLayout = forceMobile || !isDesktop`.
     - Bar bawah (`footer`) diringkaskan kepada *floating pill* minimalis: `[ < ]   [ ⊞ 1 / 2 ]   [ > ]` dengan `rounded-full` dan saiz padat (~148px) yang mudah dicapai oleh ibu jari (*thumb zone*).
     - Menyembunyikan kawalan zoom stepper (`- 100% +`) dan toggle spread (`1 Page`) pada mod telefon (pengguna telefon menggunakan *pinch-to-zoom* atau *double-tap*).
     - Pada bar atas (`header`): menyembunyikan pemilih tema dan suis bunyi pada telefon, dan menukar butang mod paparan kepada ikon 32x32 tanpa label teks. Ruang tajuk diperluaskan (`flex-1 min-w-0`) supaya nama dokumen (contohnya `AMARAN CUACA - MONSUN`) dipaparkan sepenuhnya tanpa terpotong.
  2. `components/pamphlet/viewer/index.tsx`:
     - Memajukan `forceMobile={forceMobile}` ke `<PamphletToolbar>` dan `<SliderView>`.
  3. `components/pamphlet/viewer/flipbook-view.tsx` & `slider-view.tsx`:
     - Memperluas kelebaran dokumen landskap pada mod mudah alih daripada `width - 24` ke `width - 8` untuk memaksimumkan penggunaan skrin telefon dan menjadikan teks lebih tajam serta mudah dibaca.
     - Menambah petunjuk visual minimalis monokromatik di ruang bawah flyer landskap: `<Smartphone className="h-3.5 w-3.5 rotate-90" /> Rotate phone for full-width • Double-tap to zoom` (hanya dipaparkan apabila `zoom <= 1.0` untuk keseimbangan visual yang elegan dan berorientasikan pengguna).
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 330 / 330 ujian unit lulus (37 suites).

## System Improvements (2026-10-04 — Penghapusan Kesan Denyutan "Pulse Effect" Pada Animasi Selakan Helaian 3D Flipbook)
- **Konteks & Laporan Pengguna**: "kenapa di dekstop view dan mobile view bila sy tekan flip dia macam ada pulse effect"
- **Analisis Punca Masalah**:
  1. *Unjuran Perspektif 3D Membengkak ke Kamera*: Dokumen 2 muka surat (seperti risalah depan-belakang) secara lalai menggunakan mod Single Page pada desktop dan mobile. Animasi lama memutarkan helaian tunggal `rotateY: 0 -> -85deg` dengan `transformOrigin: 'left center'`. Ini menolak bucu kanan ke ruang Z positif mendekati kamera, menyebabkan imej membesar secara optik sebanyak ~20% (kesan bengkak/denyut) sebelum hilang.
  2. *Kelipan `src` Imej Tapak*: Elemen `<img>` tapak menggunakan ternari `isFlipping ? targetPage : currentPage`. Apabila animasi selesai (`isFlipping = false`) sebelum state `currentPage` dikemas kini oleh komponen induk, imej tapak seketika berbalik ke muka surat asal selama satu bingkai mikro (mencetuskan kilatan kelipan `Halaman 2 -> Halaman 1 -> Halaman 2`).
  3. *Tindanan Bayang Lenyap Mendadak*: Animasi `opacity: [1, 1, 0]` melarutkan helaian selakan secara tiba-tiba di tengah putaran.
  4. *Kitaran Semula `ResizeObserver`*: Hook `useEffect` bagi `ResizeObserver` bergantung kepada `[currentPage]`, menyebabkan observer dibongkar dan dipasang semula pada setiap selakan, lantas mengimbas DOM dan mencetuskan kiraan semula saiz/nisbah kontena tepat ketika animasi selesai.
- **Penyelesaian Dilaksanakan**:
  1. `components/pamphlet/viewer/flipbook-view.tsx`:
     - **Penyegerakan `displayedPage`**: Memperkenalkan state `displayedPage` yang diselaraskan dengan `nextPage` sebaik sahaja selakan bermula. Imej tapak dikunci kepada muka surat sasaran tanpa sebarang kelipan `src`.
     - **Seni Bina Selakan 3D Berasingan Mengikut Mod**:
       - *Mod 2 Halaman (Two-Page Spread)*: Kekal menggunakan selakan 180° merentasi tulang tengah (`left: 50%`) yang mendarat rapi di halaman sebelah kiri (berfungsi sempurna dan disahkan lancar oleh pengguna).
       - *Mod 1 Halaman (Single Page & Mobile)*: Menggantikan putaran engsel luar yang terkeluar daripada skrin dengan **Simulasi Kelengkungan Kertas 3D Sejati (*3D Paper Curl & Peel*)**:
         - Bucu helaian terangkat dalam perspektif 3D dengan putaran `rotateY: -25deg` dan kecondongan pepenjuru organik `rotateZ: -3deg` berpaksi pada `right center`.
         - Jalur bayangan kertas 3D tebal dwi-lapisan (`shadow-[-16px_0_36px_rgba(0,0,0,0.32),-6px_0_12px_rgba(0,0,0,0.2)]`) mengekori lipatan selakan dan jatuh ke atas muka surat baharu di bawah.
         - Kilauan silinder 3D (*cylindrical highlight sheen* `from-white/60 via-black/10 to-transparent`) membiaskan cahaya di sepanjang permatang lengkungan kertas.
         - Helaian menyapu licin dari kanan ke kiri (`x: 0 -> -102%`) dan bergulung kemas ke dalam tulang kiri, menyingkap halaman baharu di bawahnya tanpa sebarang pembengkakan kamera, tanpa terpelanting keluar skrin, dan sifar garisan tengah.
     - **Kunci `ResizeObserver` ke Mount-Only**: Mengubah dependencies array observer kepada `[]` supaya dimensi kontena kekal teguh dan sifar gangguan saiz sewaktu helaian bertukar.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat, 0 amaran ESLint.
  - `npm test`: 330 / 330 ujian unit lulus (37 test suites).

## System Improvements (2026-10-05 — Penghapusan Glitch Selepas Animasi 3D Flip)
- **Punca Glitch "Lepas 3D Flip"**:
  1. *Lonjakan Transformasi `targetShiftX`*: Menetapkan `targetSpreadRef.current = null` secara segerak di dalam `onFlipAnimationComplete` menyebabkan `targetShiftX` fallback kepada `activeSpread` (spread lama) sebelum render baharu berlaku, mencetuskan lonjakan sekejap pada koordinat paksi X kontena yang dipacu oleh peralihan CSS `transition: transform 520ms`.
  2. *Kelipan Dekod Imej Tapak (`img.src` swap)*: Penyah-lekapan (*unmount*) helaian selakan berlaku serentak pada millisecond yang sama elemen `<img>` tapak diarahkan menukar `src`. Pelayar memerlukan 1 bingkai mikro untuk mendekod bitmap baharu, menyebabkan kelipan putih/halaman lama.
  3. *Bayangan Helaian Tertanggal Mengejut (`drop-shadow-xl` pop)*: Helaian berputar mengekalkan bayangan jatuh penuh sehingga saat mendarat pada 180° / 0°, lalu bayangan hilang secara mengejut sebaik sahaja helaian dinyah-lekap.
  4. *Ketidakpadanan Warna Sempadan*: Sempadan helaian berputar menggunakan `border-black/10` manakala halaman tapak menggunakan `border-black/15`, mencetuskan lonjakan warna garis luar pada saat akhir selakan.
  5. *Pepijat Selakan Undur Mod 1 Halaman*: Pada selakan `PREV`, `setDisplayedPage` tidak dikemas kini, menyebabkan imej tapak tidak memaparkan halaman sasaran di bawah helaian selakan.
  6. *Bunyi Selakan Berulang Dua Kali*: Panggilan `onPageChange` di penghujung selakan mencetuskan `playPageTurnSound` kali kedua dalam `PamphletViewer`.
- **Penyelesaian Dilaksanakan**:
  1. `components/pamphlet/viewer/flipbook-view.tsx`:
     - **Pengekalan `targetSpreadRef` Melalui `requestAnimationFrame`**: Menangguhkan pembersihan `targetSpreadRef.current = null` ke frame seterusnya selepas state dikomit, memastikan `targetShiftX` tidak sesekali melonjak ke spread lama.
     - **Pra-Pemaparan Imej Sasaran Pada Halaman Tapak (*Pre-mounted Destination Images*)**: Memasang imej muka surat sasaran di dalam lapisan asas sejak detik awal selakan (t=0) agar pelayar telah siap mendekod bitmap tersebut sebelum helaian mendarat.
     - **Nyah-Lekap Helaian Tanpa Kelipan (*Seamless Handoff*)**: Menangguhkan pembuangan `turningLeaf` sebanyak 1 frame menerusi `requestAnimationFrame` agar halaman tapak telah sedia terpapar 100% sebelum helaian diangkat.
     - **Animasi Pelarutan Bayangan Dinamik (*Drop-Shadow Dissolve*)**: Menggunakan keyframe penapis `filter: ['drop-shadow(0px...)', 'drop-shadow(±8px 12px 24px...)', 'drop-shadow(0px...)']` dengan `times: [0, 0.48, 1]` supaya bayangan kembali ke 0 secara semula jadi apabila helaian mendarat rata.
     - **Penyelarasan Sempadan**: Menyelaraskan kesemua sempadan helaian selakan kepada `border-black/15` setara dengan halaman tapak dan membuang `transition-opacity duration-300` yang melambatkan pemaparan.
     - **Sokongan Penuh Selakan Undur 1 Halaman**: Menambah prapemuatan imej sasaran, animasi pudar masuk `opacity: [0, 1, 1]`, dan bayangan berarah kanan (`shadow-[16px...]`).
  2. `components/pamphlet/viewer/index.tsx`:
     - Menghalang bunyi selakan berulang dua kali dengan menyalurkan `playSound = false` pada panggilan `onPageChange` dari `FlipbookView`.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat, 0 amaran ESLint.
  - `npm test`: 330 / 330 ujian unit lulus (37 test suites).

## System Improvements (2026-10-05 — Penyelarasan Segerak Transisi Imej dengan Animasi 3D Flip 1-Page & 2-Pages)
- **Konteks & Laporan Pengguna**: "dari segi 3d flip macam okay utk 1 page dan 2 pages, cuma utk trasition gambar tu macam tak sync bila 3d flip"
- **Analisis Punca Ketidaksegerakan Transisi Imej**:
  1. *Lengkungan Easing Front-Loaded*: Easing lama `cubic-bezier(0.25, 1, 0.5, 1)` menyebabkan putaran 3D melepasi 90° (titik peralihan hadapan ke belakang) dalam hanya ~75ms pertama (15% tempoh animasi). Muka hadapan bertukar ke muka belakang hampir serta-merta, manakala helaian mengambil baki 445ms melayang perlahan ke bawah. Pengguna merasakan gambar bertukar terlalu pantas dan tidak selari dengan selakan.
  2. *Ketaksimetrian Gerakan Mod 1 Halaman*: Pada selakan NEXT, helaian mengupas muka surat semasa ke kiri; tetapi pada PREV, helaian muka surat sebelum terbang masuk dari luar skrin manakala imej tapak bertukar secara tidak seragam.
  3. *Pertindihan Tag `<img>` Pendua di Lapisan Tapak*: Tag `<img>` pre-mount sekunder yang diletakkan di dalam kontena tapak menyebabkan gangguan ketelusan, ghosting dan double-decode sewaktu selakan.
  4. *Z-Fighting Permukaan Coplanar*: Permukaan muka hadapan (`rotateY: 0deg`) dan muka belakang (`rotateY: 180deg`) berkongsi kedalaman $Z=0$, menyebabkan pelayar kadangkala menembus atau memotong imej belakang sebelum sudut 90°.
- **Penyelesaian Dilaksanakan**:
  1. `components/pamphlet/viewer/flipbook-view.tsx`:
     - **Penyelarasan Lengkungan Easing Simetri `[0.45, 0.05, 0.55, 0.95]`**: Menyelaraskan lengkungan putaran 3D, bayangan jatuh (`filter: times [0, 0.5, 1]`), dan pergerakan anjakan kontena (`targetShiftX`) kepada lengkungan simetri. Titik serenjang 90° dicapai tepat pada 50% masa selakan (260ms), menghasilkan keseimbangan sempurna antara paparan muka hadapan dan muka belakang.
     - **Pemisahan Kedalaman Mikro `translateZ(1px)`**: Menambah `translateZ(1px)` pada permukaan muka hadapan dan muka belakang untuk menghapuskan fenomena Z-fighting dan memastikan imej belakang hanya muncul tepat apabila melepasi sudut 90°.
     - **Penyelarasan Menyeluruh Mod 1 Halaman (Symmetrical Pure Peel)**:
       - Pada NEXT: Muka surat semasa dikupas ke kiri (`x: 0% -> -105%`, `rotateY: -25deg`, `transformOrigin: 'right center'`), menyingkap `nextPage` di tapak.
       - Pada PREV: Muka surat semasa dikupas ke kanan (`x: 0% -> 105%`, `rotateY: 25deg`, `transformOrigin: 'left center'`), menyingkap `prevPage` di tapak.
       - Imej destinasi diletakkan di lapisan tapak dari detik awal $t=0$, menjadikan penyingkapan imej 100% selari dengan helaian yang dikupas.
     - **Prapemuatan Imej di Latar Belakang (Non-DOM Cache Warming)**: Menggunakan `new Image().src = url` dalam `useEffect` untuk memuat turun imej bersebelahan (`currentPage ± 1, 2`) terus ke dalam cache memori pelayar tanpa sebarang tag `<img>` pendua di dalam DOM.
     - **Pembersihan Tag `<img>` Bertindih**: Membuang kesemua tag `<img>` bertindih sekunder dari Halaman Tapak Kiri, Kanan, dan Helaian Tunggal.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 330 / 330 ujian unit lulus (37 test suites).

## System Improvements (2026-10-05 — Penyelarasan Mutlak Transisi Imej 2 Halaman / Two-Page Spread Image Transition Perfection)
- **Konteks & Laporan Pengguna**: "utk 1 page dh okay, utk 2 pages ni macam tak okay sikit, bila 3d flip gambar tak berapa nk sync"
- **Analisis Punca Masalah 2-Page Spread**:
  1. *Runtuhan Konteks 3D Akibat Penapis CSS (`filter` flattening bug)*: Penggunaan `filter: drop-shadow(...)` pada kontena `<motion.div>` yang mempunyai `transformStyle: 'preserve-3d'` melanggar spesifikasi W3C Transforms. Penapis memampatkan ruang 3D menjadi satah bitmap 2D rata, mematikan fungsi `backface-visibility: hidden` dan memecahkan susunan kedalaman Z.
  2. *Lengkungan Easing Terlalu Curam*: Lengkungan terdahulu `[0.45, 0.05, 0.55, 0.95]` memiliki kecerunan 9.0 di tengah putaran, melompat dari 9° ke 171° dalam hanya 50ms (seperti sentapan tajam), menyebabkan mata manusia tidak dapat mengikuti transisi muka hadapan ke belakang.
  3. *Had Prapemuatan Imej Tidak Sepadan*: Prapemuatan asal hanya meliputi `currentPage ± 2`. Dalam mod 2 halaman di mana setiap selakan melangkau 2 muka surat, muka surat kedua bagi spread sasaran (`currentPage + 3`) tidak diprapemuat, mencetuskan kelipan muat turun rangkaian semasa selakan.
  4. *Fallback Nullish Tersilap*: `targetSpreadRef.current?.leftPage ?? activeSpread.leftPage` menggunakan operator `??` yang tersilap fallback kepada halaman lama apabila `leftPage` bernilai `null` (semasa menutup buku ke Cover), menyebabkan halaman lama masih terpapar di atas meja sewaktu helaian diangkat.
  5. *Pembalikan Geometri Muka Belakang*: Muka belakang yang diputarkan 180° tersilap menggunakan bucu lengkung dan sempadan di sisi tulang buku, serta bayangan lipatan tulang di sisi luar.
  6. *Lonjakan Bayang Statik*: `shadow-[-16px...]` kekal pada intensiti penuh dan terpadam mengejut apabila helaian mendarat rata pada 180° / 0°.
- **Penyelesaian Dilaksanakan**:
  1. `components/pamphlet/viewer/flipbook-view.tsx`:
     - **Pengekalan Konteks 3D Tulen (*Pure preserve-3d*)**: Membuang sebarang `filter` dari `<motion.div>` berputar. Konteks 3D kekal 100% tulen tanpa runtuhan satah.
     - **Prapemuatan Menyeluruh (*Deep Spread Preload*)**: Prapemuat kesemua halaman bagi risalah $\le 16$ halaman atau 5 halaman ke hadapan/ke belakang bagi risalah besar terus ke dalam cache memori pelayar.
     - **Lengkungan Fizik Klasik `[0.42, 0, 0.58, 1]` & Tempoh 540ms**: Menggantikan lengkungan sentap dengan keluk *ease-in-out* fizikal yang licin dan seimbang. Menyelaras peralihan CSS anjakan kontena (`transform 540ms cubic-bezier(0.42, 0, 0.58, 1)`) agar kedua-duanya bergerak seirama.
     - **Penyelarasan Geometri Sempadan & Bucu Lengkung Muka Belakang**:
       - Selakan NEXT: Muka belakang menggunakan `rounded-l-2xl border-l` dan bayangan tulang di `right-0 bg-gradient-to-l`.
       - Selakan PREV: Muka belakang menggunakan `rounded-r-2xl border-r` dan bayangan tulang di `left-0 bg-gradient-to-r`.
     - **Bayang Jatuh Dinamik Melarut ke 0 (*Dynamic Box-Shadow Dissolve*)**: Menggunakan animasi `boxShadow` pada Framer Motion yang membesar dari 0px ke 28px semasa helaian terangkat, dan melarut licin kembali ke 0px tepat semasa helaian mendarat rata pada 180° / 0°. Sifar lonjakan bayang terpadam.
     - **Perlindungan Halaman Tapak Kulit Buku (`isLeftBaseHidden` & `isRightBaseHidden`)**: Menghalang paparan helaian pendua atau kelipan siluet semasa menutup buku ke Cover atau Back Cover.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript (`tsc --noEmit`).
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 330 / 330 ujian unit lulus (37 test suites).

## System Improvements (2026-10-05 — Pembaikan Ralat Kunci Pendua Preset Dwi-Tandatangan E-Sijil / Dual Signature Duplicate Key Fix)
- **Konteks & Laporan Pengguna**: "dual signature preset ni problem dekat e cert builder" dengan ralat berulang di konsol:
  `Encountered two children with the same key, el-1791171837395. Keys should be unique so that components maintain their identity across updates.`
- **Punca Masalah**:
  1. *Penjanaan ID Berasaskan Milisaat Mentah (`Date.now()`)*: `features/certificates/hooks/use-element-actions.ts` menjana ID elemen menggunakan rentetan `el-${Date.now()}`. Dalam gelung segerak pantas, `handleAddDualSignatures` memanggil `addElement` 4 kali dalam milisaat yang sama, menyebabkan kesemua 4 elemen (2 garisan + 2 teks jawatan) berkongsi kunci `id` yang serupa (`el-1791171837395`). Ini merosakkan penjejakan kunci komponen React, rekonsiliasi DOM, pemilihan elemen, dan penyeretan (*drag*).
  2. *Transaksi Undo/History Pecah*: Memanggil `addElement` 4 kali berturut-turut menghasilkan 4 kemas kini `setTemplate` dan 4 komit sejarah `commitToHistory` berasingan, memaksa pengguna menekan `Ctrl+Z` sebanyak 4 kali untuk membatalkan satu preset.
  3. *Limpahan Sempadan Potret*: Koordinat x statik (`x: 853`) melimpah keluar daripada sempadan kanvas mod potret (lebar 794px).
  4. *Templat Legasi Rosak*: Templat yang disimpan sebelum ini mempunyai elemen dengan ID pendua tersimpan dalam pangkalan data.
- **Penyelesaian Dilaksanakan**:
  1. `features/certificates/hooks/use-element-actions.ts`:
     - **Penjana ID Bebas Kolisi (`generateElementId`)**: Menggabungkan awalan, timestamp, counter sesi atomik tempatan modulo 1,000,000, dan rentetan rawak Base-36 (`${prefix}-${Date.now()}-${elementCounter}-${rand}`) yang menjamin sifar perlanggaran walaupun ribuan elemen dicipta serentak.
     - **Penambahan Kelompok Atomik (`addElements`)**: Membolehkan berbilang elemen dimasukkan ke kanvas secara atomik dalam satu panggilan `setTemplate` dan satu rekod `commitToHistory` (1 undo step).
     - **Penyelarasan `duplicateElement`**: Mengemas kini duplikasi elemen kanvas menggunakan `generateElementId`.
  2. `components/certificates/builder/sidebar.tsx`:
     - Menghubungkan `addElements` dan mengemas kini `handleAddDualSignatures` dan `handleAddClassicBorder` untuk kemas kini atomik.
     - **Geometri Adaptif Orientasi**: Mengira kedudukan penandatangan secara nisbah perkadaran (`w * 0.28` dan `w * 0.72` untuk potret; `w * 0.25` dan `w * 0.75` untuk landskap) dengan garisan pada `h - 180px` dan teks pada `lineY + 25px`.
     - **Piawaian Bahasa Inggeris**: Menyelaraskan teks jawatan lalai (`CHAIRMAN / ADVISOR`, `DIRECTOR / PRINCIPAL`) dan toast (`Dual signatures added!`).
  3. `app/(dashboard)/certificates/builder/[id]/client.tsx`:
     - **Sanitasi Kunci Legasi (`sanitizedInitialTemplate`)**: Mengesan dan memperbetulkan ID pendua daripada templat pangkalan data legasi secara automatik semasa mount.
     - Memajukan `addElements` kepada `<CertificateEditorSidebar>`.
  4. `tests/certificate-element-actions.test.ts`:
     - Menambah 5 ujian unit: penjanaan ID unik, sifar perlanggaran merentas 10,000 panggilan serentak, penambahan elemen tunggal, penambahan atomik kelompok `addElements` (1 commit), dan duplikasi ID unik.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 335 / 335 ujian unit lulus (100%) merentas kesemua 38 suite ujian.

## System Improvements (2026-10-05 — Penghapusan Amaran Konsol Pelayar: Format Warna CSS Tidak Sah / HTML5 Color Input Sanitization)
- **Konteks & Laporan Pengguna**: Muncul amaran berulang puluhan kali di konsol pelayar DevTools:
  `The specified value "transparent" does not conform to the required format. The value must be a valid CSS color.`
- **Punca Masalah**:
  1. *Spesifikasi W3C HTML5 `<input type="color">`*: Elemen pemilih warna natif pelayar hanya menerima rentetan heksadesimal 7-aksara berhuruf kecil `#rrggbb` (cth: `#ffffff`).
  2. *Preset Bingkai Sijil Bernilai `'transparent'`*: Preset bingkai sijil (seperti Classic Gold Border) menetapkan `fill: 'transparent'` dengan garisan luar emas. Apabila elemen bentuk ini dipilih atau dirender semula dalam `components/certificates/builder/properties.tsx`, ungkapan `value={selectedElement.fill || '#e5e7eb'}` menilai kepada `'transparent'` kerana `'transparent'` adalah rentetan truthy.
  3. *Re-render Berulang Semasa Interaksi Tetikus*: Pada setiap interaksi tetikus (hover, drag, resize, atau render semula React), pelayar menolak nilai `"transparent"` dan mencetak amaran ke konsol pelayar puluhan kali (cth: 38 kali berturut-turut).
- **Penyelesaian Dilaksanakan**:
  1. `lib/utils/index.ts`:
     - **Utiliti Sanitasi Warna Sejagat (`toValidHexColor`)**: Menapis sebarang nilai bukan hex (seperti `'transparent'`, `'none'`, `'inherit'`, `'initial'`, `""`, `null`) dan mengembalikan fallback yang sah (`#000000` atau `#ffffff`). Menyokong penukaran 3-digit hex kepada 6-digit (`#fff` -> `#ffffff`), pemotongan alpha 8-digit (`#ffffff80` -> `#ffffff`), dan format hex tanpa simbol pagar (`ffffff` -> `#ffffff`).
  2. `components/certificates/builder/properties.tsx`:
     - Menapis kesemua pemilih `<input type="color">` (`stroke`, `color`, `textStroke`, `fill`) menggunakan `toValidHexColor`.
     - **Kawalan Isian Lutsinar ("No Fill")**: Menambah kotak semak khusus `No Fill` untuk bentuk geometri (`rectangle` dan `circle`) yang menguruskan `fill: 'transparent'` secara kemas tanpa membebankan input pemilih warna.
     - **Kawalan Sempadan Bentuk Lengkap**: Menambah pemilih warna sempadan (`stroke`) dan pelaras ketebalan sempadan (`strokeWidth` 0-20px) bagi membolehkan pengguna menyunting bingkai sijil (seperti Classic Gold Border) secara terus di sidebar.
  3. `components/certificates/builder/sidebar.tsx`, `app/builder/[id]/client.tsx`, dan `components/forms/qr-customizer/index.tsx`:
     - Menyelaraskan kesemua pemilih `<input type="color">` merentas keseluruhan aplikasi dengan `toValidHexColor`.
  4. `tests/valid-hex-color.test.ts`:
     - Menambah 7 ujian unit yang mengesahkan sanitasi warna: penolakan 'transparent' dan kata kunci CSS, pengendalian nilai null/kosong, penolakan format bukan-hex/rgb, pengekalan 6-digit hex huruf kecil, pembesaran 3-digit hex, pemotongan alpha 8-digit, dan penukaran bare hex tanpa pagar.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 342 / 342 ujian unit lulus (100%) merentas kesemua 39 suite ujian.

## System Improvements (2026-10-05 — Penghapusan Ralat Hidrasi Radix Dialog: New Certificate Dialog Hydration Mismatch Fix)
- **Konteks & Laporan Pengguna**: Muncul ralat hidrasi React pada `/certificates/builder`:
  `Uncaught Error: Hydration failed because the server rendered HTML didn't match the client.`
  dengan perbezaan pokok DOM pada:
  `<CertificateBuilderPage>` -> `<NewCertificateDialog>` -> `<DialogTrigger asChild>` -> `<button aria-controls="radix-_R_...">`
- **Punca Masalah**:
  1. *Perbezaan ID `useId()` Antara SSR dan Hidrasi Klien*: `CertificateBuilderPage` merupakan Server Component tak segerak (async Server Component). Komponen klien `<NewCertificateDialog>` membalut elemen `<Button>` menggunakan `<DialogTrigger asChild>`.
  2. Komponen Radix UI `@radix-ui/react-dialog` menjana ID unik secara dinamik menggunakan hook `useId()` untuk atribut aksesibiliti `aria-controls`. Dalam Next.js App Router dengan penstriman RSC, penjanaan ID di persekitaran pelayan berbeza daripada hidrasi klien (`radix-_R_155esnebneitmlb_`), menyebabkan React 19 membuang pokok DOM pelayan dan membina semula di klien.
  3. Prop `suppressHydrationWarning` pada tahap trigger tidak menyekat ralat kerana percanggahan berlaku pada struktur klon elemen `SlotClone`.
- **Penyelesaian Dilaksanakan**:
  1. `components/certificates/new-certificate-dialog.tsx`:
     - **Pengawal Hidrasi Pintar (`mounted` Guard)**: Menambah state `mounted` dengan `useEffect`.
     - Sebelum komponen dipasang (`!mounted`), kembalikan `<>{children}</>` secara langsung. HTML pelayan dan pokok DOM hidrasi klien kini sepadan 100% tanpa sebarang atribut sintetik Radix `aria-controls`.
     - Sejurus selepas hidrasi selesai, `useEffect` memicu `setMounted(true)`, mengaktifkan modal `<Dialog>` dan `<DialogTrigger asChild>` di sisi klien secara lancar tanpa sebarang kelipan atau lonjakan DOM.
  2. `components/pricing-modal.tsx`:
     - Melaksanakan corak `mounted` guard yang sama pada `<PricingModal>` untuk menghapuskan potensi ralat hidrasi serupa apabila had sijil tercapai (`allowed === false`).
  3. `components/certificates/delete-certificate-button.tsx`:
     - Menambah `mounted` guard pada butang padam templat sijil (`<AlertDialogTrigger asChild>`) bagi memastikan kad templat dalam grid sentiasa hidrasi dengan bersih.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 342 / 342 ujian unit lulus (100%) merentas kesemua 39 suite ujian.

## System Improvements (2026-10-05 — Pembaikan Skrin Kosong Touch Slider & Penambahan Ciri Auto-Slider)
- **Konteks & Laporan Pengguna**:
  1. "sy perasan bila di touch slider, bila slide ke kanan nampak gambar, tapi bila slide ke kiri jadi blank"
  2. "pastu utk touch slider ni nak ada butang utk auto slider"
- **Punca Masalah Skrin Kosong (Blank Screen Lock)**:
  1. *Pertembungan `drag="x"` dengan `mode="wait"` Framer Motion*: Pada `<AnimatePresence mode="wait">`, elemen lama mesti menyelesaikan animasi keluar (`exit`) sebelum elemen baharu dipasang ke dalam pokok DOM. Apabila pengguna menyeret slaid secara sentuhan (`drag="x"`), gerakan seretan menimpa dan membatalkan transformasi `x` animasi keluar. Ini menyebabkan enjin Framer Motion terlepas (*drop*) panggilan balik `onExitComplete`. Akibatnya, `<AnimatePresence>` kekal terperangkap dalam mod menunggu dan tidak memasang slaid baharu, menyebabkan paparan terkunci sebagai skrin putih/kosong secara kekal.
  2. *State Arah Transisi Tak Segerak*: Menggunakan `useEffect` untuk mengira arah gerakan (`direction`) menyebabkan frame render pertama sentiasa menggunakan nilai lapuk atau `0`, menyebabkan animasi keluar dan masuk berlanggar ke arah yang sama.
  3. *Ketiadaan Prapemuatan Imej*: Helaian baharu perlu dimuat turun melalui rangkaian sebaik sahaja bertukar halaman, menyebabkan jeda kotak putih kosong seketika semasa imej sedang dimuatkan.
- **Penyelesaian Dilaksanakan**:
  1. `components/pamphlet/viewer/slider-view.tsx`:
     - **Peralihan Serentak `mode="popLayout"`**: Menggantikan `mode="wait"` dengan `mode="popLayout"` pada `<AnimatePresence>`. Slaid baharu dipasang serta-merta ke dalam DOM sementara slaid lama keluar secara bertindih (`absolute inset-0`), menghapuskan sepenuhnya risiko skrin terkunci kosong.
     - **Pengiraan Arah Segerak Semasa Render**: Mengira arah peralihan secara segerak `[[page, direction], setPageAndDirection]` semasa render untuk memastikan varian pergerakan arah kiri/kanan (`100%` vs `-100%`) tepat pada kitaran pertama.
     - **Prapemuatan Imej Menyeluruh (`new Image().src`)**: Kesemua imej slaid diprapemuat ke dalam cache pelayar semasa mount.
     - **Butang Togol Auto-Slider Terapung**: Menyediakan butang pil terapung atas pentas dengan status *Play / Pause* dan penunjuk denyutan hijau emerald (*emerald pulse indicator*) apabila sedang beroperasi.
     - **Sokongan Pusingan Penuh (Wrap-Around Loop)**: Seretan melepasi halaman terakhir akan membungkus semula ke halaman 1, dan sebaliknya.
  2. `components/pamphlet/viewer/toolbar.tsx`:
     - Menambah prop `isAutoSliding` dan `onToggleAutoSlide` pada `ToolbarProps`.
     - Menambah butang togol Auto-Slider pada bar navigasi bawah (*floating bottom navigator*) khusus apabila `displayMode === 'slide'`.
  3. `components/pamphlet/viewer/index.tsx`:
     - Menambah pengurusan state `isAutoSliding`.
     - Membina pemasa tayangan automatik `setInterval` (3.5 saat) dengan gelung pusingan automatik (`prev >= totalPages ? 1 : prev + 1`) dan sokongan efek bunyi selakan.
     - Mematikan tayangan automatik sekiranya pengguna beralih keluar daripada mod `slide`.
     - Menyalurkan prop `isAutoSliding`, `onToggleAutoSlide`, dan `onPageChange` kepada `PamphletToolbar` dan `SliderView`.
  4. `tests/pamphlet.test.ts`:
     - Menambah suite ujian unit baharu mengesahkan pengiraan arah transisi, gelung pusingan auto-slider, dan had indeks slaid.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
## Production Deployment (2026-10-05 — Touch Slider Blank Screen Fix & Auto Slider Feature)
- **Tarikh**: 2026-10-05
- **Commit Git**: `0cff2e7` (`feat: fix touch slider blank screen on swipe and add auto slider feature`)
- **Penyegerakan GitHub**: Berjaya ditolak ke `origin/master` (`4a0808d..0cff2e7`).
- **Kaedah**: Vercel CLI (`npx vercel --prod --yes`)
- **Status Binaan**: Selesai dalam ~2 minit, kompilasi 58 laluan (36 statik ○, 22 dinamik ƒ).
- **ID Deployment**: `dpl_ASg3D4ChsQqceGcLTs9QNWQJ1KMK`
- **URL Pengeluaran**: `https://www.klikform.com`
- **URL Deployment Vercel**: `https://klikform-626q4ihrp-sofwan-jailanis-projects.vercel.app`

## System Improvements (2026-10-05 — Pembuangan Lencana Nombor Bertindih pada Skrol Menegak Pamphlet)
- **Konteks & Laporan Pengguna**: "utk vertical scroll ni ada nombor dekat situ, kalau dekat mobile view jadi tak nampak tulisan sbb overlay dgn nombor" (beserta tangkapan skrin risalah Jabatan Meteorologi Malaysia dengan bulatan merah di lencana `1/6` yang menindih logo MET Malaysia di bucu atas kanan).
- **Punca Masalah**:
  - `components/pamphlet/viewer/vertical-view.tsx` meletakkan watermark `absolute top-3 right-3 bg-black/50 text-[11px]` di dalam setiap kad muka surat.
  - Lencana ini menutup logo, tajuk, dan teks yang lazimnya diletakkan di bahagian atas dokumen, terutamanya pada paparan telefon di mana skala dokumen lebih kecil.
  - Lencana ini juga lewah (*redundant*) kerana bar navigasi bawah (`PamphletToolbar`) telah sedia memaparkan nombor halaman semasa secara langsung (`⊞ 1 / 6`) berasaskan `IntersectionObserver`.
- **Penyelesaian**:
  - Membuang lencana nombor terapung bertindih daripada `components/pamphlet/viewer/vertical-view.tsx`.
  - Menambah `select-none` dan `draggable={false}` pada elemen `<img>` untuk mengelakkan heretan imej tidak sengaja semasa menatal.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
## Production Deployment (2026-10-05 — Vertical Scroll Number Overlay Removal)
- **Tarikh**: 2026-10-05
- **Commit Git**: `6646498` (`fix: remove overlapping page number badge in vertical pamphlet view`)
- **Penyegerakan GitHub**: Berjaya ditolak ke `origin/master` (`5fe5339..6646498`).
- **Kaedah**: Vercel CLI (`npx vercel --prod --yes`)
- **Status Binaan**: Selesai dalam ~2 minit, kompilasi 58 laluan (36 statik ○, 22 dinamik ƒ).
- **ID Deployment**: `dpl_9gvmhNqSb8HALHTixodXHj6kVWSi`
- **URL Pengeluaran**: `https://www.klikform.com`
## System Improvements (2026-10-06 — Pembaikan Pemotongan Lencana Bawah Halaman Bio Mudah Alih)
- **Konteks & Laporan Pengguna**: "nampak tak, ni default, bila scroll ke bawha baru nampak" dan "lagi tak nampak" dengan tangkapan skrin telefon pintar di `/bio/igem`.
- **Punca Masalah (Root Cause)**:
  - `justify-between` di dalam bekas berketinggian penuh `min-h-screen` adalah anti-corak untuk paparan Link-in-Bio mudah alih. Ia menolak footer penjenamaan ke paras paling bawah bekas 100vh yang melangkaui ruang pandang sebenar pelayar mudah alih (yang mempunyai bar URL dan bar navigasi aktif).
  - Mengubah padding bawah tidak menyelesaikan isu kerana footer tetap dipaksa ke sempadan luar viewport.
- **Penyelesaian Muktamad (Corak Linktree/Beacons)**:
  - Membuang `justify-between` daripada `<main className="min-h-screen ... flex flex-col items-center ...">` di `app/(public)/bio/[username]/client.tsx` dan mockup telefon di `app/(dashboard)/bio-builder/[id]/client.tsx`.
  - Meletakkan footer penjenamaan KlikForm secara semulajadi di bawah senarai pautan menggunakan margin `mt-8 mb-4` (`shrink-0`).
  - Halaman profil ringkas (seperti `/bio/igem` yang mempunyai 3 pautan) kini mengambil ketinggian padat ~500px dan muat 100% pada skrin telefon pintar (~670px-850px) secara lalai (*default*) tanpa sebarang pemotongan dan tanpa memerlukan tatalan (*zero scroll*).
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 345 / 345 ujian lulus merentas 39 suite ujian.

## System Improvements (2026-10-06 — Penghapusan Tatalan Phantom Mudah Alih & Pembuangan Butang Kongsi Bio)
- **Laporan Pengguna**: "kenapa boleh scroll ya sedangkan ada byk ruang kosong dekat bawah, pastu button share dekat atas belah kanan tu buang, pastu bila update ke vercel jadi update dua kali sepatutnya skali je".
- **Punca Tatalan Pada Ruang Kosong**:
  - `min-h-screen` (`min-height: 100vh`) dalam CSS Tailwind v4 mengatasi `min-h-[100dvh]` kerana urutan generasi kaskad CSS.
  - Pada telefon pintar (Chrome/Safari), unit `100vh` mengabaikan palang alamat URL (~56px), memaksa bekas menjadi lebih tinggi daripada skrin sebenar. Ini membolehkan pengguna menatal ke bawah walaupun ruang bawah kosong.
- **Penyelesaian**:
  - Membuang `min-h-screen` sepenuhnya dan menggunakan `min-h-[100dvh]` secara mutlak pada `<main>` di `app/(public)/bio/[username]/client.tsx`. Halaman profil ringkas kini terkunci kemas mengikut ketinggian skrin aktif tanpa sebarang lebihan tatalan (*zero phantom scroll*).
  - Membuang butang kongsi terapung (`<Share2 />`) dan modal dialog QR perkongsian dari antaramuka bio awam bagi membersihkan pandangan visual.
  - Menyelaraskan deployment Vercel kepada satu trigger tunggal melalui GitHub push (`git push origin master`) tanpa mencetuskan binaan CLI bertindih.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 345 / 345 ujian lulus merentas 39 suite ujian.

## System Improvements (2026-10-06 — Penetapan Lencana Penjenamaan Sentiasa di Bawah)
- **Permintaan Pengguna**: "sy nak ni sentiasa di bawah" (dengan tangkapan skrin menunjukkan lencana berlabuh di bawah pautan tetapi pengguna mahu ia sentiasa di bahagian paling bawah skrin).
- **Penyelesaian**:
  - Menetapkan semula `justify-between` pada `<main className="min-h-[100dvh] flex flex-col justify-between items-center px-4 pt-6 pb-6 ...">`.
  - Kerana `min-h-screen` (`100vh`) telah disingkirkan dan digantikan dengan `min-h-[100dvh]` secara mutlak, bekas tidak lagi melimpah melepasi skrin telefon aktif. Lencana penjenamaan *"Create your own with KlikForm"* kini sentiasa berlabuh kemas di bahagian paling bawah skrin (*permanently pinned to bottom*), kelihatan penuh 100% tanpa sebarang pemotongan dan tanpa tatalan phantom.
  - Mockup telefon pembina di `app/(dashboard)/bio-builder/[id]/client.tsx` turut diselaraskan dengan `justify-between`.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 345 / 345 ujian lulus merentas 39 suite ujian.

## System Improvements (2026-10-07 — Penambahan Butang Reset Rekod Kehadiran / Clear Attendance Records)
- **Konteks & Laporan Pengguna**: "sy dh kosongkan google sheet, tapi bila nk daftar balik keluar macam ni, kenapa ya" (dengan tangkapan skrin memaparkan kad "Your Attendance Has Been Fully Recorded" 16 minit pada borang pendaftaran). Pengguna mengosongkan baris di Google Sheet tetapi apabila mengimbas semula, sistem tetap menganggap peserta telah selesai hadir dan menyekat pendaftaran baharu.
- **Punca Masalah (Root Cause)**:
  - Ciri Smart Attendance (1-QR Check-In & Check-Out) KlikForm menguruskan logik kehadiran secara atomik di dalam jadual database Supabase `attendance_records` (dan salinan durasi di `form_responses`) serta cache peranti `localStorage` (`klikform_att_id_${form.id}`).
  - Google Sheet bertindak sebagai salinan eksport spreadsheet luar penganjur sahaja. Apabila baris Sheet dikosongkan secara manual, rekod di dalam jadual Supabase `attendance_records` masih kekal dengan status `'completed'`.
  - Apabila borang dibuka di telefon, semakan pantas status (`checkAttendanceStatusAction`) mendapati status `completed`, lalu secara automatik memaparkan kad penamatan kehadiran bagi menghalang penipuan / kemasukan bertindih.
- **Penyelesaian Dilaksanakan**:
  - **Lapisan Storan (`lib/storage/attendance.ts`)**:
    - Dicipta fungsi `getAttendanceStatsForForm(formId, userId)` untuk mengira jumlah rekod semasa, bilangan checked-in, dan completed.
    - Dicipta fungsi `clearAttendanceRecordsForForm(formId, userId)` untuk memadamkan kesemua rekod kehadiran (`attendance_records`) dan entri ujian tempatan (`form_responses`) bagi borang tersebut dengan semakan pemilikan yang ketat.
  - **Tindakan Pelayan (`actions/attendance.ts`)**:
    - `getAttendanceStatsAction(formId)`: Mengembalikan statistik rekod kepada pemilik borang yang disahkan (`createClient()` + `getUser()`).
    - `clearAttendanceRecordsAction(formId)`: Melaksanakan pemadaman rekod kehadiran dengan semakan pemilikan borang, serta menyegarkan laluan cache (`revalidatePath`).
  - **Antaramuka Form Builder (`app/builder/[id]/client.tsx`)**:
    - Ditambah panel "Database Attendance Records" di dalam kad tetapan Smart Attendance (Check-In & Check-Out).
    - Memaparkan lencana status masa-nyata bilangan rekod (cth. `3 records (1 in, 2 completed)`).
    - Butang "Reset Records" dengan `AlertDialog` pengesahan amaran agar penganjur tidak memadam rekod sebenar secara tidak sengaja.
  - **Antaramuka Responses Dashboard (`app/(dashboard)/responses/client.tsx`)**:
    - Bagi mana-mana borang yang mengaktifkan Smart Attendance, disediakan butang pantas "Reset Attendance" di sebelah butang Google Sheet dan Analytics.
    - Dilengkapi modal pengesahan `AlertDialog` dengan pengesahan nama borang untuk keselamatan operasi.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 353 / 353 ujian lulus merentas 39 suite ujian (+8 ujian baharu).

## Production Deployment (2026-10-07 — Reset Attendance Records Feature)
- **Tarikh**: 2026-10-07
- **Commit Git**: `c8354e0` (`feat: add reset attendance records button in form builder and responses dashboard`)
- **Penyegerakan GitHub**: Berjaya ditolak ke `origin/master`.
- **Status Binaan**: Selesai dalam ~2 minit, kompilasi 58 laluan (36 statik ○, 22 dinamik ƒ).
- **ID Deployment**: `dpl_B6Evdv2Z5HTSjkJ6i8hNK9LPZxT3`
- **URL Pengeluaran**: `https://www.klikform.com`
- **URL Deployment Vercel**: `https://klikform-1kt6xyyb1-sofwan-jailanis-projects.vercel.app`

## System Improvements (2026-10-08 — Mobile View Modal Dialog Margin & Width Fix)
- **Konteks & Laporan Pengguna**: "di mobile view kenapa pop up ni rapat sgt kiri dan kanan, betulkan dulu tanpa update ke vercel" (dengan tangkapan skrin telefon memaparkan pop-up amaran Check-Out Awal "Warning: Minimum Attendance Hours Not Met!" yang melekat ke birai kiri dan kanan skrin peranti tanpa sebarang margin).
- **Punca Masalah (Root Cause)**:
  - Komponen asas shadcn `AlertDialogContent` (`components/ui/alert-dialog.tsx`) dan `DialogContent` (`components/ui/dialog.tsx`) menggunakan kelas asas `w-full max-w-[calc(100%-2rem)]`.
  - Apabila digunakan dalam `app/(public)/form/[id]/client.tsx`, ia disalurkan `className="max-w-md bg-white rounded-2xl p-6 border shadow-xl"`.
  - Enjin utiliti Tailwind merge (`twMerge` dalam fungsi `cn()`) mengesan bahawa `max-w-[calc(100%-2rem)]` dan `max-w-md` tergolong dalam kumpulan sifat CSS yang sama (`max-width`) tanpa awalan breakpoint, lalu menggantikan `max-w-[calc(100%-2rem)]` dengan `max-w-md` (448px).
  - Pada telefon pintar (kelebaran skrin ~360px - 412px, yang lebih kecil daripada 448px), `max-w-md` tidak mengehadkan kelebaran. Akibatnya, kelas `w-full` (`width: 100%`) meregangkan kotak pop-up ke 100% kelebaran skrin peranti, menyebabkan bucu kad melekat rapat ke birai telefon dengan 0 margin.
- **Penyelesaian Dilaksanakan (Defense-in-Depth)**:
  1. **Kukuhkan Komponen Asas UI (`components/ui/alert-dialog.tsx` & `components/ui/dialog.tsx`)**:
     - Ditukar kelas asas daripada `w-full max-w-[calc(100%-2rem)]` kepada `w-[calc(100%-2rem)] sm:w-full max-w-[calc(100%-2rem)]`.
     - Sifat `width: calc(100% - 2rem)` menjamin ruang rehat 16px (1rem) di sebelah kiri dan 16px di sebelah kanan pada paparan mudah alih, dan sifat `w-*` tidak akan disentuh atau dipadam oleh sebarang sifat `max-w-*` yang disalurkan pengguna. Pada paparan tablet/desktop (`sm:`), ia bertukar lancar kepada `sm:w-full`.
  2. **Penyelarasan Penggunaan Modal Pengguna**:
     - `app/(public)/form/[id]/client.tsx`: Modal amaran Check-Out awal dikemas kini daripada `max-w-md p-6` kepada `sm:max-w-md p-5 sm:p-6`.
     - `app/builder/[id]/client.tsx`: Modal pengesahan reset rekod kehadiran dikemas kini kepada `sm:max-w-md p-5 sm:p-6`, dan modal penyesuaian kod QR dikemas kini kepada `sm:max-w-4xl`.
     - `app/(dashboard)/responses/client.tsx`: Modal pengesahan reset rekod kehadiran dikemas kini kepada `sm:max-w-md p-5 sm:p-6`.
     - `app/(dashboard)/bio-builder/[id]/client.tsx`: Modal pratetap paparan mudah alih dikemas kini kepada `sm:max-w-sm`.
- **Status Deployment**:
  - Dibaiki secara tempatan mengikut arahan ketat pengguna (*"betulkan dulu tanpa update ke vercel"*).
  - Sifar tolak ke git / Vercel deployment dilakukan.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 353 / 353 ujian unit lulus merentas 39 suite ujian.







## System Improvements (2026-10-08 — Attendance Card Layout Polish & Modernization)
- **Konteks & Laporan Pengguna**: "cantikkan sikit layout ni" (dengan 2 tangkapan skrin telefon memaparkan kad Check-Out Confirmation dan kad Attendance Fully Recorded).
- **Elemen yang Dipertingkatkan**:
  1. **Pengasingan Konteks Borang (`isAttendanceCardShowing`)**:
     - Sembunyikan bar kemajuan atas (`Progress`), pemasa undur (`Closes in`), dan lencana terapung bawah kanan (`X / Y Answered`) semasa mod kad kehadiran aktif. Ini menghapuskan gangguan widget terapung borang yang mengelirukan responden sewaktu mereka sudah pun selesai mendaftar.
  2. **Reka Bentuk Baharu Kad Check-Out (`status === 'checked_in'`)**:
     - Kontena kad moden: `rounded-3xl border-emerald-200/80 shadow-xl shadow-emerald-950/5` dengan bar aksen gradien zamrud lembut (`from-emerald-500 via-teal-500 to-emerald-600`).
     - Pengepala status: lencana kehadiran langsung (*live pulsing indicator* `Currently Present`), nama peserta diserlahkan kemas, dan pautan "Not you?" di bucu atas kanan dibuang bagi mengelakkan pertembungan lewah dengan butang tukar di bawah.
     - Tiket pas acara digital (*Event Pass*): kad maklumat Check-In Time dan ID / Identifier berkotak berkembar dengan ikon semantik `Clock` dan `UserCheck` serta teks kod mono.
     - Kotak amaran baki masa: disatukan ke dalam kad jam pasir (*Hourglass card*) lembut dengan lencana baki masa yang jelas tanpa pengulangan teks antara kotak amaran dan butang terkunci.
     - Butang tindakan: butang Check-Out bertukar ke gradien zamrud cergas dengan bayang halus dan butang tukar akaun dengan ikon `UserPlus` yang sopan di bahagian bawah.
  3. **Reka Bentuk Baharu Kad Selesai Hadir (`status === 'completed'`)**:
     - Pengepala anugerah: ikon cek bulat bertingkat 3D (`from-blue-600 to-indigo-600` dengan denyutan *ping glow* lembut).
     - Tiket resit digital: kad maklumat dua lajur berkotak putih berkembar untuk masa masuk dan masa keluar, pemisah bertitik (*dashed divider*), dan lencana durasi penuh warna zamrud berkontras tinggi.
     - Tindakan tuntutan: butang gelap premium dengan ikon `Award` keemasan untuk menyemak dan menuntut e-Sijil.
- **Status Deployment**:
  - Dibaiki secara tempatan mengikut arahan terdahulu (*"betulkan dulu tanpa update ke vercel"*). Sifar push atau deployment ke Vercel.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 353 / 353 ujian unit lulus merentas 39 suite ujian.


## System Improvements (2026-10-08 — Presenter Screen Legacy Tablet Compatibility & HEX Fallback)
- **Konteks & Laporan Pengguna**: "maksud sy design qr tu, kalau dekat phone sy lain, tapi di tablet atau phone lama lain" dengan 2 foto perbandingan (Phone moden berlatar gelap kemas dengan tajuk putih vs Tablet lama berlatar putih dengan tajuk ghaib).
- **Punca Sebenar**:
  1. Tailwind CSS v4 menjana warna lalai (`slate-950`, `slate-900`) menggunakan format `oklch(...)`.
  2. Pelayar Chrome pada tablet lama (sebelum v111) tidak menyokong `oklch()` dan menolak sintaks CSS tersebut.
  3. Ini menyebabkan latar belakang `<main>` jatuh balik ke warna putih (`#ffffff` dari `:root --background`).
  4. Tajuk acara yang disetkan sebagai `text-white` bertukar menjadi teks putih di atas latar putih (ghaib sepenuhnya).
  5. Kad QR putih kehilangan kontras, dan bar kemajuan hijau hilang gradiennya.
  6. Dalam mod landskap tablet, `overflow-hidden` memotong bahagian footer bawah.
- **Tindakan Pembaikan (`app/(public)/present/[id]/client.tsx`)**:
  - Menambah sandaran warna HEX standard ke tahap teguh: `style={{ backgroundColor: '#020617', color: '#ffffff' }}` dan kelas `bg-[#020617]`.
  - Memastikan tajuk acara dipaksa dengan `style={{ color: '#ffffff' }}` supaya tajuk sentiasa jelas timbul walaupun pada peranti tertua.
  - Menambah sandaran HEX untuk trek bar kemajuan (`#1e293b`), isian bar kemajuan (`#10b981`), kad QR border (`#1e293b`), dan jam digital (`#0f172a`).
  - Menukar pengurusan limpahan dari `overflow-hidden` tegar kepada `overflow-y-auto lg:overflow-hidden` bersama pelarasan padding supaya pada tablet landskap berketinggian rendah, tiada komponen yang terpotong.
- **Pengesahan**:
  - `npm run typecheck`: 0 ralat.
  - `npm run lint`: 0 ralat.
  - `npm test`: 353 / 353 lulus merentas 39 fail ujian.
  - Semua perubahan kekal dalam storan tempatan (sifar commit / deploy ke Vercel).


## System Improvements (2026-10-08 — Customizable Live Rotating QR Interval)
- **Konteks & Laporan Pengguna**: "30 saat ni macam cepat sgt, boleh tak buat option utk set berapa masa yg nak" (bersama bulatan merah pada paparan pemasa undur "22s left").
- **Ciri yang Dibina**:
  1. **Kawalan Pilihan Masa di Form Builder (`app/builder/[id]/client.tsx`)**:
     - Ditambah ke dalam kad tetapan **Live Rotating QR Code (Anti-Fraud Projector Mode)**.
     - **6 Butang Pratetap Pantas**: `15s`, `30s (Std)`, `45s`, `60s (1m)`, `90s`, `120s (2m)` lengkap dengan penunjuk lencana terpilih.
     - **Input Saat Tersuai**: Kotak input nombor berpagar (`min=10`, `max=600`) bagi membolehkan penganjur menetapkan sebarang durasi yang dimahukan.
     - Penerangan jelas: Membantu penganjur memahami bahawa durasi yang lebih panjang (contohnya 60s atau 120s) memberikan masa yang lebih selesa untuk peserta beratur dan mengimbas di dewan besar.
  2. **Paparan Skrin Projektor Awam (`app/(public)/present/[id]/client.tsx`)**:
     - Teks maklumat sekuriti bawah kini memaparkan durasi sebenar secara dinamik: `This QR code updates every {intervalSec} seconds`.
  3. **Pengesahan & Ujian**:
     - Tambah ujian unit di `tests/rotating-qr.test.ts` untuk pengesahan selang masa pelbagai (`15s, 60s, 90s, 120s`).
     - `npm run typecheck`: 0 ralat.
     - `npm run lint`: 0 ralat.
     - `npm test`: 354 / 354 lulus merentas 39 fail ujian.
     - Semua perubahan kekal dalam storan tempatan (sifar push / deploy ke Vercel).


## System Improvements (2026-10-08 — Attendance Check-Out Data Recording & Sync Hardening)
- **Konteks & Laporan Pengguna**: "sy perasan ada yg tak masuk data bila check in dan out tapi cukup 6 jam".
- **Analisis Punca Masalah**:
  1. **Token Rotating QR Luput Terlalu Pantas Semasa Mengisi Check-Out**:
     - Tempoh sah token sebelum ini terlalu ketat (hanya 1 tetingkap / 30s).
     - Peserta mengimbas kod QR di pentas, telefon mengambil masa 15s untuk memuatkan web di rangkaian mudah alih, membaca kad pengesahan, dan memasukkan PIN pentas (mengambil 30–45s).
     - Apabila butang "Check-Out Now" ditekan, pelayan menolak penyerahan dengan ralat `QR code has expired`. Akibatnya, Check-Out tidak direkodkan.
  2. **RLS Cookie Failure pada `getSettingsByFormId`**:
     - `getSettingsByFormId` menggunakan `createClient()` berasaskan kuki untuk menyemak `forms.user_id`. Bagi peserta awam (tiada kuki log masuk), kegagalan carian menyebabkan `settings` menjadi `undefined`.
     - Ini menyebabkan penyelarasan Google Sheet (`updateSheetRow`) dilangkau secara senyap (*silently skipped*), meninggalkan kolum `Masa Keluar (Check-Out)` sebagai `-` walaupun peserta menekan check-out.
  3. **Ketidakpadanan Pengepala Kolum Google Sheet**:
     - Carian baris Google Sheet dalam `updateSheetRow` memerlukan padanan nama kolum yang tepat. Jika terdapat sedikit perbezaan huruf besar/kecil atau jarak (cth: `No. Kad Pengenalan `), carian gagal menemui baris sasaran.
  4. **Tolakan Waktu Rehat (*Break Time Deduction*)**:
     - Jika penganjur menetapkan tolak waktu rehat (contoh: 60 minit) dan peserta hadir genap 6 jam fizikal (360 minit), masa bersih dikira `360 - 60 = 300 minit (5 jam sahaja)`, menyebabkan syarat minimum 6 jam tidak dipenuhi untuk e-sijil.
- **Tindakan Pembaikan**:
  1. **Tetingkap Ihsan Rotating QR Ditingkatkan (`lib/forms/rotating-qr.ts`)**:
     - Tambah tetingkap ihsan kepada 2 tetingkap (`wNum < currentWindow - 2`, memberikan penimbal 60–90 saat) supaya peserta tidak lagi ditolak sewaktu menaip PIN pentas.
  2. **Pertahanan Menyeluruh `getSettingsByFormId` (`lib/storage/settings.ts`)**:
     - Tukar carian `forms` kepada `createAdminClient()`. Menjamin tetapan Google Sheets penganjur sentiasa dapat dicapai tanpa gangguan RLS.
  3. **Padanan Kolum Google Sheet Fleksibel (`lib/api/google-sheets.ts`)**:
     - Tambah penyesuaian padanan kolum tidak peka huruf/ruang (`actualCol`) dalam `updateSheetRow`.
- **Pengesahan & Ujian**:
  - `npm run typecheck`: 0 ralat.
  - `npm run lint`: 0 ralat.
  - `npm test`: 354 / 354 lulus merentas 39 suite.
  - Status: Kekal dalam persekitaran tempatan (sifar commit / deploy ke Vercel).


## System Improvements (2026-10-08 — Fix Bad setState in PresenterClient Auto-Refresh)
- **Konteks & Laporan Pengguna**: Log ralat konsol browser: `Cannot update a component (Router) while rendering a different component (PresenterClient)` berpunca dari baris 106 `fetchToken()` dipanggil di dalam `setSecondsRemaining((prev) => { fetchToken(); ... })`.
- **Punca**:
  - `setSecondsRemaining` dipanggil secara berkala oleh `setInterval`.
  - Di dalam fungsi pengemas kini keadaan (`(prev) => ...`), fungsi `fetchToken()` dipanggil secara terus.
  - `fetchToken()` mencetuskan Next.js Server Action (`getRotatingQrLiveTokenAction`) yang mengubah status `Router` semasa kitaran kemas kini keadaan komponen `PresenterClient`, melanggar peraturan asas React `setState in render`.
- **Tindakan Pembaikan (`app/(public)/present/[id]/client.tsx`)**:
  - Mengasingkan pemasa undur kepada pengemas kini keadaan tulen: `setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0))`.
  - Mengalihkan panggilan `fetchToken()` ke dalam `useEffect` berasingan yang bertindak balas secara bersih apabila `secondsRemaining === 0 && !isLoading`.
- **Pengesahan**:
  - `npm run typecheck`: 0 ralat.
  - `npm run lint`: 0 ralat.
  - `npm test`: 354 / 354 ujian lulus merentas 39 suite.
  - Status: Selesai dan bersedia untuk pengeluaran.

## Production Deployment (2026-10-08 — Modern Layout, Dialog Margins, QR Intervals & Check-Out Sync)
- **Komit Git**: `02ec23d` (`feat(attendance): modernize layout, fix dialog margins, add QR intervals, and harden checkout sync`).
- **Kaedah Pelancaran**: Tolak ke GitHub (`git push origin master`) dengan penyelarasan automatik Vercel (binaan tunggal, sifar binaan berganda CLI).
- **Status Vercel**: ● Ready (binaan siap dalam masa ~55 saat).
- **Deployment ID**: `dpl_At5DaetBiE794yo11WAr6YK7nVwN`.
- **URL Pengeluaran**: `https://www.klikform.com`
- **URL Binaan Vercel**: `https://klikform-f47gjhvod-sofwan-jailanis-projects.vercel.app`
- **Pakej Pembaharuan Termasuk**:
  1. *Mobile Modal Dialog Margins*: Perlindungan `w-[calc(100%-2rem)]` dan `sm:max-w-*` merentas `AlertDialog` dan `Dialog` untuk menghapuskan sentuhan birai pada skrin telefon.
  2. *Attendance Card Layout Modernization*: Reka bentuk kad Check-Out moden dengan denyutan langsung (*pulse live badge*), tiket pas acara (*event pass pattern*), kad baki masa minimum beranimasi jam pasir, serta tiket resit kehadiran digital 3D. Bar kemajuan dan lencana terjawab disembunyikan semasa mod kehadiran aktif.
  3. *Legacy Tablet/Android Presenter Screen Compatibility*: Sandaran warna `#020617` dan `#ffffff` eksplisit bagi mengelakkan penolakan `oklch()` Tailwind v4 pada Chrome < 111, menghapuskan masalah teks tajuk acara ghaib pada tablet lama.
  4. *Customizable Live Rotating QR Interval*: Pilihan pratetap durasi (15s, 30s, 45s, 60s, 90s, 120s) serta input masa tersuai (10s–600s) di Form Builder dan penyegerakan paparan skrin projektor.
  5. *Attendance Check-Out Sync Hardening*: Perlindungan carian tetapan Google Sheets awam dengan `createAdminClient()`, padanan fleksibel nama kolum Google Sheet, dan tetingkap ihsan 2-tingkap (60–90 saat) pada token putaran QR bagi mengelakkan kegagalan penyelarasan data check-out peserta.
  6. *PresenterClient Clean Effects*: Penghapusan amaran konsol React `setState in render` dengan pengasingan pemasa undur dan Server Action `fetchToken()`.

## System Improvements (2026-10-08 — Rotating QR Page-Load Gate & Re-entry Prevention)
- **Konteks & Laporan Pengguna**: "kenapa lepas check in, atau tekan submit another response boleh masuk balik ya form, sedangkan guna live rotating qr"
- **Punca Masalah**:
  1. *Butang "Submit another response" Reload URL Lama*: Pada skrin Thank You, butang dipaparkan secara lalai dan memanggil `window.location.reload()`, menyebabkan pelayar membuka semula URL yang mengandungi token rotating QR lama.
  2. *Ketiadaan Penguncian di Peringkat Muat Halaman (Page-Load)*: `verifyRotatingQrToken` sebelum ini hanya dipanggil semasa `submitFormAction` (POST). Halaman `GET /form/[id]` tidak memeriksa kesahihan token, membolehkan sesiapa sahaja melihat soalan borang walaupun token sudah luput atau pautan dibuka terus tanpa kod QR.
  3. *Kekeliruan Aliran Kehadiran*: Selepas Check-In, peserta seharusnya kekal dalam sesi menunggu Check-Out, bukannya menghantar respons kedua.
- **Tindakan Pembaikan**:
  1. *Server-Side Page-Load Gate (`page.tsx` & `s/[code]/page.tsx`)*: Menjalankan `verifyRotatingQrToken` sewaktu memproses permintaan halaman. Jika token tiada/luput dan Live Rotating QR aktif:
     - Jika peserta telah berstatus `checked_in`, memaparkan **Pas Kehadiran Aktif** (*Currently Present*) lengkap dengan maklumat waktu masuk dan arahan Check-Out.
     - Jika bukan, memaparkan **Skrin Kunci Anti-Fraud** (*Live QR Code Required / Expired*) yang menghalang pemaparan sebarang medan borang.
  2. *Penyembunyian Butang "Submit another response"*: Disembunyikan secara automatik pada skrin kejayaan apabila `isCheckIn`, `checkOutResult`, atau borang mengaktifkan Live Rotating QR.
  3. *Pembersihan URL*: Memadam parameter carian `_rq_w` dan `_rq_sig` dari bar alamat pelayar selepas penyerahan berjaya menggunakan `window.history.replaceState`.
- **Pengesahan**:
  - `npm run typecheck`: 0 ralat.
  - `npm run lint`: 0 ralat.
  - `npm test`: 357 / 357 ujian lulus merentas 39 suite (ditambah 3 ujian baharu).

## Production Deployment (2026-10-08 — Rotating QR Page-Load Gate & Re-entry Prevention)
- **Komit Git**: `eea4805` (`fix(attendance): enforce rotating QR page-load gate and prevent re-entry after check-in`).
- **Kaedah Pelancaran**: Tolak ke GitHub (`git push origin master`) dengan penyelarasan automatik Vercel (binaan tunggal).
- **Status Vercel**: ● Ready (binaan siap dalam masa ~2 minit).
- **Deployment ID**: `dpl_GjK13ecgmZNGUZsgBYUfTtxTmUem`.
- **URL Pengeluaran**: `https://www.klikform.com`
- **URL Binaan Vercel**: `https://klikform-499pgh06l-sofwan-jailanis-projects.vercel.app`
- **Ciri Utama Dikeluarkan**:
  1. *Server-Side Page-Load Gate*: Menyekat pemaparan soalan borang terus pada `GET /form/[id]` & `GET /s/[code]` jika token rotating QR tidak sah, luput, atau tiada.
  2. *Anti-Fraud Lock Screen*: Memaparkan skrin kunci estetik yang mengarahkan peserta mengimbas skrin dewan secara langsung.
  3. *Active Attendance Pass*: Mengenalpasti peserta yang telah mendaftar masuk dan memaparkan pas kehadiran aktif ("Currently Present") dengan arahan menunggu Check-Out.
  4. *Penyembunyian Butang*: Butang "Submit another response" disembunyikan secara automatik untuk kehadiran (Check-In & Check-Out) dan mod Live Rotating QR.
  5. *URL Query Sanitization*: Membersihkan parameter token dari bar alamat pelayar selepas penyerahan berjaya bagi menghalang muat semula token lama.


## System Improvements (2026-10-08 — Restoration of "Submit another response" Button)
- **Konteks & Laporan Pengguna**: "tick show submit another response tapi kenapa tak keluar ya" dengan tangkapan skrin Form Builder menunjukkan suis togol *Show "Submit another response" button* diaktifkan (ON).
- **Punca Masalah**:
  - Pada komit terdahulu `eea4805`, butang telah disekat secara tegar di `app/(public)/form/[id]/client.tsx` (baris 980) dengan syarat:
    `!(form.attendanceSettings?.enabled && form.attendanceSettings?.rotatingQr?.enabled) && !checkInResult?.isCheckIn && !checkOutResult`
  - Sekatan sampingan ini menimpa (*overrode*) pilihan penganjur di Form Builder, mengakibatkan butang hilang sepenuhnya walaupun penganjur mengaktifkannya.
- **Tindakan Pembaikan**:
  1. *Keutamaan Penuh Tetapan Penganjur*: Memulihkan paparan butang berasaskan `(form.allowMultipleSubmissions ?? true)`. Jika penganjur mengaktifkannya di Form Builder, butang sentiasa dipaparkan.
  2. *Tetapan Semula Bersih Dalam Memori (`handleResetForAnotherResponse`)*: Menggantikan panggilan `window.location.reload()` dengan fungsi pembersihan React state: mengosongkan `formData`, `submitted`, `checkInResult`, `checkOutResult`, `attendanceSummary`, serta membersihkan `localStorage` sesi peserta dan `sessionStorage` kunci idempotensi. Ini membolehkan pendaftaran seterusnya dibuat serta-merta tanpa muat semula halaman pelayar.
- **Pengesahan**:
  - `npm run typecheck`: 0 ralat.
  - `npm run lint`: 0 ralat.
  - `npm test`: 357 / 357 lulus merentas 39 fail ujian.

## Production Deployment (2026-10-08 — Restoration of "Submit another response" Button)
- **Komit Git**: `4086f35` (`fix(forms): restore submit another response button when toggled in builder with clean state reset`).
- **Kaedah Pelancaran**: Tolak ke GitHub (`git push origin master`) dengan penyelarasan automatik Vercel (binaan tunggal).
- **Status Vercel**: ● Ready (binaan siap dalam masa ~2 minit).
- **Deployment ID**: `dpl_Wrf8TCFH9T2K9kzDeFnBFJ9bBx2i`.
- **URL Pengeluaran**: `https://www.klikform.com`
- **URL Binaan Vercel**: `https://klikform-on6csccyy-sofwan-jailanis-projects.vercel.app`

## System Improvements (2026-10-08 — Card Top Spacing & Flush Accent Bar Fix)
- **Konteks & Laporan Pengguna**: "atas tu macam ada lopong" dengan tangkapan skrin menunjukkan jurang/lopong ruang putih yang besar di atas dan di bawah bar hijau pada kad *You Are Checked In* (Active Attendance Pass).
- **Punca Masalah**:
  - Komponen shadcn `Card` di `components/ui/card.tsx` mempunyai padding lalai `py-6` (24px) dan `gap-6` (24px).
  - Apabila `<div className="h-2 bg-gradient-to-r ...">` diletakkan di dalam `Card` tanpa `p-0 gap-0`, ia ditolak ke bawah sebanyak 24px oleh padding atas kad, menghasilkan jalur putih kosong di atas bar hijau.
  - Tambahan pula, `gap-6` (24px) bersama `CardHeader` `pt-8` (32px) mewujudkan 56px ruang kosong di antara bar hijau dan ikon jam.
- **Tindakan Pembaikan**:
  1. *Active Attendance Pass (`client.tsx`)*: Menetapkan `p-0 gap-0` pada `Card`, menjadikan bar gradien melekat 100% rapat ke birai atas kad mengikut lengkungan bucu `rounded-3xl overflow-hidden`.
  2. *CardHeader & Ikon*: Menyelaraskan padding pengepala kepada `pt-6 pb-4` dan saiz kontena ikon jam kepada `w-13 h-13` yang seimbang, menghapuskan lopong kosong.
  3. *Kad Check-Out & Kad Selesai Hadir*: Menyelaraskan penetapan `p-0 gap-0` yang sama pada kad Check-Out (`line 1287`) dan kad Selesai Hadir (`line 1476`) bagi memastikan konsistensi antaramuka.
- **Pengesahan**:
  - `npm run typecheck`: 0 ralat.
  - `npm run lint`: 0 ralat.
  - `npm test`: 357 / 357 lulus merentas 39 fail ujian.

## Production Deployment (2026-10-08 — Card Top Spacing & Flush Accent Bar Fix)
- **Komit Git**: `f8f721e` (`fix(attendance): remove top padding gap on attendance cards for flush accent bar`).
- **Kaedah Pelancaran**: Tolak ke GitHub (`git push origin master`) dengan penyelarasan automatik Vercel.
- **Status Vercel**: ● Ready.
- **Deployment ID**: `dpl_9jPSpbNvownsKvAZab4M5wkR9giM`.
- **URL Pengeluaran**: `https://www.klikform.com` & `https://klikform.com`.
- **URL Binaan Vercel**: `https://klikform-5jdedl62p-sofwan-jailanis-projects.vercel.app`.

## System Improvements (2026-10-13 — Event Poster Bio Links Style & Link Thumbnails)
- **Konteks & Kehendak Pengguna**: "style jgk buat macam ni di Bio Links" bersama rujukan imej halaman Bio Links bertaraf profesional ("Forum Iklim Kebangsaan 2026") yang memaparkan poster grafik acara penuh di bahagian atas, jubin huruf handle (@[F][I][K][2][0][2][6]), lakaran kenit bulat bagi setiap pautan, dan palet gradien biru langit berbutang kaca berkabut (frosted glassmorphism).
- **Ciri-Ciri Utama Yang Dilaksanakan**:
  1. **Mod Pengepala Poster Acara (*Event Poster Header*)**:
     - Ditambah `headerType: 'avatar' | 'poster' | 'banner'` dan `posterUrl?: string` ke dalam `BioThemeConfig` (JSONB `bio_pages.theme_config`).
     - Pengguna boleh memilih mod pengepala "Classic Avatar" atau "Event Poster" di tab Profile Bio Builder.
     - Muat naik imej poster berkualiti tinggi menggunakan `compressImage()` terus ke Supabase Storage bucket `qr_logos` dengan sokongan URL luar dan butang padam.
     - Paparan awam (`/bio/[username]`) dan pratonton telefon di Bio Builder (`MobileMockupView`) memaparkan poster dengan bucu melengkung anggun (`rounded-3xl` / `rounded-2xl`), sempadan putih separa telus, dan bayangan 3D (`shadow-2xl`).
  2. **Lencana Handle Huruf (*Letter Tiles Handle Badge*)**:
     - Ditambah pilihan `badgeStyle: 'tiles' | 'pill' | 'none'` ke dalam `BioThemeConfig`.
     - Fungsi pembantu `formatHandleTiles(username)` membahagikan handle kepada jubin huruf individu (`@[F][I][K]...`) dengan petak jubin putih berkontras tinggi (`bg-white/90 text-slate-800 font-bold`).
  3. **Lakaran Kenit Imej Pautan (*Link Thumbnails & 3-Dots Action*)**:
     - Menggunakan medan `bio_links.icon` untuk menyimpan URL imej lakaran kenit atau muat naik fail imej terus ke Supabase Storage `qr_logos`.
     - Butang pautan memaparkan lakaran kenit bulat di sebelah kiri (`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-white/40`), tajuk berpusat di tengah, dan butang 3-titik di sebelah kanan yang membolehkan pengunjung menyalin pautan blok secara pantas.
  4. **Tema Baharu "Sky Breeze" (*Sky Breeze Theme*)**:
     - Gradien biru langit ke kelabu batu (`bg-gradient-to-b from-[#a0c7e2] via-[#6a9dbc] to-[#43657a]`).
     - Diperkukuh dengan kawalan kontras tinggi: butang kaca (`glass`) dan garisan (`outline`) menguatkuasakan `text-slate-950 font-semibold` di bawah `getBioButtonClass` bagi menjamin kebolehbacaan sempurna.
  5. **Bar Tindakan Atas (*Top Header Action Bar*)**:
     - Bar atas mengandungi lencana Sparkles di kiri dan butang Share di kanan.
     - Menyokong Web Share API natif di telefon pintar serta modal perkongsian dialog (salin pautan, kongsi ke WhatsApp, dan muat turun Kod QR) di komputer meja.
- **Pengesahan & Jaminan Kualiti**:
  - `tests/bio-links.test.ts`: Ujian tema 9 preset, ujian kontras teks gelap `sky`, dan ujian formatter `formatHandleTiles`.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 361 / 361 ujian lulus merentas 39 suite ujian.

## System Improvements (2026-10-13 — Bio Links Public Viewer & Port Resolution Bug Fix)
- **Konteks & Laporan Pengguna**: "kenapa takleh nk view bio links"
- **Punca Masalah Dikenal Pasti**:
  1. *SSR ReferenceError `window is not defined` (HTTP 500)*:
     - Di `app/(public)/bio/[username]/client.tsx` (baris 442), pautan WhatsApp di dalam modal Dialog mengakses `window.location.href` secara langsung di dalam blok JSX. Semasa Server-Side Rendering (SSR) oleh Next.js, objek global `window` tidak wujud, mencetuskan `ReferenceError: window is not defined` dan menghasilkan ralat 500 Internal Server Error untuk setiap cubaan membuka halaman bio.
  2. *Kerosakan Pengekodan Peratus URL (HTTP 404)*:
     - Apabila pengguna atau pelayar mengakses pautan berformat `@username` (cth: `/bio/@metmalaysia`), pelayar menghantar parameter sebagai `%40metmalaysia`.
     - Fungsi `cleanBioUsername` di `lib/bio-links/themes.ts` menapis aksara menggunakan regex `/[^a-z0-9_-]/g` tanpa menyahkod terlebih dahulu, memotong simbol `%` dan menghasilkan `'40metmalaysia'`. Carian Supabase `.ilike('username', '40metmalaysia')` gagal menemui rekod dan mencetuskan Next.js `notFound()` (404).
  3. *Konflik Port Tempatan (Port 3000 vs 3002)*:
     - Di komputer pengguna, Port 3000 telah diduduki oleh aplikasi lain (`gorahnu`), menyebabkan dev server KlikForm secara automatik memilih Port 3002.
     - Walau bagaimanapun, `.env.local` mengandungi nilai statik `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Oleh itu, butang "View Public Bio" dan "Copy Link" menjana URL `http://localhost:3000/bio/...` yang menghala ke aplikasi gorahnu bukannya KlikForm.
- **Tindakan Pembaikan**:
  1. *SSR-Safe URL Resolution (`client.tsx`)*:
     - Menyediakan nilai sandaran statik `fallbackUrl = https://www.klikform.com/bio/${page.username}` dan mengemas kini `currentUrl` di dalam `useEffect` selepas hidrasi pelayar. Menghapuskan terus sebarang akses langsung kepada `window.location.href` semasa proses SSR.
  2. *Normalisasi Teguh `cleanBioUsername` (`themes.ts`)*:
     - Menambah `decodeURIComponent` di dalam blok `try-catch` dan memotong sebarang awalan `@` secara eksplisit (`replace(/^@+/, '')`). Memastikan kedua-dua `/bio/handle`, `/bio/@handle`, dan `/bio/%40handle` dinormalkan dengan tepat kepada `handle`.
  3. *Resolusi Port Dinamik Tempatan*:
     - Mengemas kini `appUrl` di `app/(dashboard)/bio/page.tsx` dan `app/(dashboard)/bio-builder/[id]/page.tsx` untuk mengutamakan header `host` permintaan pada localhost (`isLocalHost ? proto://host : ...`).
     - Menyegerakkan `resolvedAppUrl` di dalam komponen klien (`BioPageCard` & `BioBuilderClient`) menggunakan `window.location.origin` apabila di pelayar.
- **Pengesahan & Jaminan Kualiti**:
  - `curl -I http://localhost:3002/bio/metmalaysia`: 200 OK.
  - `curl -I http://localhost:3002/bio/@metmalaysia`: 200 OK.
  - `curl -I http://localhost:3002/bio/%40metmalaysia`: 200 OK.
  - `curl -I http://localhost:3002/b/metmalaysia`: 307 -> 200 OK.
  - `curl -I http://localhost:3002/b/@metmalaysia`: 307 -> 200 OK.
  - `curl -I http://localhost:3002/bio/@bengkelinsan2026`: 200 OK.
  - `npm test`: 361 / 361 ujian unit lulus merentas 39 suite ujian.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.

## System Improvements (2026-10-13 — Linktree FIK2026 Aesthetic Match & Hero Banner Fade)
- **Konteks & Kehendak Pengguna**: `https://linktr.ee/fik2026 sy nak style macam ni`
- **Analisis Reka Bentuk Linktree FIK2026**:
  - Palet warna latar belakang tepat `#49829c` (Nordic Slate-Ocean Blue) dipadankan dengan teks putih (`text-white`).
  - Hero image flyer banner di bahagian atas skrin yang melarut/memudar ke bawah secara organik (*organic gradient mask*) terus ke latar belakang `#49829c`.
  - Handle `@fik2026` menggunakan Google Font `Monofett` (huruf stensil monokrom moden).
  - Butang kapsul bulat penuh (*pill* `rounded-full`) dengan frosted glassmorphism putih berkontras tinggi dan teks hitam pekat bold `text-slate-950 font-bold`.
  - Susun atur pautan: thumbnail bulat kiri (atau invisible balance spacer jika tiada gambar) + tajuk berpusat tepat di tengah + butang 3-titik di kanan.
- **Ciri-Ciri Utama Yang Dilaksanakan**:
  1. **Mod Pengepala Hero Banner Pudar (`headerType: 'hero'`)**:
     - Ditambah ke dalam `BioHeaderType` (`lib/types/bio-links.ts`): `'avatar' | 'poster' | 'hero' | 'banner'`.
     - Menggunakan top-bleed flyer image dengan `mask-image: linear-gradient(to bottom, black 55%, rgba(0, 0, 0, 0.75) 75%, transparent 100%)` dan `-webkit-mask-image`.
     - Poster memudar secara organik tanpa sempadan tajam ke dalam palet `#49829c`.
  2. **Tipografi Stensil Monofett (`badgeStyle: 'stencil'`)**:
     - Ditambah ke dalam `BioBadgeStyle` (`lib/types/bio-links.ts`): `'tiles' | 'pill' | 'stencil' | 'subtle' | 'none'`.
     - Pautan Google Font `Monofett` (`family=Monofett&display=swap`) dimuatkan di pemapar awam (`page.tsx`) dan builder studio.
     - Tipografi dipaparkan dengan `font-['Monofett',monospace] text-3xl sm:text-4xl tracking-wider text-white`.
  3. **Palet Warna Tema Sky Breeze (`sky`) & Butang Kaca Berkontras Tinggi**:
     - Latar belakang: `bg-[#49829c] bg-gradient-to-b from-[#558da7] via-[#49829c] to-[#3c6b80]`, `textColor: 'text-white'`, `bioColor: 'text-white/85'`, `previewColor: '#49829c'`.
     - Fungsi `getBioButtonClass` menguatkuasakan kapsul bulat penuh `rounded-full` dengan lapisan kaca berkabut `bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/40 shadow-sm` dan teks hitam pekat bold `text-slate-950 font-bold`.
     - Butang sorotan (highlight): `bg-white hover:bg-white/95 text-slate-950 font-extrabold border-2 border-white shadow-md`.
  4. **Simetri Pautan Berpusat (Centered Link Balancing)**:
     - Butang pautan awam dan mockup studio kini mengimbangi butang 3-titik di kanan dengan *invisible balance spacer* `w-8 h-8 shrink-0 mr-2 invisible pointer-events-none aria-hidden` bagi pautan tanpa gambar thumbnail.
     - Tajuk pautan kini sentiasa berpusat tepat 100% di tengah-tengah butang kapsul.
  5. **Penyegerakan Penuh Studio Bio Builder (`MobileMockupView`)**:
     - Ditambah pilihan "Hero Banner (Fade)" pada Header Display Style di tab Profile Bio Builder.
     - Ditambah pilihan "Stencil (@FIK)" pada Handle Badge Style picker di tab Profile Bio Builder.
     - `MobileMockupView` mengaplikasikan `maskImage` hero fade, font `Monofett`, dan simetri butang pautan secara langsung.
- **Pengesahan & Jaminan Kualiti**:
  - `npm test`: 361 / 361 ujian unit lulus merentas 39 suite ujian.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `curl -I http://localhost:3002/bio/metmalaysia`: 200 OK.
  - Status: Selesai dengan standard jurutera perisian kanan, sifar kod selekeh.

## System Improvements (2026-10-13 — Full-Bleed Hero Banner, Pattern Suppression & 1-Click Event Preset)
- **Konteks & Maklum Balas Pengguna**: "yg ni macam tak lawa la pulak"
- **Punca Masalah Visual Terperinci**:
  1. *Flyer Terperangkap Dalam Margin*: Poster hero diletakkan di dalam kontena dengan padding atas (`px-4 pt-4 sm:pt-6`), dan butang Sparkles/Share terapung di dalam ruang kosong di atas poster, memecahkan rupa poster persidangan.
  2. *Pertembungan Corak Latar & Pudar Poster*: Pengguna mengaktifkan corak latar `dots` (polka dots) pada tema `minimal` (kelabu putih). Bahagian pudar awan di dasar poster melarut ke dalam bintik-bintik kelabu, menghasilkan kesan visual berhabuk/kotor (*dirty specks*).
  3. *Jubin Abjad Handle Terlalu Besar*: Handle 11 huruf `@METMALAYSIA` menghasilkan 12 jubin petak yang melimpah dan memecah baris secara bersepah.
  4. *Bentuk Butang Petak Borang*: Butang masih menggunakan `rounded-xl`/`rounded-md` dengan sempadan kelabu kaku berbanding butang kaca kapsul bulat penuh (*frosted glass pill* `rounded-full`).
  5. *Tajuk Teks Lewah di Bawah Poster*: Poster flyer grafik sudah mengandungi tulisan tajuk acara, namun tajuk teks dipaparkan sekali lagi di bawah pudar poster dalam warna hitam kaku.
- **Penyelesaian & Ciri Utama Yang Dilaksanakan**:
  1. **Susun Atur Penuh Birai Sejati (*True Full-Bleed Edge-to-Edge*)**:
     - Membuang padding atas pada `<main>` (`isHeroMode ? 'pt-0 px-4' : 'px-4 pt-4 sm:pt-6'`).
     - Meluaskan kontena hero (`w-[calc(100%+2rem)] -mx-4`) supaya poster melekat rata di birai atas dan sisi peranti.
     - Memindahkan butang Sparkles dan Share menjadi butang terapung terus di atas bucu flyer (`absolute top-4 left-4 / right-4 z-20`) dengan butang kapsul kaca berkabut gelap (`bg-black/30 hover:bg-black/45 backdrop-blur-md border border-white/25 text-white`).
  2. **Penindasan Corak Latar Semasa Mod Hero (*Pattern Suppression*)**:
     - Menyekat pemaparan sebarang corak latar (`dots`, `grid`, dsb.) apabila `isHeroMode` aktif supaya kecerunan poster melarut licin ke dalam warna latar belakang pepejal yang bersih.
  3. **Kad Pratetap 1-Klik Gaya Persidangan FIK2026 (*1-Click Event Preset*)**:
     - Ditambah kad interaktif di bahagian atas tab Theme dalam Bio Builder Studio.
     - 1-Klik terus menetapkan kesemua 5 parameter secara harmoni: `theme: 'sky'`, `pattern: 'none'`, `buttonStyle: 'rounded-full'`, `headerType: 'hero'`, `badgeStyle: 'stencil'`, dan `hideTitleInHero: true`.
  4. **Penskalaan Adaptif Jubin Abjad Handle**:
     - Apabila `page.username.length > 7`, saiz jubin huruf diskalakan secara automatik kepada `w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs` supaya abjad kekal rapat dalam satu baris kemas tanpa melimpah.
  5. **Togol Sembunyi Teks Tajuk di Bawah Poster (`hideTitleInHero`)**:
     - Ditambah ke dalam `BioThemeConfig` dan suis togol di tab Profile Bio Builder supaya tajuk tidak berulang jika poster telah mempunyai reka bentuk tajuk sendiri.
  6. **Penyegerakan Penuh Simulator Telefon Studio (`MobileMockupView`)**:
     - Cermin reka bentuk hero penuh birai (`rounded-t-[38px]`), butang terapung atas poster, penindasan corak, dan jubin abjad adaptif di dalam telefon mockup.
- **Pengesahan & Jaminan Kualiti**:
  - `npm test`: 362 / 362 ujian unit lulus merentas 39 suite ujian.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `curl -I http://localhost:3002/bio/metmalaysia`: 200 OK.

## System Improvements (2026-10-13 — Phone Mockup Desktop Scrollbar Hiding)
- **Konteks & Permintaan Pengguna**: "scroll tu boleh hide tak" (merujuk kepada palang skrol kelabu natif Windows yang terpapar di dalam skrin simulator telefon Bio Builder).
- **Punca Masalah**:
  - Bekas skrin telefon di dalam `MobileMockupView` (`app/(dashboard)/bio-builder/[id]/client.tsx`) mempunyai ketinggian tetap (`h-[660px]`) dan menggunakan `overflow-y-auto`.
  - Pada sistem operasi desktop (terutamanya Windows Chrome/Edge/Firefox), apabila senarai butang pautan melebihi ketinggian skrin, pelayar menjana palang skrol natif tebal (~17px) kelabu dengan butang anak panah, merosakkan estetika realistik simulator telefon pintar.
- **Penyelesaian**:
  1. Menambah peraturan utiliti sejagat `.no-scrollbar` dan `.custom-scrollbar` dalam `app/globals.css`:
     - `::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }`
     - `-ms-overflow-style: none !important;` (IE & Edge)
     - `scrollbar-width: none !important;` (Firefox & Chromium moden)
  2. Mengemas kini bekas Screen Area dalam `MobileMockupView` (`app/(dashboard)/bio-builder/[id]/client.tsx`):
     - Memasukkan kelas utiliti `no-scrollbar custom-scrollbar`.
     - Menambah gaya sebaris defensif `style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}`.
  3. Memastikan tatalan lancar (smooth scrolling) melalui roda tetikus (*mouse wheel*), pad sentuh (*trackpad*), dan gerak isyarat sentuhan kekal berfungsi 100% tanpa palang skrol kelihatan.
- **Pengesahan**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 362 / 362 ujian lulus merentas 39 suite fail.

## System Improvements (2026-10-13 — FIK2026 1-Click Preset Banner Removal)
- **Konteks & Permintaan Pengguna**: "yg tu tak nak" (merujuk kepada kad banner pratetap FIK2026 berwarna biru di bahagian atas tab Design).
- **Tindakan**:
  - Membuang kad banner pratetap 1-klik tersebut dari `app/(dashboard)/bio-builder/[id]/client.tsx` supaya tab Design terus memaparkan seksyen `Color Themes` dengan kemas dan bersih.
  - Kesemua ciri reka bentuk (tema Sky Breeze, poster Hero Banner, lencana handle Stencil, dan gaya butang) kekal boleh diakses secara langsung melalui pemilih standard.
- **Pengesahan**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 362 / 362 ujian lulus merentas 39 suite fail.

## System Improvements (2026-10-13 — Generalizing Example Labels from FIK to USER)
- **Konteks & Permintaan Pengguna**: "guna nama lain instead of FIK" (merujuk kepada label `Linktree FIK2026 fade`, `Stencil (@FIK)`, dan `@[F][I][K]...` pada tetapan Header Display Style dan Handle Badge Style).
- **Tindakan**:
  1. Pada `Hero Banner (Fade)`: Menukar penerangan `Linktree FIK2026 fade` kepada `Full-bleed bottom fade`.
  2. Pada pemilih `Handle Badge Style`:
     - Menukar `Stencil (@FIK)` kepada `Stencil (@USER)`.
     - Menukar subtitle `Letter Tiles` daripada `@[F][I][K]...` kepada `@[U][S][E][R]...`.
  3. Memastikan semua label kelihatan neutral, profesional, dan sejagat bagi sebarang jenama atau pengguna (seperti `@metmalaysia`).
- **Pengesahan**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 362 / 362 ujian lulus merentas 39 suite fail.

## System Improvements (2026-10-13 — Organic Hero Fade Scrim Perfection)
- **Konteks & Permintaan Pengguna**: "fade tu nak cantikkan sikit" (merujuk kepada kecerunan pudar di bawah poster awan yang kelihatan bergaris tajam atau terpotong mengejut).
- **Punca Masalah Visual**:
  - Mask lama `linear-gradient(to bottom, black 55%, rgba(0,0,0,0.75) 75%, transparent 100%)` mengekalkan 75% kelegapan sehingga 75% ketinggian, lalu merudum daripada 75% ke 0% dalam baki 25% ketinggian (~35px-45px pada nisbah landskap 16:9), menghasilkan garisan sempadan kabur kelabu/gelap yang kasar.
  - Imej banner menggunakan `h-auto max-h-[280px]` yang menyebabkan banner landskap lebar termampat kepada hanya ~140px-180px, mengecilkan zon peralihan menegak.
- **Penyelesaian & Ciri Yang Dilaksanakan**:
  1. **Lengkungan Scrim 12-Peringkat (`getHeroFadeMask`)**:
     - Dicipta algoritma topeng CSS polinomial quintic/smoothstep 12-peringkat (`lib/bio-links/themes.ts`):
       - `0%-18%`: 100% grafik tajuk/poster atas kekal tajam.
       - `18%-48%`: Melarut beransur-ansur dari 0.98 ke 0.82.
       - `48%-68%`: Peralihan nada pertengahan dari 0.68 ke 0.50.
       - `68%-86%`: Pelarutan lembut dari 0.32 ke 0.18.
       - `86%-100%`: Pemudaran mikro-peringkat `93% (0.07)`, `97.5% (0.01)` dan `100% (0)`.
     - Tiada garisan potong yang ketara; poster melarut ke dalam latar belakang persis kabus pagi.
  2. **Ketinggian Berkadar Berwibawa**:
     - Mockup telefon: `h-[240px] sm:h-[260px] object-cover object-top`.
     - Paparan awam: `h-[280px] sm:h-[340px] object-cover object-top`.
  3. **Integrasi Lencana Handle Terapung**:
     - Apabila tajuk teks disembunyikan (`hideTitleInHero`), lencana handle (`@METMALAYSIA`) dianjak naik secara halus (`-mt-4` pada mockup, `-mt-6 sm:-mt-8` pada paparan awam) agar terapung di atas zon kabus paling lembut poster persis Linktree rasmi.
  4. **Pemilih Gaya Pudar ("Hero Fade Transition") di Studio Bio Builder**:
     - Pilihan 3-butang di bawah Hero Banner Graphic: `Smooth Mist (Default)`, `Deep Fog`, `Subtle Edge`.
- **Pengesahan**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 366 / 366 ujian lulus merentas 39 suite fail (termasuk 4 ujian unit baharu untuk `getHeroFadeMask`).

## Fleksibiliti Huruf Handle Badge Bio Links (Handle Badge Casing Alignment & Uppercase Toggle) (2026-10-13)
- **Penyelesaian Isu Huruf Besar Terpaksa**:
  - Menyelesaikan masalah di mana nama pengguna huruf kecil (seperti `metmalaysia`) dipaksa menjadi huruf besar tegar (`@[M][E][T][M][A][L][A][Y][S][I][A]` dan `@{username.toUpperCase()}`).
  - `formatHandleTiles(username, uppercase = false)` di `lib/bio-links/themes.ts` kini mengekalkan huruf asal mengikut input secara lalai (`clean.split('')`).
  - Menambah sifat `handleUppercase?: boolean` pada `BioThemeConfig` di `lib/types/bio-links.ts` (re-export dari `lib/types/index.ts`).
  - Memasukkan suis togol (*Switch*) "Uppercase Handle Badge" di tab Profile Bio Builder Studio (`app/(dashboard)/bio-builder/[id]/client.tsx`) supaya pengguna boleh memilih sama ada mahu huruf kecil asal (`@metmalaysia`) atau huruf besar penuh (`@METMALAYSIA`).
  - Selaraskan paparan awam (`app/(public)/bio/[username]/client.tsx`) dan simulator telefon (`MobileMockupView`) untuk menghormati `handleUppercase` merentas Letter Tiles, Stencil, dan Modern Pill.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 367 / 367 ujian lulus merentas 39 suite fail.
  - HTTP 200 OK disahkan pada dev server.

## Paparan Handle Tersuai Huruf Campuran (Custom Mixed-Case Handle Display Badge) (2026-10-13)
- **Pelaksanaan Pemisahan Teks Lencana daripada Slug URL**:
  - Menjawab keperluan pengguna untuk menggabungkan huruf besar & huruf kecil (*CamelCase / PascalCase* seperti `MetMalaysia`, `WanTech`, `MyBrand_MY`) tanpa terikat kepada format URL slug yang sentiasa huruf kecil (`klikform.com/bio/metmalaysia`).
  - Menambah sifat `customHandle?: string` pada `BioThemeConfig` di `lib/types/bio-links.ts` (re-export dari `lib/types/index.ts`).
  - Cipta fungsi utiliti tulen `getBioDisplayHandle(username, customHandle)` di `lib/bio-links/themes.ts` untuk menyelesaikan teks paparan dengan fallback selamat kepada `username`.
  - Tambah komponen input teks "Custom Handle Display (Mixed Case)" di tab Profile Bio Builder Studio (`app/(dashboard)/bio-builder/[id]/client.tsx`) lengkap dengan awalan `@`, had 30 aksara, dan butang "Reset to @{username}".
  - Selaraskan paparan awam (`app/(public)/bio/[username]/client.tsx`) dan simulator telefon (`MobileMockupView`) untuk memaparkan teks campuran pada lencana Letter Tiles, Stencil, dan Modern Pill.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 372 / 372 ujian lulus merentas 39 suite fail (termasuk 5 ujian unit baharu untuk `getBioDisplayHandle` dan jubin huruf campuran).
  - HTTP 200 OK disahkan pada dev server.

## Penyelarasan Keseimbangan Padding Tab Navigasi Bio Builder (Tabs Bar Vertical Symmetry & Height Balance Fix) (2026-10-13)
- **Konteks & Maklum Balas Pengguna**: "macam tak balance padding atas dan bawah" bersama tangkapan skrin bar tab navigasi (`[ 🔗 Links ] [ ✨ Design ] [ 🪪 Profile ] [ 🔲 Share & QR ]`).
- **Punca Masalah Visual**:
  1. *Ketidakseimbangan Ketinggian TabsTrigger Radix*: Di `components/ui/tabs.tsx`, elemen `TabsTrigger` mempunyai kelas `h-[calc(100%-1px)]`. Nilai tolak 1 piksel ini menyebabkan pil aktif terapung 1px lebih tinggi daripada dasar kontena, menjadikan jarak bawah kelihatan lebih tebal berbanding jarak atas.
  2. *Kekangan Ketinggian Kontena `h-9` (36px)*: Bar `TabsList` asal hanya mempunyai ketinggian lalai 36px dengan `p-1` (4px). Ruang dalaman bagi trigger mengecil ke 28px, menyebabkan teks font berjarak baris 20px (`text-sm` leading-5) dan ikon 14px menyentuh birai atas sementara birai bawah tertinggal lebihan ruang.
- **Penyelesaian & Ciri Yang Dilaksanakan**:
  1. **Pembetulan Asas `components/ui/tabs.tsx`**:
     - Mengubah `h-[calc(100%-1px)]` kepada `h-full` supaya elemen trigger mengisi ketinggian dalaman secara simetri dan tepat.
  2. **Peningkatan Ketinggian Ergonomik Moden (`h-11` / 44px)**:
     - Di `app/(dashboard)/bio-builder/[id]/client.tsx`, `TabsList` dinaikkan kepada `h-11` (44px) yang memenuhi standard kebolehgunaan sentuhan (*touch-friendly*).
     - Menetapkan padding kontena simetri `p-1.5` (6px seragam di atas, bawah, kiri, kanan).
     - Menetapkan `h-full rounded-lg text-xs md:text-sm font-medium gap-1.5 py-0 flex items-center justify-center` pada setiap `TabsTrigger`.
     - Pil putih aktif kini mempunyai margin tepat 6px dari semua sisi kontena kelabu, dengan teks dan ikon berpusat secara geometri.
  3. **Penyelarasan Merentas Studio Pembina**:
     - Di `app/(dashboard)/pamphlet-builder/[id]/client.tsx`, `TabsList` diselaraskan kepada `h-10` dengan `h-full py-0 flex items-center justify-center` pada trigger untuk mengekalkan keanggunan yang sama.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 372 / 372 ujian unit lulus merentas 39 suite fail.
  - HTTP 200 OK disahkan pada dev server.

## Penyesuaian Warna Butang Bio Links & Palet Pratetap (Custom Bio Button Colors & Presets) (2026-10-14)
- **Konteks & Maklum Balas Pengguna**: "boleh ke nk custom warna ni" bersama bulatan merah pada senarai butang pautan profil di simulator telefon (yang sebelum ini terikat kepada warna hijau neon lalai Cyber Neon).
- **Penyelesaian & Ciri Dilaksanakan**:
  1. **Lapisan Jenis Data & Storan JSONB**:
     - Memperluas `BioThemeConfig` di `lib/types/bio-links.ts` (re-export di `lib/types/index.ts`) dengan:
       - `buttonColor?: string;` (warna latar butang pautan)
       - `buttonTextColor?: string;` (warna teks & ikon butang)
       - `buttonBorderColor?: string;` (warna sempadan / garis luar butang)
       - `highlightButtonColor?: string;` (warna latar butang sorotan)
       - `highlightButtonTextColor?: string;` (warna teks butang sorotan)
       - `buttonPreset?: string;` (ID pratetap pilihan pengguna)
  2. **Enjin Penyelarasan Gaya Butang (`lib/bio-links/themes.ts`)**:
     - Mentakrifkan 9 Palet Warna Pantas `BIO_BUTTON_PRESETS`:
       - `Theme Default` (kembali ke warna tema asal)
       - `Frosted Glass Pill` (kaca berkabut putih: `rgba(255,255,255,0.16)` bg, teks putih, sempadan `rgba(255,255,255,0.35)`)
       - `Solid Crisp White` (putih kontras tinggi: `#ffffff` bg, teks slate `#0f172a`, sempadan `#e2e8f0`)
       - `Ocean Sky Blue` (biru langit / MetMalaysia: `rgba(2,132,199,0.22)` bg, teks `#38bdf8`, sempadan `#38bdf8`)
       - `Emerald Green` (hijau zamrud: `rgba(16,185,129,0.22)` bg, teks `#34d399`, sempadan `#10b981`)
       - `Electric Neon Cyan` (sian neon cyberpunk: `rgba(6,182,212,0.22)` bg, teks `#22d3ee`, sempadan `#06b6d4`)
       - `Luxury Amber Gold` (emas amber: `rgba(245,158,11,0.22)` bg, teks `#fbbf24`, sempadan `#f59e0b`)
       - `Royal Purple` (ungu diraja: `rgba(168,85,247,0.22)` bg, teks `#c084fc`, sempadan `#a855f7`)
       - `Stealth Charcoal` (arang gelap: `#18181b` bg, teks putih, sempadan `#3f3f46`)
     - Membina fungsi utiliti tulen `getBioButtonCustomStyle(themeConfig, isHighlight)` yang mengira gaya sebaris (`React.CSSProperties`) bagi warna latar, warna teks, dan warna sempadan secara bebas konflik.
  3. **Antaramuka Bio Builder Studio (`app/(dashboard)/bio-builder/[id]/client.tsx`)**:
     - Ditambah kad baharu "Button Colors & Appearance / Warna Butang" dalam Tab 2 ("Design"):
       - Grid 9 Palet Warna Pantas dengan pratonton warna butang secara visual.
       - Seksyen Pemilih Warna Bebas (Fine-Tune Custom Colors) menggunakan pemilih warna `<input type="color">` dilindungi `toValidHexColor` dan medan teks hex:
         - Button Background
         - Text & Icon Color
         - Border / Outline Color
         - Highlighted Button Fill
       - Butang "Reset" pantas untuk kembali ke warna asal tema pada bila-bila masa.
  4. **Penyelarasan Merentas Simulator & Paparan Awam**:
     - `MobileMockupView` di `client.tsx` dan `PublicBioClient` di `app/(public)/bio/[username]/client.tsx` menyalurkan `style={getBioButtonCustomStyle(page.themeConfig, isHighlight)}` ke elemen butang, memberikan respons visual masa nyata (*zero-lag preview*).
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 377 / 377 ujian unit lulus merentas 39 suite fail (termasuk 5 ujian unit baharu untuk `getBioButtonCustomStyle` dan presets).

## Pengaktifan Corak Latar Bersama Mod Hero (Hero Mode Background Pattern Seamless Fade-In) (2026-10-14)
- **Konteks & Maklum Balas Pengguna**: "kenapa takde background pattens ya" bersama tangkapan skrin pemilih corak latar (Polka Dots terpilih hijau) dan simulator telefon (latar belakang pepejal tanpa sebarang corak).
- **Punca Masalah**:
  - Di kedua-dua `MobileMockupView` dan `PublicBioClient`, elemen corak latar disekat dengan syarat `!isHeroMode` (`{page.themeConfig?.pattern && page.themeConfig.pattern !== 'none' && !isHeroMode && ...}`).
  - Apabila pengguna menggunakan mod Hero Banner (poster awan di bahagian atas), `isHeroMode` bernilai `true`. Ini menyebabkan keseluruhan lapisan corak (Polka Dots, Modern Grid, Waves, dll.) tidak dirender sama sekali ke dalam DOM.
- **Penyelesaian Dilaksanakan**:
  1. Menyingkirkan sekatan `!isHeroMode` supaya corak latar sentiasa dipaparkan apabila pengguna memilih sebarang corak (`pattern !== 'none'`).
  2. Melaksanakan topeng pudar adaptif (*adaptive gradient mask*):
     - Di `MobileMockupView`: `maskImage: 'linear-gradient(to bottom, transparent 0px, transparent 130px, black 230px)'`
     - Di `PublicBioClient`: `maskImage: 'linear-gradient(to bottom, transparent 0px, transparent 160px, black 270px)'`
  3. Bahagian atas grafik langit/poster kekal 100% bersih tanpa sebarang gangguan bintik corak, manakala di bawah zon peralihan poster (di belakang `@METMALAYSIA`, butang pautan, dan kaki halaman), corak latar (seperti Polka Dots) terpapar jelas, estetik, dan menawan.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 377 / 377 ujian unit lulus merentas 39 suite fail.
  - HTTP 200 OK disahkan pada dev server.

## Pelarasan Kelegapan Corak Latar (Background Pattern Opacity Control) (2026-10-14)
- **Konteks & Maklum Balas Pengguna**: "yg ni boleh adjust tak opacity" bersama tangkapan skrin kad Background Patterns di Bio Builder.
- **Penyelesaian & Ciri Dilaksanakan**:
  1. **Lapisan Jenis Data & Storan JSONB**:
     - Menambah `patternOpacity?: number;` (peratusan 10 hingga 100) dalam antaramuka `BioThemeConfig` di `lib/types/bio-links.ts` (re-export di `lib/types/index.ts`).
  2. **Enjin Penyelarasan Kelegapan (`lib/bio-links/themes.ts`)**:
     - Membina fungsi utiliti tulen `getBioPatternOpacity(themeConfig?: BioThemeConfig): number`:
       - Mengembalikan nilai lalai `1` (100% opacity) sekiranya `patternOpacity` belum ditakrifkan untuk mengekalkan keanggunan halaman sedia ada tanpa sebarang regresi.
       - Mengehadkan nilai (*clamp*) antara `10` (0.1) hingga `100` (1.0) secara selamat untuk mengelakkan nilai ganjil atau negatif.
  3. **Antaramuka Bio Builder Studio (`app/(dashboard)/bio-builder/[id]/client.tsx`)**:
     - Dalam kad "Background Patterns / Corak Latar", apabila corak aktif dipilih (`currentPattern !== 'none'`), seksyen kawalan kelegapan dipaparkan secara reaktif:
       - Header dengan label `Pattern Opacity / Kelegapan Corak`, lencana peratusan hidup (`${val}%`), dan butang Reset pantas kembali ke 100%.
       - Gelangsar range input `<input type="range" min="10" max="100" step="5" ... />` dengan gaya Tailwind moden `accent-emerald-600`.
       - 4 Butang Pratetap Pantas: `25% (Subtle)`, `50% (Soft)`, `75% (Clear)`, dan `100% (Bold)`.
       - Maklum balas visual serta-merta (*zero-lag preview*) dengan simpanan latar automatik ke Supabase (`handleSavePage`).
  4. **Penyelarasan Merentas Simulator Telefon & Halaman Awam**:
     - `MobileMockupView` di `client.tsx` dan `PublicBioClient` di `app/(public)/bio/[username]/client.tsx` menyalurkan `opacity: getBioPatternOpacity(page.themeConfig)` bersama kelas transisi `transition-opacity duration-200`.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `tests/bio-links.test.ts`: Ditambah 4 ujian unit baharu untuk `getBioPatternOpacity` (45/45 lulus).
  - `npm test`: 381 / 381 ujian unit lulus merentas 39 suite fail.
  - HTTP 200 OK disahkan pada dev server (`http://localhost:3002/bio/metmalaysia`).

## Production Deployment (2026-10-14 — Bio Custom Handle, Button Colors, Background Patterns & Opacity Control)
- **Komit Git**: `6736325` (`feat(bio): add custom handle casing, custom button colors, background patterns, and pattern opacity controls`).
- **Kaedah Pelancaran**: Tolak ke GitHub (`git push origin master`) dengan penyelarasan automatik Vercel.
- **Status Vercel**: ● Ready.
## Pembaikan Limpahan Paparan Mudah Alih Bio Builder (Mobile View Horizontal Overflow & Clipping Fix) (2026-10-14)
- **Konteks & Maklum Balas Pengguna**: "kenapa jadi view di mobile view macam ni ya?" bersama tangkapan skrin telefon pintar di mana kandungan Bio Builder terpotong di sebelah kiri (Back button hilang, "BATAN METEOROL...", tab "s", "inks", drag grip handles terpotong) manakala bahagian kanan melekat rapat ke tepi.
- **Punca Masalah (Root Causes)**:
  1. *Horizontal Overflow*: Bar sub-header Bio Builder (Back button, tajuk agensi panjang, lencana @username, Preview dan View Bio) memerlukan kelebaran minimum >520px, melebihi skrin telefon pintar (360px-414px). Bar 4-tab navigasi (`grid-cols-4` dengan label "Share & QR") turut memerlukan >440px dengan teks `whitespace-nowrap`.
  2. *CSS Auto Overflow-X*: Elemen `<main>` dalam `DashboardShell` mempunyai `overflow-y: auto`. Mengikut spesifikasi CSS, pelayar mengira paksi pasangannya `overflow-x` sebagai `auto`.
  3. *Tatalan Mendatar*: Apabila pengguna meleret skrin telefon, sebarang leretan santai atau sentuhan jari menyebabkan kontena `<main>` diskrol ke sebelah kanan (`scrollLeft > 0`), menolak kandungan sebelah kiri (x: 0 ke ~90px) keluar dari birai skrin peranti.
- **Penyelesaian Dilaksanakan**:
  1. **Pertahanan Lapisan Kontena Asas (`components/dashboard/dashboard-shell.tsx`)**:
     - Menetapkan `min-w-0 overflow-x-hidden w-full` pada elemen `<main>` di `DashboardShell`, menghapuskan keupayaan pelayar untuk menggelincirkan kontena induk secara mendatar pada peranti mudah alih.
  2. **Pengoptimuman Responsif Antaramuka Bio Builder (`app/(dashboard)/bio-builder/[id]/client.tsx`)**:
     - *Sticky Header Bar*: Menyuntik `min-w-0 flex-1 truncate` pada tajuk supaya teks panjang terpotong kemas dengan elipsis (`...`), memindahkan `@username` ke baris kedua pada paparan mudah alih (`sm:hidden font-mono text-[11px]`) dan sebaris pada desktop (`hidden sm:inline-block`), serta menetapkan `shrink-0` dan butang kompak `h-8 px-2 sm:px-3` pada `Preview` dan `Bio`.
     - *Tabs Bar (`TabsList`)*: Menetapkan `min-w-0`, `px-1 sm:px-2`, `gap-1 sm:gap-1.5`, serta menyingkatkan teks tab ke-4 kepada "Share" pada paparan mudah alih (`sm:hidden`) dan "Share & QR" pada desktop (`hidden sm:inline`). Kesemua 4 tab kini muat 100% pada skrin telefon sekecil 320px (iPhone SE).
     - *Seksyen Tajuk*: Menggunakan susun atur responsif `flex flex-col sm:flex-row justify-between gap-3 min-w-0` agar tajuk dan butang `+ Add Block / Link` tidak menolak sempadan skrin.
     - *Kad Pautan (`SortableBioLinkItem`)*: Menggunakan `p-2.5 sm:p-3.5`, `gap-2 sm:gap-3`, `min-w-0 w-full` pada bekas kad, `shrink-0` pada pemegang drag dan suis/butang kawalan, serta `flex-1 min-w-0` pada teks tajuk dan pautan.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 381 / 381 ujian unit lulus merentas 39 suite fail.

## Penghapusan Tatalan Phantom Menegak Bio Builder (Mobile Vertical Phantom Scroll Fix) (2026-10-14)
- **Konteks & Maklum Balas Pengguna**: "kenapa boleh scroll ya, sedangkan tak sampai bawah lagi" bersama tangkapan skrin yang menunjukkan halaman boleh diskrol ke bawah ke kawasan kosong putih yang luas di bawah kad pautan terakhir ("TekaMET (Game MET)").
- **Punca Masalah (Root Causes)**:
  1. *Nested `min-h-screen`*: Elemen pembalut dalam `BioBuilderClient` mempunyai kelas `min-h-screen` (`min-height: 100vh`).
  2. *Padding Bertindan*: Kontena induk (`<main>` di `DashboardShell`) sudah pun mempunyai ketinggian `h-full` dengan padding atas `pt-16` (64px). Apabila elemen anak menetapkan `min-h-screen` dan padding bawah `pb-20` (80px), jumlah ketinggian minimum dipaksa menjadi `100vh + 144px`.
  3. Ini memaksa pelayar menghasilkan tatalan menegak tambahan sebanyak 144px ke kawasan kosong kelabu/putih walaupun kandungan pautan telah habis.
- **Penyelesaian Dilaksanakan**:
  - Di `app/(dashboard)/bio-builder/[id]/client.tsx`, menyingkirkan kelas `min-h-screen` dan menukar `pb-20` (80px) kepada `pb-8 sm:pb-12` (32px).
  - Ketinggian halaman kini mengalir secara semulajadi mengikut kandungan sebenar tanpa ruang mati (*dead space*).
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / amaran ESLint.
  - `npm test`: 381 / 381 ujian unit lulus merentas 39 suite fail.

## Pengindahan & Pengoptimuman Paparan Mudah Alih E-Cert Builder (Mobile E-Cert Builder Canva-Style UX Polish) (2026-10-14)
- **Konteks & Maklum Balas Pengguna**: "mobile view utk e cert builder macam ni, cantikkan sikit" bersama tangkapan skrin telefon pintar yang menunjukkan toolbar atas bersesak dengan 10+ butang ikon dan kanvas sijil berskala ~33% terapung di tengah ruang kosong kelabu tanpa sebarang sidebar atau kawalan penyuntingan.
- **Punca Masalah (Root Causes)**:
  1. *Panel Terkunci*: `CertificateEditorSidebar` dan `CertificateEditorProperties` dikunci secara statik dengan `hidden md:block` dan `hidden lg:block`. Pada paparan telefon pintar (`< 768px`), pengguna langsung tidak mempunyai akses kepada ciri menambah elemen (teks, bentuk, imej, QR, preset tandatangan) mahupun menyunting sifat elemen (fon, saiz, warna, border, lapisan).
  2. *Toolbar Bersesak*: Toolbar atas memaparkan Group, Ungroup, Grid, Snap, Safe Margin, Orientasi, Download PNG, Download PDF, Preview, dan Save serentak dalam satu baris sempit 360px tanpa ruang untuk tajuk templat.
  3. *Pertindihan Bar Zum*: Bar zum terapung (`bottom-4`) bertembung dengan bahagian bawah skrin dan tiada ruang selamat kanvas.
- **Penyelesaian Dilaksanakan**:
  1. **Top Toolbar Ramping & Responsif (`components/certificates/builder/toolbar.tsx`)**:
     - Memendekkan input nama templat kepada `w-24 sm:w-44 md:w-56` dengan fon responsif `text-sm sm:text-base md:text-lg`.
     - Menyembunyikan perkakasan papan kekunci desktop (Group, Ungroup, Grid, Snap, Safe Margin) di bawah `hidden sm:flex`.
     - Mengekalkan butang penting (Back, Undo, Redo, Orientation Toggle, Preview, Save) dan memindahkan eksport berat ke bar/drawer mudah alih.
  2. **Jalur Status Kanvas Mudah Alih (`app/(dashboard)/certificates/builder/[id]/client.tsx`)**:
     - Memaparkan lencana orientasi aktif (`A4 Landscape` vs `A4 Portrait` bersama ukuran piksel) dan butang pintas pusingan A4 di bawah toolbar.
  3. **Bar Navigasi Bawah Berlabuh Canva-Style (Docked Bottom Bar `md:hidden`)**:
     - *Mod Bebas (Tiada Elemen Dipilih)*: `[＋ Add Element]` (butang menyerlah bersaiz besar mesra ibu jari), `[🎨 Canvas]`, `[⟳ Flip]`, dan `[📥 Export]`.
     - *Mod Kontekstual (Elemen Dipilih)*: Bertukar secara dinamik kepada `[🎨 Edit Style]` (membuka laci properties), `[📋 Duplicate]`, `[⬆️ Layer Forward]`, `[🗑️ Delete]`, dan `[✕ Deselect]`.
  4. **Laci Gelongsor Bawah Mudah Alih (`Sheet side="bottom"`)**:
     - Menyokong prop `className?: string` dan callback `onItemAdded` dalam `CertificateEditorSidebar` dan `CertificateEditorProperties`.
     - Laci 1 (Add Elements & Canvas): Menyediakan akses 100% kepada penambahan teks, gambar peranti, bentuk geometri, garisan, tempat letak `{Nama}`, `{Program}`, `{Tarikh}`, `{IC}`, `{QR}`, pratetap tandatangan, bingkai emas, dan warna/imej latar belakang kanvas.
     - Laci 2 (Element Properties): Menyediakan akses 100% kepada pemilihan Google Fonts (Alex Brush, Cinzel, Montserrat, dsb.), saiz, warna hex sah, bayang teks, dan lapisan z-index.
     - Laci 3 (Export Options): Pilihan muat turun 1-klik untuk PNG Resolusi Tinggi dan PDF Cetakan A4.
  5. **Kelegaan Ruang Kanvas & Bar Zum Terapung**:
     - Bar zum dinaikkan ke `bottom-16 md:bottom-4` dan kawasan kanvas ditambah padding `pb-24 md:pb-6` agar tidak terhalang oleh bar navigasi bawah.
  6. **Pembaikan Skala Fit (65%) & Limpahan Sisi Kanan (Mobile Canvas Viewport Bounding)**:
     - *Punca Masalah*: Pada mount permulaan, `containerSize` bernilai `{ width: 0, height: 0 }`. Fallback desktop `0.65` menyebabkan kanvas dirender pada kelebaran 730px. Kerana kontena flex `containerRef` kekurangan kelas `min-w-0`, spesifikasi CSS Flexbox menetapkan `min-width: auto` (min-content), menyebabkan kontena mengembang mengikut saiz kanvas 730px. Apabila `ResizeObserver` mengukur kontena, ia membaca 730px dan bukannya kelebaran skrin sebenar (390px), memerangkap pengiraan `fitScale` pada ~65% dan memotong 40% bahagian kanan sijil di luar skrin.
     - *Penyelesaian*: Inisialisasi `containerSize` secara dinamik dengan `window.innerWidth`, sekat (*clamp*) pembacaan `ResizeObserver` kepada `window.innerWidth`, suntik `min-w-0 min-h-0 max-w-full` merentas semua lapisan flex (`dashboard-shell.tsx`, flex-col root, flex-row editor body, dan `containerRef`), dan kira `fitScale` dengan had kelebaran skrin sebenar. Pada telefon pintar (360px-400px), templat landskap 1123px diskalakan secara tepat kepada `~33%` dan muat 100% pada skrin tanpa sebarang keratan teks atau sempadan.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 381 / 381 ujian unit lulus merentas 39 suite fail.

## Pengindahan & Penstrukturan Semula Kawalan Zum Mudah Alih E-Cert Builder (Mobile Zoom Bar Canva/iOS Precision Polish) (2026-10-14)
- **Konteks & Maklum Balas Pengguna**: "kenapa macam tu ya" dan "betulkan yg tu bagi cantik" bersama tangkapan skrin telefon pintar yang membulatkan bar kawalan zum terapung `[-] [Fit (36%)] [+] | 100%` di atas bar navigasi bawah.
- **Punca Masalah Estetika & UX (Root Causes)**:
  1. *Perlanggaran Vertikal*: Kedudukan `bottom-16` (64px) meletakkan bar zum hanya ~12px di atas bar navigasi bawah dock (52px), kelihatan seperti widget desktop terbiar yang terhimpit di atas bar butang bawah.
  2. *Bahan & Gaya Rata (Flat White Pill)*: Gaya `bg-white/95 border-gray-200/90 shadow-lg` kelihatan seperti pelekat putih tebal yang dilekatkan secara rawak di ruang kelabu kanvas.
  3. *Tipografi Mentah*: Butang peratusan memaparkan `Fit (36%)` dalam kurungan dengan kotak biru cyan yang kelihatan seperti teks debug pengaturcara berbanding antaramuka produk premium.
  4. *Ketiadaan Maklum Balas Sentuhan*: Ketiadaan kelas `active:scale` menjadikan butang kaku pada peranti skrin sentuh.
- **Penyelesaian Dilaksanakan**:
  1. **Kapsul Kaca Terapung Frosted Glassmorphism (`app/(dashboard)/certificates/builder/[id]/client.tsx`)**:
     - Menggunakan `bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_25px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] rounded-full p-1`.
  2. **Penyelarasan Ruang Lega Seimbang**:
     - Kedudukan dinaikkan kepada `bottom-20 md:bottom-4` (80px), memberikan ruang lega 28px yang selesa dan seimbang di atas bar dock bawah pada peranti mudah alih, dan kekal rapi di `bottom-4` pada komputer meja.
  3. **Tipografi Segmen & Lencana Pintar (Smart Fit/100% Toggle)**:
     - Menggantikan teks `Fit (36%)` dengan butang segmen berkuasa: memaparkan nombor peratusan kemas (`36%`), ikon `Maximize2` bercahaya zamrud (`text-emerald-400`), dan lencana mikro `FIT` (`bg-white/20 text-white`) di dalam kapsul gelap `bg-slate-900 text-white shadow-xs` apabila mod Fit aktif.
     - Mengklik butang ini bertindak sebagai togol dwiarah pintar: klik ketika Fit akan mengezum ke 100% (saiz sebenar), dan klik ketika Custom Zoom akan mereset kanvas kembali ke Fit.
  4. **Pencahayaan Butang Pratetap 100%**:
     - Butang `100%` menyala secara automatik dengan gaya aktif moden `bg-slate-900 text-white font-semibold shadow-xs` apabila skala kanvas tepat pada 100%.
  5. **Mikro-Interaksi Sentuhan Responsif**:
     - Butang `[-]`, `[+]`, tengah, dan `100%` dilengkapi `active:scale-90` dan `active:scale-95` bersama `select-none` untuk pengalaman sentuhan taktil seumpama aplikasi natif iOS / Canva.
  6. **Penambahbaikan Jalur Status Mudah Alih Atas (`md:hidden`)**:
     - Lencana orientasi (`A4 Landscape / Portrait`) dan butang pintas `Rotate A4` dipertingkatkan dengan reka bentuk butang kapsul moden `bg-slate-100 hover:bg-slate-200`.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 381 / 381 ujian unit lulus merentas 39 suite fail.
  - Pelayan dev mengesahkan sambungan sihat HTTP 200.

## Penyelarasan Bar Zum Mudah Alih ke Warna Tema (Mobile Zoom Bar Theme Color Alignment) (2026-10-14)
- **Konteks & Maklum Balas Pengguna**: "tukar ke warna tema" bersama tangkapan skrin membulatkan bar kawalan zum yang sebelum ini menggunakan lencana hitam `bg-slate-900` dan aksen zamrud `emerald-400`.
- **Penyelesaian Dilaksanakan**:
  1. *Lencana Aktif Fit*: Ditukarkan daripada hitam `bg-slate-900` kepada warna tema rasmi KlikForm (`bg-primary text-white hover:bg-primary/90`) sepadan dengan butang *Save* dan *+ Add Element*.
  2. *Ikon & Teks*: Ikon `Maximize2` ditukar kepada putih `text-white stroke-[2.5]`, dan lencana `FIT` diselaraskan kepada `bg-white/25 text-white`.
  3. *Pratetap 100%*: Pencahayaan aktif butang `100%` diselaraskan ke `bg-primary text-white font-semibold shadow-xs hover:bg-primary/90`.
  4. *Aksen Kapsul & Hover*: Butang `[-]` dan `[+]` kini menyokong `hover:text-primary hover:bg-primary/10 active:bg-primary/20`, manakala kapsul dilengkapi rona bayang tema `shadow-[0_8px_25px_-4px_rgba(124,58,237,0.15)...]` dan `ring-1 ring-primary/20`.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 381 / 381 ujian unit lulus merentas 39 suite fail.

## Penghapusan Ralat Hidrasi E-Cert Builder (Hydration Mismatch Elimination) (2026-10-14)
- **Konteks & Maklum Balas Pengguna**: Ralat konsol React 19 `Uncaught Error: Hydration failed because the server rendered text didn't match the client`. Pelayan (SSR) menjana `width: 374px`, `height: 264px`, teks `33%`, manakala klien (hydration) menjana `width: 424px`, `height: 300px`, teks `38%`.
- **Punca Masalah (Root Cause)**:
  - `containerSize` memulakan nilai menggunakan percabangan `if (typeof window !== 'undefined')`. Di pelayan, `window` adalah `undefined`, maka dimensi ialah `{0, 0}` dan fallback ke lebar skrin `390px` (`fitScale = 33%`). Di klien sewaktu permulaan state, `window.innerWidth` bernilai `440px` (`fitScale = 38%`). Perbezaan dimensi ini menyebabkan React 19 mengesan ketidakpadanan DOM (*hydration mismatch*) pada atribut gaya kanvas dan teks peratusan zum.
- **Penyelesaian Dilaksanakan**:
  1. *Corak `mounted` Guard*: Menambah state `mounted` (`useState(false)` dan diaktifkan `setMounted(true)` dalam `useEffect`).
  2. *Inisialisasi Deterministik*: `containerSize` dimulakan secara seragam kepada `{ width: 0, height: 0 }` di kedua-dua pelayan dan klien awal.
  3. *Skala Garis Asas Sebelum Mount*: Pengiraan `fitScale` semasa `!mounted` menggunakan garis asas tetap yang identikal 100% di pelayan dan hidrasi klien.
  4. *Nyahaktifkan Transisi Awal*: Menyuntik `!mounted ? 'transition-none'` supaya peralihan daripada garis asas ke ukuran sebenar skrin berlaku serta-merta tanpa sebarang kelipan animasi.
  5. *Pertahanan Mendalam (`suppressHydrationWarning`)*: Dipasang pada kontena `<div ref={canvasRef} suppressHydrationWarning ...>` dan lencana teks peratusan zum.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat ESLint.
  - `npm test`: 381 / 381 ujian unit lulus merentas 39 suite fail.

## Pelancaran Pengeluaran Vercel (Production Deployment) (2026-10-14 — E-Cert Mobile Builder Polish, Theme Color Zoom Bar & Hydration Fixes)
- **Komit Git**: `8d707f4` (`feat(ecert,bio): mobile responsive canvas fit, canva-style bottom dock, brand theme zoom capsule, and hydration fixes`).
- **Kaedah Pelancaran**: Tolak ke GitHub (`git push origin master`) dengan pembinaan automatik Vercel (CI/CD).
- **Status Vercel**: ● Ready (Build Time: ~3m).
- **ID Deployment**: `dpl_5WvhfUcP8P1tPd1U5gWtoXV7dvYU`
- **Domain Pengeluaran Aktif**:
  - `https://www.klikform.com`
  - `https://klikform.vercel.app`
  - `https://klikform.com`

## Pembinaan Pemapar 3D Flipbook E-Pamphlet Mandiri (Standalone 3D Flipbook Viewer `index.html`) (2026-10-14)
- **Konteks & Permintaan Pengguna**: Membina pemapar 3D flipbook realistis bertaraf industri seumpama `online.flippingbook.com` dalam satu fail tunggal mandiri `index.html` menggunakan 100% vanilla HTML, CSS 3D transforms, dan JavaScript tanpa kebergantungan luaran, tanpa canvas/webgl, dan berfungsi sepenuhnya di luar talian (offline).
- **Seni Bina & Ciri-Ciri Utama**:
  1. **Seni Bina CSS 3D Murni**:
     - Dimensi buku 880×580px, `perspective: 2600px`, `rotateX(7deg)` condong pandangan dari atas, skala responsif `--scale = Math.min(1, (vw * 0.96) / 880, (vh * 0.84) / 580)`.
     - Lembaran fizikal (`.sheet`): `left: 50%; width: 50%; height: 100%; transform-style: preserve-3d; transform-origin: left center`.
     - Muka helaian (`.face.front` & `.face.back`): `backface-visibility: hidden; inset: 0`, helaian belakang pra-putaran `rotateY(180deg)`.
     - Lapisan Z-index: Helaian belum diselak $N - i$, helaian telah diselak $i + 1$, helaian sedang berputar $N + 10$.
     - Tiada `overflow`, `filter`, atau `clip-path` pada mana-mana bekas induk buku bagi mengelakkan perataan konteks 3D.
  2. **Animasi & Kinematik `requestAnimationFrame`**:
     - Animasi berpandukan rAF dengan `easeInOutCubic` (~780ms).
     - Kinematik angkatan helaian `translateZ(shade * 16px) rotateY(angle)` di mana `shade = sin(min(|angle|/180, 1) * PI)`.
     - Kilauan spekular dinamik `.glare` dipacu oleh pemboleh ubah CSS `--shade`.
     - Anjakan pose buku (`translateX(-25%)` kulit depan, `0%` buka hamparan dua muka, `+25%` kulit belakang) bersama bayang bawah elips yang menjejak pergerakan.
  3. **Interaksi Penuh (Klik, Sentuh/Seret, Papan Kekunci, Audio & HUD)**:
     - Klik kiri (undur helaian) & klik kanan (maju helaian) dengan saringan anjakan klik `< 6px`.
     - Kawalan seretan lancar (*drag-to-flip*) menggunakan `setPointerCapture`, sudut putaran menjejak kursor, ambang lontaran 32%, dan lantunan lembut (*spring back*).
     - Pintasan papan kekunci lengkap: `←`/`→`, `PageUp`/`PageDown`, `Space`, `Home`/`End`, `F` (skrin penuh), `M` (bisu).
     - Bar kawalan HUD kaca terapung (*glassmorphism bottom dock*): Pertama, Sebelum, Penunjuk halaman dinamik ("Kulit Depan", "4–5 / 14", "Kulit Belakang"), Seterusnya, Terakhir, Togol Bunyi, dan Skrin Penuh.
     - Sintesis audio selakan kertas tanpa fail audio menggunakan Web Audio API (white noise bandpass filter ~1500Hz / ~1100Hz).
     - Petunjuk lengkungan bucu (*pulsing corner-curl hint*) pada kulit depan yang pudar secara automatik pada interaksi pertama.
  4. **Kandungan 14 Muka Surat E-Pamphlet Beresolusi Tinggi**:
     - Kulit Hadapan E-Pamphlet mewah emas/gelap, Jadual Kandungan bertitik, Panduan Penggunaan 4 langkah, Rencana Editorial (drop cap & pull quote), Grid 4 Kad Keupayaan Platform, Seni Kecerunan Aurora Murni CSS, Tipografi Gergasi 3D, Sistem Reka Bentuk & Swatches, Grid Statistik Numerik, Mockup Peranti Kanvas Beresolusi Tinggi, Spesimen Tipografi Pelbagai Lajur, Agenda & Garis Masa Acara, Gambaran Teknikal & Penghargaan, serta Kulit Belakang dengan Kod Bar Murni CSS.
- **Fail Terlibat**:
  - `c:\Users\Sofwan\Desktop\klikform\index.html` (Fail utama kendiri, 57KB, 0 pautan luaran, sifar kebergantungan luar).
  - `c:\Users\Sofwan\Desktop\klikform\public\flipbook\index.html` (Salinan untuk akses terus melalui pelayan dev di `http://localhost:3000/flipbook/index.html`).
- **Pengesahan & Ujian**:
  - Pengesahan sintaks JavaScript: 0 ralat sintaks.
  - Sifar kebergantungan luaran: `Contains http: false`, `Contains script src: false`, `Contains link stylesheet: false`.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm test`: 381 / 381 ujian unit lulus merentas 39 suite fail.

## Integrasi Pemapar 3D Flipbook ke Dalam KlikForm (3D Flipbook Implementation in KlikForm) (2026-10-14)
- **Konteks & Permintaan Pengguna**: "sy nak awak impliment di klikform" — Pengguna meminta enjin 3D flipbook realistis yang telah dibina disepadukan secara natif ke dalam aplikasi web KlikForm.
- **Penyelesaian Dilaksanakan**:
  1. **Naik Taraf Pemapar E-Pamphlet Natif (`components/pamphlet/viewer/flipbook-view.tsx`)**:
     - *Struktur Lembaran Fizikal*: Muka surat dipadankan kepada lembaran berengsel pada tulang buku (`left: 50%; transform-origin: left center; transform-style: preserve-3d`), dengan muka hadapan ganjil (1, 3, 5...) dan muka belakang genap (2, 4, 6...) berorientasikan `rotateY(180deg)`.
     - *Kawalan Seretan Taktil (*Drag-to-Flip*)*: Menyokong `setPointerCapture` pada tetikus dan skrin sentuh (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`). Lembaran berputar mengikut kursor secara dinamik. Jika dilepaskan melepasi ambang 32%, selakan diteruskan; jika di bawah 32%, lembaran melantun (*spring back*) kembali ke posisi asal.
     - *Enjin Kinematik `requestAnimationFrame`*: Animasi selakan berpandukan `easeInOutCubic` (~720ms) dengan angkatan spatial `translateZ(shade * 18px)` dan pemboleh ubah CSS `--shade` yang mengawal kilauan spekular dinamik `.glare` pada kedua-dua muka surat.
     - *Lapisan Z-Index Fizikal*: Lembaran belum diselak ($N - i$), lembaran telah diselak ($i + 1$), dan lembaran sedang berputar ($N + 10$).
     - *Anjakan Pose Buku*: `translateX(-25%)` semasa kulit depan, `0%` semasa dua muka surat terbuka, dan `+25%` semasa kulit belakang, dengan bayang elips bawah buku (*ground drop shadow*) yang bergerak seiring.
     - *Tepi Kertas Bertindih (*Stacked Paper Edges*)*: Memaparkan lapisan tepi kertas di sisi kiri dan kanan buku.
     - *Audio Sintetik*: Memanggil `playPageTurnSound(direction)` dengan frekuensi berbeza (~1600Hz mara / ~1200Hz undur) menggunakan Web Audio API tanpa memerlukan fail audio luaran.
     - *Keserasian Penuh*: Mengekalkan fungsi `computeSpread` (lulus semua ujian unit Vitest), navigasi `ref` (`flipNext`, `flipPrev`), papan kekunci, togol skrin penuh, dan integrasi bersama `PamphletToolbar` dan `ThumbnailsStrip`.
  2. **Penyediaan Laluan Awam Showcase E-Pamphlet (`app/(public)/flipbook/page.tsx`)**:
     - Membina laluan awam `/flipbook` di KlikForm yang memaparkan showcase pemapar 3D Flipbook interaktif beresolusi tinggi dengan metadata SEO lengkap.
  3. **Penambahbaikan Utiliti Audio (`lib/pamphlets/utils.ts`)**:
     - Menambah sokongan arah (`direction?: 'forward' | 'backward'`) dalam `playPageTurnSound` untuk frekuensi selakan kertas yang lebih taktil dan realistik.
- **Pengesahan & Ujian Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm test`: 381 / 381 ujian unit lulus merentas 39 suite fail.
  - Ujian HTTP dev server: `/flipbook` (Status 200 OK), `/p/demo` (Status 200 OK).

## Fitur Multi-Day Smart Attendance (1-QR Check-In & Check-Out Berbilang Hari) (2026-10-18)
- **Konteks & Permintaan Pengguna**: "kalau yg ni boleh ke guna untuk event yg lebih daripada sehari?", "kalau tak nak cipta borang byk2 tapi still nk kira jam jgk boleh ke utk multi day?", "so kalau fitur Multi-Day Smart Attendance, boleh guna utk 1 hari jgk kan?", "okay proceed untuk penambah baikan".
- **Objektif Utama**:
  1. Membolehkan penganjur menetapkan tempoh acara berbilang hari (*1 Day, 2 Days, 3 Days, ... 14 Days*) dalam sistem 1-QR Smart Check-In & Check-Out.
  2. Peserta menggunakan **1 kod QR yang sama** merentas keseluruhan hari acara tanpa perlu mendaftar borang berasingan untuk setiap hari.
  3. Mengira waktu masuk, waktu keluar, durasi harian, dan jumlah masa terkumpul (kumulatif) secara automatik bagi syarat kelayakan e-Sijil.
  4. 100% *backward-compatible* dengan acara 1 hari sedia ada (`totalDays = 1` sebagai lalai).
- **Komponen & Seni Bina Dilaksanakan**:
  1. **Pangkalan Data (`supabase/migrations/20261018000000_add_multi_day_attendance.sql`)**:
     - Menambah lajur `day_number integer NOT NULL DEFAULT 1` pada jadual `attendance_records`.
     - Menambah indeks kompaun `idx_attendance_records_form_participant_day ON attendance_records (form_id, identifier_value, day_number)`.
     - Melaksanakan `NOTIFY pgrst, 'reload schema'`.
  2. **Skema Jenis TypeScript (`lib/types/forms.ts` & `lib/types/attendance.ts`)**:
     - `CheckInOutConfig`: Ditambah `totalDays?: number`.
     - `AttendanceRecord`: Ditambah `dayNumber?: number`.
     - `DailyAttendanceDetail`: Jenis baharu untuk butiran harian (`dayNumber`, `checkInTime`, `checkOutTime`, `durationFormatted`, `durationHours`, `status`).
     - `AttendanceSummary`: Diperluas dengan medan `dayNumber`, `totalDays`, `completedDays`, `isAllDaysCompleted`, `totalAccumulatedMinutes`, `totalAccumulatedHours`, `totalAccumulatedFormatted`, `dailyRecords`, `canCheckInNextDay`, `nextDayNumber`.
     - Barrel `lib/types/index.ts` dikemas kini untuk mengeksport `DailyAttendanceDetail`.
  3. **Lapisan Logik Kehadiran (`lib/forms/attendance.ts`)**:
     - `calculateMultiDayAttendanceDuration`: Mengira masa terkumpul merentas semua rekod hari peserta, menolak masa rehat harian (`breakMinutesPerDay`), dan menyusun pecahan harian (`dailyBreakdown`).
     - `checkCertificateAttendanceEligibility`: Menyokong rekod tunggal (keserasian 1-hari) mahupun susunan rekod (`AttendanceRecord[]`). Menguatkuasakan semakan `activeCheckIn` (jika sebarang hari masih `checked_in`, menolak dengan status `not_checked_out` sehingga peserta check out).
  4. **Lapisan Storan Pangkalan Data (`lib/storage/attendance.ts`)**:
     - `getAttendanceRecordsForParticipant`: Mengambil semua rekod hari peserta mengikut `form_id` dan `cleanId`, disusun mengikut `day_number ASC`.
     - `createAttendanceRecord` & `updateAttendanceCheckOut`: Menyokong `day_number`.
  5. **Tindakan Pelayan (`actions/attendance.ts`, `actions/forms.ts`, `actions/certificates.ts`)**:
     - `checkAttendanceStatusAction`: Menilai kemajuan multi-day peserta, mengenal pasti rekod aktif vs rekod hari terdahulu yang telah siap, dan mengesan kesediaan untuk Hari $K+1$.
     - `submitAttendanceCheckInAction`: Tindakan 1-klik untuk mendaftar masuk Hari $K+1$ secara serta-merta tanpa mengisi semula borang.
     - `submitAttendanceCheckOutAction`: Merekod check-out hari berkenaan, mengira durasi kumulatif, dan menyelaraskan Google Sheets dengan lajur dinamik (`Masa Masuk (Hari X)`, `Masa Keluar (Hari X)`, `Jumlah Jam (Hari X)`) serta lajur kumulatif `Jumlah Masa Hadir` dan `Jumlah Jam Keseluruhan (Total Hours)`.
     - `submitFormAction`: Membina kitaran hayat 4-senario (active check-out convert, Day $K+1$ check-in, completion guard, fresh Day 1).
     - `checkCertificateByICOrEmail`: Mengambil semua rekod multi-day dan menilai kelayakan jam terkumpul untuk tuntutan e-Sijil.
  6. **Antaramuka Form Builder & Public Form UX (`app/builder/[id]/client.tsx` & `app/(public)/form/[id]/client.tsx`)**:
     - *Form Builder*: Menambah dropdown "Program Duration (Event Days / Tempoh Acara)" (1 Day hingga 14 Days) dalam kad tetapan 1-QR Check-In & Check-Out.
     - *Public Form*:
       - Lencana `Day X of Y` pada kad `checked_in`.
       - Pecahan sejarah hari-hari sebelum yang telah selesai pada kad `checked_in`.
       - Kad `completed` dwi-mod: Jika ada hari seterusnya (`canCheckInNextDay`), paparan tahniah hari tersebut bersama butang menonjol 1-klik `[ Check-In for Day X+1 Now ]`; jika semua hari selesai, paparan resit digital lengkap pecahan setiap hari dan butang tuntutan e-Sijil.
  7. **Ujian Unit & Kualiti (`tests/attendance-multiday.test.ts`)**:
     - 11 ujian unit baharu merangkumi pengiraan jam terkumpul multi-day, penolakan rehat harian, penilaian kelayakan e-Sijil merentas berbilang hari, dan keserasian rekod tunggal.
     - Selaras mock di `tests/attendance-actions.test.ts` dan `tests/certificate-attendance-gating.test.ts`.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 392 / 392 ujian unit lulus merentas 40 fail suite (semua lulus, 100% sifar regresi).

## Penjajaran Teks Sekata Penerangan Borang (Whitespace Pre-Wrap & Alignment in Description) (2026-10-18)
- **Konteks & Permintaan Pengguna**: "yg tu boleh ke nak sekata macam ni?" bersama gambar tangkapan skrin editor Description di mana pengguna menaip ruang *spacebar* berturut-turut untuk menjajarkan titik bertindih (`:`) bagi Tarikh, Masa, Tempat, dan Pengerusi.
- **Punca Masalah (Root Cause)**:
  - Pelayar web mengikut spesifikasi HTML secara lazim mengecutkan (*collapse*) urutan ruang kosong (multiple spaces) menjadi satu ruang kosong sahaja jika `white-space` tidak ditetapkan kepada `pre-wrap`. Akibatnya, jarak yang ditaip oleh pengguna hilang pada paparan borang awam dan teks menjadi senget.
- **Penyelesaian Dilaksanakan**:
  - `app/globals.css`: Menambah `white-space: pre-wrap; word-break: break-word;` pada peraturan `.ProseMirror`.
  - `components/ui/rich-text-editor.tsx`: Menambah kelas Tailwind `whitespace-pre-wrap break-words` pada atribut editor ProseMirror.
  - `app/(public)/form/[id]/client.tsx`: Menambah kelas `whitespace-pre-wrap break-words` pada kontena paparan Description borang awam.
  - Kini sebarang bilangan *spaces* manual yang ditaip oleh pengguna untuk menjajarkan titik bertindih (`:`) kekal 100% terpelihara dan tertera kemas di borang awam.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 392 / 392 ujian unit lulus merentas 40 fail suite.

## Pengalaman Auto-Tulis Tajuk Soalan Baharu (Instant Question Label Entry Without Manual Deletion) (2026-10-18)
- **Konteks & Maklum Balas Pengguna**: "sepatutnya kalau add new question, bila klik label/question tu auto boleh tulis tajuk, tak perlu padam new question" bersama gambar tangkapan skrin membulatkan kotak input `Label / Question` yang mengandungi nilai "New Question".
- **Punca Masalah (Root Cause)**:
  - Sebelum ini, fungsi `addField()` memasukkan nilai string sebenar `label: 'New Question'`.
  - Apabila pengguna mengklik medan input, kursor mendarat di penghujung teks dan memaksa pengguna menekan Backspace 12 kali untuk memadam "New Question" sebelum dapat menaip soalan sebenar.
- **Penyelesaian Dilaksanakan**:
  - `components/forms/fields-editor/index.tsx`:
    1. *Input Label Pintar*: Ditambah `placeholder="New Question"`, cangkuk `onFocus` & `onClick` yang mengosongkan nilai serta-merta apabila bernilai `'New Question'` (membolehkan pengguna terus menaip tanpa memadam apa-apa), dan cangkuk `onBlur` yang memulihkan `'New Question'` jika input ditinggalkan kosong.
    2. *Aliran Pantas `addField`*: Menjana soalan baharu dengan `label: ''` dan memfokuskan kursor secara automatik ke dalam input tajuk soalan baharu tersebut.
    3. *Keselamatan Duplikasi (`duplicateField`)*: Menyokong fallback tajuk jika soalan asal kosong.
  - `actions/forms.ts`:
    - Memastikan fungsi `updateFormAction` menyaring sebarang soalan yang ditinggalkan kosong dengan tajuk selamat (`Question X` / `Page Break`) sebelum disimpan ke pangkalan data.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 392 / 392 ujian unit lulus merentas 40 fail suite.

## Pelancaran Pengeluaran Vercel (Production Deployment) (2026-10-18 — Multi-Day Attendance, 3D Flipbook Showcase, Whitespace Pre-Wrap & Instant Question Label Entry)
- **Komit Git**: `6ff28bd` (`feat: multi-day smart attendance, 3d flipbook viewer showcase, description whitespace pre-wrap, and instant question title entry`).
- **Kaedah Pelancaran**: Ditugaskan ke GitHub (`origin/master`) dan dideploy melalui Vercel CLI (`npx vercel --prod --yes`).
- **Status Vercel**: ● Ready (Build Time: ~2m).
- **ID Deployment**: `dpl_HhUhjtn5HhbbtFKfanTKLMSLwB4U`
## Pelancaran Pengeluaran Vercel (Production Deployment) (2026-10-18 — 3D Flipbook Viewer Visual Polish, True Aspect Ratio & Balanced Shadow)
- **Komit Git**: `014f378` (`feat(pamphlet): true aspect ratio auto-fit, centered 3d sheet layout, and soft ambient ground shadow`).
- **Kaedah Pelancaran**: Ditugaskan ke GitHub (`origin/master`) dan dideploy melalui Vercel CLI (`npx vercel --prod --yes`).
- **Status Vercel**: ● Ready (Build Time: ~2m).
- **ID Deployment**: `dpl_AdiFtNvKHjE83J2piesTAJmryLfk`
- **Domain Pengeluaran Aktif**:
  - `https://www.klikform.com`
  - `https://klikform-fgipaqt7u-sofwan-jailanis-projects.vercel.app`

## Pengindahan & Penyelarasan Visual Pemapar 3D Flipbook (3D Flipbook Viewer Visual Polish, True Aspect Ratio & Balanced Shadow) (2026-10-18)
- **Konteks & Maklum Balas Pengguna**: Pengguna memuat naik tangkapan skrin pemapar 3D Flipbook bagi risalah landskap 2 muka surat METMalaysia ("GEMPA BUMI") dengan permintaan "yg ni cantikkan sikit".
- **Punca Masalah (Root Cause)**:
  1. *Anjakan Halaman ke Kanan*: Risalah landskap 2 muka surat dinilai sebagai mod halaman tunggal (`!isTwoPageSpread`), menetapkan kelebaran kanvas `bookWidth` bersamaan 1 muka surat. Walau bagaimanapun, elemen lembaran (`sheets`) dikod tegar dengan `left: 50%, width: 50%` (geometri hamparan buku 2 muka surat), menyebabkan helaian dimampatkan separuh saiz di sebelah kanan bekas manakala 50% bahagian kiri kosong.
  2. *Bayang Terkeluar ke Kiri*: Bayang elips bawah diletakkan berpusat pada bekas `left: calc(50% - ...)`, manakala helaian berada di bahagian kanan. Bayang juga tidak mewarisi `--book-shift` dari elemen adik-beradik, menyebabkan bayang hitam pekat (`rgba(0,0,0,0.52)`) terpesong ke kawasan kosong sebelah kiri.
  3. *Letterboxing Tebal Atas & Bawah*: Ketiadaan pengesanan nisbah aspek sebenar menyebabkan risalah menggunakan nisbah potret lalai (0.707) dan mengecilkan brosur landskap (1.414).
  4. *Petunjuk Telefon di Desktop*: Teks "Rotate phone for wide spread" dipaparkan di skrin komputer desktop.
- **Penyelesaian Dilaksanakan**:
  - `components/pamphlet/viewer/flipbook-view.tsx`:
    1. *Pengesanan Nisbah Aspek Sebenar (True Aspect Ratio)*: Ditambah `detectedRatio` yang mengukur dimensi semulajadi (`naturalWidth / naturalHeight`) imej yang dimuat naik, memadankan saiz buku tepat dengan risalah tanpa sebarang ruang kosong letterbox.
    2. *Geometri Helaian Adaptif*: Dalam mod halaman tunggal (`!isTwoPageSpread`), helaian kini mengambil `left: 0%`, `width: 100%`, `transformOrigin: center center`, dan `transform: translateX(0%) rotateX(7deg)`, meletakkan helaian 100% tepat di tengah kanvas pemapar.
    3. *Bayang Studio Berpusat & Lembut*: Bayang bawah dipusatkan secara mutlak (`left: 50%, transform: translateX(-50%)`) dengan kelebaran dinamik (`pageWidth * 1.08` sewaktu kulit hadapan/belakang, `bookWidth * 1.04` sewaktu buku terbuka, dan `bookWidth * 1.06` sewaktu helaian tunggal). Rona diperhalusi kepada kecerunan fotorealistik `radial-gradient(ellipse at center, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0.10) 38%, rgba(0,0,0,0.02) 65%, transparent 78%)` dengan `filter: blur(4px)`.
    4. *Bahan Kertas Studio Bersih*: Menggantikan warna `#faf7f0` kepada putih bersih `bg-white` dengan bayang halus `shadow-[0_4px_24px_-2px_rgba(0,0,0,0.14),0_2px_8px_-1px_rgba(0,0,0,0.08)]` dan sempadan lembut `border-slate-300/60`.
    5. *Kawalan Bersyarat*: Menyembunyikan tulang buku (`crease`) dan tepi bertindih (`stacked paper edges`) apabila beroperasi dalam mod helaian tunggal, serta menghadkan petunjuk telefon hanya pada peranti berskrin kecil (`width < 768px`).
  - `lib/pamphlets/utils.ts`:
    - Mengemas kini `getPamphletOrientation` untuk mengesan `firstPage.aspectRatio > 1.05` sebagai `'landscape'`.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 392 / 392 ujian unit lulus merentas 40 fail suite.








## Susunan Skala & Pilihan Mendatar Borang (Horizontal Scale & Options Layout) (2026-10-19)
- **Konteks & Maklum Balas Pengguna**: Pengguna memuat naik tangkapan skrin telefon pintar bagi bahagian borang penilaian ("C. Penilaian Penceramah") dengan soalan-soalan skala penilaian (cth: "Pencapaian Objektif", "Penyampaian Penceramah", "Pengetahuan Berkenaan Topik", "Interaksi dengan Peserta") yang mempunyai 4 pilihan skala ("Lemah", "Baik", "Sangat Baik", "Cemerlang") yang disusun secara menegak (vertical). Pengguna memohon: *"sy nak scale tu mendatar"*.
- **Punca Masalah (Root Cause)**:
  1. *Ketiadaan Sokongan Teks Berperingkat pada `rating`*: Jenis medan `rating` (*Linear Scale*) hanya terhad kepada nombor (cth: 1 hingga 5). Penganjur yang memerlukan skala penilaian berasaskan perkataan (seperti Lemah / Baik / Sangat Baik / Cemerlang) menggunakan medan `radio` (*Multiple Choice*).
  2. *Susunan Menegak Kod Tegar pada `radio` & `checkbox`*: Dalam `app/(public)/form/[id]/client.tsx`, pilihan medan `radio` dikodkan dengan `space-y-3 pt-2`, memaksa setiap pilihan berada pada baris menegak yang berasingan. Bagi 18 soalan penilaian penceramah, borang memanjang sehingga 72 baris menegak yang memerlukan tatalan skrin yang sangat banyak di telefon pintar.
  3. *Ketiadaan Tetapan Susunan di Form Builder*: Model data `FormField` dan antara muka Form Builder tidak mempunyai pilihan untuk penganjur memilih susunan mendatar atau menegak bagi pilihan jawapan.
- **Penyelesaian Dilaksanakan**:
  - `lib/types/forms.ts`:
    - Menambah sifat `optionsLayout?: 'vertical' | 'horizontal'` pada antara muka `FormField`.
  - `lib/forms/scale-guide.ts`:
    - Membina fungsi `isScaleLikeOptions(options?: string[]): boolean` yang mengesan corak skala penilaian lazim secara automatik berasaskan kamus kata kunci Melayu dan Inggeris (`lemah`, `sederhana`, `baik`, `cemerlang`, `memuaskan`, `setuju`, `puas`, `angka 1-5`, dan `ya/tidak`).
    - Membina fungsi `isFieldHorizontal(field): boolean` yang mengutamakan tetapan eksplisit `field.optionsLayout` dan membuat fallback pintar kepada `isScaleLikeOptions(field.options)`.
  - `app/(public)/form/[id]/client.tsx`:
    - Mengintegrasikan `isFieldHorizontal(field)` pada rendering `radio` dan `checkbox`.
    - Apabila mendatar, menggunakan susunan flexbox padat `flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2.5 pt-2` dengan saiz fon `text-sm sm:text-base` dan padding sentuh mikro `py-1 px-1 rounded-md` bersama `cursor-pointer select-none` pada bulatan dan label teks. Ini membolehkan 4 pilihan skala muat dengan anggun dalam satu baris mendatar pada skrin telefon pintar sekecil 360px tanpa sebarang limpahan mendatar.
  - `components/forms/fields-editor/index.tsx`:
    - Menambah kawalan segmen berikon di bawah input `Options (comma separated)` untuk jenis soalan `radio` dan `checkbox`:
      - Butang `Menegak (Vertical)` (dengan ikon `List`)
      - Butang `Mendatar (Horizontal)` (dengan ikon `Columns3`)
    - Memaparkan lencana status pintar `Skala dikesan automatik (Mendatar)` apabila sistem mengesan pilihan skala penilaian dan tiada susunan manual ditetapkan.
  - `tests/scale-guide.test.ts`:
    - Menambah 11 ujian unit baharu merangkumi skala penilaian pengguna ("Lemah", "Baik", "Sangat Baik", "Cemerlang"), skala Likert Melayu & Inggeris, skala berangka, pilihan polariti, senarai bukan skala (negeri, jabatan), dan keutamaan tetapan eksplisit.
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 452 / 452 ujian unit lulus merentas 45 fail suite.

## Pembaikan Had 26 Lajur Google Sheets & Segerak Data Skala Banyak (Google Sheets >26 Columns Auto-Resize & Pending Sync) (2026-10-19)
- **Konteks & Laporan Pengguna**:
  - Pengguna bertanya: *"kenapa ya data tak masuk di google sheet"* dan menduga *"sy rasa data tak masuk bila ada soalan scale byk2"*.
- **Punca Asal (Root Cause Analysis)**:
  1. *Had Grid 26 Lajur Google Sheets (`google-spreadsheet`)*:
     - Setiap helaian baru di Google Sheets secara lalai hanya mempunyai 26 lajur (A hingga Z, `columnCount = 26`).
     - Pakej `google-spreadsheet` (`node_modules/google-spreadsheet/dist/index.js:798-800`) menyemak:
       ```javascript
       if (headerValues.length > this.columnCount) {
         throw new Error(`Sheet is not large enough to fit ${headerValues.length} columns. Resize the sheet first.`);
       }
       ```
     - Apabila borang mempunyai 18 soalan skala penilaian bersama medan asas pendaftaran (Timestamp, _submission_id, Nama, IC, Emel, No Tel, Agensi, dll.), jumlah lajur mencecah 27 hingga 30+ lajur.
     - Fungsi `appendToSheet` tidak pernah memanggil `sheet.resize`, menyebabkan `google-spreadsheet` melemparkan exception secara senyap dalam latar belakang (`after()`), menggugurkan penyegerakan ke Google Sheet bagi borang yang mempunyai banyak soalan skala!
  2. *Medan Susun Atur Mencemari Google Sheets*:
     - Di `app/(public)/form/[id]/client.tsx`, `handleSubmit` memasukkan medan pemisah seksyen (`separator`) dan imej (`image`) ke dalam `FormData` sebagai rentetan kosong `""`.
     - Ini bukan sahaja membazirkan lajur Google Sheet dan menghimpit had 26 lajur, malah berisiko mencetuskan ralat `Duplicate header detected` sekiranya label pemisah kosong atau bertindih.
  3. *Pengepala Kosong / Bertindih*:
     - `google-spreadsheet` tidak membenarkan nama lajur berulang atau kosong tanpa disambiguasi.
- **Penyelesaian Dilaksanakan**:
  - `lib/api/google-sheets.ts`:
    - Membina pembantu `ensureSheetCapacity(sheet, requiredColumns)`:
      - Memeriksa `sheet.columnCount` (lalai 26).
      - Sekiranya `requiredColumns > sheet.columnCount`, memanggil `await sheet.resize({ columnCount: Math.max(requiredColumns + 10, currentCols + 10), rowCount })` dengan margin padding +10 lajur.
    - Membina pembantu `sanitizeHeaders(rawHeaders)`:
      - Memangkas ruang putih (*whitespace*).
      - Menggantikan pengepala kosong dengan `Kolom_X`.
      - Menyahduplikasi nama lajur bertindih secara automatik dengan akhiran nombor (`Tajuk (2)`, `Tajuk (3)`).
    - Menyelaras `appendToSheet`, `updateSheetRow`, dan `syncDailyAttendanceToSheet` untuk memanggil `sanitizeHeaders` dan `ensureSheetCapacity` sebelum sebarang panggilan `setHeaderRow`.
  - `app/(public)/form/[id]/client.tsx`:
    - Menggunakan `isLayoutOnlyField(field)` di dalam `handleSubmit` untuk menyaring keluar medan `separator`, `image`, dan `pagebreak` daripada dihantar ke `FormData`.
  - `actions/forms.ts`:
    - Menyaring keluar kunci kosong (`!key.trim()`) dan label susun atur daripada `dbData`.
  - `actions/sheets.ts`:
    - Mencipta fungsi Server Action baharu `syncPendingResponsesForFormAction(formId)` yang menyemak rekod `pending` di Supabase `form_responses` dan menolak data ke Google Sheet dengan auto-resize.
  - `app/(dashboard)/responses/client.tsx`:
    - Menambah butang berikon `Sync Data` bersebelahan butang `Open Sheet` di kad borang tab Responses supaya penganjur boleh menekan butang tersebut untuk menyegerakkan sebarang data tertunggak (*pending*) serta-merta tanpa perlu menunggu cron harian.
  - `tests/sheet-capacity.test.ts`:
    - Menambah 9 ujian unit baharu menguji sanitasi ruang putih, penamaan lajur kosong, penyahduplikasi pengepala bertindih, auto-resize lajur > 26 (35 lajur -> 45 lajur), keserasian lajur sedia ada, dan simulasi borang 18 soalan skala penilaian (semua lulus).
- **Pengesahan & Kualiti**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm test`: 461 / 461 ujian unit lulus merentas 46 fail suite.
  - `npm run build`: Kompilasi Next.js 16 Turbopack bersih tanpa sebarang ralat (58 laluan).
- **Penerapan Vercel Production**:
  - Commit `f6fccef` ditolak ke `origin/master`.
  - Vercel Deployment ID: `dpl_DDvTo9K7odKgpNTUQoPQ5VNheS9i`.
  - Domain Pengeluaran: `https://www.klikform.com` (HTTP 200 OK).
  - Status: Selesai & Beroperasi Penuh di Pengeluaran.

## Reka Bentuk Semula Halaman Semakan E-Sijil (`/check/[formId]`) & Pengecaman Lajur E-mel Mantap (2026-10-19)
- **Konteks & Permintaan Pengguna**:
  - Pengguna berkongsi tangkapan skrin halaman semakan e-sijil (`/check/[formId]`) yang kelihatan ringkas/pudar dan memaparkan kotak merah kasar *"Certificate Not Found / Email field not found in Google Sheet"* selepas memasukkan e-mel, dengan arahan: *"cantikkan halaman ni"*.
- **Punca Asal (Root Cause Analysis)**:
  1. *Pengesanan Lajur E-mel Yang Terhad*:
     - Logik carian lajur e-mel di `actions/certificates.ts` hanya menyemak `lower === 'email'` (padanan tepat) atau `lower.includes('emel')`.
     - Sekiranya lajur spreadsheet dinamakan `"Email Address"`, `"Alamat Email"`, atau `"Email Peserta"`, semakan gagal dan mencetuskan ralat `"Email field not found in Google Sheet"`.
  2. *Ketiadaan Panduan Kontekstual untuk Borang Berasaskan No. IC*:
     - Sekiranya sesuatu acara hanya mengumpulkan No. IC peserta (tiada medan e-mel), peserta yang mencuba mencari melalui e-mel disajikan dengan ralat sistem mentah *"Email field not found in Google Sheet"*, bukannya panduan mesra untuk menggunakan No. IC.
  3. *Estetika Antara Muka Pengguna*:
     - Latar belakang putih/pudar tanpa kedalaman visual, ikon kecil tanpa pencahayaan, input tanpa ikon status, butang asas, dan kotak ralat merah kaku di bawah kad carian.
- **Penyelesaian Dilaksanakan**:
  - `lib/certificates/headers.ts`:
    - Membina pembantu `isEmailHeader(h: string): boolean` yang menyokong variasi Bahasa Melayu & Inggeris: `email`, `e-mel`, `e-mail`, `emel`, `mail`, `alamat e-mel`, `email address`, `alamat emel`, `user email`, `emel peserta`, dan regex perkataan terasing `/\b(email|emel|mail)\b/i`.
  - `actions/certificates.ts`:
    - Menggunakan `isEmailHeader` untuk carian lajur e-mel.
    - Menambah sandaran automatik ke definisi medan borang (`form.fields.find(f => f.type === 'email')`).
    - Menambah sifat `missingField?: 'email' | 'ic' | 'name'` pada antara muka `CertificateCheckResult`.
  - `app/(public)/check/[formId]/client.tsx`:
    - **Latar Belakang Ambien**: `bg-slate-50` dengan *gradient mesh* atas dan bulatan kabur lembut (blur orbs) untuk rasa mewah dan rasmi.
    - **Pengepala Portal Rasmi**: Lencana terapung berkembar (`Award` + `ShieldCheck`), lencana status *"Portal Semakan E-Sijil Rasmi"*, tipografi tajuk tebal seimbang (`[text-wrap:balance]`), dan arahan mesra.
    - **Kad Carian Moden**: Kontena kaca berkontur `rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-xl`. Input carian pintar dengan penukaran ikon masa nyata (`Mail` jika `@`, `CreditCard` jika nombor, atau `Search`), butang pemadam pantas `X`, dan panduan format. Butang sahkan sijil berkilat dengan status memuatkan dinamik.
    - **Kad Maklum Balas Kontekstual (Menggantikan Kotak Merah Kasar)**:
      - *Ketiadaan lajur e-mel*: Kad lembut ambar memaklumkan borang menggunakan No. IC berserta butang 1-klik `[ Gunakan Nombor Kad Pengenalan (No. IC) ]`.
      - *Ketiadaan lajur IC*: Kad lembut biru memaklumkan borang menggunakan E-mel berserta butang 1-klik `[ Gunakan Alamat E-mel ]`.
      - *Tiada rekod*: Kad rose lembut dengan ringkasan carian dan senarai panduan semakan mesra pengguna (semak sengketa, ejaan e-mel, dan hubungi urusetia).
    - **Penyelarasan Sudut Kad**: Semua kad keputusan dan pratonton dinaik taraf ke `rounded-3xl` yang selaras.
    - **Kaki Halaman (Footer)**: Ditambah pengesahan digital selamat KlikForm.
  - `tests/certificate-headers.test.ts`:
    - Menambah 4 suite ujian unit baharu untuk `isEmailHeader` (padanan standard, padanan majmuk MY/EN, kepekaan huruf, dan penolakan lajur tidak berkaitan).
- **Pengesahan & Kualiti**:
  - `npm test`: 465 / 465 ujian unit lulus merentas 46 fail suite.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm run build`: Kompilasi Next.js 16 Turbopack bersih tanpa sebarang ralat (58 laluan).

## Sisipan Pemisah Halaman Kontekstual Pada Setiap Soalan (2026-10-19)
- **Konteks & Permintaan Pengguna**:
  - Pengguna mendapati menambah pemisah halaman leceh apabila borang mempunyai banyak soalan: *"add page break ni leceh pulak bila soalan dh byk, boleh tak letak je di setiap question kalau nak add page break"*.
- **Penyelesaian Dilaksanakan**:
  - `components/forms/fields-editor/index.tsx`:
    - Fungsi `insertPageBreak(afterIndex)` menggunakan `splice(afterIndex + 1, 0, newPageBreak)` untuk menyuntik pemisah terus di bawah soalan yang dipilih.
    - Menambah butang `[ + Pemisah Halaman ]` pada `CardHeader` setiap soalan di sebelah butang Salin & Padam.
    - Menambah pintasan pantas di bahagian bawah `CardContent`: `Mahu jadikan soalan seterusnya pada halaman baharu? [ + Tambah Pemisah di sini ]`.
    - Pengesanan `hasNextPageBreak`: bertukar kepada lencana `✓ Pemisah Aktif` secara automatik jika pemisah telah wujud di bawah soalan berkenaan untuk mengelakkan pemisah kosong berganda.
  - `tests/pagination.test.ts`:
    - Menambah ujian unit penyisipan dan pengesahan pemecahan halaman berbilang muka surat.
- **Pengesahan & Kualiti**:
  - `npm test`: 467 / 467 ujian unit lulus.
  - `npm run typecheck`: 0 ralat.
  - `npm run lint`: 0 ralat.
  - `npm run build`: Bersih (58 laluan).

## Penyesuaian Dinamik Portal Pengesahan Sijil Awam Berasaskan Medan Borang (2026-10-19)
- **Konteks & Permintaan Pengguna**:
  - Maklum balas pengguna: *"dekat sini kalau form yg ada emel baru letak emel, kalau form yg ada ic baru letak ic, kalau ada dua2 baru letak dua2"* (`media_1792425039076_07d2b73a.png`).
- **Punca Asal (Root Cause Analysis)**:
  - Portal semakan sijil awam (`/check/[formId]`) sebelum ini menetapkan tajuk kecil, penerangan kad, label, dan contoh input secara statik ("No. Kad Pengenalan / E-mel") untuk SEMUA borang, walaupun borang tersebut hanya mengumpul e-mel sahaja atau No. IC sahaja. Ini mengelirukan responden dan mencetuskan ralat carian apabila format yang salah dimasukkan.
- **Penyelesaian Dilaksanakan**:
  - `lib/certificates/headers.ts`:
    - Mentakrifkan jenis `CertificateVerificationMode = 'both' | 'ic_only' | 'email_only'`.
    - Menambah sokongan kata kunci `mykad` pada `isIcHeader`.
    - Membina fungsi tulen `detectVerificationMode(fields?: MinimalFormField[] | null): CertificateVerificationMode` yang menyemak jenis medan `email`, label emel, label IC, perkataan MyKad, serta corak regex IC Malaysia (`[0-9]{12}` atau `[0-9]{6}-[0-9]{2}-[0-9]{4}`).
  - `actions/certificates.ts`:
    - Mengimport `detectVerificationMode`.
    - `getFormForCertificateCheck(formId)` memulangkan `verificationMode: detectVerificationMode(form.fields)` sifar-latensi daripada rekod borang Supabase sedia ada.
  - `app/(public)/check/[formId]/page.tsx`:
    - Menghantar `verificationMode={form.verificationMode}` kepada `<CertificateCheckClient>`.
  - `app/(public)/check/[formId]/client.tsx`:
    - Menerima prop `verificationMode?: CertificateVerificationMode`.
    - Menyelaras `modeContent` (`subtitle`, `cardDesc`, `label`, `example`, `placeholder`, `hint`, `emptyToast`, `inputMode`, `type`):
      1. `email_only`: Memaparkan "Alamat E-mel", contoh `nama@email.com`, `inputMode="email"`, ikon `Mail`, sari kata khusus e-mel, dan tip domain e-mel pada kad Not Found.
      2. `ic_only`: Memaparkan "No. Kad Pengenalan (IC)", contoh `901234567890`, `inputMode="numeric"`, ikon `CreditCard`, sari kata khusus No. IC, dan tip 12-digit No. IC pada kad Not Found.
      3. `both`: Mengekalkan carian fleksibel dwi-pengenalan "No. Kad Pengenalan / E-mel" dan peralihan ikon carian dinamik.
    - Menambah `mismatchWarning`: Memberikan maklum balas interaktif proaktif jika responden menaip tanda `@` pada borang `ic_only`, atau menaip digit angka pada borang `email_only`.
  - `tests/certificate-headers.test.ts`:
    - Menambah 5 ujian unit baharu untuk `detectVerificationMode` (merangkumi `both`, `email_only`, `ic_only`, regex IC, MyKad, dan sandaran).
- **Pengesahan & Kualiti**:
  - `npm test`: 472 / 472 ujian unit lulus merentas 46 fail suite.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm run build`: Kompilasi Next.js 16 Turbopack bersih tanpa ralat (58 laluan).

## Penyorokan Automatik Kad Carian Semakan Sijil Awam (`Auto-Hide Search Box`) (2026-10-20)
- **Konteks & Permintaan Pengguna**:
  - Pengguna meminta agar kotak carian disorokkan secara automatik sebaik sahaja sijil keluar: *"yg tu bila dh keluar sijil boleh tak auto hide, maksudnya keluar sijil sahaja"* (`media_1792426318854_180222fc.png`).
- **Punca Asal (Root Cause Analysis)**:
  - Sebelum ini, apabila carian rekod peserta berjaya (`result?.found === true`), kad "Semakan Rekod Peserta" berserta medan input dan butang semakan kekal berada di atas bahagian sijil dengan margin `mb-8`. Ini memakan ruang menegak ~350px dan menolak kad pratonton sijil serta butang muat turun ke bawah (*below the fold*), memaksa pengguna menatal skrin ke bawah.
- **Penyelesaian Dilaksanakan**:
  - `app/(public)/check/[formId]/client.tsx`:
    - Membalut kad borang carian dengan syarat `{!result?.found && ( ... )}` supaya kad carian dinyahlekap secara automatik apabila rekod sijil dijumpai.
    - Menyelaras teks sari kata pengepala secara dinamik: bertukar kepada *"Sijil rasmi anda telah berjaya disahkan dan sedia untuk dimuat turun."* apabila sijil ditemui.
    - Menambah bar tindakan pantas atas (`Top Quick Action Bar`) dengan butang `[ 🔄 Semak Peserta Lain ]` dan lencana status `✓ Rekod Peserta Disahkan`.
    - Menambah butang `[ 🔄 Semak Sijil Peserta Lain ]` pada kad perincian kiri di bawah butang Muat Turun PNG untuk membolehkan responden memulakan semula carian tanpa perlu menyegarkan semula (*reload*) halaman.
- **Pengesahan & Kualiti**:
  - `npm test`: 472 / 472 ujian unit lulus merentas 46 fail suite.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm run build`: Kompilasi Next.js 16 Turbopack bersih tanpa sebarang ralat (58 laluan).

## Pengoptimuman Tab Pemilih Sijil Harian & Pencegahan Herotan Rapat (2026-10-20)
- **Konteks & Permintaan Pengguna**:
  - Maklum balas pengguna: *"kenapa macam rapat sgt"* berserta bulatan merah pada butang `Semua Hari (Penuh) (October 7, 2026 - October 19, 2026)` yang terlipat kepada 2 baris dan menghimpit sempadan kanan kad pratonton secara ketat (`media_1792426944975_4cb4e59a.png`).
- **Punca Asal (Root Cause Analysis)**:
  - Di dalam sub-header pratonton langsung (`app/(public)/check/[formId]/client.tsx`), label pilihan sijil digabungkan dengan tarikh penuh `{opt.label} ({opt.formattedDate})`. Untuk pilihan gabungan, rentetan ini mencapai 56 aksara (`Semua Hari (Penuh) (October 7, 2026 - October 19, 2026)`).
  - Tanpa `whitespace-nowrap`, pelayar memecahkan teks selepas tanda sempang, memaksa bahagian tarikh ke baris kedua dan membengkakkan ketinggian butang serta menolaknya rapat ke sempadan kanan kad.
  - Pada kad perincian kiri, kelebaran teks tarikh mendatar menolak tajuk sehingga terpotong menjadi elipsis `Semua Hari (...`.
- **Penyelesaian Dilaksanakan**:
  - `app/(public)/check/[formId]/client.tsx`:
    - **Tab Sub-Header Ringkas & Lapang**: Memaparkan `opt.label` sahaja (`[ 🏅 Hari 1 ]`, `[ 🏅 Hari 2 ]`, `[ 🏅 Semua Hari (Penuh) ]`) dengan `whitespace-nowrap shrink-0` dan kontena `justify-between gap-3`. Ini menjimatkan ~300px ruang mendatar dan menghalang sebarang pemecahan baris hodoh. Tarikh penuh dipaparkan secara automatik pada sari kata tajuk di atasnya dan melalui atribut `title`.
    - **Susunan Bertindan Kad Perincian Kiri**: Mengubah butang senarai pilihan kehadiran kepada susunan 2 baris (`flex-col gap-0.5`). Baris 1 memaparkan tajuk penuh `Semua Hari (Penuh)` dan lencana `Aktif`, Baris 2 memaparkan julat tarikh penuh di bawahnya. Ini menghapuskan 100% isu pemotongan teks elipsis.
- **Pengesahan & Kualiti**:
  - `npm test`: 472 / 472 ujian unit lulus merentas 46 fail suite.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm run build`: Kompilasi Next.js 16 Turbopack bersih tanpa sebarang ralat (58 laluan).



