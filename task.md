# Perlindungan Anti-Bot Pendaftaran (Turnstile + Signup Guard + Admin Cleanup) ✅ SELESAI

**Konteks & Punca Isu**:
- Akaun bot dengan nama rawak (cth. `ycOzLIsSbljRGtmsuabUn`) dan emel Gmail dot-trick (cth. `n.o.ro.l.u.t.i.s.u.852@gmail.com`) boleh mendaftar kerana pendaftaran menggunakan `supabase.auth.signUp()` terus dari pelayar tanpa CAPTCHA, tanpa *honeypot*, tanpa *rate limit*, dan tanpa validasi username/emel.
- Panel admin (`/admin`) pula tidak membezakan akaun belum disahkan (`email_confirmed_at === null`) dan tiada pembersihan pukal.

### Pelan Tindakan Pelaksanaan
- [x] 1. **Modul Pengawal Pendaftaran & Turnstile (`lib/auth/signup-guard.ts`, `lib/auth/turnstile.ts`, `lib/rate-limit.ts`)**:
  - Bina validasi *honeypot*, sekatan Gmail dot-trick (`>= 4` titik), senarai domain emel pakai-buang (*disposable*), dan penapis nama pengguna rawak entropy tinggi.
  - Bina pembantu `verifyTurnstileToken` untuk pengesahan pelayan ke Cloudflare `siteverify`.
  - Tambah konfigurasi `signupAttempt` pada `RATE_LIMITS`.
- [x] 2. **Server Action Pendaftaran (`actions/auth.ts`)**:
  - Bina `signUpAction` yang menguatkuasakan *rate limit*, `validateSignupInput`, dan Turnstile (elak penebusan berganda apabila guna mod Supabase Attack Protection vs pelayan Next.js).
- [x] 3. **CSP & Antaramuka Pendaftaran (`next.config.ts`, `components/auth/turnstile-widget.tsx`, `app/(auth)/login/page.tsx`, `.env.local.example`)**:
  - Benarkan `challenges.cloudflare.com` dalam CSP `script-src`, `frame-src`, dan `connect-src`.
  - Bina komponen `TurnstileWidget` dan pasangkan pada tab Sign Up bersama medan *honeypot* tersembunyi serta panggil `signUpAction`.
- [x] 4. **Peningkatan Panel Admin (`actions/admin.ts`, `components/admin/client-table.tsx`)**:
  - Dedahkan status pengesahan emel (`isVerified`, `emailConfirmedAt`) dan paparkan lencana `Unverified`.
  - Tambah penapis `Unverified`, pilihan kotak semak berbilang baris, pemadaman pukal (`deleteClientsBulkAction`), dan pembersihan pantas akaun belum disahkan (`deleteUnverifiedZeroUsageClientsAction`).
- [x] 5. **Ujian Unit & Pengesahan Kualiti**:
  - Tambah `tests/signup-guard.test.ts` (5/5 lulus) dan kemas kini `tests/admin-actions.test.ts` (4/4 lulus).
  - Jalankan `npm test` (506/506 lulus merentas 52 fail), `npm run typecheck` (0 ralat), `npm run lint` (0 ralat), dan `npm run build` (berjaya).
- [x] 6. **Dokumentasi**:
  - Kemas kini `task.md`, `memory.md`, dan `lessons.md`.

### Seksyen Reviu
- **Elak Penebusan Berganda Token Turnstile**: Token Cloudflare Turnstile hanya sah sekali guna (*single-use*). `signUpAction` menyemak `TURNSTILE_SECRET_KEY`: jika dikonfigurasi di Next.js, ia mengesahkan token melalui `siteverify` dan tidak menghantar `captchaToken` ke Supabase; jika tidak dikonfigurasi di Next.js, ia menghantar `captchaToken` kepada Supabase Auth Attack Protection.
- **Kemas Kini CSP**: Menambah `https://challenges.cloudflare.com` pada `script-src`, `frame-src`, dan `connect-src` dalam `next.config.ts` supaya widget Turnstile tidak disekat di persekitaran produksi.

---

# Penyelarasan Bahasa Inggeris Sejagat (System-wide English Language Standardization) ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna meminta berserta tangkapan skrin Form Fields: *"ada yg bahasa melayu, sy nak awak selaraskan semua dlm sistem ni bahasa inggeris"*.
- **Punca Isu & Tindakan Pembaikan**:
  - Terdapat beberapa komponen terutamanya pada penyunting soalan borang (`components/forms/fields-editor/index.tsx`), pembina borang (`app/builder/[id]/client.tsx`), portal semakan sijil (`app/(public)/check/[formId]/client.tsx`), panel pentadbir (`app/(admin)/*`), dan penonton risalah (`components/pamphlet/viewer/flipbook-view.tsx`) yang masih memaparkan teks Bahasa Melayu (contoh: "Pemisah Halaman", "Soalan di bawah garisan...", "Tambah Baris", "Urus Pelan", "Halaman 1").
  - Kami menyelaraskan keseluruhan teks antaramuka (*user-facing UI strings*), mesej toast, arahan panduan, dan butang tindakan kepada Bahasa Inggeris standard yang profesional dan konsisten.

### Pelan Tindakan Pelaksanaan
- [x] 1. **Penyunting Medan Borang (`components/forms/fields-editor/index.tsx`)**:
  - `Pemisah Halaman (Page Break)` -> `Page Break`
  - `Soalan di bawah garisan ini akan bermula pada halaman baharu` -> `Questions below this line will start on a new page`
  - `Pemisah Halaman` / `Pemisah Aktif` -> `Page Break` / `Active Break`
  - `Mahu jadikan soalan seterusnya pada halaman baharu?` -> `Want the next question on a new page?`
  - `+ Tambah Pemisah di sini` -> `+ Add Page Break here`
  - `Susunan Pilihan (Layout)` -> `Options Layout`
  - `Menegak (Vertical)` / `Mendatar (Horizontal)` -> `Vertical` / `Horizontal`
  - `Baris Pernyataan` / `Lajur Skala` -> `Statement Rows` / `Scale Columns`
  - `Tambah Baris (Add Row)` / `Tambah Lajur (Add Column)` -> `Add Row` / `Add Column`
  - `Sentiasa tunjuk soalan ini.` -> `Always show this question.`
  - `Tambah peraturan` / `Buang peraturan` -> `Add rule` / `Remove rule`
  - `Tunjuk jika SEMUA / MANA-MANA peraturan ini benar:` -> `Show if ALL / ANY of these rules match:`
  - `Soalan {n}` / `(Tanpa Tajuk)` / `Wajib` -> `Question {n}` / `(Untitled)` / `Required`
- [x] 2. **Form Builder Client (`app/builder/[id]/client.tsx`)**:
  - Mesej toast sinkronisasi Google Sheet -> `Google Sheet title synced: ...` / `Failed to sync Google Sheet title`
  - Penerangan mod kehadiran berbilang hari & pilihan pengeluaran sijil -> English
  - Label jam minimum sijil -> `Minimum Hours for E-Certificate`
- [x] 3. **Portal Semakan E-Sijil (`app/(public)/check/[formId]/client.tsx`)**:
  - Kesemua teks panduan, kad semakan, butang semak, status semakan kehadiran dan sijil diselaraskan ke Bahasa Inggeris.
- [x] 4. **Panel Pentadbir (`app/(admin)/admin/page.tsx`, `components/admin/client-table.tsx`, `components/admin/edit-subscription-dialog.tsx`)**:
  - Kad statistik, jadual klien, penapis pelan/status, dan dialog pengurusan langganan pentadbir ditukar ke Bahasa Inggeris.
- [x] 5. **Penonton Risalah (`components/pamphlet/viewer/flipbook-view.tsx`) & Tindakan Pelayan (`actions/sheets.ts`)**:
  - `Halaman ${n}` -> `Page ${n}`
  - Mesej ralat tindakan lembaran Google ke Bahasa Inggeris.
- [x] 6. **Ujian & Pengesahan Kualiti**:
  - Jalankan `npm test` (501/501 ujian lulus merentas 51 suite fail tanpa regresi).
  - Jalankan `npm run typecheck` (0 ralat).
  - Jalankan `npm run lint` (0 ralat).
- [x] 7. **Dokumentasi & Respons**:
  - Kemas kini `memory.md`, `lessons.md`, dan `task.md`.
  - Berikan maklum balas ringkas kepada pengguna dalam Bahasa Melayu.

---

# Penambahan Garisan Luar (Stroke) Pemilih Warna Tema Borang ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna bertanya berserta gambar pemilih warna di Form Builder: *"kenapa bulat putih ni tak nampak ya? boleh ke strokekan"*.
- **Punca Isu & Tindakan Pembaikan**:
  - Pada pemilih `Background Color`, apabila warnanya adalah `#FFFFFF` (putih) di atas kad yang berlatar belakang putih, bulatan pemilih warna menjadi halimunan kerana ketiadaan garisan sempadan (stroke/border).
  - Terdahulu, kontena menggunakan `[clip-path:circle(50%)]` dan elemen `<input type="color">` diletakkan dengan `-inset-2`, menyebabkan sebarang border atau ring pada kontena luput atau tertutup oleh piksel input itu sendiri.
  - Kami menambah lapisan tindanan garisan sempadan di atas input:
    `<div className="absolute inset-0 rounded-full border-2 border-slate-300/90 dark:border-slate-600 pointer-events-none" />`
  - Dilengkapi `pointer-events-none` supaya klik terus tembus ke input pemilih warna.
  - Kedua-dua `Primary Color` dan `Background Color` kini memiliki sempadan bulat (stroke 2px) neutral yang jelas dan bayang halus `shadow-2xs` walaupun warnanya putih bersih.

### Pelan Tindakan Pelaksanaan
- [x] 1. Kemas kini pemilih warna dalam `app/builder/[id]/client.tsx`:
  - Masukkan struktur tindanan stroke bulat (`border-2 border-slate-300/90 dark:border-slate-600 pointer-events-none`) pada `Primary Color` dan `Background Color`.
- [x] 2. Ujian & Pengesahan Kualiti:
  - `npm test`: 501/501 lulus merentas 51 suite fail.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat ESLint.
- [x] 3. Dokumentasi: Kemas kini `memory.md`, `lessons.md`, dan `task.md`.

---

# Penggantian Corak Latar Belakang Borang (Form Background Pattern Upgrade) ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna meminta: *"background pattern tu, buang waves dan triangles, gantikan dengan yg cantik sikit"* berserta gambar selector tema di Form Builder.
- **Punca Isu & Tindakan Pembaikan**:
  - Corak lama `waves` (separuh bulatan berlapis / sisik ikan kasar) dan `triangles` (jalur bergerigi / hazard chevrons tajam) kelihatan tidak estetik dan ketinggalan zaman.
  - Kita membuang `waves` dan `triangles` daripada pemilih tema Form Builder.
  - Menggantikannya dengan corak-corak moden yang estetik, bersih, dan profesional:
    1. **Crosses (`crosses`)**: Penanda campur/palang halus geometri minimalis (*Linear/Vercel/GitHub tech aesthetic*).
    2. **Topography (`topography`)**: Garisan kontur beralun organik yang lembut dan elegan (menggantikan *waves* kasar sebelumnya).
    3. **Stars (`stars`)**: Bintang kilauan berlian 4-bucu (*sparkles ✨*) yang sesuai untuk majlis, jemputan, dan portfolio kreatif.
  - Membina modul berpusat `lib/forms/patterns.ts` sebagai *single source of truth* bagi memastikan gaya dalam Form Builder dan halaman borang awam sepadan 100%.
  - Mengekalkan keserasian ke belakang (*backward compatibility*) untuk borang sedia ada dalam pangkalan data yang mungkin mempunyai nilai `waves` atau `triangles`.

