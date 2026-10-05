# Penukaran Keseluruhan Antaramuka Sistem ke Bahasa Inggeris (Malay to English Global Standardization) ✅ SELESAI

**Matlamat**: Memenuhi permintaan pengguna ("yg mana ada bahasa melayu, tukarkan semua ke bahasa inggeris"), menukar kesemua teks antaramuka pengguna (UI), mesej ralat, tooltip, modal dialog, metadata, dan templat yang masih dalam Bahasa Melayu kepada Bahasa Inggeris secara profesional, kemas, dan konsisten di seluruh aplikasi KlikForm.

---

### Pelan Pelaksanaan Terperinci

- [x] 1. Fasa 1: Modul E-Pamphlet & 3D Flipbook (Viewer, Dashboard, Builder, Themes & Presets)
  - [x] 1.1 Toolbar & Navigasi Pemapar (`components/pamphlet/viewer/toolbar.tsx`)
  - [x] 1.2 Paparan 3D Flipbook, Touch Slider, Skrol Menegak & Jalur Thumbnails (`components/pamphlet/viewer/flipbook-view.tsx`, `slider-view.tsx`, `vertical-view.tsx`, `thumbnails-strip.tsx`, `index.tsx`)
  - [x] 1.3 Dashboard Senarai & Pengurusan E-Pamphlet (`app/(dashboard)/pamphlets/page.tsx`, `client.tsx`)
  - [x] 1.4 Pamphlet Builder Studio (`app/(dashboard)/pamphlet-builder/[id]/page.tsx`, `client.tsx`)
  - [x] 1.5 Tema & Pratetap Pamphlet (`lib/pamphlets/themes.ts`, `utils.ts`)

- [x] 2. Fasa 2: Sistem Kehadiran (Smart Attendance / Check-In & Check-Out) & Semakan Sijil Awam
  - [x] 2.1 Borang Awam Aliran Check-In & Check-Out (`app/(public)/form/[id]/client.tsx`)
  - [x] 2.2 Pembantu Logik & Format Masa Kehadiran (`lib/forms/attendance.ts`)
  - [x] 2.3 Skrin Projektor Kehadiran Awam (`app/(public)/present/[id]/page.tsx`, `client.tsx`)
  - [x] 2.4 Halaman Semakan Sijil Awam & Kelayakan Kehadiran (`app/(public)/check/[formId]/client.tsx`)
  - [x] 2.5 Halaman Sunting Jawapan (`app/(public)/edit/[token]/page.tsx`)

- [x] 3. Fasa 3: Modul E-Sijil & Builder (Presets, Dialogs, Cards & Canvas Studio)
  - [x] 3.1 Templat Pra-bina Sijil (`lib/certificates/presets.ts`)
  - [x] 3.2 Dialog Cipta & Padam Sijil, Kad Templat & Kad QR (`components/certificates/new-certificate-dialog.tsx`, `delete-certificate-button.tsx`, `certificate-template-card.tsx`, `components/certificate-qr-card.tsx`)
  - [x] 3.3 Studio Pembina Sijil (`app/(dashboard)/certificates/builder/[id]/client.tsx`, `components/certificates/builder/*`)

- [x] 4. Fasa 4: Banner Langganan, Server Actions & Mesej Ralat Storan
  - [x] 4.1 Banner Peringatan Langganan Dashboard (`components/dashboard/subscription-banner.tsx`)
  - [x] 4.2 Bio Builder Toast (`app/(dashboard)/bio-builder/[id]/client.tsx`)
  - [x] 4.3 Mesej Ralat Server Actions (`actions/attendance.ts`, `actions/certificate-template.ts`, `actions/certificates.ts`, `actions/forms.ts`, `actions/bio-links.ts`, `actions/pamphlets.ts`, `actions/edit-response.ts`, `actions/response-summary.ts`, `actions/webhooks.ts`)
  - [x] 4.4 Mesej Ralat Storan (`lib/storage/subscription.ts`, `lib/storage/pamphlets.ts`, `lib/storage/bio-links.ts`, `lib/storage/short-links.ts`)

