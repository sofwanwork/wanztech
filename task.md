# Format Nama Peserta Pada Sijil: 1 Line Untuk Nama Pendek & Max 2 Line Untuk Nama Panjang ✅ SIAP

**Matlamat**: Menguatkuasakan paparan nama peserta pada sijil agar nama pendek (seperti 'SOFWAN BIN MOHD JAILANI') kekal 1 baris, manakala nama panjang dihadkan kepada maksimum 2 baris sahaja dengan penskalaan saiz fon pintar (auto-scaling).

- [x] 1. Cipta Helper Tipografi Nama Pintar (`components/certificates/types.ts`)
  - `isShortName(name)`: Mengesan nama pendek/sederhana (<= 28 aksara tanpa `\n`) untuk dikunci pada 1 baris.
  - `getNameFontSize(name, baseSize)`: Mengira saiz fon dinamik bagi nama panjang (29-43 aksara -> ~78%, 44+ aksara -> ~62%, min 18px) supaya muat dalam 2 baris tanpa melimpah.
  - Ujian unit di `tests/certificate-typography.test.ts` (14/14 lulus).
- [x] 2. Kemas Kini Renderer Sijil Utama (`components/certificates/renderer/index.tsx`)
  - Untuk nama pendek: `whitespace-nowrap`, `width: max-content`, `maxWidth: 92%` supaya tidak dipecahkan oleh lebar kotak asal.
  - Untuk nama panjang: `whitespace-pre-line break-words line-clamp-2 [text-wrap:balance]`, `WebkitLineClamp: 2`, `overflow: hidden`.
- [x] 3. Kemas Kini Templat Sijil Lain (`components/certificate-template.tsx`, `ClassicTemplate.tsx`, `CorporateTemplate.tsx`)
  - Mengintegrasikan `isShortName`, `getNameFontSize`, dan `line-clamp-2` untuk keseragaman.
- [x] 4. Pengesahan Kualiti & Ujian
  - `npm test`: 307 / 307 ujian lulus merentas 35 suite ujian.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - Kemas kini `task.md` dan `memory.md`.

---

# Pembaikan Bug 1-QR Smart Check-In & Check-Out: Dua Kali Entry Data Masa Masuk Google Sheet ✅ SIAP

**Matlamat**: Menyelesaikan isu di mana Google Sheets menerima dua entri berasingan kedua-duanya dengan 'Masa Masuk (Check-In)' dan tiada data 'Masa Keluar (Check-Out)'.

- [x] 1. Kenal Pasti Punca Asal (Root Causes)
  - Di `app/(public)/form/[id]/client.tsx`, apabila peserta telah `checked_in`, medan borang pendaftaran dan butang submit `[ Daftar Masuk (Check-In) ]` masih aktif di bawah banner, mengelirukan peserta untuk menekan butang daftar masuk semula.
  - Di `actions/forms.ts`, `submitFormAction` tiada semakan pendua (`duplicate check-in guard`) jika peserta telah berstatus `checked_in`.
  - Di `actions/attendance.ts`, `submitAttendanceCheckOutAction` tidak memperbaharui token Google OAuth (`getValidAccessToken`) dan hanya bergantung kepada `_submission_id` tanpa fallback kepada No. IC.
  - Di `lib/api/google-sheets.ts`, pemadanan lajur pengenalan bersifat tegar (strict equality) dan gagal memadankan format IC berbeza (dengan dash vs tanpa dash).
- [x] 2. Penguatkuasaan Pelayan (`actions/forms.ts` & `actions/attendance.ts`)
  - Dalam `submitFormAction`, jika peserta dengan identifier yang sama telah berstatus `checked_in`, sistem secara automatik menukar tindakan kepada Check-Out, menghalang penciptaan baris check-in kedua dan mengemas kini rekod `attendance_records` serta Google Sheet kepada selesai.
  - Dalam `submitAttendanceCheckOutAction`, perbaharui token OAuth secara automatik menerusi `getValidAccessToken` sebelum kemas kini helaian.
  - Tambah fallback berperingkat dalam kemas kini Sheet: `_submission_id` → `record.identifierLabel` → lajur lazim IC/Emel (`No. Kad Pengenalan`, `No IC`, dsb.).
- [x] 3. Penambahbaikan Pengalaman Pengguna / UI Klien (`app/(public)/form/[id]/client.tsx`)
  - Gating Paparan: Apabila status peserta dikesan `checked_in`, medan pendaftaran dan butang `[ Daftar Masuk ]` **disembunyikan sepenuhnya**. Digantikan dengan **Kad Check-Out Khusus** bersama butang utama `[ Daftar Keluar Sekarang (Check-Out) ]`.
  - Apabila status peserta `completed`, kad status "Kehadiran Lengkap" dipaparkan berserta maklumat masa masuk, masa keluar, dan durasi penuh, tanpa sebarang butang atau medan borang.
  - Auto-Detection & Local Storage: No. IC disimpan ke dalam `localStorage` selepas Check-In pertama. Apabila peserta mengimbas QR kod yang sama pada waktu petang di telefon yang sama, sistem serta-merta mengesan identiti peserta dan terus memaparkan Kad Check-Out.
  - Menyediakan butang "Bukan anda? [Daftar Peserta Lain]" untuk peranti yang dikongsi.
  - Guard `handleSubmit`: Jika borang dihantar atau kekunci Enter ditekan ketika status `checked_in`, sistem secara automatik memanggil `handleCheckOut()`.
- [x] 4. Peningkatan Ketahanan Pemadanan Google Sheets (`lib/api/google-sheets.ts`)
  - Menyokong pemadanan fleksibel alfanumerik (menyingkirkan sengkang, ruang kosong, huruf kecil/besar) supaya `010203-04-0506` sepadan dengan `010203040506`.
- [x] 5. Ujian, Pengesahan & Kemas Kini Dokumentasi
  - `npm test`: 298 / 298 ujian lulus merentas 35 suite ujian (termasuk ujian unit fallback di `tests/attendance-actions.test.ts`).
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - Kemas kini `memory.md`, `lessons.md`, dan `task.md`.

---

## Reviu Pelaksanaan: Pembaikan Bug 1-QR Smart Check-In & Check-Out

