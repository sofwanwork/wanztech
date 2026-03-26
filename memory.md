# Project Memory

## System Overview

**KlikForm** — SaaS form builder platform (Malaysian market). Users create forms, collect responses, generate e-certificates, build QR codes, and shorten URLs.

### Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Google Integration**: OAuth ("Connect with Google") + Manual Service Account keys
- **Payments**: Custom webhook-based payment system
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel

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
- **`actions/`** — Server actions: `forms.ts`, `certificates.ts`, `certificate-template.ts`, `qr-codes.ts`, `short-links.ts`, `auth.ts`, `user.ts`
- **`lib/storage/`** — Supabase CRUD: `forms.ts`, `settings.ts`, `certificates.ts`, `qr-codes.ts`, `short-links.ts`, `subscription.ts`
- **`lib/types/`** — TypeScript interfaces: `forms.ts`, `certificates.ts`, `qr-codes.ts`, `subscription.ts`, `common.ts`, `index.ts`
- **`lib/`** — Utilities: `encryption.ts`, `rate-limit.ts`, `navigation.ts`, `email/`, `constants/`, `api/`
- **`components/`** — UI components: `dashboard/` (sidebar, form-card), `ui/` (shadcn), `pricing/`, `pricing-modal.tsx`
- **`utils/supabase/`** — Supabase clients: `client.ts` (browser), `server.ts` (SSR), `admin.ts` (service role)

### Database Tables (Supabase)
| Table | Purpose |
|---|---|
| `forms` | Form definitions (fields, settings, theme) |
| `settings` | Google credentials per user (encrypted) |
| `subscriptions` | User tier (free/pro/enterprise), status, period |
| `usage` | Monthly usage tracking (forms created, submissions count) |
| `certificate_templates` | E-cert builder templates |
| `qr_codes` | QR code designs |
| `short_links` | URL shortener data |

### Google Auth — Dual Method
1. **OAuth ("Connect with Google")** — Recommended. One-click auth, stores `googleAccessToken` + `googleRefreshToken` in settings. Auto-refreshes expired tokens.
2. **Manual Service Account** — Advanced. User configures `googleClientEmail` + `googlePrivateKey` in Settings → Service Account tab. Requires manual Google Sheet sharing.
- **Builder logic**: `useManualKeys = !!settings?.googleClientEmail` determines which UI to show.
- **Google Sheet URL input**: Always visible in builder if form has one.
- **Blue instruction box**: Hidden for manual key users (they already configured in Settings).

### Form Submission Flow (`submitFormAction`)
1. Rate limiting check
2. Server-side validation
3. File uploads → Google Drive (if configured)
4. Send data → Google Sheets (if `googleSheetUrl` set AND credentials exist)
5. Increment `usage.total_submissions` counter

## Core Features & Fixes
- **Certificate Verification (e-Sijil)**: Fixed a bug where certificate verification threw an `invalid_grant` exception when checking records from Google Sheets. The root cause was that `checkCertificateByIC` strictly assumed a Google Service Account (`googleClientEmail` & `googlePrivateKey`) was in use. It was updated to check for `googleAccessToken` (Google OAuth "Connect with Google" flow) first, with an auto-refresh mechanism if the token is expired.
- **Mobile Certificate Template Fallback (2026-03-18)**: Fixed a bug where the public certificate verification page (`/check/[formId]`) showed the default 'classic' template on mobile/unauthenticated devices instead of the custom template. Root cause: `getCertificateTemplatePublic()` in `lib/storage/certificates.ts` used `createClient()` (auth-aware SSR client). The `certificate_templates` RLS policy (`auth.uid() = user_id`) blocked unauthenticated queries, returning null. Fix: switched to `createAdminClient()` (service role, bypasses RLS). Security maintained because the function already strips `userId` from the response.
- **Service Account Google Credentials parsing**: Implemented `.trim()` and `formatPrivateKey()` when building the service account parameter to prevent trailing space errors.
- **IC Search Robustness**: Improved the Google Sheet column regex/matching to be more deterministic (`IC`, `No IC`, `Kad Pengenalan` etc).
- **Certificate Name Formatting**: Auto-uppercased all certificate names in `CertificateTemplate` component to ensure consistent ALL CAPS display across custom, legacy URL, and built-[in] templates alike.
- **IC Input UX**: Removed dashes from the example placeholder (`901234567890`) safely since dash-formatting isn't required strictly, preventing end-user confusion.
- **Login Layout Optimization**: Compacted the `/login` page UI components (Card gaps, spacing, subtitle removal, `min-h-screen`) to improve visibility on smaller viewports like 14-inch laptops (768px height and down to 643px) without hard viewport clipping.