### Pelan Tindakan Pelaksanaan
- [x] 1. **Kemas kini Jenis Data (`lib/types/forms.ts`)**:
  - Tambah `'crosses' | 'topography' | 'stars'` ke dalam `BackgroundPattern`.
  - Kekalkan `'waves' | 'triangles'` sebagai *legacy fallback*.
- [x] 2. **Bina Modul Berpusat Corak (`lib/forms/patterns.ts`)**:
  - Takrifkan `FORM_BACKGROUND_PATTERNS` (None, Dots, Grid, Diagonal, Crosses, Circles, Topography, Stars).
  - Bina fungsi `getFormPatternStyle(pattern)` dengan pemetaan selamat dan *fallback* untuk `waves` (ke `topography`) dan `triangles` (ke `crosses`).
- [x] 3. **Kemas kini Form Builder (`app/builder/[id]/client.tsx`)**:
  - Gunakan `FORM_BACKGROUND_PATTERNS` dan paparkan grid 8 pilihan (4 kolum x 2 baris pada mudah alih, 8 kolum sebaris pada desktop) dengan pratonton thumbnail yang jelas dan kemas.
- [x] 4. **Kemas kini Borang Awam (`app/(public)/form/[id]/client.tsx`)**:
  - Gunakan `getFormPatternStyle` untuk render corak latar belakang borang secara seragam.
- [x] 5. **Ujian Unit & Pengesahan**:
  - Bina `tests/form-patterns.test.ts` untuk menguji semua corak dan keserasian legasi (5/5 ujian lulus).
  - Jalankan `npm test` (501/501 lulus merentas 51 suite fail), `npm run typecheck` (0 ralat), dan `npm run lint` (0 ralat).
- [x] 6. **Dokumentasi & Respons**:
  - Kemas kini `memory.md`, `lessons.md`, dan `task.md`.
  - Maklumkan kepada pengguna dengan ringkas.

---

# Penyelarasan Lengkungan Rendah & Bersih Form Builder (Low-Radius Curve Standardization) ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna meminta: *"yg dalam ni pun selaraskan jgk less curve tu"* berserta tangkapan skrin halaman Form Builder (`app/builder/[id]/client.tsx`).
- **Punca Isu & Tindakan Pembaikan**:
  - Di halaman Form Builder, sesetengah kad (`General Info`, `Share`, dsb.), bekas pratonton kod QR (`rounded-lg`), dialog amaran pengesahan (`rounded-2xl`), dan elemen medan borang (`components/forms/fields-editor/index.tsx`) masih menggunakan lengkungan tebal/bubbly (`rounded-xl` / `rounded-2xl`).
  - Kami menyelaraskan komponen asas `<Card>` dalam `components/ui/card.tsx` kepada `rounded-lg border-slate-200 shadow-2xs`.
  - Mengemas kini kontena QR code kepada `rounded-md shadow-2xs border border-slate-200`.
  - Mengemas kini dialog pengesahan, kotak alert, panel tetapan, dan sasaran seret-dan-lepas (*drag-and-drop sortable items*) medan borang kepada lengkungan bersih standard `rounded-md` (6px) dan `rounded-lg` (8px).

### Pelan Tindakan Pelaksanaan
- [x] 1. Kemas kini `components/ui/card.tsx` kepada `rounded-lg border-slate-200 shadow-2xs`.
- [x] 2. Kemas kini `app/builder/[id]/client.tsx`:
  - Kad utama borang (General Info, Theme, E-Cert, Attendance, Share) menggunakan `rounded-lg shadow-2xs border-slate-200`.
  - Bekas pratonton QR code diselaraskan ke `rounded-md shadow-2xs border border-slate-200`.
  - Dialog, kotak alert, butang tindakan diselaraskan ke `rounded-md` / `rounded-lg`.
- [x] 3. Kemas kini `components/forms/fields-editor/index.tsx`:
  - Sasaran seret medan soalan (`SortableField`), grid questions, dan drag overlay diselaraskan dari `rounded-2xl`/`rounded-xl` ke `rounded-md`.
- [x] 4. Pengesahan Kualiti:
  - `npm test`: 496/496 lulus merentas 50 fail suite.
  - `npm run typecheck`: 0 ralat.
  - `npm run lint`: 0 ralat.
- [x] 5. Kemas kini dokumentasi `memory.md`, `lessons.md`, dan `task.md`.

---

# Penyelarasan Tema Rona Ungu Lebih Gelap (Midnight Violet #4C1D95) ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna meminta: *"gelapkan sikit lagi color ungu tu"* berserta tangkapan skrin halaman Settings (`/settings`).
- **Punca Isu & Tindakan Pembaikan**:
  - Warna ungu sebelumnya (`violet-800` / `#5b21b6`) masih terasa agak cerah bagi pengguna.
  - Kami menggelapkannya kepada **Midnight Violet** (`violet-900` / `#4c1d95`) dengan hover `violet-950` (`#2e1065`) merentas fail `app/globals.css`, butang `+ New Form` di sidebar, kad integrasi Google, lencana, teks penjenamaan, dan semua komponen UI (48 fail).

### Pelan Tindakan Pelaksanaan
- [x] 1. Kemas kini token global dalam `app/globals.css`: `--primary: #4c1d95;`, `--ring: #4c1d95;`, `--accent-foreground: #4c1d95;`, `selection:text-violet-950`.
- [x] 2. Kemas kini sidebar `sidebar.tsx`: butang `+ New Form` (`bg-violet-900 hover:bg-violet-950`), item aktif, dan penjenamaan.
- [x] 3. Kemas kini keseluruhan komponen (48 fail) merangkumi Dashboard, Auth, Landing, Builder, dan Settings.
- [x] 4. Pengesahan Kualiti: `npm test` (496/496 lulus), `npm run typecheck` (0 ralat), `npm run lint` (0 ralat).
- [x] 5. Kemas kini dokumentasi `memory.md`, `lessons.md`, dan `task.md`.

---

# Sinkronisasi Automatik Tajuk Google Sheet Apabila Tajuk Borang Dikemas Kini ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna bertanya berserta tangkapan skrin Google Sheet: *"tajuk tu tak auto update ke? kalau ubah di form title"*.
- **Punca Isu & Tindakan Pembaikan**:
  - Apabila borang dicipta pada mulanya dengan tajuk lalai `Untitled Form`, Google Sheet dinamakan `Untitled Form - Responses`.
  - Apabila pengguna mengubah tajuk borang di Form Builder (contoh: "Mesyuarat Pasukan Kandungan Laman Web 2026") dan menyimpannya (atau auto-save berjalan), tajuk Google Sheet di Google Drive sebelum ini tidak disinkronkan.
  - Kami membina `updateGoogleSpreadsheetTitle(sheetUrl, newTitle, settings)` dan `syncSheetTitleAction(formId, newTitle)` dalam `actions/sheets.ts` menggunakan API Google Sheets `spreadsheets.batchUpdate` (`updateSpreadsheetProperties`).
  - Mengintegrasikan pengemaskinian tajuk automatik dalam `updateFormAction` (`actions/forms.ts`) menggunakan `after()` supaya pengemaskinian berlaku di latar belakang tanpa melambatkan maklum balas simpan borang.

### Pelan Seni Bina & Pelaksanaan:
- [x] 1. **Fungsi Kemas Kini Tajuk Google Sheet (`actions/sheets.ts`)**:
  - Bina fungsi `updateGoogleSpreadsheetTitle(sheetUrl, newTitle, settings)` menggunakan API Google Sheets `spreadsheets.batchUpdate` (`updateSpreadsheetProperties: { properties: { title }, fields: 'title' }`).
  - Menyokong kedua-dua Google OAuth dan Google Service Account dengan pembaharuan token (*refresh token*) automatik.
- [x] 2. **Integrasi Automatik dalam `updateFormAction` (`actions/forms.ts`)**:
  - Mengesan perubahan tajuk borang (`existing.title !== form.title` atau `existing.title === 'Untitled Form'`).
  - Apabila tajuk berubah dan borang mempunyai pautan `googleSheetUrl`, laksanakan pengemaskinian tajuk Google Sheet secara tidak segerak via `after()` di latar belakang.
- [x] 3. **Ujian Unit & Kualiti**:
  - Tambah ujian unit dalam `tests/auto-sheet-creation.test.ts` (4/4 lulus).
  - Jalankan `npm test` (496/496 lulus merentas 50 fail suite), `npm run typecheck` (0 ralat), dan `npm run lint` (0 ralat).
- [x] 4. **Kemas kini Dokumen**:
  - Kemas kini `memory.md` & `lessons.md`.

---

# Autogenerasi & Pautan Automatik Google Sheet Semasa Cipta Borang Baharu ✅ SELESAI

**Konteks & Keperluan Pengguna**:
- Pengguna bertanya: *"bila create new form kan, boleh ke nak auto ada google sheet share url"*.
- Pengguna mengesahkan arahan: *"proceed"*.
- **Punca & Penyelesaian**:
  - Sebelum ini, `createFormAction` mencipta borang dengan `googleSheetUrl: ''`, memaksa pengguna mencipta spreadsheet di Google Drive secara manual, berkongsi hak milik kepada Service Account, dan menyalin pautan ke form builder.
  - Kami membina `createGoogleSpreadsheetHelper` dalam `actions/sheets.ts` yang menyokong kedua-dua Google OAuth dan Service Account (berserta perkongsian hak milik `writer` kepada pengguna dan pemindahan ke folder Drive pengguna jika dikonfigurasi).
  - Mengintegrasikan penjanaan automatik terus di dalam `createFormAction` (`actions/forms.ts`) dengan perlindungan *try-catch fail-safe*.
  - Menambah butang tindakan 1-klik **"Auto-Generate Google Sheet"** dan pautan langsung **"Open Google Sheet"** di dalam Form Builder (`app/builder/[id]/client.tsx`).

### Pelan Seni Bina & Pelaksanaan:
- [x] 1. **Modul Pengautomasian Google Sheet (`actions/sheets.ts`)**:
  - Bina fungsi teras `createGoogleSpreadsheetHelper(title, settings, userEmail)` yang menyokong:
    - **Google OAuth**: Cipta spreadsheet terus pada Google Drive pengguna dengan refresh token automatik.
    - **Google Service Account**: Cipta spreadsheet via JWT, kongsi izin editor automatik (`role: 'writer'`) kepada emel pengguna, dan masukkan ke `googleDriveFolderId` jika disediakan.
- [x] 2. **Integrasi Automatik dalam `createFormAction` (`actions/forms.ts`)**:
  - Apabila borang baharu dicipta (`+ New Form`), panggil `createGoogleSpreadsheetHelper` secara automatik.
  - Pautan URL spreadsheet yang dijana terus dimasukkan ke `newForm.googleSheetUrl` sebelum disimpan ke pangkalan data.
  - Dilindungi dengan *fail-safe* supaya jika berlaku gangguan talian Google, borang tetap berjaya disimpan tanpa sebarang kegagalan.