1. **Seni Bina Dwirantai (Client-Side Gating & Server-Side Fallback)**:
   - **Klien**: Apabila identiti peserta dikenal pasti dan berstatus `checked_in`, UI borang pendaftaran ditiadakan sama sekali. Peserta hanya melihat kad status hadir dan butang jelas untuk "Daftar Keluar Sekarang".
   - **Pelayan**: Walaupun peserta berjaya memintas klien (atau menekan Enter pada peranti berbeza), `submitFormAction` menyemak status terkini dalam `attendance_records`. Jika peserta telah check-in, tindakan dihala secara automatik ke aliran check-out tanpa menambah baris baharu ke Google Sheet.
2. **Penyelarasan Google Sheets yang Kalis Ralat**:
   - Token Google OAuth diperbaharui menggunakan `getValidAccessToken` sebelum sebarang kemas kini ke Google Sheets dijalankan semasa check-out.
   - Fungsi `updateSheetRow` mempunyai pemadanan alfanumerik bebas tanda sengkang serta mekanisme carian berganda (`_submission_id` diikuti label pengenalan borang dan alias IC standard).
3. **Pengalaman Pengguna (UX) Imbasan Petang**:
   - Dengan simpanan `localStorage`, peserta tidak perlu lagi menaip semula nombor IC mereka sewaktu petang di pintu keluar. Membuka pautan QR serta-merta menyambut nama peserta dan memaparkan butang Check-Out.

---

# Pembaikan Pertindihan Visual Kad Profil Bio (`BioPageCard`) ✅ SIAP

**Matlamat**: Menghapuskan pertindihan cincin avatar profil bio dengan lencana tema di banner atas serta mengemaskan susun atur teks profil.

- [x] 1. Kenal Pasti Punca Masalah (`app/(dashboard)/bio/client.tsx`)
  - Banner `h-16` (64px) terlalu sempit menyebabkan cincin putih avatar (`-mt-10`) bertindih dengan lencana tema di sudut kiri atas banner.
  - Teks profil mempunyai `pt-6` yang menyebabkan ketidakseimbangan penjajaran menegak.
- [x] 2. Kemas Kini Susun Atur UI (`app/(dashboard)/bio/client.tsx`)
  - Tingkatkan ketinggian banner daripada `h-16` kepada `h-20` (80px).
  - Alihkan lencana tema (`{theme.name}`) ke sudut kanan atas sebaris dengan togol status `Active / Draft`.
  - Biarkan zon kiri atas banner kosong agar avatar terapung secara bersih.
  - Besarkan avatar kepada `w-16 h-16` dengan `-mt-12` dan `items-end gap-3.5`.
  - Gantikan `pt-6` pada tajuk/handle dengan `pb-1`.
  - Paparkan nama tema mesra pengguna `{theme.name}` pada bar statistik.
- [x] 3. Pengesahan Kualiti
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat ESLint.
  - Kemas kini `memory.md` & `task.md`.

---

# Syarat Minimum Jam Kehadiran untuk Tebus E-Sijil & Amaran Awal Check-Out ✅ SIAP

**Matlamat**: Menguatkuasakan syarat kehadiran minima sebelum e-Sijil boleh ditebus, serta memberi amaran masa nyata kepada peserta jika mereka cuba mendaftar keluar (Check-Out) sebelum memenuhi jam yang ditetapkan.

- [x] 1. Jenis Data & Konfigurasi (`lib/types/forms.ts`, `lib/types/index.ts`, `lib/types/attendance.ts`)
  - Tambah `minHoursForCertificate?: number` ke dalam `CheckInOutConfig`.
  - Tambah `checkInAtIso`, `minHoursForCertificate`, `isEarlyCheckOut`, `earlyCheckOutShortfallText` ke dalam `AttendanceSummary`.
- [x] 2. Logik & Helper Tulen (`lib/forms/attendance.ts`)
  - Cipta helper `checkCertificateAttendanceEligibility(record, minHoursForCertificate, breakMinutes)`.
  - Cipta fungsi kiraan amaran check-out awal `isEarlyCheckOut(checkInAt, now, minHoursRequired, breakMinutes)`.
  - Ujian unit di `tests/attendance.test.ts` (23/23 lulus).
- [x] 3. Penguatkuasaan di Pelayan (Server Action) (`actions/certificates.ts`)
  - Semak kelayakan kehadiran dalam `checkCertificateByICOrEmail` sebelum membenarkan muat turun e-Sijil.
  - Kemas kini `CertificateCheckResult` untuk menyertakan maklumat ketidaklayakan kehadiran (`attendanceIneligible`, `attendanceDetails`).
  - Ujian unit di `tests/certificate-attendance-gating.test.ts` (7/7 lulus).
- [x] 4. Dialog Amaran Awal Semasa Check-Out (`app/(public)/form/[id]/client.tsx`)
  - Pop-up amaran jika jam kehadiran belum mencukupi sebelum check-out.
  - Pilihan jelas: "Batal & Terus Hadir" atau "Tetap Daftar Keluar".
- [x] 5. Antara Muka Pembina Borang (`app/builder/[id]/client.tsx`)
  - Tambah medan input "Minimum Hours for E-Certificate" di bawah seksyen Smart Check-In/Out.
- [x] 6. Paparan Portal Tebus Sijil Awam (`app/(public)/check/[formId]/page.tsx` & `client.tsx`)
  - Lencana syarat jam minima di bahagian atas halaman semakan.
  - Kad amaran telus dengan perincian masa hadir vs baki jam diperlukan jika belum layak.
- [x] 7. Ujian, Pengesahan & Kemas Kini Memori
  - `npm test`: 297 / 297 ujian lulus merentas 35 suite ujian.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - Kemas kini `memory.md` dan `task.md`.

---

## Reviu Pelaksanaan: Syarat Minimum Jam Kehadiran E-Sijil & Amaran Awal

1. **Seni Bina & Penguatkuasaan**:
   - **Form Builder**: Penganjur menetapkan syarat jam minimum (contoh: 6 Jam). Disimpan secara stateless/JSONB ke dalam `attendanceSettings.checkInOut.minHoursForCertificate`.
   - **Pelayan (`actions/certificates.ts`)**: Semasa peserta menyemak sijil di `/check/[formId]`, sistem secara automatik mencari rekod kehadiran (`attendance_records`) menggunakan No. IC atau Emel.
     * Jika peserta tiada rekod langsung: disekat dengan mesej tiada rekod Check-In.
     * Jika status masih `checked_in`: disekat dan diminta lakukan Check-Out dahulu.
     * Jika status `completed` tetapi jumlah jam kurang: disekat dengan kad amaran terperinci menunjukkan masa hadir dan baki kekurangan jam.