- [x] 5. Fasa 5: Metadata SEO & JSON-LD Utama
  - [x] 5.1 Metadata Halaman Utama & JSON-LD (`app/page.tsx`, `app/layout.tsx`)
  - [x] 5.2 Metadata Laluan Awam Pamphlet (`app/(public)/p/[slug]/page.tsx`)

- [x] 6. Fasa 6: Penyelarasan Ujian & Pengesahan Kualiti Menyeluruh
  - [x] 6.1 Selaras ujian unit yang menyemak mesej format/ralat (`tests/attendance.test.ts`, `tests/certificate-attendance-gating.test.ts`, `tests/pamphlet-storage.test.ts`, `tests/bio-storage.test.ts`, `tests/pamphlet.test.ts`, `tests/attendance-actions.test.ts`)
  - [x] 6.2 `npm run typecheck`: 0 ralat TypeScript
  - [x] 6.3 `npm run lint`: 0 ralat / 0 amaran ESLint
  - [x] 6.4 `npm test`: 330 / 330 ujian unit lulus (37 suites)

- [x] 7. Fasa 7: Kemas Kini Memori & Dokumentasi
  - [x] Kemas kini `task.md`, `lessons.md`, dan `memory.md`

---

# Pembersihan Emoji Antaramuka untuk Estetika Minimalis ✅ SELESAI
- [x] Buang emoji `💻` dan `📱` dari pill status orientasi buku (`app/(dashboard)/pamphlet-builder/[id]/client.tsx`)
- [x] Gantikan emoji amaran/status (⛔, 🚫, 🔒, 📌, ⏳, ⚠️, 🎉, 💬, ❤️) dengan ikon monokromatik Lucide SVG merentas aplikasi (`client.tsx`, `page.tsx`, `stats.tsx`, `landing-hero.tsx`, `landing-footer.tsx`)
- [x] Sahkan `npm run typecheck` (0 ralat)
- [x] Sahkan `npm run lint` (0 ralat / 0 amaran)
- [x] Sahkan `npm test` (330/330 ujian lulus)

---

# Pengoptimuman Paparan Mudah Alih Pemapar E-Pamphlet (Mobile Pamphlet Viewer Optimization) ✅ SELESAI
- [x] Kenal pasti punca ketidakseimbangan visual pada paparan telefon (nisbah landskap pada skrin menegak & kawalan desktop di dalam simulator telefon).
- [x] Ringkaskan bar kawalan bawah (bottom navigator) pada mod mudah alih kepada bentuk pil minimalis: `[ < ]   [ ⊞ 1 / 2 ]   [ > ]`.
- [x] Sembunyikan butang yang tidak kritikal pada header telefon (Palette dan Sound) serta buang label teks "Flipbook" supaya tajuk program/acara tidak dipotong (`IG...` -> teks penuh).
- [x] Luaskan kelebaran dokumen landskap pada telefon daripada `width - 24` ke `width - 8` untuk memaksimumkan ketajaman dan saiz teks flyer.
- [x] Tambahkan petunjuk visual minimalis monokromatik (`Rotate phone for full-width • Double-tap to zoom`) di ruang bawah risalah landskap.
- [x] Forward `forceMobile={forceMobile}` daripada `PamphletViewer` kepada `PamphletToolbar` dan `SliderView`.
- [x] Sahkan `npm run typecheck` (0 ralat), `npm run lint` (0 ralat), dan `npm test` (330/330 ujian lulus).

---

# Penghapusan Kesan Denyutan (Pulse Effect) Semasa Selakan Helaian 3D Flipbook ✅ SELESAI
- [x] 1. Kenal pasti 4 punca teknikal kesan "pulse effect" pada paparan Desktop dan Mobile (khasnya dokumen 2 muka surat yang beroperasi dalam Single Page Mode):
  - 1.1 Putaran 3D `rotateY: 0 -> -85deg` dengan `transformOrigin: 'left center'` dan `perspective: 5000px` yang menghayunkan bucu kanan muka surat ke hadapan ke arah mata pengguna (pembesaran perspektif 3D / bulking forward).
  - 1.2 `opacity: [1, 1, 0]` yang melarutkan helaian secara tiba-tiba di tengah animasi.
  - 1.3 Pertukaran `src` imej tapak yang tidak segerak (flicker `targetPage -> currentPage -> targetPage`) semasa `isFlipping` selesai sebelum state induk dikemas kini.
  - 1.4 `ResizeObserver` yang dicipta semula pada setiap perubahan `currentPage`, mencetuskan penilaian semula saiz dan nisbah imej sebaik sahaja animasi tamat.