- [x] 3. **Butang Jana Segera 1-Klik dalam Form Builder (`app/builder/[id]/client.tsx`)**:
  - Jika borang tiada Google Sheet: butang `Auto-Generate Google Sheet` disediakan untuk cipta & pautkan terus dengan 1 klik.
  - Jika borang ada Google Sheet: pautan `Open Google Sheet` disediakan untuk membuka helaian terus di tab baharu.
- [x] 4. **Ujian & Pengesahan Kualiti**:
  - `tests/auto-sheet-creation.test.ts`: 3/3 ujian unit lulus merangkumi OAuth, Service Account, dan fail-safe.
  - `npm test`: 495 / 495 ujian lulus merentas 50 fail suite.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
- [x] 5. **Kemas kini Dokumen**:
  - Kemas kini `memory.md` & `lessons.md`.

---

# Penyelarasan Saiz Kotak Tarikh Kad Borang (Form Card Date Box Consistency) ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna meminta: *"kotak tarikh tu bagi sama saiz dengan sebelah, nampak konsisten"* berserta tangkapan skrin kad borang papan pemuka.
- **Punca Isu & Tindakan Pembaikan**:
  - Pada bahagian bawah kad borang (`CardFooter` dalam `components/dashboard/form-card.tsx`), butang *Copy Link* dan *Preview* mempunyai ketinggian `h-8` (32px), sempadan 1px, dan radius `rounded-md`.
  - Kotak tarikh ciptaan borang sebelum ini hanya menggunakan span `py-0.5 rounded` (~20px tinggi) tanpa sempadan terstruktur.
  - Elemen kotak tarikh kini diselaraskan kepada `inline-flex items-center h-8 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 whitespace-nowrap shrink-0 shadow-2xs`.
  - Hasilnya: Kotak tarikh dan butang di sebelahnya kini berkongsi ketinggian tepat 32px (`h-8`), radius sudut `rounded-md` yang sama, dan sempadan 1px neutral yang seimbang dan simetri.

### Pelan Tindakan
- [x] 1. Kemas kini elemen kotak tarikh dalam `components/dashboard/form-card.tsx` kepada `inline-flex items-center h-8 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600`.
- [x] 2. Sahkan pengesahan kualiti (`npm test` 492/492 lulus, `npm run typecheck` 0 ralat, `npm run lint` 0 ralat).
- [x] 3. Kemas kini `memory.md` dan `lessons.md`.

---

# Penyelarasan Tema Warna Ungu Gelap (Darker Purple Theme - Deep Royal Violet #5B21B6) ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna meminta: *"tema website ni color purple gelap sikit boleh ke"* berserta tangkapan skrin papan pemuka KlikForm.
- **Punca & Pengesahan**:
  - Rona ungu terdahulu menggunakan `purple-600` / `#7c3aed` yang terlalu terang dan silau neon pada latar putih papan pemuka.
  - Pengguna memilih pilihan yang dicadangkan: **Deep Royal Violet (`#5b21b6` / Violet-800)** dengan hover `#4c1d95` (Violet-900) dan aksen lembut `#f5f3ff`.

### Pelan Tindakan Pelaksanaan
- [x] 1. Sahkan pilihan rona ungu gelap bersama pengguna melalui dialog pemilihan rasmi (`Deep Royal Violet #5b21b6`).
- [x] 2. Kemas kini token warna CSS global dalam `app/globals.css`:
  - `--primary: #5b21b6;`, `--ring: #5b21b6;`, `--accent: #f5f3ff;`, `--accent-foreground: #5b21b6;`.
  - Palet carta analytics (`#5b21b6`, `#6d28d9`, `#7c3aed`, `#a78bfa`, `#c4b5fd`).
  - Warna pemilihan teks berjenama (`selection:bg-violet-100 selection:text-violet-900`).
  - Penyelarasan tema manifes PWA `public/site.webmanifest` (`theme_color: #5b21b6`).
- [x] 3. Selaraskan komponen Papan Pemuka (`components/dashboard/*`):
  - Butang utama `+ New Form` dalam `sidebar.tsx` bertukar ke `bg-violet-800 hover:bg-violet-900 text-white`.
  - Item menu navigasi aktif (`Dashboard`, dsb.) menggunakan `bg-violet-50 text-violet-900` dengan ikon `text-violet-800`.
  - Teks jenama sidebar `<span className="text-violet-800">Klik</span>Form` dan border avatar/logo `border-violet-200/80`.
  - Lencana pelan Pro dalam `stats.tsx` bertukar ke `bg-violet-50 text-violet-800 border-violet-200/80` dan pautan `text-violet-800 hover:text-violet-900`.
  - Ikon 30-Day Analytics `text-violet-800` dan bar visual harian `bg-violet-200 hover:bg-violet-400`.
  - Butang pratonton kad borang `form-card.tsx` dan butang cipta borang `app/(dashboard)/forms/page.tsx`.
- [x] 4. Selaraskan komponen Awam, Produk & Auth:
  - Butang Sign In / Sign Up dalam `app/(auth)/login/page.tsx` & `components/landing-header-auth.tsx`.
  - Kad Pro dalam `components/pricing/plan-card.tsx` & `components/pricing-modal.tsx` bertukar ke `border-violet-800` dan `bg-violet-800 hover:bg-violet-900`.
  - Butang CTA, status indicator, dan lencana pada halaman landing (`landing-hero.tsx`, `landing-features-bento.tsx`, `landing-showcase.tsx`, `landing-cta.tsx`, `landing-comparison.tsx`, `landing-footer.tsx`).
  - Semua halaman produk (`app/products/*`) dan ciri-ciri dashboard (`bio`, `certificates`, `pamphlets`, `qr-builder`, `shortener`, `settings`, `audit`).
- [x] 5. Ujian & Pengesahan Kualiti:
  - `npm test`: 492 / 492 ujian unit lulus (100% lulus merentas 49 suite).
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat / 0 amaran ESLint.
- [x] 6. Kemas kini `memory.md` & `lessons.md`.

### Seksyen Reviu & Keputusan Seni Bina
1. **Keanggunan & Ergonomik Visual**:
   - Peralihan daripada `#7c3aed` (lightness ~58%) kepada Deep Royal Violet `#5b21b6` (lightness ~42%) berjaya menghapuskan silau neon murahan ("AI slop / glowing candy"), memberikan profil visual gred perusahaan yang matang ala Stripe, GitHub, dan Linear.
2. **WCAG AAA Compliance**:
   - Teks putih di atas butang `bg-violet-800` kini mempunyai nisbah kontras melebihi 7.5:1 (melepasi standard ketat WCAG AAA), meningkatkan kebolehbacaan pada semua jenis skrin paparan.
3. **Penyelarasan Menyeluruh Tanpa Pecahan Sub-sistem**:
   - Tiada unsur bertembung antara warna ungu terang lama dengan ungu gelap baharu; semua elemen aktif, penunjuk, dan butang diselaraskan seragam dalam satu spektrum warna terpadu.

---

# Penghapusan Artifak Takuk Buku / Tompok Gelap di Bawah Tulang (Spine Notch Removal) ✅ SELESAI

**Objektif**:
Menjawab dan membaiki isu yang dibangkitkan oleh pengguna (*"kenapa ada tu dekat bawah"* berserta bulatan merah pada tompok gelap di bahagian bawah tulang buku):
1. **Punca Isu**:
   - Terdahulu, terdapat elemen hiasan takuk jahitan ikatan buku (*binding notch accent*) dengan kecerunan jejari `radial-gradient` yang diletakkan di dalam kontena flex tulang buku.
   - Disebabkan garisan lurah tengah menggunakan `h-full`, susunan flex telah menolak elemen takuk bawah melepasi sempadan bawah helaian buku, menjadikannya terkeluar seperti tompok/petak gelap kotor di bahagian bawah.
2. **Tindakan Pembaikan**:
   - Membuang sepenuhnya elemen takuk tiruan (*binding notches*) di bahagian atas dan bawah yang kelihatan comot.
   - Menetapkan `overflow-hidden` pada kontena tulang belakang `w-4` supaya tiada sebarang bayang atau garisan terkeluar daripada ketinggian buku.
   - Mengekalkan kemasan longkang cekung 3D yang bersih dan garisan lurah tengah rambut (*hairline crease*) 1.5px yang anggun dan minimalis mengikut prinsip *anti-AI slop*.
3. **Ujian & Pengesahan**:
   - `npm test tests/pamphlet.test.ts`: 18/18 lulus.
   - `npm run typecheck`: 0 ralat.
   - `npm run lint`: 0 ralat/amaran.

### Pelan Tindakan
- [x] 1. Kenal pasti elemen takuk `radial-gradient` yang terkeluar di bahagian bawah tulang.
- [x] 2. Padam elemen takuk atas & bawah dan kemas kini kontena tulang dengan `overflow-hidden`.
- [x] 3. Jalankan ujian unit, semakan jenis (typecheck), dan linter.
- [x] 4. Berikan penjelasan ringkas dan padat kepada pengguna dalam Bahasa Melayu.

---

# Pemulihan & Pengukuhan Tulang Belakang Buku 3D di Tengah (Center Spine Restoration) ✅ SELESAI

**Objektif**:
Menyelesaikan isu yang dibangkitkan oleh pengguna (*"kenapa tulang belakang buku takde dekat tengah2"* berserta tangkapan skrin bulatan merah pada bahagian tengah cantuman halaman):
1. **Punca Isu**:
   - Semasa beralih ke enjin StPageFlip, komponen tindanan *Center Spine Crease System* (longkang cekung 16px, rabung spekular, lurah garis rambut, dan takuk jahitan) sebelum ini tertinggal.
   - Bayang lengkungan dalaman helaian (*inner spine shadow*) diletakkan berasaskan indeks nombor genap/ganjil (`idx % 2 === 0`) yang terbalik, menyebabkan bayang terkeluar di bucu tepi luar kiri dan kanan dan bukannya di tulang tengah.
2. **Tindakan Pembaikan**:
   - Membina semula lapisan **3D Center Spine System** di tengah-tengah kontena buku (`left: 50%`):
     - Longkang cekung 3D 16px (*concave spine gutter gradient*).
     - Lurah garis rambut 2px berserta rabung spekular (*specular ridge*).
     - Takuk ikatan jahitan buku atas dan bawah (*top & bottom binding notch accents*).
     - Meletakkan `startZIndex: 10` dan lapisan tulang pada `z-[12]` supaya helaian yang diselak (`z: 15`) berputar secara semula jadi di atas tulang tengah buku.
   - Menghubungkan bayang lengkungan dalaman muka surat secara dinamik melalui kelas selektor CSS `.stf__item.--left` dan `.stf__item.--right` dalam `app/globals.css`, memastikan bayang sentiasa menuruni cerun ke arah tulang tengah buku.
3. **Ujian & Pengesahan**:
   - `npm test tests/pamphlet.test.ts`: 18/18 lulus.
   - `npm run typecheck`: 0 ralat.
   - `npm run lint`: 0 ralat/amaran.

### Pelan Tindakan
- [x] 1. Kenal pasti ketiadaan komponen spine tengah dan penempatan bayang terbalik pada tepi luar.
- [x] 2. Tambah peraturan gaya CSS selektor dinamik `.stf__item.--left` dan `.stf__item.--right` di `app/globals.css`.
- [x] 3. Bina semula tindanan *3D Center Spine Crease System* di `components/pamphlet/viewer/flipbook-view.tsx`.
- [x] 4. Selaraskan `startZIndex` untuk hierarki visual yang tepat semasa halaman melipat.
- [x] 5. Jalankan ujian unit, semakan jenis (typecheck), dan linter.