2. **Pengalaman Responden (UX)**:
   - **Amaran Awal Check-Out**: Apabila peserta cuba scan Check-Out sebelum cukup masa, modal dialog amaran terpapar memberitahu baki masa yang kurang dan memberi pilihan sama ada mahu terus hadir atau tetap daftar keluar.
   - **Portal e-Sijil**: Menunjukkan lencana syarat jam program dan kad penjelasan mesra jika syarat jam belum mencukupi, bersama panduan menghubungi urusetia jika mempunyai pelepasan khas.

---

# Perlindungan Anti-Tipu Kehadiran: PIN Check-Out & Live Rotating QR ✅ SIAP

**Matlamat**: Menghapuskan kelemahan peserta mengambil gambar kod QR untuk scan dari rumah pada waktu petang melalui:
1. **Solusi 2**: Kod PIN / Passcode Rahsia Check-Out yang diumumkan di pentas pada akhir program.
2. **Solusi 3**: Skrin Projektor Kod QR Berputar Masa Nyata (*Live Rotating QR*) yang auto-refresh setiap 30 saat dengan token kriptografi bertempoh sah.

- [x] 1. Jenis Data & Konfigurasi (`lib/types/forms.ts`, `lib/types/index.ts`)
  - Tambah `checkOutPasscode?: string` pada `CheckInOutConfig`.
  - Tambah `RotatingQrConfig` (`enabled`, `intervalSeconds`, `secret`) ke dalam `AttendanceSettings`.
- [x] 2. Enjin Penjanaan & Pengesahan Rotating QR (`lib/forms/rotating-qr.ts`)
  - Logik kriptografi HMAC-SHA256 berasaskan tetingkap masa (TOTP concept: 30 saat).
  - Fungsi `generateRotatingQrPayload` dan `verifyRotatingQrToken` dengan toleransi grace period 1 tetingkap (30-60s).
  - Ujian unit di `tests/rotating-qr.test.ts`.
- [x] 3. Tindakan Pelayan (`actions/attendance.ts` & `actions/forms.ts`)
  - Sokongan semakan `passcode` dalam `submitAttendanceCheckOutAction`.
  - Tindakan `getRotatingQrLiveTokenAction` untuk menyelaraskan token langsung autoritatif pelayan ke skrin projektor.
  - Penguatkuasaan pengesahan token rotating QR dalam `submitFormAction` (Check-In) dan `submitAttendanceCheckOutAction` (Check-Out).
- [x] 4. Laman Skrin Projektor Dewan (`app/(public)/present/[id]/page.tsx` & `client.tsx`)
  - Paparan skrin penuh mesra projektor/TV (tajuk program, kod QR gergasi, animasi lingkaran/bar kira detik 30 saat, jam digital UTC+8, status langsung).
  - Butang skrin penuh (F) dan butang buka/tutup PIN pentas (P).
- [x] 5. Antara Muka Pembina Borang (`app/builder/[id]/client.tsx`)
  - Medan tetapan "Check-Out Passcode / PIN" di bawah Smart Check-In/Out.
  - Togol "Live Rotating QR Code (Anti-Fraud Projector Mode)" + butang "Buka Skrin Projektor" (Present Mode).
- [x] 6. Penguatkuasaan Borang Awam Responden (`app/(public)/form/[id]/client.tsx`)
  - Input kod PIN semasa Check-Out (jika penganjur aktifkan passcode).
  - Semakan token rotating QR; jika tamat tempoh / diambil daripada foto lama, sekat akses dengan mesej amaran jelas.
- [x] 7. Ujian, Pengesahan & Deployment
  - `npm test`: 281 / 281 lulus merentas 34 suite ujian.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
  - `npm run build`: Bersih (54 laluan Next.js 16 Turbopack).

---

## Reviu Pelaksanaan: Perlindungan Anti-Tipu Kehadiran (PIN & Rotating QR)

1. **Solusi 2 (Check-Out Passcode / PIN Pentas)**:
   - **Konsep**: Penganjur menetapkan 4-6 digit PIN rahsia pada Form Builder (contoh: `8899`).
   - **Pelaksanaan**:
     - Semasa Check-In pagi, peserta mendaftar masuk secara bebas tanpa halangan.
     - Semasa Check-Out petang, kad status peserta meminta "Kod PIN Check-Out Diperlukan".
     - Jika peserta cuba scan dari rumah tanpa mengetahui PIN yang diumumkan di pentas oleh penceramah, cubaan daftar keluar disekat serta-merta oleh pelayan.
2. **Solusi 3 (Live Rotating QR Code — Skrin Projektor Dewan)**:
   - **Konsep**: Menggunakan algoritma kriptografi HMAC-SHA256 tanpa spamming database (stateless & pantas). Kod QR bertukar token setiap 30 saat (`?rq_w=...&rq_sig=...`).
   - **Skrin Projektor (`/present/[id]`)**:
     - Reka bentuk gelap berimpak tinggi (*ambient glow*, tipografi jelas, jam digital masa nyata, kod QR bersaiz besar ~380px untuk paparan dewan 10-30 meter).
     - Kira detik auto-refresh 30 saat bersama bar kemajuan licin.
     - Pintasan papan kekunci: Tekan **F** untuk skrin penuh (fullscreen), **P** untuk tayang/sembunyi PIN pentas.
   - **Toleransi Masa (Grace Period)**:
     - Dibenarkan 1 tetingkap masa sebelumnya (30–60 saat) bagi menampung kelewatan fokus kamera telefon peserta atau rangkaian telco perlahan.
     - Gambar foto yang diambil beberapa minit atau jam sebelumnya (contohnya foto pagi) disahkan luput dan ditolak serta-merta dengan mesej: *"Kod QR ini telah luput atau tidak sah. Sila imbas kod QR langsung yang sedang dipaparkan di skrin dewan."*
3. **Penyelarasan & Keselamatan**:
   - Parameter dalaman `_rq_w` dan `_rq_sig` ditapis daripada `dbData` sebelum dihantar ke Google Sheets supaya helaian penganjur kekal bersih tanpa lajur teknikal.
   - Laluan `/present/[id]` didaftarkan ke dalam senarai `publicRoutes` di `proxy.ts`.

