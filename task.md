# Format Pengeluaran Sijil Acara Berbilang Hari (Multi-Day Certificate Mode: Daily Only vs Full Only vs Both) ✅ SELESAI

**Matlamat**: Menyelesaikan permintaan pengguna ("tapi kan kalau semua hari (penuh) tu kalau user nak baru ada, maksudnya salah satu, sama ada sijil harian atau penuh"):
(1) Menambah konfigurasi mod pengeluaran sijil berbilang hari `multiDayCertMode?: 'both' | 'daily_only' | 'full_only'` dalam `CheckInOutConfig` (`lib/types/forms.ts` & `lib/types/index.ts`);
(2) Memperkemas fungsi `buildDailyCertificateOptions` (`lib/forms/attendance.ts`) supaya menapis sijil mengikut mod yang dipilih oleh penganjur:
  - `daily_only`: Hanya sijil harian (Hari 1, Hari 2, dll). Pilihan "Semua Hari (Penuh)" tidak dijana;
  - `full_only`: Hanya satu sijil penuh/gabungan (Semua Hari). Sijil harian diabaikan;
  - `both`: Menjana kedua-dua sijil harian dan sijil penuh supaya peserta boleh memilih;
(3) Menghubungkan `actions/certificates.ts` dengan konfigurasi borang `checkInOutConfig?.multiDayCertMode` (lalai: `daily_only` untuk acara berbilang hari tanpa pilihan);
(4) Menambah panel antaramuka pemilih mod sijil berbilang hari yang elegan, responsif, dan mesra pengguna di Form Builder (`app/builder/[id]/client.tsx`) di bawah seksyen Program Duration apabila `totalDays > 1`;
(5) Menambah ujian unit komprehensif bagi ketiga-tiga mod di `tests/certificate-multiday-options.test.ts`;
(6) Memastikan 100% keserasian ke belakang bagi borang 1 hari dan konfigurasi sedia ada.
(PERINGATAN KETAT: JANGAN KEMAS KINI KE VERCEL SEHINGGA DIBERI KEBENARAN).

### Pelan Pelaksanaan
- [x] 1. Lapisan Model Data & Jenis TypeScript (`lib/types/forms.ts` & `lib/types/index.ts`):
  - [x] 1.1 Tentukan jenis `MultiDayCertMode = 'both' | 'daily_only' | 'full_only'`.
  - [x] 1.2 Tambah `multiDayCertMode?: MultiDayCertMode` ke dalam antara muka `CheckInOutConfig`.
  - [x] 1.3 Re-eksport `MultiDayCertMode` pada barrel `lib/types/index.ts`.
- [x] 2. Logik Penjanaan Sijil Berbilang Hari (`lib/forms/attendance.ts` & `actions/certificates.ts`):
  - [x] 2.1 Terima parameter `multiDayCertMode?: MultiDayCertMode` dalam `buildDailyCertificateOptions`.
  - [x] 2.2 Laksana penapisan mengikut mod:
    - Jika `multiDayCertMode === 'daily_only'`, pulangkan `dailyOptions` sahaja tanpa `Semua Hari (Penuh)`.
    - Jika `multiDayCertMode === 'full_only'`, pulangkan `[combinedOption]` sahaja.
    - Jika `multiDayCertMode === 'both'`, gabungkan `dailyOptions` dan `combinedOption`.
  - [x] 2.3 Kemas kini `actions/certificates.ts` untuk menghantar `checkInOutConfig?.multiDayCertMode || 'daily_only'` bagi acara berbilang hari.
- [x] 3. Antaramuka Form Builder (`app/builder/[id]/client.tsx`):
  - [x] 3.1 Tambah bahagian pemilih mod sijil berbilang hari di bawah Tempoh Program apabila `totalDays > 1`.
  - [x] 3.2 Sediakan 3 kad pilihan interaktif:
    - `Sijil Harian Sahaja` (Lalai - Hari 1, Hari 2 dll, tiada sijil gabungan)
    - `Sijil Penuh Sahaja` (Hanya 1 sijil penuh merangkumi semua hari)
    - `Kedua-duanya` (Sijil harian & penuh serentak untuk pilihan peserta)
  - [x] 3.3 Gayakan dengan kad bersempadan dinamik, lencana status, ikon yang jelas, dan penerangan ringkas.