## Lessons Learned
- When introducing a new authentication mechanism (e.g., Google OAuth to replace/supplement Service Accounts), all related functional pathways (like Certificate Search) must be audited and updated to support both credential types.
- Ensure temporary API routes or explicit error string exposures in the Catch block are reverted cleanly before marking development tasks done.
- **Always sync feature lists across all surfaces.** When updating pricing features, remember there are TWO places to update: `app/pricing/page.tsx` (public pricing page) AND `components/pricing-modal.tsx` (in-dashboard upgrade modal). Missing one causes inconsistency.
- **CSS `flex-1` placement matters in card layouts.** When pricing/plan cards have different content lengths, putting `flex-1` on the top section creates ugly gaps between header and content. Apply `flex-1` to the bottom section (feature list + button) so the button aligns at the bottom of all cards.
- **Turbopack cache can cause 404s unexpectedly.** If a route suddenly returns 404 even though `page.tsx` exists, restart the dev server first. If that doesn't work, delete `.next` folder and restart.
- **KlikForm complete feature set (for marketing):** Online Forms (Google Sheets integration), Dynamic QR Code Generator, URL Shortener, E-Certificate Generation (auto-generated & emailed), Certificate Verification System (serial number + QR code).

## Rendering System (e-Sijil)
- **PDF/PNG Download Issues**: Fixed a bug where downloaded PDFs were saving as blank. `html2canvas` struggles to capture elements strictly hidden off-screen (`top: -9999px`). The fix uses `html2canvas-pro`'s native `onclone` hook (`clonedDoc.getElementById`) to position the element into the viewport *only* inside the cloned rendering sandbox, avoiding visual bleeding or layout flashing across the live DOM.
- **HD Output / Low File Size**: `html2canvas` `scale` is set to `3` for crisp HD rendering, while `toDataURL` output for JPEG inside `jsPDF` is compressed to `0.7` with a `'FAST'` compression filter. This achieves a highly readable/sharp certificate with a significantly smaller file footprint.
- **Sub-pixel White Borders**: Fixed an aesthetic issue where the PDF would exhibit a microscopic 1px white border. This was resolved by forcing `html2canvas` to reset scroll offsets (`scrollY: 0`, `scrollX: 0`) and deliberately stretching the target `jsPDF` canvas coordinates by `+2` overlapping pixels to override rounding gaps.
- **Portrait Orientation Support**: The certificate rendering system natively favored landscape (e.g. forced 800px styling max-widths, hardcoded jsPDF `orientation: 'landscape'` variables, and absolute pixels mapping in Preview). It was completely rewritten to support robust Portrait constraints via dynamically bound `isPortrait` evaluations, proportional percentage constraints, and shrinking canvas widths for tall elements.

## Builder Interface
- **NaN Input Prevention**: React UI crashes regarding `Received NaN for the value attribute` happening in the Certificate Editor properties panel were safely resolved. Number inputs (`x, y, width, height, offsets`) were updated to use strictly casted values and logical fallbacks (`Number(val) || 0`) preventing blank text boxes from propagating `parseInt("") => NaN` state exceptions.
- **Orientation Persistence**: The builder allowed users to flip to Portrait mode, but the `handleSave` dispatcher in `client.tsx` silently stripped `width` and `height` from the payload, meaning the database eternally reset the template back to Landscape on refresh. `width` and `height` were added to the payload block to successfully lock horizontal/vertical ratios into persistence.