---

# Ciri Kehadiran Pintar 1 QR (Check-In & Check-Out & Kira Durasi Jam) ✅ SIAP

**Matlamat**: Membolehkan peserta mengimbas 1 Kod QR yang sama untuk Daftar Masuk (Check-In) dan Daftar Keluar (Check-Out), mengira secara automatik jumlah masa/jam kehadiran dalam program, dan merekodkannya ke pangkalan data serta Google Sheets.

- [x] 1. Jenis Data (`lib/types/forms.ts`, `lib/types/attendance.ts`, `lib/types/index.ts`)
  - Tambah `CheckInOutConfig` ke dalam `AttendanceSettings` di `lib/types/forms.ts`.
  - Takrifkan jenis `AttendanceRecord`, `AttendanceStatus`, dan `AttendanceSummary`.
- [x] 2. Logik & Pengiraan Tulen (`lib/forms/attendance.ts`)
  - Cipta fungsi `cleanIdentifier` (pembersihan IC / Emel).
  - Cipta `calculateAttendanceDuration` (kira beza masa, jam & minit, tolak rehat).
  - Cipta `formatAttendanceTime` dan `formatAttendanceDateTime` (zon masa Malaysia UTC+8).
  - Cipta ujian unit komprehensif di `tests/attendance.test.ts`.
- [x] 3. Migrasi Pangkalan Data (`supabase/migrations/20260928000000_add_attendance_records.sql`)
  - Cipta jadual `attendance_records` dengan index pada `(form_id, identifier_value)` dan RLS.
- [x] 4. Lapisan Storan (`lib/storage/attendance.ts`)
  - Fungsi `getAttendanceRecord`, `createAttendanceRecord`, `updateAttendanceCheckOut`, `listAttendanceRecordsForForm`.
  - Ujian unit di `tests/attendance-storage.test.ts`.
- [x] 5. Tindakan Pelayan (`actions/attendance.ts` & `actions/forms.ts`)
  - `checkAttendanceStatusAction` (semak sama ada belum masuk, sedang masuk, atau dah keluar).
  - `submitFormAction` integrasi check-in automatik (merekod status dan masa masuk).
  - `submitAttendanceCheckOutAction` (daftar keluar, kira durasi, kemas kini Google Sheets & rekod tempatan).
  - Ujian unit di `tests/attendance-actions.test.ts`.
- [x] 6. Antara Muka Pembina Borang (`app/builder/[id]/client.tsx`)
  - Tambah togol "1-QR Smart Check-In & Check-Out" dalam kad Attendance & Location.
  - Konfigurasi pemilihan medan pengenalan (Identifier Field), tempoh minimum sebelum check-out (minDurationMinutes), dan tolak waktu rehat (breakMinutes).
- [x] 7. Antara Muka Borang Awam (`app/(public)/form/[id]/client.tsx`)
  - Aliran responsif: pengesanan status masa nyata apabila peserta mengisi No. IC / Emel.
  - Kad maklumat "🟢 Sedang Hadir" dengan butang pantas "Daftar Keluar Sekarang (Check-Out)".
  - Butang dinamik "Daftar Masuk (Check-In)" bagi pendaftaran kali pertama.
  - Skrin kejayaan khusus memaparkan ringkasan masa masuk, masa keluar, dan jumlah durasi jam kehadiran.
- [x] 8. Ujian & Pengesahan Penuh
  - `npm test`: 274 / 274 lulus merentas 33 suite ujian.
  - `npm run typecheck`: 0 ralat TypeScript (`tsc --noEmit`).
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
- [x] 9. Dokumentasi & Kemas Kini Memori
  - Kemas kini `task.md` dan `memory.md`.

---

## Reviu Pelaksanaan: Ciri Kehadiran Pintar 1 QR

1. **Seni Bina Sistem**:
   - **Tunggal & Lancar**: Peserta hanya perlu mengimbas 1 kod QR di pintu masuk program sepanjang hari.
   - **Pengesanan Pintar**: Nombor Kad Pengenalan atau Emel dibersihkan secara automatik (`cleanIdentifier`) untuk menghapuskan tanda sengkang, ruang kosong, atau perbezaan huruf besar/kecil.
   - **Keselamatan & Ketepatan**:
     - Dilengkapi `minDurationMinutes` (lalai: 5 minit) untuk menghalang peserta daripada tertekan Check-Out serta-merta selepas Check-In.
     - Sokongan penolakan waktu rehat (`breakMinutes`, contohnya 60 minit rehat tengah hari).
     - Kadar panggilan (`rate limiting`) menggunakan `checkRateLimit` bagi mengelakkan percubaan spam atau penipuan.
2. **Penyelarasan Data**:
   - Disimpan terus ke pangkalan data Supabase (`attendance_records` dan `form_responses`).
   - Diselaraskan ke Google Sheets penganjur dengan penambahan lajur dinamik: `Masa Masuk (Check-In)`, `Masa Keluar (Check-Out)`, `Jumlah Masa Hadir`, `Jumlah Jam (Hours)`, dan `Status Kehadiran`.
3. **Pengalaman Pengguna (UX)**:
   - **Pagi**: Borang memaparkan butang "Daftar Masuk (Check-In)". Selepas dihantar, skrin kejayaan memaparkan masa masuk bersama peringatan mesra untuk scan semula QR semasa tamat program.
   - **Petang**: Apabila peserta membuka borang dan memasukkan No. IC yang sama, sistem serta-merta mengesan rekod daftar masuk pagi dan memaparkan kad status "🟢 Sedang Hadir" dengan butang jelas "Daftar Keluar Sekarang (Check-Out)".
   - **Selesai**: Skrin memaparkan piala kejayaan, masa masuk, masa keluar, dan jumlah durasi jam sebenar yang dihadiri (contoh: **8 Jam 15 Minit**).

---

# Revamp Laman Utama (Landing Page) — Minimalist & Framer Motion ✅ SIAP