- [x] 2. Laksanakan `displayedPage` untuk menyelaraskan lapisan imej tapak secara stabil tanpa sebarang kelipan `src`.
- [x] 3. Reka semula animasi selakan 1 muka surat (Single Page & Mobile) kepada kelengkungan kertas 3D sejati (*3D Paper Curl & Peel* `rotateY: -25deg`, `rotateZ: -3deg`, bayangan tebal 3D, dan kilauan silinder) yang kekal 100% di dalam sempadan dokumen tanpa terpelanting keluar skrin ke kawasan kosong.
- [x] 4. Kunci `ResizeObserver` kepada permulaan komponen (mount-only `[]`) tanpa bergantung kepada `[currentPage]`.
- [x] 5. Sahkan `npm run typecheck` (0 ralat), `npm run lint` (0 ralat), dan `npm test` (330/330 lulus).
- [x] 6. Dokumentasikan penemuan dan penyelesaian dalam `lessons.md` dan `memory.md`.

---

# Penghapusan Glitch Selepas Animasi 3D Flip (Post-Flip Visual Glitch Elimination) ✅ SELESAI
- [x] 1. Siasat & baiki punca lonjakan transformasi `targetShiftX` semasa `targetSpreadRef.current = null` di penghujung animasi.
- [x] 2. Hentikan pertukaran mendadak sumber imej (`img.src`) pada helaian tapak (Base Page) semasa unmount helaian selakan menerusi pra-pemaparan berlapis (*seamless pre-rendered handoff*).
- [x] 3. Selesaikan pepijat selakan undur (*PREV flip*) pada mod 1 Muka Surat (Single Page) di mana `displayedPage` tidak dikemas kini dengan betul.
- [x] 4. Lembutkan bayangan jatuh helaian 3D (*drop-shadow pop*) supaya memudar secara dinamik ke 0 sewaktu helaian mendarat rata (0°/180°), mengelakkan bayangan terpadam mengejut.
- [x] 5. Samakan warna dan kelegapan sempadan (*border opacity*) antara helaian selakan (`border-black/15`) dan halaman tapak (`border-black/15`) bagi mengelakkan kelipan garisan bucu.
- [x] 6. Elakkan bunyi selakan berulang dua kali (*double page turn sound*) semasa pertukaran halaman selesai.
- [x] 7. Uji dan sahkan `npm run typecheck`, `npm run lint`, dan `npm test`.
- [x] 8. Kemas kini `lessons.md` dan `memory.md`.

---

# Penyelarasan Segerak Transisi Imej dengan Animasi 3D Flip (1-Page & 2-Pages Image Transition Sync) ✅ SELESAI
- [x] 1. Kenal pasti punca ketidaksegerakan transisi imej dengan putaran 3D:
  - 1.1 Lengkungan easing mendadak `[0.25, 1, 0.5, 1]` yang mencapai putaran 90° dalam ~75ms pertama, menyebabkan imej bertukar serta-merta sebelum gerakan fizikal selesai.
  - 1.2 Ketaksimetrian logik NEXT vs PREV dalam Single Page mode (PREV terbang masuk dari luar skrin manakala NEXT mengupas halaman keluar).
  - 1.3 Lapisan tag `<img>` bertindih pendua (*duplicate pre-mount images*) pada helaian tapak (Base Page).
  - 1.4 Fenomena pertembungan kedalaman 3D (*Z-fighting*) pada satah putaran coplanar Z=0.