- [x] 4. Pengesahan Kualiti & Ujian Unit (`tests/certificate-multiday-options.test.ts`):
  - [x] 4.1 Tambah ujian unit untuk mod `daily_only`.
  - [x] 4.2 Tambah ujian unit untuk mod `full_only`.
  - [x] 4.3 Tambah ujian unit untuk mod `both`.
  - [x] 4.4 Jalankan `npm run typecheck` (0 ralat TypeScript).
  - [x] 4.5 Jalankan `npm run lint` (0 ralat ESLint).
  - [x] 4.6 Jalankan `npm test` (semua 476 ujian lulus merentas 46 fail).
  - [x] 4.7 Jalankan `npm run build` (kompilasi Next.js 16 Turbopack bersih, 58 laluan).
- [x] 5. Dokumentasi & Pengesahan Pengguna:
  - [x] 5.1 Kemas kini `task.md`, `lessons.md`, dan `memory.md`.
  - [x] 5.2 PATUHI arahan pengguna: JANGAN kemas kini ke Vercel lagi sehingga diarahkan.
  - [x] 5.3 Maklumkan kepada pengguna dengan ringkas dalam Bahasa Melayu.

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Punca Isu & Keperluan Pengguna**:
   - Sebelum ini, apabila acara berbilang hari (`totalDays > 1`) dikonfigurasikan, sistem secara automatik menjana pilihan sijil harian (`Hari 1`, `Hari 2`) DAN sijil gabungan `Semua Hari (Penuh)` serentak.
   - Penganjur acara kursus/bengkel/seminar di Malaysia seringkali mempunyai dasar pengeluaran sijil yang khusus:
     - Sesetengah acara bengkel modular hanya mengeluarkan sijil bagi setiap hari dihadiri (contoh: Hari 1 - Asas, Hari 2 - Lanjutan) dan TIDAK mahu sijil gabungan "Semua Hari".
     - Sesetengah persidangan/seminar berbilang hari hanya mengeluarkan SATU sijil kehadiran penuh untuk keseluruhan program dan TIDAK mahu sijil harian yang berpecah-belah.
     - Sesetengah penganjur mahu kedua-duanya sekali gus.
   - Pengguna meminta: *"kalau semua hari (penuh) tu kalau user nak baru ada, maksudnya salah satu, sama ada sijil harian atau penuh"*.
2. **Seni Bina Tiga Mod Sijil Berbilang Hari (`MultiDayCertMode`)**:
   - `daily_only` (Lalai untuk multi-day): Sijil harian sahaja (`[Hari 1, Hari 2, ...]`). Pilihan gabungan "Semua Hari (Penuh)" langsung tidak dijana.
   - `full_only`: Hanya satu sijil gabungan penuh dikembalikan (`[Semua Hari (Penuh)]`). Pada portal semakan awam `/check/[formId]`, sistem mengesan `dailyCertificates.length === 1` lalu menyembunyikan tab pemilih dan terus memaparkan sijil tunggal tersebut dengan julat tarikh penuh acara secara bersih.
   - `both`: Menjana `[Hari 1, Hari 2, ..., Semua Hari (Penuh)]` untuk penganjur yang mahu memberi kebebasan kepada peserta memuat turun mana-mana format.
3. **Penyimpanan Sifar-Migrasi (Zero-Migration JSONB Persistence)**:
   - Medan `multiDayCertMode` disimpan di bawah `attendanceSettings.checkInOut` yang disirikan ke dalam lajur `forms.attendance_settings` (JSONB) di Supabase. Tiada perubahan skema SQL diperlukan dan 100% selamat untuk pangkalan data pengeluaran.