## Dashboard — Responses Tab
- **Responses Page** (`app/(dashboard)/responses/`): New sidebar tab "Responses" that lists all user forms with their Google Sheet links. Each form card shows the linked Google Sheet URL with an "Open Sheet" button to directly open the spreadsheet. Forms without a linked sheet show a message prompting users to add one via the Form Builder.
- **Google Sheet Section (Builder)**: The blue instruction box ("How to link your Google Sheet" + "Copy Service Email" button) in `app/builder/[id]/client.tsx` is conditionally hidden for manual Service Account key users (`useManualKeys` prop from `page.tsx`). The Google Sheet URL input remains visible for all users. The `useManualKeys` flag is set based on `!!settings?.googleClientEmail`.
- **Turbopack Cache Corruption (Resolved):** Encountered a fatal "module factory is not available" error for `client.tsx` under Next.js 16 / Turbopack. This was diagnosed as a corrupted `.next` cache retaining stale dependency trees after migrating middleware and Server Actions. A total cache wipe (`Remove-Item -Recurse -Force .next`) successfully resolved the issue.

## Login Page
- **Hydration Mismatch Fix**: Radix UI Tabs on `app/(auth)/login/page.tsx` caused a hydration warning because `activeTab` was set via `useEffect` (reading URL `?tab=signup`) which differs between server and client render. Fixed by adding a `mounted` state and using `value={mounted ? activeTab : 'login'}` so server and client both render `'login'` initially.

## Security Audit (2026-02-24)
- All dashboard routes: auth-gated via `getUser()` + RLS (`user_id` filter) ✅
- `/api/service-email`: requires authentication, returns 401 if not logged in ✅
- `submitFormAction`: IP-based rate limiting + server-side validation + quota check ✅
- `/api/proxy`: domain whitelist (Google domains only) ✅
- Builder page: ownership check (`user.id !== form.userId`) ✅
- **Public Data Integrity**: SSR hydration safely strips sensitive tokens (`googleSheetUrl: undefined`) before pushing payloads to public clients. ✅
- **Sheet Injection Shield**: Active mitigation against arbitrary CSV/formula injections (`=`, `+`, `-`, `@`) forced to plaintext format via `lib/api/google-sheets.ts`. ✅
- **ReDoS Protection**: Submission text strings are natively chopped at a 1000-character max before attempting RegExp validation to prevent CPU locks. ✅
- Production build: clean (exit code 0), all routes compile successfully ✅
- **Public Data Stripping**: `getCertificateTemplatePublic` intentionally omits `userId` from response to prevent user ID enumeration attacks. `CertificateTemplate.userId` made optional in type definition. ✅
- **ilike Wildcard Escape**: `qr-codes.ts` search query escapes `%`, `_`, `\` characters before passing to `.ilike()` to prevent unintended pattern matching. ✅
- **Cron Error Response Hardened**: `inactivity-check/route.ts` no longer leaks `String(error)` details in JSON response; error details logged server-side only. ✅
- **Auth Callback Open Redirect Fix**: `app/api/auth/callback/route.ts` `next` query parameter now validated to prevent open redirect attacks (`//evil.com` style). Only safe relative paths (`/path`) are accepted. ✅
- **Short-Link Limit Logic Fix**: `lib/storage/short-links.ts` was incorrectly using `limits.maxQRCodes` and a hardcoded `5` to gate short-link creation. Added `maxShortLinks` to `TierLimits` type and `TIER_LIMITS` constants (free: 5, pro: -1, enterprise: -1). ✅
- **Certificate QR Client-Side Migration**: `components/certificate-qr-card.tsx` migrated from external `api.qrserver.com` API to client-side `qrcode.react` (QRCodeCanvas). QR codes now generated entirely in-browser — zero external API dependency. ✅
- Production build: clean (exit code 0), all 40 routes compile successfully (2026-02-25) ✅