- [x] 2. Laksanakan pra-muat imej di latar belakang (*background cache preloading*) menggunakan objek imej tanpa membebankan pohon DOM.
- [x] 3. Buang lapisan tag `<img>` pendua pada Left, Right, dan Single Base Page untuk mengelakkan *ghosting* / *double-render*.
- [x] 4. Selaras lengkungan masa (*easing curve*) kepada `[0.45, 0.05, 0.55, 0.95]` yang simetri supaya titik pertukaran muka surat (90°) berlaku tepat pada 50% masa selakan (260ms) bagi mod 2-Page dan 1-Page.
- [x] 5. Tambah jarak mikro 3D `translateZ(1px)` pada permukaan hadapan dan belakang helaian selakan untuk menghapuskan *Z-fighting*.
- [x] 6. Rombak selakan PREV Single Page supaya menanggalkan halaman semasa ke sebelah kanan (*peel right* 0% -> 105%), mendedahkan halaman sebelumnya di lapisan tapak secara konsisten dan simetri dengan NEXT.
- [x] 7. Uji dan sahkan dengan `npm run typecheck`, `npm run lint`, dan `npm test`.
- [x] 8. Kemas kini `lessons.md` dan `memory.md`.

---

# Penyelarasan Mutlak Transisi Imej 2 Halaman (Two-Page Spread Image Transition Perfection) ✅ SELESAI
- [x] 1. Kenal pasti 6 punca teknikal ketidaksegerakan transisi imej pada paparan 2 Halaman:
  - 1.1 `filter: drop-shadow(...)` pada bekas `<motion.div>` yang mempunyai `transform-style: preserve-3d` meruntuhkan (*flatten*) konteks 3D enjin pelayar menjadi satah 2D rata, merosakkan *backface-visibility* dan susunan kedalaman Z.
  - 1.2 Lengkungan easing lama `[0.45, 0.05, 0.55, 0.95]` yang mempunyai kecerunan menegak curam (kecerunan 9.0 pada t=0.5) memecutkan putaran 162° dalam hanya 50ms, menyebabkan imej kelihatan seperti menyentap mendadak dan tidak selari dengan selakan fizikal.
  - 1.3 `pagesToPreload` hanya memuatkan `currentPage ± 2`, mengabaikan muka surat kedua spread berikutnya (`currentPage + 3`) dan mencetuskan kelipan muat turun rangkaian semasa selakan 2 halaman.
  - 1.4 Operator `??` pada `targetSpreadRef.current?.leftPage ?? activeSpread.leftPage` tersilap membuat fallback kepada halaman semasa apabila `targetSpreadRef.current.leftPage` sengaja bernilai `null` (semasa menutup buku ke Cover), menyebabkan halaman lama masih terpapar di atas meja sewaktu helaian diangkat.
  - 1.5 Pembalikan geometri sempadan dan bucu lengkung (*corner radius & border*) serta bayang lipatan tulang (*crease gradient*) pada muka belakang helaian berputar.
  - 1.6 Bayang jatuh helaian statik (`shadow-[-16px...]`) tidak melarut ke 0, mencetuskan lonjakan visual bayang terpadam mengejut apabila helaian mendarat rata.