**Matlamat**: Mereka bentuk semula laman utama KlikForm (`app/page.tsx`) dengan estetik *minimalist* moden (gaya Linear / Vercel), animasi lancar menggunakan `framer-motion`, dan mengemas kini semua kandungan (*content*) agar mencerminkan ciri-ciri sebenar dan terkini (*features semasa*): Borang Pintar Google Sheets, Studio e-Sijil Canva-Style, Penjanaan Pukal CSV ke ZIP, KlikBio Link-in-Bio, Verifikasi Sijil Segera, Analitik Privasi, Logik Bersyarat & Pelbagai Halaman, serta Pematuhan PDPA.

- [x] 1. Cipta komponen Hero Minimalist (`components/landing/landing-hero.tsx`) dengan animasi Framer Motion, lencana kemas, tipografi berkontras tinggi, dan mockup interaktif produk sebenar.
- [x] 2. Cipta Bento Grid Ciri-Ciri Semasa (`components/landing/landing-features-bento.tsx`) dengan kad interaktif (Google Sheets Sync, Studio Sijil Canva-Style, Bulk CSV ZIP, KlikBio, Analitik Drop-off, Multi-page & Conditional Logic, Attendance & PDPA).
- [x] 3. Cipta Showcase Interaktif Mendalam (`components/landing/landing-showcase.tsx`) yang membolehkan pengunjung beralih antara produk utama (Forms, Sijil, KlikBio, QR) dengan animasi tab `framer-motion`.
- [x] 4. Cipta Seksyen Sasaran Pengguna & Kes Penggunaan Tempatan (`components/landing/landing-use-cases.tsx`) untuk Cikgu/Sekolah, Penganjur Majlis, Peniaga Online/WhatsApp, dan HR/Syarikat.
- [x] 5. Cipta Seksyen Perbandingan Pintar ("Mengapa KlikForm?") (`components/landing/landing-comparison.tsx`) membandingkan KlikForm vs Google Forms / Canva / Linktree.
- [x] 6. Cipta Seksyen Tindakan (CTA) & Footer Minimalist (`components/landing/landing-cta.tsx` & `components/landing/landing-footer.tsx`).
- [x] 7. Gabungkan semua seksyen ke dalam `app/page.tsx` sebagai Server Component (mengekalkan SSG & metadata SEO penuh).
- [x] 8. Verifikasi kualiti: `npm run lint` (0 amaran), `npm run typecheck` (0 ralat), `npm test` (252/252 lulus), dan `npm run build` (bersih, 50 laluan termasuk /health).
- [x] 9. Kemas kini `memory.md` dan `task.md`.

---

## Reviu Revamp Laman Utama (Landing Page)

**Reka Bentuk Visual & Interaktiviti**:
- **Estetik Minimalist**: Berteraskan reka bentuk moden berimpak tinggi ala Linear / Vercel dengan ruang bernafas yang luas, garisan sempadan mikro (`border-slate-200/80`), tipografi berkontras tinggi (`[text-wrap:balance]`, `tracking-tight`), dan lencana berstatus elegan.
- **Animasi Framer Motion**:
  - Hero staggered reveal (tajuk, subteks, butang CTA, lencana pengesahan).
  - Mockup produk interaktif dengan tab langsung yang mempamerkan Form Builder, Studio E-Sijil, Google Sheets Sync, dan KlikBio menggunakan `layoutId` untuk peralihan tanpa kelipan.
  - Skrol viewport reveal (`whileInView`, `viewport={{ once: true }}`) untuk Bento Grid dan seksyen utama.
  - Deep-dive showcase dengan tab animasi interaktif.
- **Kandungan Mengikut Ciri Semasa (*Features Semasa*)**:
  1. Penyelarasan Google Sheets masa nyata tanpa webhook pihak ketiga berserta *Formula Injection Shield*.
  2. Studio E-Sijil Canva-Style dengan pemegang penskalaan 4 bucu (*drag-to-scale*), fon Google/kaligrafi, dan *Auto-Scaling Typography* untuk tajuk program panjang.
  3. Penjanaan Sijil Pukal (Bulk CSV to ZIP) untuk menghasilkan ratusan sijil PDF/PNG dalam beberapa saat.
  4. Portal Semakan Awam & Kod QR Verifikasi dengan carian No. IC atau emel.
  5. Halaman mikro KlikBio (Link-in-Bio) dengan 8 tema dan corak latar belakang estetik.
  6. Borang dinamik: Multi-page (Page Breaks) & Conditional Logic (Skip Logic).
  7. Analitik mesra privasi (penjejakan drop-off soalan tanpa menyimpan IP mentah) & pematuhan PDPA.
- **Seni Bina & Prestasi**:
  - `app/page.tsx` kekal sebagai **Server Component** (Static Site Generation `○ Static`), mengekalkan kelajuan pantas tanpa serverless cold start dan kecekapan metadata SEO penuh.
  - Komponen animasi diasingkan ke dalam `components/landing/` dengan sempadan `"use client"`.
  - Endpoint `/health` ditambah (`app/health/route.ts`) untuk membalas `200 OK` kepada probe kesihatan pelayan.
  - Amaran usang `disableLogger` Sentry dibuang daripada `next.config.ts`.
- **Kualiti & Ujian**:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 amaran/ralat ESLint.
  - `npm test`: 252 / 252 ujian lulus merentas 30 suite ujian.
  - `npm run build`: Bersih (50 laluan).

---

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

---

# Revamp Halaman Pricing (Pricing Page) — Minimalist & Visual Polish ✅ SIAP

**Matlamat**: Memperkemas dan mencantikkan halaman penentuan harga (`/pricing`), kad pelan (`components/pricing/plan-card.tsx`), dan susun atur kandungan (`app/pricing/page.tsx`) agar selari dengan estetika minimalist moden landing page KlikForm (gaya Linear/Vercel) dengan hierarki visual yang jelas, kad berkontur rounded-3xl yang seimbang, sorotan pelan Pro yang elegan, serta seksyen FAQ interaktif.

- [x] 1. Perkemas kad pelan harga (`components/pricing/plan-card.tsx`):
  - Kad 3D-feeling rounded-3xl dengan border halus berkontras (`border-slate-200/80` untuk Free/Enterprise dan `border-purple-600/40 shadow-xl ring-1 ring-purple-500/20` untuk Pro).
  - Lencana "Paling Popular" moden dengan gradien ungu-indigo terapung elegan.
  - Paparan harga berkontras tinggi dengan diskaun 50% "Jimat 50% Promosi" yang kemas.
  - Ikon tanda semak (checkmarks) bulat emerald yang anggun untuk senarai ciri.
  - Susun atur flexbox seimbang dengan `flex-1` pada bekas ciri & butang supaya ketinggian kad seragam tanpa jurang lompang.