---

# Penjelasan Mekanik Tarikan Halaman 3D & Sokongan Kertas Lembut Menyeluruh ✅ SELESAI

**Objektif**:
Menjawab persoalan pengguna (*"kenapa tak semua page boleh tarik ya"*) dengan menerangkan secara terperinci fizik selakan buku digital serta memastikan semua halaman boleh ditarik dan dilentur secara seragam:
1. **Punca Utama & Fizik Selakan**:
   - **Fizik Arah Selakan (Kiri vs Kanan)**: Muka surat kanan hanya boleh ditarik ke kiri (ke hadapan), muka surat kiri hanya boleh ditarik ke kanan (ke belakang). Muka tengah tulang buku (*spine*) adalah tempat ikatan mati jadi tidak boleh ditarik dari tengah.
   - **Batasan Muka Surat Pertama & Terakhir**: Pada muka depan (Page 1), tiada halaman sebelum, jadi hanya boleh ditarik ke hadapan. Pada muka belakang, tiada halaman seterusnya, jadi hanya boleh ditarik ke belakang.
   - **Ketumpatan Kertas Lembut (*Soft Paper Density*)**: Mengemaskini semua helaian (termasuk muka depan dan belakang) kepada ketumpatan `soft` supaya bucu boleh melipat (*corner curling*) dan ditarik lentur tanpa kekakuan *hardcover*.
2. **Kemas kini Kod `flipbook-view.tsx`**:
   - Menetapkan `pageEl.dataset.density = 'soft'` secara seragam.
   - Menguatkuasakan `p.setDensity('soft')` pada koleksi helaian `pageFlipInstance` untuk mengatasi ketetapan automatik *hardcover* enjin.
3. **Ujian & Pengesahan**:
   - `npm test tests/pamphlet.test.ts`: Lulus 18/18.
   - `npm run typecheck`: 0 ralat.
   - `npm run lint`: 0 ralat/amaran.

### Pelan Tindakan
- [x] 1. Selidik punca mekanik `page-flip` berkaitan seretan bucu, arah pergerakan, dan ketumpatan muka surat (`density`).
- [x] 2. Kemas kini `components/pamphlet/viewer/flipbook-view.tsx` supaya semua helaian menggunakan `soft density`.
- [x] 3. Jalankan ujian unit, semakan jenis (typecheck), dan linter.
- [x] 4. Berikan penjelasan padat dan jelas kepada pengguna dalam Bahasa Melayu.

---

# Integrasi Enjin 3D StPageFlip (Fizik Kertas Melentur & Lesen MIT Bebas Komersial) ✅ SELESAI

**Objektif**:
Berdasarkan arahan pengguna (*"okay proceed"* selepas pengesahan bahawa Pilihan 2 (`page-flip` / StPageFlip) berlesen MIT dan membenarkan kod KlikForm kekal 100% rahsia / tertutup):
1. **Pasang & Sediakan Pakej**:
   - `page-flip` dan `@types/page-flip` telah dipasang dalam projek (Lesen MIT, bebas komersial, sifar kebergantungan luar).
2. **Bina Komponen Flipbook Berasaskan `page-flip`**:
   - Menyediakan pemuatan dinamik sisi klien (*client-side dynamic import*) bagi `page-flip` untuk mengelakkan ralat SSR / hydration mismatch.
   - Menguruskan kitaran hidup DOM tanpa pertembungan rekonsiliasi React DOM (menggunakan kontena hos terasing dan `bookMount` terpencil).
   - Menyokong fizik lipatan bucu interaktif (*interactive corner fold*), kelenturan helaian (*flexible paper curvature*), dan kulit keras/lembut (*hardcover & soft pages* via `data-density="hard"`).
   - Memastikan mod dwi-halaman (*two-page spread*) dan satu halaman (*single-page portrait*) berfungsi secara automatik mengikut saiz skrin dan bilangan halaman.
3. **Kekalkan Integrasi Lengkap KlikForm**:
   - Sokongan kawalan pembesaran & seretan (*zoom & pan*).
   - Penyegerakan dengan bar navigasi, kekunci anak panah papan kekunci, dan butang terapung.
   - Pengekalan fungsi `computeSpread` untuk integriti 100% ujian unit sedia ada.
4. **Ujian & Pengesahan Kualiti**:
   - `npm test tests/pamphlet.test.ts`: 18/18 ujian lulus.
   - `npm test`: 492/492 ujian suite penuh lulus.
   - `npm run typecheck`: 0 ralat TypeScript (`tsc --noEmit`).
   - `npm run lint`: 0 ralat / 0 amaran ESLint (`eslint .`).

### Pelan Tindakan
- [x] 1. Pasang `page-flip` dan `@types/page-flip` (Lesen MIT).
- [x] 2. Reka bentuk semula `components/pamphlet/viewer/flipbook-view.tsx` menggunakan enjin `PageFlip`.
- [x] 3. Sambungkan event listener (`flip`, `changeState`, audio selakan halaman).
- [x] 4. Sambungkan kawalan luaran (`flipNext`, `flipPrev`, `zoom`, `keyboard`).
- [x] 5. Uji responsiviti pada peranti mudah alih dan mod landskap.
- [x] 6. Jalankan pengesahan ujian (pamphlet tests, full test suite, typecheck, lint).

---

# Penambahbaikan Tulang Buku 3D (Spine Beautification & Crease Depth) ✅ SELESAI

**Objektif**:
Berdasarkan permintaan dan tangkapan skrin pengguna (*"boleh ke cantikkan sikit tgh tulang buku (spine)"*):
1. **Cantikkan Tengah Tulang Buku (Center Spine Crease)**:
   - Gantikan garisan gelap 2px rata dengan longkang cekung 3D (*concave spine gutter* 16px) yang mempunyai kecerunan fizikal mendalam.
   - Tambah rabung mikro-spekular (*specular ridge*) dan lurah garis rambut (*hairline valley groove*) di bahagian tengah.
   - Tambah aksen takuk jahitan ikatan (*spine binding notch accents*) di bahagian atas dan bawah buku.
   - Luaskan bayang lurah dalaman (*inner gutter shadow*) pada muka halaman kepada 32px (`w-8`) dengan keluk keamatan berkembar.
2. **Cantikkan & Kemaskan Tulang Luar Buku (Outer Spine Binding & Hinge)**:
   - Tambah reben lipatan tulang buku fizikal (*tactile spine fold & hinge accent*) pada sisi luar muka hadapan dan belakang: sorotan tepi lembut (*specular highlight*), rona silinder kelabu, dan garis alur skor mikro.
   - Pindahkan bayang jatuhan (*drop shadow*) dari muka halaman depan/belakang ke kontena helaian induk (*sheet container*).
   - Asingkan satah 3D muka hadapan (`translateZ(0.5px)`) dan belakang (`rotateY(180deg) translateZ(0.5px)`), menghapuskan sepenuhnya artifak *Z-fighting* dan bayang terbalik yang terkeluar di sisi kiri buku.
3. **Pengesahan & Ujian Kualiti**:
   - 18/18 ujian unit pamphlet lulus.
   - 492/492 ujian suite penuh lulus.
   - 0 ralat TypeScript (`tsc --noEmit`).
   - 0 ralat/amaran ESLint (`eslint .`).

### Pelan Tindakan
- [x] 1. Bina longkang cekung 3D di tengah buku (*concave gutter* 16px, rabung mikro, lurah tengah, dan takuk jahitan atas/bawah).
- [x] 2. Alihkan `box-shadow` ke kontena helaian induk bagi mengelakkan bayang terbalik.
- [x] 3. Asingkan muka depan dan belakang dalam ruang 3D (`translateZ(0.5px)`), menghapuskan artifak lelehan sisi kiri.
- [x] 4. Luaskan bayang lurah tengah muka hadapan dan belakang kepada 32px (`w-8`).
- [x] 5. Tambah aksen lipatan tulang buku fizikal (*tactile spine fold & hinge*) pada sisi luar muka buku.
- [x] 6. Jalankan pengesahan ujian (18/18 pamphlet, 492/492 penuh, `typecheck`, `lint`).

---

# Pembaikan 3D Flipbook: Selakan Masa Nyata & Penghapusan Jalur Tulang Terapung ✅ SELESAI

**Objektif**:
Berdasarkan permintaan dan tangkapan skrin pengguna (*"boleh ke real time bila flip, tak nak ada tu dulu baru flip"*):
1. **Hapuskan Jalur Terapung ("tak nak ada tu")**: Menyingkirkan elemen skeuomorphic bertindih (*stacked paper edges*) yang tergantung di ruang kosong sebelah kanan.
2. **Kunci Mod Halaman Tunggal untuk Dokumen $\le 2$ Halaman**: Membetulkan logik `isTwoPageSpread` agar risalah 1 atau 2 muka surat dipaparkan berpusat (*centered*) secara kemas tanpa ruang kosong separuh buku.
3. **Selakan Responsif Masa Nyata (*Real-Time Direct Flip*)**:
   - Memendekkan tempoh animasi kepada 400ms dengan mulaan *quadratic* segera (sifar kelewatan / kelengahan sebelum selak).
   - Menajamkan kepekaan seretan kursor/jari kepada 3px dan ambang penyiapan 22%.
   - Menyelaraskan butang terapung kepada geometri moden `rounded-md`.

### Pelan Tindakan
- [x] 1. Kemas kini logik `isTwoPageSpread` dalam `flipbook-view.tsx` (`totalPages > 2` untuk mod dwi-halaman automatik).
- [x] 2. Padamkan elemen `Stacked Paper Edges` kiri & kanan.
- [x] 3. Optimumkan fungsi easing dan tempoh animasi selakan daripada 720ms ke 400ms.
- [x] 4. Optimumkan kepekaan *pointer drag* (3px) dan ambang pelepasan (22%).
- [x] 5. Selaraskan butang terapung ke `rounded-md`.
- [x] 6. Jalankan pengesahan ujian (18/18 ujian pamphlet, 492/492 suite penuh, TypeScript, ESLint).

---



**Objektif**:
Berdasarkan permintaan dan tangkapan skrin pengguna (*"dekat sini dan setiap tab pun selaraskan jgk"*), selaraskan keseluruhan kawasan papan pemuka (dashboard) yang boleh diakses pengguna dan setiap tab di dalamnya:
1. **Sidebar Navigasi & Mobile Menu (`components/dashboard/sidebar.tsx`, `components/mobile-menu.tsx`)**:
   - Ubah logo container daripada `rounded-xl` kepada `rounded-md`.
   - Butang `+ New Form`: lengkungan rendah `rounded-md`, rona ungu logo `bg-purple-600 hover:bg-purple-700 text-white shadow-xs`.
   - Item aktif: `rounded-md`, latar lembut `bg-purple-50 text-purple-700 font-semibold`, ikon `text-purple-600`.
   - Item tidak aktif: `rounded-md`, `text-slate-600 hover:text-slate-900 hover:bg-slate-100/80`.
   - Profil pengguna: `rounded-md`, avatar geometri `rounded-md`.