- [x] 2. Singkirkan `filter: drop-shadow(...)` daripada bekas berputar 3D untuk memelihara integriti konteks 3D tulen (*pure preserve-3d context*).
- [x] 3. Perluas prapemuatan imej di latar belakang (`new Image().src`): prapemuat kesemua halaman bagi risalah $\le 16$ halaman atau 5 halaman ke hadapan/ke belakang bagi risalah besar agar imej sentiasa 100% sedia dalam cache memori pelayar sebelum pengguna menekan butang selakan.
- [x] 4. Selaras lengkungan masa dan durasi kepada `duration: 0.54` dengan lengkungan fizikal organik `[0.42, 0, 0.58, 1]` yang licin merentas keseluruhan pergerakan, disegerakkan bersama peralihan CSS anjakan kontena (`transform 540ms cubic-bezier(0.42, 0, 0.58, 1)`).
- [x] 5. Perbetulkan sempadan dan bucu lengkung muka belakang (`rounded-l-2xl border-l` untuk NEXT, `rounded-r-2xl border-r` untuk PREV) serta lokasi bayangan tulang buku (`right-0` untuk NEXT, `left-0` untuk PREV) sepadan tepat dengan halaman tapak.
- [x] 6. Laksanakan bayang jatuh dinamik `boxShadow` yang membesar dari 0px ke 28px semasa helaian diangkat, dan melarut licin kembali ke 0px apabila helaian mendarat rata di muka surat destinasi pada 180° / 0°.
- [x] 7. Lindungi halaman tapak semasa menutup buku ke Kulit Hadapan (Cover) atau Kulit Belakang (Back Cover) dengan pengawal `isLeftBaseHidden` dan `isRightBaseHidden` bagi menghapuskan masalah helaian pendua atau kelipan siluet.
- [x] 8. Uji dan sahkan dengan `npm run typecheck` (0 ralat), `npm run lint` (0 ralat), dan `npm test` (330/330 lulus merentas 37 suite ujian).
- [x] 9. Kemas kini `lessons.md` dan `memory.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Pemisahan Konteks 3D**: `transformStyle: 'preserve-3d'` dikekalkan strictly tanpa sebarang CSS `filter`, `backdrop-filter`, atau `overflow: hidden` pada kontena induk. Animasi bayang dinamik dialihkan ke elemen muka hadapan dan belakang menggunakan `boxShadow` Framer Motion.
2. **Keseimbangan Lengkungan Easing Fizikal**: Menolak kecerunan mendadak `[0.45, 0.05, 0.55, 0.95]` dan menggantikannya dengan `cubic-bezier(0.42, 0, 0.58, 1)` menghasilkan selakan buku yang anggun, realistik, dan membolehkan mata manusia mengikuti pertukaran gambar dengan lancar.
3. **Prapemuatan Menyeluruh (Deep Preloading)**: Memandangkan buku program digital lazimnya bersaiz kecil-sederhana (2 - 16 halaman), prapemuatan agresif ke dalam memori cache pelayar menghapuskan terus sebarang kelewatan rangkaian semasa interaksi selakan.
4. **Keserasian 1-Page vs 2-Page**: Mod 1-Page (yang telah disahkan sempurna oleh pengguna) dipelihara sepenuhnya tanpa sebarang sentuhan atau regresi.

---

# Pembaikan Kunci Pendua Preset Dwi-Tandatangan E-Sijil (Dual Signature Preset Duplicate Key Bug Fix) ✅ SELESAI
- [x] 1. Kenal pasti punca teknikal ralat `Encountered two children with the same key, el-...`:
  - 1.1 Penjanaan ID elemen kanvas menggunakan `el-${Date.now()}` dalam `features/certificates/hooks/use-element-actions.ts`. Apabila preset menambah beberapa elemen serentak dalam milisaat yang sama, kesemua elemen mendapat ID yang serupa.
  - 1.2 Panggilan berturut-turut `addElement` sebanyak 4 kali mencetuskan 4 transaksi `commitToHistory` berasingan dan 4 kemas kini `setTemplate` untuk satu tindakan preset.
  - 1.3 `handleAddDualSignatures` mempunyai koordinat keras (`x: 853`) yang terkeluar daripada sempadan kanvas potret (lebar 794px).
  - 1.4 Mesej toast masih dalam bahasa Melayu (`Dwi-Tandatangan ditambah!`) berbanding piawaian bahasa Inggeris aplikasi.
- [x] 2. Bina fungsi penjana ID unik teguh (`generateElementId`) menggunakan kombinasi timestamp, counter tempatan, dan rentetan rawak kripto/alphanumeric bagi menjamin keunikan mutlak walaupun jutaan elemen dicipta dalam milisaat yang sama.
- [x] 3. Sediakan fungsi kemas kini kelompok atomik `addElements` dalam `use-element-actions.ts` agar pelbagai elemen preset dimasukkan serentak dalam satu panggilan `setTemplate` dan satu rekod `commitToHistory` (1 undo step).
- [x] 4. Kemas kini `components/certificates/builder/sidebar.tsx` untuk menggunakan `addElements` dengan koordinat adaptif orientasi (menyokong kedua-dua Landskap dan Potret) serta toast bahasa Inggeris (`Dual signatures added!`).
- [x] 5. Kemas kini `duplicateElement` dalam `use-element-actions.ts` untuk menggunakan `generateElementId`.
- [x] 6. Sanitasi templat legasi (`sanitizedInitialTemplate`) dalam `app/(dashboard)/certificates/builder/[id]/client.tsx` untuk menyahkan pendua ID sedia ada dalam pangkalan data secara automatik.
- [x] 7. Tambah suite ujian unit `tests/certificate-element-actions.test.ts` (5 ujian lulus, sifar perlanggaran merentas 10,000 penjanaan serentak, batch addition atomik, dan duplikasi ID unik).
- [x] 8. Uji dan sahkan dengan `npm run typecheck` (0 ralat), `npm run lint` (0 ralat / 0 amaran), dan `npm test` (335/335 lulus merentas 38 suite).
- [x] 9. Kemas kini `lessons.md` dan `memory.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Penjanaan ID Bebas Kolisi (Collision-Free ID Generator)**: Menggabungkan awalan jenis elemen, timestamp, rolling increment counter modulo 1,000,000, dan rentetan rawak 6 aksara Base-36 (`${prefix}-${Date.now()}-${elementCounter}-${rand}`) menghapuskan sepenuhnya kebergantungan kepada perbezaan milisaat OS.
2. **Kemas Kini Kelompok Atomik (`addElements`)**: Preset yang menjana berbilang elemen (seperti 2 garisan tandatangan + 2 blok teks) kini dikomit serentak dalam satu kitaran render dan satu sejarah undo (`Ctrl+Z` membatalkan keseluruhan preset, bukan elemen individu satu demi satu).
3. **Penyelarasan Geometri Dinamik Mengikut Orientasi (Landscape vs Portrait)**: Koordinat tandatangan dikira secara nisbah perkadaran lebar dan tinggi kanvas (`w * 0.28`, `w * 0.72` untuk potret; `w * 0.25`, `w * 0.75` untuk landskap) dengan garis diletakkan pada `h - 180px` dan teks pada `lineY + 25px`. Ini memastikan tandatangan tidak terkeluar daripada sempadan kanvas atau bertindih.
4. **Sanitasi Kunci Legasi (Self-Healing Deduplication)**: Templat lama yang disimpan dalam pangkalan data sebelum pembaikan ini disaring secara pintar semasa mount melalui `sanitizedInitialTemplate` di `client.tsx`, membaiki sebarang kunci pendua secara senyap di sisi klien tanpa merosakkan data pengguna.