- [x] 2. Mereka bentuk semula halaman `app/pricing/page.tsx`:
  - Latar belakang putih bersih (`bg-white`) dengan sentuhan grid dot pattern halus.
  - Header tajuk dan subteks berkontras tinggi dengan jaminan ketenangan minda ("Batal bila-bila masa", "Bayaran selamat BCL / FPX", "Sedia digunakan serta-merta").
  - Jadual/senarai FAQ moden menggunakan komponen akordion interaktif (Soalan Lazim).
  - Footer kemas menggunakan `LandingFooter`.
  - Pengekalan Static Site Generation (`○ Static`) tanpa server-side cookie block.
- [x] 3. Pengesahan kualiti:
  - `npm run lint`: 0 ralat, 0 amaran.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm test`: 252 / 252 ujian unit lulus (termasuk `tests/pricing.test.ts`).
  - `npm run build`: Kompilasi Turbopack Next.js 16 bersih.

---

# Revamp Menu Dropdown Produk Navbar (Landing Navbar & Mobile Drawer) ✅ SIAP

**Matlamat**: Mengemas kini senarai produk terkini KlikForm pada dropdown menu "Products" di desktop navbar (`components/landing-navbar.tsx`) dan mobile drawer (`components/landing-mobile-menu.tsx`) dengan reka bentuk mega-menu moden, ikon squircle berwarna unik, lencana visual `BARU` dan `HOT`, penerangan ringkas setiap produk, serta bar tindakan bawah (*trust & action bar*).

- [x] 1. Perkemas Desktop Mega-Menu di `components/landing-navbar.tsx`:
  - Menggantikan senarai 4 produk lama dengan 6 produk terkini 2026:
    1. Online Forms (Google Sheets Sync masa nyata, Formula Injection Shield & skip logic)
    2. Studio E-Sijil Canva (Drag-to-scale, 10+ templat & auto-scaling typography)
    3. KlikBio Link-in-Bio (Lencana `BARU`, 8 tema warna, corak latar & pautan WhatsApp)
    4. Jana Sijil Pukal CSV → ZIP (Lencana `HOT`, eksport ratusan sijil PDF/PNG)
    5. Kod QR Dinamik (Resolusi cetakan tinggi & imbasan pantas)
    6. URL Shortener (Pautan ringkas dengan analitik lawatan)
  - Bekas mega-menu diperluas (`w-[520px] md:w-[680px] lg:w-[720px]`), bucu `rounded-3xl`, bayang terapung lembut `shadow-[0_20px_50px_rgba(15,23,42,0.12)]`.
  - Ikon squircle berwarna khas bagi setiap produk dengan efek interaktif hover.
  - Bar bawah (*bottom bar*): Lencana jaminan pengesahan sijil segera dan pautan pintas ke `/pricing`.
- [x] 2. Segerakkan Navigasi Mudah Alih di `components/landing-mobile-menu.tsx`:
  - Memasukkan kesemua 6 produk terkini dengan ikon kemas dan lencana `BARU` & `HOT`.
- [x] 3. Pengesahan kualiti:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat, 0 amaran ESLint.
  - `npm test`: 251 / 251 ujian unit lulus (30 test suites).

---

# Pengindahan Gaya Hover & Pembetulan Susun Atur Mendatar Navbar Dropdown ✅ SIAP

**Matlamat**: Menyelesaikan masalah susun atur menegak yang janggal dan kesan hover yang kasar pada kad menu "Products" (menghapuskan kotak sempadan kelabu tegar, pembalikan warna ikon gelap yang garang, dan pertembungan warna teks ungu dengan ikon hijau).

- [x] 1. Pembetulan Susun Atur Mendatar (*Horizontal Layout*):
  - Buang `flex-col` lalai dari `NavigationMenuLink` dalam `components/ui/navigation-menu.tsx`.
  - Tetapkan susun atur mendatar `flex flex-row items-start gap-3.5` di `components/landing-navbar.tsx` (ikon kemas di sebelah kiri, tajuk & penerangan di sebelah kanan).
- [x] 2. Pengindahan Kesan Hover (*Polished & Subtle Hover Effect*):
  - Buang sempadan kelabu tegar `border-slate-200/60` yang kelihatan seperti kotak kaku.
  - Gantikan dengan latar belakang lembut mengikut rona produk (`hover:bg-[color]-50/40`) tanpa sebarang garisan sempadan tajam.
  - Ikon squircle tidak lagi bertukar menjadi blok gelap legap; sebaliknya menggunakan penskalaan lembut `scale-105` dengan rona pastel yang lebih kaya (`bg-100` / `text-700`).
  - Warna teks tajuk semasa hover diselaraskan mengikut warna produk masing-masing (KlikBio bertukar menjadi emerald yang harmoni, bukan ungu yang bertembung).
- [x] 3. Segerakkan menu mobile di `components/landing-mobile-menu.tsx`.
- [x] 4. Pembuangan Bar Bawah (*Bottom Action/Trust Bar*):
  - Membuang bar bawah `Portal Semakan Awam & Kod QR Sah disertakan automatik` dan butang `Lihat Pelan & Harga` daripada menu dropdown desktop di `components/landing-navbar.tsx` agar dropdown kekal minimalis dan fokus kepada 6 produk sahaja.
  - Membersihkan import tidak digunakan (`ShieldCheck`, `ArrowRight`).
- [x] 5. Pengesahan kualiti: `npm run typecheck` (0), `npm run lint` (0), `npm test` (251/251 lulus).

---

# Halaman Khusus 6 Produk KlikForm (Dedicated Product Pages) ✅ SIAP

**Matlamat**: Memastikan kesemua 6 produk di dalam menu dropdown mempunyai halaman penerangan dan pameran ciri (*product landing page*) masing-masing secara lengkap dan berasingan.

- [x] 1. Cipta halaman pameran KlikBio di `app/products/bio/page.tsx` (`/products/bio`):
  - Hero, 8 preset tema warna, 8 corak latar belakang estetik, pautan WhatsApp terus, live mobile mockup preview, kod QR perkongsian, dan analitik klik.
- [x] 2. Cipta halaman pameran Jana Sijil Pukal di `app/products/bulk-certificates/page.tsx` (`/products/bulk-certificates`):
  - Hero, import CSV & auto-detect lajur, penjanaan pantas terus ke arkib ZIP, format PDF/PNG HD, nombor siri & kod QR keselamatan, dan auto-scaling typography.
- [x] 3. Kemas kini pautan dropdown di `components/landing-navbar.tsx`:
  - `KlikBio (Link-in-Bio)` dipautkan ke `/products/bio` (bukan `/bio` dashboard).
  - `Jana Sijil Pukal (CSV → ZIP)` dipautkan ke `/products/bulk-certificates` (bukan `/products/certificates`).
- [x] 4. Kemas kini pautan mobile drawer di `components/landing-mobile-menu.tsx`.
- [x] 5. Kemas kini pautan footer di `components/landing/landing-footer.tsx`.
- [x] 6. Pengesahan kualiti: `npm run typecheck` (0), `npm run lint` (0), `npm test` (251/251 lulus).

---

# Translasi Penuh Laman Web & Sistem ke Bahasa Inggeris (Full English Localization) ✅ SIAP

**Matlamat**: Mengalihkan keseluruhan teks, penerangan ciri, antaramuka sistem, borang awam, dan emel automatik KlikForm kepada Bahasa Inggeris sepenuhnya mengikut standard antarabangsa profesional.

- [x] 1. Laman Pemasaran & Landing Page:
  - [x] `app/layout.tsx`: Tukar `lang="en"` & kemas kini metadata SEO/OpenGraph ke Bahasa Inggeris.
  - [x] `components/landing-navbar.tsx` & `components/landing-mobile-menu.tsx`: Terjemahkan penerangan produk mega-menu & lencana (`NEW`, `HOT`).
  - [x] `components/landing/landing-hero.tsx`: Hero badge, H1, subteks, butang CTA, bukti sosial & tab mockup.
  - [x] `components/landing/landing-features-bento.tsx`: Semua 6 kad Bento Grid (Google Sheets, Canva Studio, Bulk CSV, KlikBio, Analytics, PDPA).
  - [x] `components/landing/landing-showcase.tsx`: Tab interaktif showcase mendalam.
  - [x] `components/landing/landing-use-cases.tsx`: 4 segmen sasaran pengguna.
  - [x] `components/landing/landing-comparison.tsx`: Matriks perbandingan platform.
  - [x] `components/landing/landing-cta.tsx` & `landing-footer.tsx`: Banner CTA & footer.
- [x] 2. Halaman Pameran Produk (`app/products/*`):
  - [x] `app/products/bio/page.tsx`: Terjemahkan pameran ciri KlikBio ke Bahasa Inggeris.
  - [x] `app/products/bulk-certificates/page.tsx`: Terjemahkan pameran Jana Sijil Pukal ke Bahasa Inggeris.
  - [x] Semak & perhalusi `forms/page.tsx`, `certificates/page.tsx`, `qr-codes/page.tsx`, `shortener/page.tsx`.
- [x] 3. Halaman Pricing & Tetapan Harga:
  - [x] `app/pricing/page.tsx`: Tajuk, jaminan keselamatan (FPX/BCL), dan FAQ akordion.
  - [x] `components/pricing/plan-card.tsx`: Lencana "Most Popular", butang tindakan, dan senarai ciri pelan.
  - [x] `lib/constants/pricing.ts`: Kemas kini deskripsi harga ke Bahasa Inggeris.
- [x] 4. Papan Pemuka & Pembina (Dashboard & Builders):
  - [x] `components/dashboard/cross-form-analytics.tsx`: Tajuk kad analitik.
  - [x] `components/builder-tour.tsx`: Lawatan interaktif 5 langkah (Joyride onboarding).
  - [x] `app/builder/[id]/client.tsx`: Status autosave ("Saving...", "Saved to cloud"), tab, dan dialog tukar templat.
  - [x] `app/(dashboard)/certificates/builder/[id]/client.tsx` & bulk client: Kawalan zum ("Fit to Screen", "Actual Size"), pemetaan lajur CSV, butang muat turun ZIP.
- [x] 5. Borang Awam & Notifikasi Emel:
  - [x] `app/(public)/form/[id]/client.tsx`: Bar progres ("X / Y Answered"), butang Back/Next/Submit, skrin borang ditutup & terima kasih.
  - [x] `app/(public)/check/[formId]/client.tsx` & `verify/[id]/page.tsx`: Input carian sijil & butang muat turun.
  - [x] `lib/email/index.ts`: Terjemahkan kesemua 10 templat emel (notifikasi pemilik, pengesahan responden, edit magic link, peringatan langganan, resit FPX/BCL).
  - [x] `tests/respondent-notification.test.ts`: Kemas kini jangkaan teks ujian emel.
- [x] 6. Pengesahan Kualiti Penuh:
  - [x] `npm run typecheck`: 0 ralat TypeScript.
  - [x] `npm run lint`: 0 ralat, 0 amaran ESLint.
  - [x] `npm test`: 251 / 251 ujian unit lulus (30 test suites).

---

## Reviu Translasi Penuh Laman Web & Sistem ke Bahasa Inggeris

**Skop & Pelaksanaan Translasi**:
1. **Laman Pemasaran & Navigasi**:
   - `app/layout.tsx`: Diselaraskan kepada `<html lang="en">` dengan metadata OpenGraph & deskripsi Bahasa Inggeris antarabangsa.
   - `components/landing-navbar.tsx` & `components/landing-mobile-menu.tsx`: Kesemua 6 produk diterjemahkan ke Bahasa Inggeris dengan lencana moden `NEW` dan `HOT`.
   - `components/landing/`: Komponen `landing-hero.tsx`, `landing-features-bento.tsx`, `landing-showcase.tsx`, `landing-use-cases.tsx`, `landing-comparison.tsx`, `landing-cta.tsx`, dan `landing-footer.tsx` semuanya dialihkan kepada Bahasa Inggeris standard, jelas, dan meyakinkan.
2. **Halaman Pameran Produk (`/products/*`)**:
   - `/products/bio`, `/products/bulk-certificates`, `/products/forms`, `/products/certificates`, `/products/qr-codes`, `/products/shortener` lengkap dengan salinan Bahasa Inggeris dan footer standard `LandingFooter`.
3. **Harga & Langganan**:
   - `/pricing` dan kad `plan-card.tsx` menggunakan Bahasa Inggeris ("Most Popular", "Get Started Free", "Upgrade to Pro", "Cancel anytime • No hidden fees", "Instant activation", "Secure FPX / BCL online banking").
   - Mata wang kekal `RM 15` dan gerbang pembayaran kekal berorientasikan pasaran tempatan Malaysia (FPX / BCL.my).
4. **Studio & Pembina**:
   - Status auto-save: `Saving...` dan `Saved to cloud`.
   - Onboarding Joyride: Langkah 1 hingga 5 lengkap dalam Bahasa Inggeris dengan kawalan `Skip`, `Next`, `Back`, dan `Finish`.
   - Studio Sijil & Bulk Generator: Kawalan zum `Fit (X%)`, `Actual Size 100%`, label muat naik CSV, pengesanan lajur (`Name`, `Program / Event`, `Date`, `IC / ID`, dll.), dan butang `Generate & Download ZIP`.
5. **Borang Awam & Lapisan Emel**:
   - Paparan responden: `X / Y Answered`, `Closes in: X`, `Form Closed`, `Access Restricted`, `Submit Another Response`.
   - Lapisan emel (`lib/email/index.ts`): Kesemua 10 templat diselaraskan kepada Bahasa Inggeris dengan escaping keselamatan HTML penuh.
   - Ujian unit Vitest `tests/respondent-notification.test.ts` diselaraskan dan mengekalkan 100% kadar kelulusan.
6. **Kualiti & Keandalan**:
   - `npm run typecheck`: 0 ralat.
   - `npm run lint`: 0 ralat/amaran.
   - `npm test`: 251 / 251 ujian lulus merentas 30 suites.

---

# Pengoptimuman Prestasi & Penghapusan Lag Drag E-Cert Builder ✅ SIAP

**Matlamat**: Menyelesaikan masalah pergerakan terasa lambat/tersekat (*drag lag*) semasa pengguna menggerakkan atau mengubah saiz elemen pada canvas E-Cert Builder.

- [x] 1. Kenal pasti punca asal lag:
  - Kelas CSS `transition-all duration-150` pada pembungkus elemen melambatkan kemas kini kedudukan `left` dan `top` sebanyak 150ms di belakang kursor.
  - Panggilan `canvasRef.current.getBoundingClientRect()` pada setiap event `mousemove` menyebabkan *forced synchronous reflow* berulang kali.
  - Ketiadaan *frame throttling* (`requestAnimationFrame`) menyebabkan event tetikus berfrekuensi tinggi membebankan kitaran re-render React.
  - Event listener `onMouseMove`/`onMouseLeave` terikat pada elemen canvas semata-mata, menyebabkan seretan pantas terputus apabila kursor terkeluar sedikit dari kanvas.
- [x] 2. Laksanakan pengoptimuman prestasi di `app/(dashboard)/certificates/builder/[id]/client.tsx`:
  - Nyahaktifkan transition kedudukan (`transition-none` atau khusus kepada `box-shadow,opacity`) semasa seretan/ubah saiz aktif (`isDragging || isResizing`).
  - Tambah akselerasi GPU `willChange: 'left, top'` semasa seretan.
  - Hapuskan panggilan `getBoundingClientRect()` pada `mousemove`; guna `currentScale` yang telah siap dikira.
  - Laksanakan *batching* dengan `requestAnimationFrame` untuk menyelaraskan pergerakan dengan kadar segar semula skrin (60fps/120fps).
  - Pindahkan event listener ke peringkat `window` semasa seretan/ubah saiz aktif dengan penguncian kursor `move` dan pencegahan `userSelect`.
  - Kemas kini undo/redo history hanya jika elemen benar-benar digerakkan (`hasMovedRef`).
- [x] 3. Pengesahan kualiti:
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat/amaran ESLint.
  - `npm test`: 251 / 251 ujian lulus (30 test suites).

---

## Reviu Pengoptimuman Prestasi E-Cert Builder

**Punca Masalah & Analisis Teknikal**:
1. **Interpolasi CSS 150ms**: Pembungkus elemen menggunakan `transition-all duration-150`. Apabila `left` dan `top` dikemas kini, enjin CSS pelayar web tidak meletakkan elemen serta-merta, sebaliknya menginterpolasi koordinat selama 150ms. Ini menghasilkan sensasi terapung/tertunda di belakang tetikus.
2. **Forced Synchronous Layout Reflow**: Setiap kali event `mousemove` berlaku, kod memanggil `canvasRef.current.getBoundingClientRect()` untuk mendapatkan skala kanvas. Ini memaksa pelayar mengira semula susun atur geometri berpuluh hingga beratus kali sesaat.
3. **Kekerapan Event Tanpa Had (Unthrottled High-Polling Mouse Events)**: Tetikus moden menghantar 125Hz–1000Hz event. Kemas kini state React secara terus pada setiap event mencetuskan kitaran re-render yang melebihi kadar muat semula skrin (60Hz/120Hz).
4. **Kehilangan Fokus Seretan (Canvas-Bound Listeners)**: Penggunaan `onMouseLeave={handleMouseUp}` pada kanvas menyebabkan seretan yang laju terputus sebaik sahaja kursor tergelincir melepasi garisan kanvas.

**Penyelesaian Yang Dilaksanakan**:
1. Menggantikan `transition-all duration-150` dengan `transition-[box-shadow,opacity] duration-150` dan menguatkuasakan `transition-none` apabila `isDragging || isResizing` aktif.
2. Menggunakan `currentScale` secara langsung tanpa membuat pertanyaan geometri DOM (`getBoundingClientRect`) pada setiap event `mousemove`.
3. Mengintegrasikan `requestAnimationFrame` (rAF) ref throttling supaya pengemaskinian state komponen berlaku selari dengan kadar bingkai paparan (60/120 FPS).
4. Melampirkan event listener `mousemove` dan `mouseup` pada objek `window` apabila seretan bermula, membolehkan pergerakan lancar dan tidak terputus walaupun tetikus bergerak laju ke luar kawasan kanvas.
5. Memastikan rekod sejarah Undo/Redo hanya ditambah apabila berlaku perubahan kedudukan sebenar (`hasMovedRef`), mengelakkan catatan kosong sewaktu klik pemilihan elemen.