2. **Tab 1: Dashboard / My Forms (`app/(dashboard)/forms/page.tsx`, `form-card.tsx`, `stats.tsx`, `search.tsx`, `filter.tsx`)**:
   - Kad Borang (`FormCard`): kurangkan daripada `rounded-2xl` kepada `rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs`. Buang efek lambung `-translate-y-1` dan bayang tebal `hover:shadow-xl`.
   - Butang dalam `FormCard`: tukar `Copy Link` dan `Preview` daripada pil bulat `rounded-full` kepada butang geometri kemas `rounded-md`.
   - Lencana tarikh: `rounded bg-slate-100 text-slate-600 font-mono text-[11px]`.
   - Kad Statistik (`DashboardStats`): `rounded-lg border border-slate-200 bg-white shadow-2xs`. Lencana pelan `rounded-md` (bukan `rounded-full`). Pautan naik taraf `text-purple-600`.
   - Kotak Carian & Penapis (`DashboardSearch`, `DashboardFilter`): `rounded-md border-slate-200`.
   - Keadaan Kosong (Empty State): kurangkan daripada `rounded-2xl` kepada `rounded-lg border border-dashed border-slate-200 bg-slate-50/50`.
3. **Tab 2: Responses (`app/(dashboard)/responses/client.tsx`, `page.tsx`)**:
   - Kad senarai borang respons: `rounded-lg border border-slate-200 bg-white shadow-2xs`.
   - Dialog Reset Kehadiran: `rounded-lg` (bukan `rounded-2xl` / `rounded-xl`).
   - Selaraskan mesej notifikasi toast ke 100% Bahasa Inggeris (terjemah mesej segerak Google Sheets daripada Bahasa Melayu ke Bahasa Inggeris).
4. **Tab 3: E-Cert (`app/(dashboard)/certificates/page.tsx`, `components/certificate-qr-card.tsx`)**:
   - Kad e-sijil: `rounded-lg border border-slate-200 bg-white shadow-2xs`.
   - Kotak QR & butang muat turun: `rounded-md`, butang utama `bg-purple-600 hover:bg-purple-700 text-white shadow-xs`.
5. **Tab 4: E-Cert Builder (`app/(dashboard)/certificates/builder/page.tsx`, `certificate-template-card.tsx`)**:
   - Lencana penapis kategori: `rounded-md text-xs` (bukan pil bujur tebal).
   - Butang New Certificate: `bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-xs`.
   - Kad templat sijil: `rounded-lg border border-slate-200 bg-white shadow-2xs`.
6. **Tab 5: QR Builder (`app/(dashboard)/qr-builder/client.tsx`, `qr-code-list.tsx`)**:
   - Kad senarai kod QR: `rounded-lg border border-slate-200 bg-white shadow-2xs`.
   - Butang tindakan & editor: `rounded-md`, `bg-purple-600 hover:bg-purple-700 text-white shadow-xs`.
7. **Tab 6: URL Shortener (`app/(dashboard)/shortener/client.tsx`, `page.tsx`)**:
   - Kad statistik dan jadual pautan pendek: `rounded-lg border border-slate-200 bg-white shadow-2xs`.
   - Dialog dan butang jana: `rounded-md`, `bg-purple-600 hover:bg-purple-700 text-white shadow-xs`.
8. **Tab 7: Bio Links / KlikBio (`app/(dashboard)/bio/client.tsx`, `page.tsx`)**:
   - Kad statistik dan kad profil Bio: kurangkan daripada `rounded-2xl` / `rounded-3xl` kepada `rounded-lg border border-slate-200 bg-white shadow-2xs`.
   - Lencana tema dan kotak pautan awam: `rounded-md`.
9. **Tab 8: E-Pamphlet (`app/(dashboard)/pamphlets/client.tsx`, `page.tsx`)**:
   - Kad statistik dan kad brosur digital: `rounded-lg border border-slate-200 bg-white shadow-2xs`.
   - Butang cipta dan pratonton: `rounded-md`, `bg-purple-600 hover:bg-purple-700 text-white shadow-xs`.
10. **Tab 9 & 10: Audit Log & Settings & Pricing Modal (`app/(dashboard)/audit/page.tsx`, `app/(dashboard)/settings/page.tsx`, `components/pricing-modal.tsx`)**:
    - Kad log audit dan tetapan profil/integrasi: `rounded-lg border border-slate-200 bg-white shadow-2xs`.
    - Tab tetapan: `rounded-md`.
    - Modal Pricing (`PricingModal`): `rounded-lg border border-slate-200`, kad Pro `border-2 border-purple-600`, lencana `rounded-md`, butang `bg-purple-600 hover:bg-purple-700 text-white shadow-xs`.
11. **Pengesahan & Ujian**:
    - `npm run typecheck`, `npm run lint`, `npm test`, dan `npm run build`.

---

### Pelan Tindakan

- [x] 1. **Penyelarasan Sidebar & Shell (`components/dashboard/sidebar.tsx`, `components/mobile-menu.tsx`)**
- [x] 2. **Penyelarasan Tab 1: Dashboard / My Forms (`components/dashboard/form-card.tsx`, `stats.tsx`, `search.tsx`, `filter.tsx`, `app/(dashboard)/forms/page.tsx`, `cross-form-analytics.tsx`)**
- [x] 3. **Penyelarasan Tab 2: Responses (`app/(dashboard)/responses/client.tsx`, `page.tsx`, `responses/[id]/analytics/client.tsx`, `response-charts.tsx`)**
- [x] 4. **Penyelarasan Tab 3: E-Cert (`app/(dashboard)/certificates/page.tsx`, `components/certificate-qr-card.tsx`)**
- [x] 5. **Penyelarasan Tab 4: E-Cert Builder (`app/(dashboard)/certificates/builder/page.tsx`, `components/certificates/certificate-template-card.tsx`)**
- [x] 6. **Penyelarasan Tab 5: QR Builder (`app/(dashboard)/qr-builder/qr-code-list.tsx`, `client.tsx`, `page.tsx`)**
- [x] 7. **Penyelarasan Tab 6: URL Shortener (`app/(dashboard)/shortener/page.tsx`, `client.tsx`)**
- [x] 8. **Penyelarasan Tab 7: Bio Links (`app/(dashboard)/bio/page.tsx`, `client.tsx`)**
- [x] 9. **Penyelarasan Tab 8: E-Pamphlet (`app/(dashboard)/pamphlets/page.tsx`, `client.tsx`)**
- [x] 10. **Penyelarasan Tab 9 & 10: Audit Log, Settings & Pricing Modal (`app/(dashboard)/audit/page.tsx`, `app/(dashboard)/settings/page.tsx`, `components/pricing-modal.tsx`, `subscription-banner.tsx`)**
- [x] 11. **Pengesahan Menyeluruh (Ujian 492/492, Typecheck, Lint, Build Turbopack)**

---

# Penyelarasan Tema Logo KlikForm (#7C3AED / Violet-600) ✅ SELESAI

**Objektif**:
Menyelaraskan tema warna dan visual laman web KlikForm agar mencerminkan identiti logo rasmi (`#7C3AED` / `#7F3CEB` - signature vibrant purple/violet) secara elegan, minimalis, dan anti-AI slop:
1. **Warna Tema Utama**: Menyelaraskan warna primer `--primary: #7c3aed;` dan aksen `--accent: #f5f3ff;` agar tepat sepadan dengan ungu logo rasmi KlikForm.
2. **Butang Tindakan & CTA Utama**: Menggunakan butang warna ungu logo (`bg-purple-600 hover:bg-purple-700 text-white shadow-xs`) untuk tindakan utama ("Get Started Free", "Create Free Account", "Sign Up", "Start Building for Free"), sambil mengekalkan butang sekunder/outline yang bersih.
3. **Sentuhan Visual Jenama yang Bersahaja (Refined Brand Accents)**:
   - Aksen pilihan teks: `selection:bg-purple-100 selection:text-purple-900`.
   - Lencana status utama: lencana ungu neutral (`bg-purple-50 text-purple-700 border-purple-200/80`).
   - Penunjuk tab aktif dan hover link: sentuhan warna logo `text-purple-600` / `hover:text-purple-600` yang konsisten.
   - Kad Pro dalam halaman harga: sempadan beraksen ungu logo yang berwibawa (`border-2 border-purple-600`), butang ungu logo, dan lencana "Recommended" ungu logo.
   - Lajur perbandingan KlikForm: sempadan beraksen ungu logo, tanda semak ungu logo dengan kontras tinggi.
4. **Kekalkan Standard Terdahulu**: Sifar radiasi berlebihan, sifar bebola kabur (*anti-AI slop*), radius rendah (*less curve*: `rounded-md`, `rounded-lg`), dan 100% Bahasa Inggeris.

---

### Pelan Tindakan

- [x] 1. **Kemas Kini Pemboleh Ubah CSS Global (`app/globals.css`, `app/page.tsx`)**
  - [x] 1.1 Kemas kini `--primary: #7c3aed;` dan `--ring: #7c3aed;` agar sepadan dengan nilai tepat logo.
  - [x] 1.2 Tetapkan pemilihan teks global `selection:bg-purple-100 selection:text-purple-900`.
  - [x] 1.3 Laraskan warna sidebar dan aksen agar harmoni dengan ungu logo.

- [x] 2. **Penyelarasan Butang & Pengepala (`components/landing-header-auth.tsx`, `components/landing-navbar.tsx`, `components/landing-mobile-menu.tsx`)**
  - [x] 2.1 Kemas kini butang Sign Up dalam header (`LandingHeaderAuth`) kepada ungu tema logo `bg-purple-600 hover:bg-purple-700 text-white`.
  - [x] 2.2 Kemas kini hover dan aktiviti pautan dalam `LandingNavbar` kepada aksen ungu jenama logo.
  - [x] 2.3 Kemas kini butang tindakan dalam `LandingMobileMenu` kepada ungu tema logo.

- [x] 3. **Penyelarasan Hero Section (`components/landing/landing-hero.tsx`)**
  - [x] 3.1 Kemas kini butang utama "Get Started Free" kepada ungu tema logo `bg-purple-600 hover:bg-purple-700 text-white shadow-xs`.
  - [x] 3.2 Selaraskan titik status lencana dan tajuk lencana dengan aksen ungu logo.
  - [x] 3.3 Kemas kini elemen interaktif dalam mockup borang dan sijil (contohnya butang hantar olok-olok, lencana aktif) agar harmoni dengan ungu jenama logo.

- [x] 4. **Penyelarasan Bento Grid & Showcase (`components/landing/landing-features-bento.tsx`, `components/landing/landing-showcase.tsx`)**
  - [x] 4.1 Selaraskan ikon utama dan tag kapsul kepada aksen ungu jenama logo.
  - [x] 4.2 Kemas kini butang tindakan showcase kepada ungu tema logo.

- [x] 5. **Penyelarasan Perbandingan, CTA & Footer (`components/landing/landing-comparison.tsx`, `components/landing/landing-cta.tsx`, `components/landing/landing-footer.tsx`)**
  - [x] 5.1 Kemas kini lajur utama KlikForm pada jadual perbandingan dengan aksen ungu jenama logo yang anggun.
  - [x] 5.2 Kemas kini seksyen CTA: gunakan latar belakang slate gelap dengan butang tindakan utama beraksen ungu logo berkontras tinggi yang elegan (`bg-purple-600 hover:bg-purple-700 text-white shadow-sm`).
  - [x] 5.3 Kemas kini pautan footer kepada `hover:text-purple-600`.