---

# Penghapusan Amaran Konsol Pelayar: Format Warna CSS Tidak Sah ("transparent" Invalid CSS Color Warning) ✅ SELESAI
- [x] 1. Kenal pasti punca teknikal amaran konsol `The specified value "transparent" does not conform to the required format. The value must be a valid CSS color`:
  - 1.1 Elemen HTML5 `<input type="color">` mengikut spesifikasi W3C hanya menerima format heksadesimal 7-aksara `#rrggbb` (cth. `#ffffff`).
  - 1.2 Preset sempadan sijil (Classic Gold Border, dsb.) menetapkan `fill: 'transparent'`. Apabila bentuk (shape) ini dipilih atau dirender semula, `components/certificates/builder/properties.tsx` menyalurkan `value={selectedElement.fill || '#e5e7eb'}`. Oleh kerana `'transparent'` adalah rentetan bukan kosong (truthy), `<input type="color" value="transparent">` dicetuskan ke DOM pada setiap kitaran render/event tetikus, menghasilkan amaran berulang puluhan kali di konsol pelayar.
- [x] 2. Bina fungsi utiliti pembersih warna sejagat `toValidHexColor(color, fallback)` di `lib/utils/index.ts` untuk menukar sebarang nilai bukan hex (seperti `'transparent'`, `'none'`, hex pendek, dsb.) kepada format 7-aksara hex yang sah bagi semua elemen `<input type="color">`.
- [x] 3. Kemas kini `components/certificates/builder/properties.tsx`:
  - 3.1 Gunakan `toValidHexColor` pada kesemua pemilih warna (`stroke`, `color`, `textStroke`, `fill`).
  - 3.2 Tambah kawalan pintar "No Fill (Transparent)" untuk bentuk geometri (`rectangle` & `circle`) supaya pengguna boleh memilih isian lutsinar tanpa membebankan pemilih warna.
  - 3.3 Tambah kawalan warna sempadan (`stroke`) dan ketebalan sempadan (`strokeWidth`) untuk bentuk segi empat / bulatan supaya pengguna boleh mengubah suai bingkai seperti Classic Border secara terus.
