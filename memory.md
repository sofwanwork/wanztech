# Project Memory

## Core Features & Fixes
- **Certificate Verification (e-Sijil)**: Fixed a bug where certificate verification threw an `invalid_grant` exception when checking records from Google Sheets. The root cause was that `checkCertificateByIC` strictly assumed a Google Service Account (`googleClientEmail` & `googlePrivateKey`) was in use. It was updated to check for `googleAccessToken` (Google OAuth "Connect with Google" flow) first, with an auto-refresh mechanism if the token is expired.
- **Service Account Google Credentials parsing**: Implemented `.trim()` and `formatPrivateKey()` when building the service account parameter to prevent trailing space errors.
- **IC Search Robustness**: Improved the Google Sheet column regex/matching to be more deterministic (`IC`, `No IC`, `Kad Pengenalan` etc).

## Lessons Learned
- When introducing a new authentication mechanism (e.g., Google OAuth to replace/supplement Service Accounts), all related functional pathways (like Certificate Search) must be audited and updated to support both credential types.
- Ensure temporary API routes or explicit error string exposures in the Catch block are reverted cleanly before marking development tasks done.

## Rendering System (e-Sijil)
- **PDF/PNG Download Issues**: Fixed a bug where downloaded PDFs were saving as blank. `html2canvas` struggles to capture elements strictly hidden off-screen (`top: -9999px`). The fix uses `html2canvas-pro`'s native `onclone` hook (`clonedDoc.getElementById`) to position the element into the viewport *only* inside the cloned rendering sandbox, avoiding visual bleeding or layout flashing across the live DOM.
- **HD Output / Low File Size**: `html2canvas` `scale` is set to `3` for crisp HD rendering, while `toDataURL` output for JPEG inside `jsPDF` is compressed to `0.7` with a `'FAST'` compression filter. This achieves a highly readable/sharp certificate with a significantly smaller file footprint.
- **Sub-pixel White Borders**: Fixed an aesthetic issue where the PDF would exhibit a microscopic 1px white border. This was resolved by forcing `html2canvas` to reset scroll offsets (`scrollY: 0`, `scrollX: 0`) and deliberately stretching the target `jsPDF` canvas coordinates by `+2` overlapping pixels to override rounding gaps.
- **Portrait Orientation Support**: The certificate rendering system natively favored landscape (e.g. forced 800px styling max-widths, hardcoded jsPDF `orientation: 'landscape'` variables, and absolute pixels mapping in Preview). It was completely rewritten to support robust Portrait constraints via dynamically bound `isPortrait` evaluations, proportional percentage constraints, and shrinking canvas widths for tall elements.

## Builder Interface
- **NaN Input Prevention**: React UI crashes regarding `Received NaN for the value attribute` happening in the Certificate Editor properties panel were safely resolved. Number inputs (`x, y, width, height, offsets`) were updated to use strictly casted values and logical fallbacks (`Number(val) || 0`) preventing blank text boxes from propagating `parseInt("") => NaN` state exceptions.
- **Orientation Persistence**: The builder allowed users to flip to Portrait mode, but the `handleSave` dispatcher in `client.tsx` silently stripped `width` and `height` from the payload, meaning the database eternally reset the template back to Landscape on refresh. `width` and `height` were added to the payload block to successfully lock horizontal/vertical ratios into persistence.