- [x] 6. **Penyelarasan Halaman Awam Lain (`app/pricing/page.tsx`, `components/pricing/plan-card.tsx`, `app/(auth)/login/page.tsx`, `app/products/*`)**
  - [x] 6.1 Kemas kini `PlanCard` bagi pelan "Pro" dengan sempadan dan butang ungu tema logo `border-2 border-purple-600` dan `bg-purple-600 hover:bg-purple-700`.
  - [x] 6.2 Kemas kini butang "Create Account", "Sign In", dan pautan log masuk dalam `app/(auth)/login/page.tsx` kepada ungu tema logo.
  - [x] 6.3 Kemas kini butang tindakan utama pada semua 6 halaman produk kepada ungu tema logo.

- [x] 7. **Pengesahan & Ujian**
  - [x] 7.1 Jalankan `npm test`, `npm run typecheck`, dan `npm run lint` (semua 492 ujian lulus, 0 ralat TypeScript, 0 amaran ESLint).
  - [x] 7.2 Jalankan `npm run build` untuk mengesahkan binaan Turbopack (berjaya menyusun 36 laluan statik dan dinamik).
  - [x] 7.3 Kemas kini `memory.md` dan laporkan hasil kepada pengguna.

---

# Reka Bentuk Semula UI Website KlikForm (Minimalist, Clean, Anti-AI Slop, Less Radiant, Less Curve, Full English) ✅ SELESAI

**Objektif**:
Mengubah antara muka (UI) laman web KlikForm kepada reka bentuk yang:
1. **Interactive**: Interaksi mikro yang lancar, komponen pratonton interaktif langsung (live mockup sandbox), tab kawalan segmen yang responsif, simulasi penambahan baris Google Sheets masa-nyata, suis orientasi/gaya e-sijil langsung, dan penukar tema KlikBio interaktif.
2. **Minimalist & Clean**: Hierarki tipografi yang kemas dan berwibawa (`tracking-tight`, kontras tinggi, solid dark typography), struktur susun atur lapang (*generous whitespace*), sempadan garis nipis halus (*subtle hairline borders*), tanpa sebarang kekusutan visual.
3. **Anti AI Slop**: Menghapuskan elemen klise AI generator seperti teks gradien pelangi tebal, animasi teks melampau (`animate-gradient-xy`), hiasan ikon terapung tanpa tujuan, dan teks pemasaran basi. Menampilkan visual produk substantif dan ketukangan perisian moden (ala Linear, Vercel, Stripe, Resend).
4. **Less Radiant**: Menghapuskan bebola cahaya neon kabur (`blur-3xl`, radial neon flare, bayang-bayang warna tepu). Menggunakan permukaan matte berkontras tinggi dan aksen warna neutral / gelap yang berhemah.
5. **Pastikan Semuanya Dalam Bahasa Inggeris (100% English)**: Memastikan keseluruhan salinan teks di laman utama, navigasi, produk, harga, tentang kami, perbandingan, footer, borang login, dan sampel data borang ditulis dalam bahasa Inggeris standard antarabangsa yang profesional.
6. **Less Curve**: Mengurangkan radius lengkungan besar (`rounded-3xl`, `rounded-2xl`, bentuk pil `rounded-full`) kepada estetika geometri ketepatan moden (`rounded-md`, `rounded-lg`, `rounded-sm`).

---

### Pelan Tindakan

- [x] 1. **Penyelarasan Asas Global CSS & Radius (`app/globals.css`)**
  - [x] 1.1 Laraskan pemboleh ubah reka bentuk `--radius` kepada nilai lengkungan rendah yang kemas (`0.375rem` / `6px`).
  - [x] 1.2 Hapuskan sebarang kelas bantuan gradien beranimasi yang melampau atau efek cahaya neon.
  - [x] 1.3 Perhalusi kelas utiliti kad dan butang untuk rupa bentuk minimalis dan berprestasi tinggi.

- [x] 2. **Reka Bentuk Semula Navigasi & Pengepala (`components/landing-navbar.tsx`, `components/landing-header-auth.tsx`, `components/landing-mobile-menu.tsx`)**
  - [x] 2.1 Tukar radius menu lungsur produk daripada `rounded-3xl` kepada `rounded-lg` dengan sempadan 1px halus dan bayang matte.
  - [x] 2.2 Kemas kini item produk: kurangkan lengkungan daripada `rounded-2xl` kepada `rounded-md`, gantikan kotak ikon pastel pelbagai warna dengan reka bentuk monokrom/slate neutral yang anggun.
  - [x] 2.3 Pastikan semua lencana (NEW, FAST) menggunakan lengkungan geometri (`rounded` atau `rounded-sm`), bukan bujur `rounded-full`.
  - [x] 2.4 Kemas kini `LandingMobileMenu` dengan lengkungan rendah dan bahasa Inggeris sepenuhnya.

- [x] 3. **Reka Bentuk Semula Hero Section Interaktif (`components/landing/landing-hero.tsx`)**
  - [x] 3.1 Hapuskan teks gradien ungu/indigo melampau dan bebola cahaya `blur-3xl` beradiasi di latar belakang; gunakan tipografi berani kontras tinggi `text-slate-950`.
  - [x] 3.2 Gantikan pil bujur `rounded-full` dengan lencana status minimalis geometri bersudut kemas (`rounded-md`).
  - [x] 3.3 Reka semula bingkai mockup aplikasi: kurangkan daripada `rounded-2xl` kepada `rounded-lg` dengan palet tingkap kelabu matte yang bersih.
  - [x] 3.4 Tingkatkan keinteraktifan tab pratonton (`Smart Forms`, `E-Cert Studio`, `Google Sheets`, `KlikBio`):
    - **Forms**: Borang pendaftaran langsung dengan suis medan interaktif dan simulasi penghantaran respon.
    - **Certificates**: Studio sijil digital dengan pemilih orientasi Landscape/Portrait, suis penunjuk pengesahan QR, dan fon sijil elegan.
    - **Sheets**: Simulasi penstriman baris helaian Google secara masa-nyata dengan penunjuk status hijau bersahaja dan butang "Simulate New Row".
    - **KlikBio**: Mockup telefon bimbit mikro interaktif dengan pautan profil yang boleh diklik dan penukar tema Light/Dark.
  - [x] 3.5 Pastikan semua nama sampel, label input, dan butang tindakan 100% dalam bahasa Inggeris.

- [x] 4. **Reka Bentuk Semula Bento Grid Fitur (`components/landing/landing-features-bento.tsx`)**
  - [x] 4.1 Tukar semua kad bento daripada `rounded-2xl` kepada `rounded-lg` / `rounded-md`.
  - [x] 4.2 Gantikan kotak ikon berwarna-warni pastel dengan ikon neutral berkualiti tinggi dan bersempadan kemas.
  - [x] 4.3 Hapuskan latar gradien kuning/jingga pada kad templat sijil; gantikan dengan susun atur data grid berstruktur.
  - [x] 4.4 Pastikan semua tajuk dan perenggan adalah bahasa Inggeris standard, ringkas, padat dan anti-slop.

- [x] 5. **Reka Bentuk Semula Showcase & Interaktiviti Produk (`components/landing/landing-showcase.tsx`)**
  - [x] 5.1 Tukar butang tab daripada pil melengkung tebal kepada kawalan segmen bersudut minimalis (`rounded-md`).
  - [x] 5.2 Reka bentuk semula kad pratonton interaktif dengan sempadan 1px tepat, tanpa kesan cahaya neon atau gradien kabur.
  - [x] 5.3 Sertakan simulasi interaktif render kelompok (Bulk ZIP generator) dan simulasi carian pengesahan sijil segera.
  - [x] 5.4 Pastikan teks dan poin penerangan dalam bahasa Inggeris sepenuhnya.

- [x] 6. **Reka Bentuk Semula Use Cases & Perbandingan (`components/landing/landing-use-cases.tsx`, `components/landing/landing-comparison.tsx`)**
  - [x] 6.1 Tukar kad senario penggunaan kepada `rounded-lg`, kurangkan saturasi warna ikon, dan perhalusi teks bahasa Inggeris.
  - [x] 6.2 Kemas kini jadual perbandingan dengan sempadan geometri halus, tanda semak monokrom, dan bahasa Inggeris yang tepat.

- [x] 7. **Reka Bentuk Semula Call-to-Action (CTA) & Footer (`components/landing/landing-cta.tsx`, `components/landing/landing-footer.tsx`)**
  - [x] 7.1 Alih keluar radial gradient flare (`radial-gradient(ellipse_at_top, ...)`) pada bahagian CTA; gunakan latar belakang obsidian/slate pekat dengan sempadan 1px halus dan butang berkontras tinggi berpenjuru kemas (`rounded-md`).
  - [x] 7.2 Kemas kini footer: pastikan semua pautan, hak cipta, dan sari kata dalam bahasa Inggeris sepenuhnya dan menggunakan lengkungan rendah (`rounded-md` pada logo).

- [x] 8. **Penyelarasan Halaman Awam Lain (`app/pricing/page.tsx`, `app/about/page.tsx`, `app/products/*`, `app/(auth)/login/page.tsx`, `components/pricing/plan-card.tsx`)**
  - [x] 8.1 Selaraskan `PlanCard` dan kad FAQ harga: tukar `rounded-3xl` kepada `rounded-lg`, buang lencana gradien terapung tebal kepada lencana minimalis geometri.
  - [x] 8.2 Selaraskan halaman About (`app/about/page.tsx`): buang bebola `blur-3xl`, teks gradien beranimasi, dan tukar kad `rounded-2xl` kepada `rounded-lg`.
  - [x] 8.3 Selaraskan semua 5 halaman produk (`forms`, `certificates`, `bulk-certificates`, `bio`, `qr-codes`, `shortener`): alih keluar `blur-3xl` dan teks gradien, ubah kad kepada `rounded-lg`, tukar ikon kepada gaya neutral minimalis.
  - [x] 8.4 Selaraskan halaman Login/Signup (`app/(auth)/login/page.tsx`): alih keluar `blur-3xl`, tukar tab bujur tebal kepada tab segmen bersudut kemas, terjemahkan semua mesej ralat/kejayaan dan amaran spam kepada bahasa Inggeris standard.

- [x] 9. **Pengesahan Kualiti & Ujian**
  - [x] 9.1 Jalankan `npm test`: 492 / 492 ujian lulus merentas 49 fail suite.
  - [x] 9.2 Jalankan `npm run typecheck`: 0 ralat TypeScript.
  - [x] 9.3 Jalankan `npm run lint`: 0 ralat / 0 amaran ESLint.
  - [x] 9.4 Jalankan `npm run build`: Kompilasi Next.js 16 Turbopack berjaya 100% (59 laluan dinamik/statik).

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Piawaian Estetika Geometri Ketepatan (Low-Radius Precision System)**:
   - Menggantikan elemen bujur bulat melampau (`rounded-3xl` 24px, `rounded-2xl` 16px, `rounded-full` pills) dengan token lengkungan rendah moden (`rounded-md` 6px, `rounded-lg` 8px, `rounded-sm` 2px).
   - Menghasilkan rupa bentuk seperti perkakas perisian kelas perusahaan (ala Linear / Supabase / Vercel), di mana penekanan diletakkan pada kepadatan maklumat dan kejelasan data.