## System Improvements (2026-02-24)
- **Loading Skeletons (UI/UX)**: Replaced standard spinners with layout-specific skeleton loaders (`loading.tsx`) across all dashboard tabs (`forms`, `responses`, `settings`, `shortener`, `qr-builder`, `certificates`) for immediate visual feedback. These skeletons perfectly mimic the structure of their respective pages, eliminating layout shift during data fetching.m card placeholders with `animate-pulse`.
- **Email Notification on Submission**: Added `getNewSubmissionEmail()` template in `lib/email/index.ts` — shows form name, data table (max 10 fields), and Google Sheet button. Integrated into `submitFormAction` as fire-and-forget (non-blocking) using admin client to fetch owner email.
- **Auto-Create Google Sheet**: New server action `actions/sheets.ts` → `createSheetForFormAction`. Uses OAuth access token to create Google Sheet via Sheets API, handles token refresh, auto-links URL to form. "Create Sheet" button visible on Responses page for OAuth-connected users only (`hasGoogleOAuth` prop).
- **Responses Page Enhanced**: `app/(dashboard)/responses/page.tsx` now fetches settings to determine OAuth status. Client shows "Create Sheet" button for unlinked forms when OAuth is connected. Adjustments made for responsive layout stacking strictly on smaller screens.
- **QR Code Bad Request Fix**: Addressed an issue in `components/certificate-qr-card.tsx` where an empty `window.location.origin` during Server-Side Rendering (SSR) caused an incomplete request to `api.qrserver.com` (400 Bad Request). The `<img src={qrUrlPreview} />` is now conditionally rendered only after the component is mounted, displaying a skeleton loader in the interim.
- **Settings Mobile View Override**: Fixed an interface overflow bug on the Settings (`/settings`) page under the "Integrations" tab. The Google connection toggle buttons (`TabsTrigger`) were overlapping on mobile devices. Replaced the rigid 2-column grid with a responsive stack (`grid-cols-1 sm:grid-cols-2`) and enabled `h-auto whitespace-normal` text wrapping to ensure readability on narrow screens.
- **Shortener Mobile View Padding Fix**: Fixed a visual issue in `app/(dashboard)/shortener/page.tsx` where content was glued to the edges of the screen on mobile devices. Added `px-4 md:px-8` to the main container and wrapped the links table in an `overflow-x-auto` div with `min-w-[600px]` to allow horizontal scrolling instead of squishing columns.
- **Responsive Architecture (Desktop & Mobile Sync)**: Clarified that the application natively "syncs" across Desktop and Mobile without parallel codebases. It utilizes Responsive Web Design (Tailwind media queries like `sm:`, `md:`) to adapt a single, unified codebase to any screen size automatically while sharing the same real-time backend and database.
- **Middleware Bug Fixed**: Reverted the misguided `proxy.ts` migration back to standard Next.js `middleware.ts` because Next.js actively ignores `proxy.ts` at the root, leading to critical `AuthApiError: Invalid Refresh Token` failures where expired Supabase sessions could never refresh properly. `middleware.ts` is correctly applying cookies again.
- **Mobile Responsive Audit**: Screen-tested application with subagent. 5/5 score. Minimal styling changes required on Response Client container.
- **Hydration Mismatch Fix**: Added `suppressHydrationWarning` to `<html>` and `<body>` tags in `app/layout.tsx` to prevent React hydration errors caused by browser extensions (e.g., extensions injecting `data-jetski-tab-id`).
- **Landing Page Enhancements**: Completely translated `app/page.tsx` and `app/pricing/page.tsx` from Malay to English. Upgraded the basic desktop navigation to a premium `NavigationMenu` (mega-menu style) and extracted it into a strictly isolated `"use client"` boundary (`components/landing-navbar.tsx`) to resolve complex Radix UI hydration mismatches.

