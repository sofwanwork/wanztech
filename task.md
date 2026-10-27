# Pembangunan Admin Dashboard untuk Pengurusan Klien (KlikForm) ✅ SELESAI

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