2. **Penyingkiran Total "AI Slop" & Radiance**:
   - Menghapuskan semua `blur-3xl` glow spheres, flare radial ungu tepu, animasi pelangi `animate-gradient-xy`, dan teks potongan gradien.
   - Menggunakan tipografi berani pepejal kontras tinggi (`text-slate-950` di atas `bg-white`) dengan garis grid halus neutral 1px (`border-slate-200`) dan aksen monokrom/slate neutral.
3. **Peningkatan Tahap Keinteraktifan Langsung (Tactile Interactive Mockups)**:
   - Bahagian hero dan showcase kini dilengkapi elemen interaktif sebenar yang boleh disentuh dan diuji: borang simulasi, penstriman helaian Google dinamik (`Simulate New Row`), penukar orientasi/stail e-sijil secara langsung, simulator render fail ZIP kelompok, dan suis tema terang/gelap pada profil KlikBio.
4. **Penyelarasan Bahasa 100% Bahasa Inggeris**:
   - Keseluruhan salinan teks laman awam, penerangan fitur, label input, butang tindakan, jadual perbandingan, lencana status, mesej notifikasi toast, dan panduan peti masuk e-mel kini diselaraskan sepenuhnya dalam Bahasa Inggeris antarabangsa yang fasih dan profesional.

**Objektif**:
Mengubah antara muka (UI) laman web KlikForm kepada reka bentuk yang:
1. **Interactive**: Interaksi mikro yang lancar, komponen pratonton interaktif langsung (live mockup), tab kawalan segmen yang responsif, dan maklum balas visual yang pantas.
2. **Minimalist & Clean**: Hierarki tipografi yang kemas dan tepat (`tracking-tight`, kontras tinggi), struktur susun atur lapang (*generous whitespace*), sempadan garis nipis halus (*subtle hairline borders*), tanpa kekusutan visual.
3. **Anti AI Slop**: Menghapuskan elemen klise AI generator seperti teks gradien pelangi tebal, animasi teks melampau, hiasan ikon terapung tanpa tujuan, dan teks pemasaran basi. Menampilkan visual produk substantif dan ketukangan perisian moden (ala Linear, Vercel, Stripe, Resend).
4. **Less Radiant**: Menghapuskan bebola cahaya neon kabur (`blur-3xl`, radial neon flare, bayang-bayang warna tepu). Menggunakan permukaan matte berkontras tinggi dan aksen warna neutral / gelap yang berhemah.
5. **Pastikan Semuanya Dalam Bahasa Inggeris (100% English)**: Memastikan keseluruhan salinan teks di laman utama, navigasi, produk, harga, tentang kami, perbandingan, footer, dan sampel data borang ditulis dalam bahasa Inggeris standard antarabangsa yang profesional.
6. **Less Curve**: Mengurangkan radius lengkungan besar (`rounded-3xl`, `rounded-2xl`, bentuk pil `rounded-full`) kepada estetika geometri ketepatan moden (`rounded-md`, `rounded-lg`, `rounded-sm`).

---

### Pelan Tindakan

- [ ] 1. **Penyelarasan Asas Global CSS & Radius (`app/globals.css`)**
  - [ ] 1.1 Laraskan pemboleh ubah reka bentuk `--radius` kepada nilai lengkungan rendah yang kemas (`0.375rem` / `6px` atau `0.25rem` / `4px`).
  - [ ] 1.2 Hapuskan sebarang kelas bantuan gradien beranimasi yang melampau (`animate-gradient-xy`) atau efek cahaya neon.
  - [ ] 1.3 Perhalusi kelas utiliti kad dan butang untuk rupa bentuk minimalis dan berprestasi tinggi.

- [ ] 2. **Reka Bentuk Semula Navigasi & Pengepala (`components/landing-navbar.tsx`, `components/landing-header-auth.tsx`, `components/landing-mobile-menu.tsx`)**
  - [ ] 2.1 Tukar radius menu lungsur produk daripada `rounded-3xl` kepada `rounded-lg` dengan sempadan 1px halus dan bayang matte.
  - [ ] 2.2 Kemas kini item produk: kurangkan lengkungan daripada `rounded-2xl` kepada `rounded-md`, gantikan kotak ikon pastel pelbagai warna dengan reka bentuk monokrom/slate neutral yang anggun.
  - [ ] 2.3 Pastikan semua lencana (NEW, HOT) menggunakan lengkungan geometri (`rounded-md` atau `rounded-sm`), bukan bujur `rounded-full`.
  - [ ] 2.4 Kemas kini `LandingMobileMenu` dengan lengkungan rendah dan bahasa Inggeris sepenuhnya.

- [ ] 3. **Reka Bentuk Semula Hero Section Interaktif (`components/landing/landing-hero.tsx`)**
  - [ ] 3.1 Hapuskan teks gradien ungu/indigo melampau dan bebola cahaya `blur-3xl` beradiasi di latar belakang; gunakan tipografi berani kontras tinggi `text-slate-900`.
  - [ ] 3.2 Gantikan pil bujur `rounded-full` dengan lencana status minimalis geometri bersudut kemas (`rounded-md`).
  - [ ] 3.3 Reka semula bingkai mockup aplikasi: kurangkan daripada `rounded-2xl` kepada `rounded-lg` dengan palet tingkap kelabu matte yang bersih.
  - [ ] 3.4 Tingkatkan keinteraktifan tab pratonton (`Smart Forms`, `E-Cert Studio`, `Google Sheets`, `KlikBio`):
    - **Forms**: Borang pendaftaran langsung dengan suis medan interaktif dan butang hantar olok-olok.
    - **Certificates**: Studio sijil digital dengan pemilih orientasi Landscape/Portrait, suis penunjuk pengesahan QR, dan fon sijil elegan.
    - **Sheets**: Simulasi penstriman baris helaian Google secara masa-nyata dengan penunjuk status hijau bersahaja.
    - **KlikBio**: Mockup telefon bimbit mikro interaktif dengan pautan profil yang boleh diklik dan penukar tema.
  - [ ] 3.5 Pastikan semua nama sampel, label input, dan butang tindakan 100% dalam bahasa Inggeris.

- [ ] 4. **Reka Bentuk Semula Bento Grid Fitur (`components/landing/landing-features-bento.tsx`)**
  - [ ] 4.1 Tukar semua kad bento daripada `rounded-2xl` kepada `rounded-lg` / `rounded-md`.
  - [ ] 4.2 Gantikan kotak ikon berwarna-warni pastel dengan ikon neutral berkualiti tinggi dan bersempadan kemas.
  - [ ] 4.3 Hapuskan latar gradien kuning/jingga pada kad templat sijil; gantikan dengan susun atur data grid berstruktur.
  - [ ] 4.4 Pastikan semua tajuk dan perenggan adalah bahasa Inggeris standard, ringkas, padat dan anti-slop.

- [ ] 5. **Reka Bentuk Semula Showcase & Interaktiviti Produk (`components/landing/landing-showcase.tsx`)**
  - [ ] 5.1 Tukar butang tab daripada pil melengkung tebal kepada kawalan segmen bersudut minimalis (`rounded-md`).
  - [ ] 5.2 Reka bentuk semula kad pratonton interaktif dengan sempadan 1px tepat, tanpa kesan cahaya neon atau gradien kabur.
  - [ ] 5.3 Pastikan teks dan poin penerangan dalam bahasa Inggeris sepenuhnya.

- [ ] 6. **Reka Bentuk Semula Use Cases & Perbandingan (`components/landing/landing-use-cases.tsx`, `components/landing/landing-comparison.tsx`)**
  - [ ] 6.1 Tukar kad senario penggunaan kepada `rounded-lg`, kurangkan saturasi warna ikon, dan perhalusi teks bahasa Inggeris.
  - [ ] 6.2 Kemas kini jadual perbandingan dengan sempadan geometri halus, tanda semak monokrom, dan bahasa Inggeris yang tepat.

- [ ] 7. **Reka Bentuk Semula Call-to-Action (CTA) & Footer (`components/landing/landing-cta.tsx`, `components/landing/landing-footer.tsx`)**
  - [ ] 7.1 Alih keluar radial gradient flare (`radial-gradient(ellipse_at_top, ...)`) pada bahagian CTA; gunakan latar belakang obsidian/slate pekat dengan sempadan 1px halus dan butang berkontras tinggi berpenjuru kemas.
  - [ ] 7.2 Kemas kini footer: pastikan semua pautan, hak cipta, dan sari kata dalam bahasa Inggeris sepenuhnya dan menggunakan lengkungan rendah.

- [ ] 8. **Penyelarasan Halaman Awam Lain (`app/pricing/page.tsx`, `app/about/page.tsx`, `app/products/*`, `components/pricing/plan-card.tsx`)**
  - [ ] 8.1 Selaraskan `PlanCard` dan kad FAQ harga: tukar `rounded-3xl` kepada `rounded-lg`, buang lencana gradien terapung tebal kepada lencana minimalis.
  - [ ] 8.2 Selaraskan halaman About (`app/about/page.tsx`): buang bebola `blur-3xl`, teks gradien beranimasi, dan tukar kad `rounded-2xl` kepada `rounded-lg`.
  - [ ] 8.3 Selaraskan halaman produk (`app/products/**/page.tsx`): alih keluar `blur-3xl` dan teks gradien, ubah kad kepada `rounded-lg`.

- [ ] 9. **Pengesahan Kualiti & Ujian**
  - [ ] 9.1 Jalankan `npm test` untuk memastikan semua ujian lulus.
  - [ ] 9.2 Jalankan `npm run typecheck` dan `npm run lint`.
  - [ ] 9.3 Jalankan `npm run build` untuk mengesahkan kompilasi Next.js 16 Turbopack berjaya 100%.

- [ ] 10. **Dokumentasi & Memori**
  - [ ] 10.1 Kemas kini `memory.md` dengan semua perubahan seni bina UI.
  - [ ] 10.2 Kemas kini `lessons.md`.
  - [ ] 10.3 Laporkan ringkasan kepada pengguna.

**Objektif**:
Membina Admin Dashboard berpusat khusus untuk pengurusan klien KlikForm (senarai klien, semakan penggunaan, dan pengurusan pelan langganan manual) dengan kawalan keselamatan ketat di mana **HANYA** emel `sofwanjailani.work@gmail.com` dibenarkan mengaksesnya.

---

### Kawalan Akses & Keselamatan
- **Akses Terhad**: Akses pentadbir dihadkan secara eksklusif kepada `sofwanjailani.work@gmail.com` (dengan sokongan tambahan pilihan melalui `ADMIN_EMAILS` dalam persekitaran).
- **Pertahanan 3-Lapisan (Defense in Depth)**:
  1. *Edge/Proxy Layer* (`proxy.ts`): Sekat sebarang cubaan capaian ke `/admin*` jika pengguna bukan admin, arahkan ke `/forms`.
  2. *Layout / Server Component Layer* (`app/(admin)/layout.tsx`): Semakan sesi selamat melalui `verifyAdminSession()`.
  3. *Server Action Layer* (`actions/admin.ts`): Semak identiti sebelum sebarang mutasi data menggunakan `createAdminClient()`.

---

### Pelan Tindakan