- [x] 4. Kemas kini pemilih warna dalam `components/certificates/builder/sidebar.tsx`, `app/builder/[id]/client.tsx`, dan `components/forms/qr-customizer/index.tsx` dengan `toValidHexColor`.
- [x] 5. Tambah ujian unit di `tests/valid-hex-color.test.ts` (7 ujian lulus) untuk mengesahkan fungsi `toValidHexColor` menolak `'transparent'`, mengembangkan 3-digit hex, memotong alpha 8-digit, dan memelihara 6-digit hex dengan selamat.
- [x] 6. Uji dan sahkan dengan `npm run typecheck` (0 ralat), `npm run lint` (0 ralat / 0 amaran), dan `npm test` (342/342 lulus merentas 39 suite).
- [x] 7. Kemas kini `lessons.md` dan `memory.md`.

---

# Penghapusan Ralat Hydration Mismatch Dialog Sijil Baharu (New Certificate Dialog Radix Hydration Fix) ✅ SELESAI
- [x] 1. Kenal pasti punca teknikal ralat `Uncaught Error: Hydration failed because the server rendered HTML didn't match the client` pada `<CertificateBuilderPage>`:
  - 1.1 `CertificateBuilderPage` merupakan Server Component tak segerak (async Server Component).
  - 1.2 Komponen klien `<NewCertificateDialog>` dan `<PricingModal>` membalut elemen anak (`<Button>`) menggunakan `<DialogTrigger asChild>`.
  - 1.3 Komponen Radix UI `@radix-ui/react-dialog` menjana atribut aksesibiliti `aria-controls="radix-_R_..."` berasaskan hook `useId()`. Semasa SSR di pelayan vs hidrasi di klien, penjanaan urutan ID atau format string ID (`_R_..._`) menghasilkan ketidakpadanan atribut pada elemen `<button>`, menyebabkan enjin React 19 membuang pokok DOM pelayan dan membina semula di klien.
- [x] 2. Laksanakan pengawal hidrasi pintar (`mounted` guard) pada `components/certificates/new-certificate-dialog.tsx`:
  - 2.1 Tambah state `mounted` dengan `useEffect` untuk mengasingkan kitaran hidrasi.
  - 2.2 Kembalikan `<>{children}</>` secara langsung apabila `!mounted` supaya HTML pelayan dan DOM permulaan klien sepadan 100% tanpa sebarang atribut sintetik Radix `aria-controls`.
  - 2.3 Aktifkan `<Dialog>` dan `<DialogTrigger asChild>` sebaik sahaja komponen dipasang (`mounted === true`).
- [x] 3. Laksanakan pengawal hidrasi (`mounted` guard) yang sama pada `components/pricing-modal.tsx` dan `components/certificates/delete-certificate-button.tsx` secara proaktif untuk mengelakkan ralat berulang pada mod had sijil (Limit Reached) dan kad templat.
- [x] 4. Jalankan ujian pengesahan:
  - 4.1 `npm run typecheck` (0 ralat TypeScript).
  - 4.2 `npm run lint` (0 ralat / 0 amaran ESLint).
  - 4.3 `npm test` (342/342 ujian lulus merentas 39 suite).
- [x] 5. Kemas kini `lessons.md` dan `memory.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Pengasingan Kitaran Hidrasi Radix Trigger (`mounted` Guard Pattern)**: Elemen `DialogTrigger` dan `AlertDialogTrigger` Radix UI yang menggunakan `asChild` menyuntik atribut dinamik seperti `aria-controls` berasaskan `useId()`. Apabila diletakkan di dalam Server Component App Router, perbezaan urutan panggilan `useId()` antara persekitaran streaming SSR dan hidrasi klien mencetuskan amaran perlanggaran DOM React 19 (`throwOnHydrationMismatch`). Memulangkan `{children}` secara natif sewaktu `!mounted` memastikan pohon DOM pelayan dan DOM hidrasi klien sepadan 100% tanpa sebarang mutasi awal, manakala interaktiviti dialog diaktifkan secara licin sebaik sahaja JavaScript sedia.
2. **Perlindungan Menyeluruh Merentas Semua Dialog Pembangun**: Pengawal hidrasi dipasang secara serentak ke atas `<NewCertificateDialog>`, `<PricingModal>` (apabila had sijil dicapai), dan `<DeleteCertificateButton>` (pada kad templat) bagi menghapuskan terus sebarang potensi hidrasi berulang di halaman `/certificates/builder`.