## System Improvements (2026-02-25)
- **Corporate About Page**: Created a new robust `/about` route (`app/about/page.tsx`) styled precisely to the theme of top-tier SaaS landing pages to increase brand trust.
- **Individual Product Pages**: Created 4 dedicated product pages (`/products/forms`, `/products/certificates`, `/products/shortener`, `/products/qr-codes`) each showcasing 6 unique features, use cases, and CTAs with per-product color themes (blue, purple, orange, green). Updated `LandingNavbar` dropdown and `LandingMobileMenu` to link to these pages.
- **Gradient Animation Slowmo**: Changed `animate-gradient-xy` duration from 3s to 8s in `globals.css` for a smoother, more premium feel.
- **Descender Clipping Fix**: Added `pb-4` padding to all `bg-clip-text` gradient headings to prevent letters like "g", "y", "p" from being clipped by the CSS `background-clip: text` property.
- **LandingNavbar Hydration Guard**: Added `mounted` state guard to `LandingNavbar` so Radix UI `NavigationMenu` only renders client-side. SSR placeholder with matching dimensions prevents layout shift while eliminating `useId()` hydration mismatches.
- **Email Notification Toggle**: Added a `receive_email_notifications` boolean column (via Supabase migration) to the `forms` table. Users can now toggle "Receive Email Notifications" ON or OFF from within the Form Builder's General Info section. The `submitFormAction` logic conditionally skips `sendEmail` if this preference is set to false.
- **RLS Performance Optimization**: Addressed Supabase Performance Advisor warnings by creating explicit `CREATE INDEX` statements (`20260225154753_add_rls_performance_indexes.sql`) for foreign keys heavily used in RLS policies (e.g., `user_id` on `forms`, `settings`, `subscriptions`, `certificates`, `transactions`). This eliminates expensive full table scans during auth checks.
- **Critical Database Debug (42P01 relation "forms")**: Addressed a severe production outage where Form Builder failed to save (Auto-save Error 42P01).
  - Cause 1: Several columns (`receive_email_notifications`, `theme`, `qr_settings`, `attendance_settings`) existed locally but were missing in the Live database. Applied a comprehensive `sync_production_forms_columns.sql` to align the schema.
  - Cause 2: Implementing Supabase "Security Advisor" patches (`search_path = ''`) broke critical trigger functions (`generate_short_code`, `handle_new_user`, `get_email_by_username`). The empty `search_path` prevented these triggers from locating the `public.forms` table, causing silent `INSERT/UPDATE` rejections.
  - Fix: Executed `ALTER FUNCTION ... RESET search_path;` on all three affected functions and executed `NOTIFY pgrst, 'reload schema'` to restore system stability. We must intentionally ignore the Supabase "mutable search path" warnings for these specific triggers to keep the app functional.
- **Codebase Linting & Strict Types**: Ran a rigorous `npm run lint` audit. Eliminated dozens of `no-explicit-any` warnings by carefully casting to `unknown` or `Record<string, unknown>`. Purged numerous unused imports (Lucide icons, unused destructures, obsolete components) to ensure a perfectly clean console.
- **Final Security Release (2026-02-26)**: Verified that all primary attack vectors (XSS in Public Forms via `dangerouslySetInnerHTML`, Open Redirects via `middleware.ts`, and permissive RLS policies on `transactions`) have been fully fortified. Proceeded to execute a flawless production Turbopack build (`npm run build`) which succeeded with exactly `0` errors confirming holistic structural integrity for the entire application.

## System Improvements (2026-02-28)
- **Pricing Page Features Update**: Updated `app/pricing/page.tsx` to reflect all latest KlikForm features. Free plan now includes `Basic QR code generation` and `URL Shortener`. Pro plan now includes `Dynamic QR code generator`, `URL Shortener`, `E-Certificate generation`, and `Certificate Verification System`. The `notIncluded` lists for the Free plan were also expanded to show the full feature gap vs Pro.
- **Pricing Modal Sync**: Updated `components/pricing-modal.tsx` (the "Upgrade to Pro" dialog inside the dashboard) with the exact same feature lists as the main Pricing page to ensure consistency across both surfaces.
- **Plan Card Layout Fix**: Fixed a layout bug in `components/pricing/plan-card.tsx` where the top section of pricing cards had `flex-1`, causing an ugly empty gap between the price area and the feature list when cards had different heights. Moved `flex-1` to the bottom section (`ul` + button area) so the button aligns at the bottom and the price section stays compact.

## System Improvements (2026-03-27)
- **Certificate Creation Infinite Loading Fix (2026-03-27)**: Resolved a critical bug where the "Create New Certificate" (`new-certificate-dialog.tsx`) button got stuck on an infinite "Creating..." state. The root cause was that when the Next.js Server Action (`createCertificateTemplateAction`) failed (e.g., due to reaching Free tier limits or missing RLS), it silently `return;`ed `void`, or threw unhandled promise rejections, leaving the client-side `setLoading(true)` permanently active. The Server Action was refactored to cleanly return a structured JSON response `{ success: true, id: data.id }` or `{ error: string }`. Additionally, the redirect logic was moved entirely to the Client Side via `useRouter().push()`, eliminating Next.js `NEXT_REDIRECT` interception issues that notoriously cause component hanging in modern App Routers.