- [x] 1. **Modul Keselamatan & Pengesahan Admin**
  - [x] 1.1 Bina modul pembantu `lib/auth/admin.ts` (`isSuperAdmin`, `verifyAdminSession`, `PRIMARY_ADMIN_EMAIL`).
  - [x] 1.2 Kemas kini `proxy.ts` untuk melindungi laluan `/admin*` dan menapis akses mengikut emel yang dibenarkan.
  - [x] 1.3 Kemas kini `components/dashboard/sidebar.tsx` untuk memaparkan pautan "Admin Panel" secara eksklusif hanya kepada `sofwanjailani.work@gmail.com`.

- [x] 2. **Server Actions & Pengurusan Data Klien (`actions/admin.ts`)**
  - [x] 2.1 Bina fungsi `getAdminStatsAction` untuk metrik keseluruhan (Jumlah Klien, Bilangan Pro/Enterprise, Jumlah Borang, Jumlah Submissions, dan Hasil Transaksi).
  - [x] 2.2 Bina fungsi `getAdminClientsAction` dengan agregasi data Auth Users, Subscriptions, Profiles, Bilangan Borang, dan Bilangan Submissions.
  - [x] 2.3 Bina fungsi `updateClientSubscriptionAction` untuk menaik taraf / mengubah pelan klien, tarikh tamat tempoh (`current_period_end`), dan status secara manual.

- [x] 3. **Antara Muka Pengguna Admin Dashboard (`app/(admin)/admin/`)**
  - [x] 3.1 Bina susun atur khusus `app/(admin)/layout.tsx` dengan bar navigasi pentadbir, lencana Super Admin, butang kembali ke Dashboard Klien, dan petunjuk status emel admin.
  - [x] 3.2 Bina halaman utama `app/(admin)/admin/page.tsx` dengan kad-kad statistik dan komponen pengurusan klien.
  - [x] 3.3 Bina komponen jadual klien `components/admin/client-table.tsx` (maklumat pengguna, status langganan, jumlah borang, tarikh daftar, carian, dan penapis pelan/status).
  - [x] 3.4 Bina dialog pengurusan pelan `components/admin/edit-subscription-dialog.tsx` (tukar tier Free/Pro/Enterprise, status aktif/luput, dan tarikh luput tersuai / pintasan +1 bulan, +1 tahun, Seumur Hidup).

- [x] 4. **Ujian & Pengesahan Kualiti**
  - [x] 4.1 Tambah ujian unit di `tests/admin-auth.test.ts` (menguji kelayakan `sofwanjailani.work@gmail.com` dan sekatan emel lain).
  - [x] 4.2 Tambah ujian unit tindakan data admin `tests/admin-actions.test.ts`.
  - [x] 4.3 Jalankan `npm test` (491/491 ujian lulus merentas 49 fail suite).
  - [x] 4.4 Jalankan `npm run typecheck` (0 ralat TypeScript).
  - [x] 4.5 Jalankan `npm run lint` (0 ralat / 0 amaran ESLint).
  - [x] 4.6 Jalankan `npm run build` (Next.js 16 build bersih, laluan `/admin` berjaya dikompilasi).

- [x] 5. **Dokumentasi & Memori**
  - [x] 5.1 Kemas kini `memory.md` dengan laluan `/admin`, protokol keselamatan, dan keupayaan pengurusan klien.
  - [x] 5.2 Kemas kini `task.md` dan laporkan hasil kepada pengguna.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Model Keselamatan Berlapis (Zero Data Leakage for Non-Admins)**:
   - Emel pentadbir `sofwanjailani.work@gmail.com` ditetapkan sebagai nilai lalai utama (`PRIMARY_ADMIN_EMAIL`) dalam `lib/auth/admin.ts`.
   - Sebarang permintaan tanpa pengesahan emel ini disekat pada peringkat `proxy.ts`, dihalang pada peringkat susun atur `app/(admin)/layout.tsx`, dan disahkan semula dalam setiap *Server Action* sebelum `createAdminClient()` dilaksanakan.
   - Pautan "Admin Panel" dalam menu bar sisi (`DashboardSidebar`) hanya disuntik sekiranya `profile.isAdmin === true`. Pengguna biasa langsung tidak melihat menu tersebut.
2. **Pengurusan Pelan Fleksibel (Instant Tier Provisioning)**:
   - Dialog "Urus Pelan" membolehkan pentadbir menukar status akaun klien (Free, Pro, Enterprise) dan status (Active, Expired, Cancelled) secara langsung tanpa perlu melalui gerbang pembayaran manual.
   - Pintasan pantas disediakan untuk kemudahan pentadbir: `+ 1 Bulan`, `+ 1 Tahun`, atau `Lifetime` (2099-12-31).
3. **Agregasi Data Pantas (Service Role Data Joining)**:
   - Pengguna auth (`auth.admin.listUsers`) digabungkan dengan jadual `profiles`, `subscriptions`, `forms`, dan `usage` secara selari untuk memaparkan statistik penggunaan sebenar bagi setiap klien.

---

# Penambahbaikan UI Modal Langganan & Penutupan Tier Enterprise 🔄 SEDANG BERJALAN

**Objektif**:
Memperkemas dan mencantikkan reka bentuk modal dialog pengurusan langganan (`EditSubscriptionDialog`), serta menutup/membuang pilihan tier `Enterprise` buat masa ini supaya hanya memaparkan pilihan `FREE` dan `PRO` secara seimbang (2 lajur).

- [x] 1. **Kemas Kini & Reka Bentuk Semula `EditSubscriptionDialog`**:
  - [x] 1.1 Tutup / alih keluar kad pilihan `Enterprise` daripada antaramuka modal.
  - [x] 1.2 Ubah susun atur kad pilihan pelan kepada 2 lajur (`grid-cols-2`) yang seimbang, kemas dan luas untuk `FREE` dan `PRO`.
  - [x] 1.3 Tingkatkan estetika visual header: kemasan gradien gelap, avatar huruf awal klien, lencana keselamatan, dan ID klien yang elegan.
  - [x] 1.4 Cantikkan kad `FREE` (tema obsidian/gelap bila aktif) dan `PRO` (gradien indigo/sky dengan ikon `Sparkles` dan lencana "Akses Penuh").
  - [x] 1.5 Perhalusi dropdown status, pemilih tarikh luput berserta pratonton hari baki relatif, dan bar butang pintasan pantas (`+ 1 Bulan`, `+ 1 Tahun`, `Lifetime`, `Kosongkan`).
  - [x] 1.6 Cantikkan butang tindakan footer ("Batal" dan "Simpan Perubahan" bergradien moden).
- [x] 2. **Ujian & Pengesahan**:
  - [x] 2.1 Jalankan ujian unit `npm test` untuk memastikan tiada sebarang regresi (492/492 lulus).
  - [x] 2.2 Jalankan `npm run lint` dan `npm run typecheck` (0 ralat/amaran).
  - [x] 2.3 Jalankan `npm run build` untuk pengesahan Turbopack (berjaya dikompilasi).
- [ ] 3. **Dokumentasi & Memori**:
  - [ ] 3.1 Kemas kini `memory.md` dan `lessons.md`.
  - [ ] 3.2 Laporkan kepada pengguna.


# Pembaikan & Pengukuhan Penyelarasan Tajuk Google Sheet (Multi-Point Sync) ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna melaporkan: *"tak jadi pun"*.
- **Punca Asal Isu Dikenal Pasti**:
  1. Borang yang diuji (`sejarah IT`) telah pun menyimpan tajuk baharu ke dalam pangkalan data sebelum ini. Semasa pengguna klik simpan, `existing.title === form.title`, menyebabkan logik `titleChanged` bernilai `false` dan melangkau kemas kini API Google Sheet.
  2. Penggunaan `after()` daripada `next/server` dalam persekitaran pembangunan tempatan berisiko digugurkan sebaik sahaja sambungan klien ditutup.
  3. Tiada butang penyelarasan manual sekiranya nama fail di Google Drive tersasar dari tajuk borang.

### Pelan & Tindakan Pembaikan:
- [x] 1. **Alih Keluar `after()` & Laksana Terus (`await`) dalam `actions/forms.ts`**:
  - `updateFormAction` kini melaksanakan `await updateGoogleSpreadsheetTitle(...)` secara langsung dan terjamin selesai.
- [x] 2. **Pencetus Multi-Titik dalam `app/builder/[id]/client.tsx`**:
  - `onBlur` pada medan tajuk borang (`form-title` textarea): Selesai taip dan klik keluar terus segerakkan tajuk Google Sheet.
  - Tindakan `handleSave` (butang Save): Memastikan tajuk Google Sheet turut diselaraskan.
  - Klik pautan `Open Google Sheet`: Menjalankan semakan penyelarasan tajuk di latar belakang sebelum membuka Google Sheet di tab baharu.
- [x] 3. **Butang 1-Klik "↻ Sync Title"**:
  - Ditambah bersebelahan pautan "Open Google Sheet" di Form Builder dengan status berputar (`animate-spin`) dan notifikasi toast.
- [x] 4. **Ujian & Kualiti**:
  - `npm test`: 496/496 ujian lulus merentas 50 fail suite.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat ESLint.


# Pembaikan Padding Tidak Sekata pada Tab Settings ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna melaporkan: *"padding tak sekata"* berserta tangkapan skrin tab Settings (Profile, Subscription, Integrations).
- **Punca Isu**:
  - `TabsList` menggunakan susun atur kaku `grid w-full grid-cols-3 max-w-[400px]` tanpa ruang pemisah (`gap`).
  - Akibatnya, tab dengan perkataan pendek (*Profile*) mempunyai ruang kosong yang terlalu luas, manakala perkataan yang panjang (*Integrations*) terhimpit dan melimpah melepasi sempadan kanan bekas.

### Tindakan Pembaikan:
- [x] 1. Tukar `TabsList` kepada susun atur fleksibel berkadaran: `inline-flex h-10 w-fit items-center gap-1 rounded-md border border-slate-200 bg-slate-100/80 p-1`.
- [x] 2. Berikan padding seragam dan ketinggian seimbang pada setiap `TabsTrigger`: `h-8 px-4 py-1.5 rounded-md text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs`.
- [x] 3. Pengesahan Kualiti:
  - `npm test`: 496/496 ujian lulus merentas 50 fail suite.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat ESLint.


# Penggelapan Warna Tema Ungu (Midnight Violet `#4c1d95`) ✅ SELESAI

**Konteks & Maklum Balas Pengguna**:
- Pengguna meminta: *"gelapkan sikit lagi color ungu tu"* berserta tangkapan skrin dashboard/settings.

### Tindakan Pelaksanaan:
- [x] 1. Perhalusi palet asas tema daripada `violet-800` (`#5b21b6`) ke **`violet-900` (`#4c1d95`)** dengan hover **`violet-950` (`#2e1065`)**.
- [x] 2. Kemas kini pemboleh ubah reka bentuk dalam `app/globals.css`:
  - `--primary: #4c1d95;`
  - `--ring: #4c1d95;`
  - `--sidebar-primary: #4c1d95;`
  - `--sidebar-ring: #4c1d95;`
  - `--accent-foreground: #4c1d95;`
  - Carta `--chart-1: #4c1d95;`
- [x] 3. Kemas kini semua komponen Tailwind (butang "+ New Form" sidebar, logo KlikForm, badges, pautan aktif) merentas 48 fail.
- [x] 4. Pengesahan Kualiti:
  - `npm test`: 496/496 ujian lulus merentas 50 fail suite.
  - `npm run typecheck`: 0 ralat TypeScript.
  - `npm run lint`: 0 ralat ESLint.
