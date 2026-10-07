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

---

# Pembaikan Skrin Kosong Touch Slider & Penambahan Ciri Auto-Slider (Touch Slider Blank Screen Fix & Auto Slider) ✅ SELESAI
- [x] 1. Kenal pasti punca teknikal "bila slide ke kiri jadi blank":
  - 1.1 `mode="wait"` pada `<AnimatePresence>`: Memaksa elemen lama menyelesaikan animasi keluar (`exit`) sebelum elemen baharu boleh dipasang (*mount*). Apabila seretan tetikus/jari (*drag gesture*) bertembung dengan animasi `x` atau berlaku re-render imej (`onLoad`), `onExitComplete` Framer Motion gagal dicetuskan, menyebabkan bekas paparan terperangkap dalam keadaan menunggu tanpa sebarang helaian dipaparkan (menjadi skrin kosong/blank).
  - 1.2 State `direction` tidak segerak: Menggunakan `useEffect` untuk mengira arah pergerakan halaman menyebabkan render pertama selepas penukaran halaman masih menggunakan nilai `direction` lama atau `0`, menyebabkan animasi keluar dan masuk berlanggar ke arah yang sama.
  - 1.3 Ketiadaan prapemuatan imej dalam `SliderView`: Helaian baharu perlu dimuat turun melalui rangkaian sebaik sahaja bertukar halaman, menyebabkan kotak putih kosong seketika semasa imej sedang dimuatkan.
- [x] 2. Rombak seni bina animasi `SliderView` (`components/pamphlet/viewer/slider-view.tsx`):
  - 2.1 Tukar `mode="wait"` kepada `mode="popLayout"` pada `<AnimatePresence>` supaya helaian baharu dipasang serta-merta dan bergerak serentak dengan helaian lama tanpa sebarang jeda skrin kosong.
  - 2.2 Kira `direction` secara segerak semasa kitaran render (synchronous render-time tracking `[page, direction]`) untuk menjamin arah transisi 100% tepat pada setiap pertukaran helaian.
  - 2.3 Tambah prapemuatan imej di latar belakang (`new Image().src`) bagi kesemua muka surat supaya imej tersedia serta-merta di dalam cache pelayar.
  - 2.4 Kemas kini varian transisi (`enter`, `center`, `exit`) dengan peratusan CSS (`100%`, `-100%`) dan easing spring yang stabil bagi pengalaman gelongsor sentuh (*touch swipe*) yang lancar dan responsif.
- [x] 3. Bina ciri Auto-Slider (Tayangan Automatik / Autoplay Slideshow):
  - 3.1 Cipta pengurusan state `isAutoSliding` di `components/pamphlet/viewer/index.tsx` dan salurkan ke `SliderView` serta `PamphletToolbar`.
  - 3.2 Laksanakan pemasa peralihan automatik (3.5 saat) dengan gelung pusingan automatik (apabila tiba di muka surat terakhir, kembali lancar ke muka surat 1).
  - 3.3 Sediakan butang togol Auto-Slider terapung yang elegan pada antaramuka `SliderView` lengkap dengan penunjuk status (*Play/Pause* dan penunjuk denyutan status emerald).
  - 3.4 Sediakan butang Auto-Slider pada bar navigasi bawah `PamphletToolbar` khusus untuk mod `slide`.
- [x] 4. Jalankan pengesahan kualiti:
  - 4.1 `npm run typecheck` (0 ralat TypeScript).
  - 4.2 `npm run lint` (0 ralat / 0 amaran ESLint).
  - 4.3 `npm test` (345/345 ujian lulus merentas 39 suite).
- [x] 5. Kemas kini `lessons.md`, `memory.md`, dan `task.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Peralihan Serentak `mode="popLayout"` Menggantikan `mode="wait"`**: Mod `wait` dalam Framer Motion menunggu animasi keluar `exit` tamat sebelum memulakan animasi masuk `enter`. Apabila pengguna menyeret slaid secara pantas (`drag="x"`), interaksi seretan menimpa kedudukan `x` animasi keluar sehingga callback `onExitComplete` tidak dicetuskan oleh enjin Framer Motion, mengakibatkan slaid baharu langsung tidak dipasang (*unmounted state lock*) dan memaparkan skrin kosong. Menggunakan `mode="popLayout"` menyelesaikan pertembungan ini secara mutlak kerana slaid baharu dipasang serta-merta pada DOM manakala slaid lama keluar secara berlapis (`absolute inset-0`).
2. **Pengiraan Arah Segerak Semasa Render (Zero-Lag Direction Derivation)**: Menggantikan `useEffect` yang tak segerak dengan state derivation segerak `[[page, direction], setPageAndDirection]` memastikan varian pergerakan arah kiri/kanan (`dir >= 0 ? 100% : -100%`) sentiasa tepat pada frame render pertama tanpa sebarang lag atau nilai arah lapuk (`0`).
3. **Prapemuatan Imej Menyeluruh (`new Image().src`)**: Kesemua imej slaid diprapemuat ke dalam cache memori pelayar sebaik sahaja komponen dipasang. Ini menghapuskan sebarang kelipan kotak putih kosong semasa pengguna meluncur pantas ke mana-mana halaman.
4. **Kawalan Auto-Slider Dwi-Akses (Dual Surface Controls)**: Pengguna boleh mengaktifkan tayangan slaid automatik sama ada melalui butang pil terapung atas pentas (dengan status Play/Pause & lampu denyutan hijau emerald) ataupun melalui bar navigasi bawah pemapar (toolbar), memberikan fleksibiliti maksimum pada kedua-dua peranti mudah alih dan komputer meja.

---

# Pembuangan Nombor Halaman Bertindih pada Skrol Menegak (Vertical Scroll Page Number Overlay Removal) ✅ SELESAI
- [x] 1. Kenal pasti punca teknikal nombor halaman menutup tulisan/logo dokumen:
  - 1.1 Komponen `VerticalView` (`components/pamphlet/viewer/vertical-view.tsx`) meletakkan elemen tera air (*watermark badge*) `absolute top-3 right-3 bg-black/50` di dalam bekas kad imej bagi setiap muka surat.
  - 1.2 Pada paparan telefon (dan skrin desktop), risalah atau buku program yang mempunyai logo (seperti MET Malaysia), teks tajuk, atau maklumat penting di sudut atas kanan terhalang secara terus oleh lencana nombor ini.
  - 1.3 Bar navigasi bawah pemapar (`PamphletToolbar`) telah sedia memaparkan nombor halaman semasa secara dinamik (`⊞ 1 / 6`) berasaskan `IntersectionObserver`, menjadikan lencana di atas imej lewah (*redundant*) dan merosakkan kebolehbacaan dokumen.
- [x] 2. Buang elemen lencana nombor bertindih daripada `components/pamphlet/viewer/vertical-view.tsx`.
- [x] 3. Tambah atribut `select-none` dan `draggable={false}` pada elemen `<img>` agar serasi dengan mod pemapar lain.
- [x] 4. Jalankan pengesahan kualiti:
  - 4.1 `npm run typecheck` (0 ralat TypeScript).
  - 4.2 `npm run lint` (0 ralat / 0 amaran ESLint).
  - 4.3 `npm test` (345/345 ujian unit lulus merentas 39 suite).
- [x] 5. Kemas kini `lessons.md`, `memory.md`, dan `task.md`.

---

# Pembaikan Pemotongan Lencana Bawah Halaman Bio Mudah Alih (Mobile Bio Footer Clipping Fix) ✅ SELESAI
- [x] 1. Kenal pasti punca teknikal lencana "Create your own with KlikForm" terpotong di bahagian bawah skrin telefon pintar:
  - [x] 1.1 `min-h-screen` (`100vh`) dalam pelayar telefon pintar (Chrome/Safari) mengira ketinggian mengikut Large Viewport Height (LVH) yang tidak mengambil kira palang alamat URL dan navigasi yang sedang terbuka (~56px lebih panjang daripada skrin sebenar).
  - [x] 1.2 `flex flex-col justify-between` menolak elemen `<footer>` ke dasar bekas `100vh`, menyebabkan lencana terkeluar sebanyak ~56px melepasi birai bawah skrin dan terpotong separuh.
  - [x] 1.3 Pengguna terpaksa menatal ke bawah (*scroll down*) semata-mata untuk melihat lencana penuh walaupun halaman hanya mempunyai 3 pautan (sepatutnya muat penuh tanpa sebarang skrol).
- [x] 2. Kemas kini susun atur responsif `PublicBioClient` (`app/(public)/bio/[username]/client.tsx`):
  - [x] 2.1 Tukar `min-h-screen` kepada `min-h-screen min-h-[100dvh]` supaya ketinggian awal padan tepat dengan Dynamic/Small Viewport Height (`100dvh`/`100svh`).
  - [x] 2.2 Laraskan padding `<main>` kepada `px-4 pt-4 sm:pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]` bagi menyokong ruang selamat (*safe-area-inset*) pada Android dan iOS.
  - [x] 2.3 Kemas kini padding bekas profil `pt-2 sm:pt-4` dan ruang footer `pt-6 sm:pt-8 pb-1 shrink-0` untuk mengelakkan penindihan padding lewah.
- [x] 3. Jalankan pengesahan kualiti:
  - [x] 3.1 `npm run typecheck` (0 ralat TypeScript).
  - [x] 3.2 `npm run lint` (0 ralat ESLint).
  - [x] 3.3 `npm test` (345/345 ujian lulus merentas 39 suite).
- [x] 4. Kemas kini `lessons.md`, `memory.md`, dan `task.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Penukaran `min-h-screen` kepada `min-h-screen min-h-[100dvh]`**: Pada pelayar mudah alih (khususnya Google Chrome dan Safari di Android/iOS), unit CSS `100vh` diterjemahkan sebagai *Large Viewport Height* (LVH) — iaitu ketinggian skrin apabila palang alamat URL (*address bar*) dan bar navigasi ditutup. Apabila pengguna mula-mula membuka halaman bio, palang URL masih terbuka sepenuhnya, menjadikan viewport sebenar sekitar 56px-80px lebih pendek daripada `100vh`. Menggunakan `justify-between` pada bekas `min-h-screen` menolak footer ke koordinat $Y$ di luar skrin yang boleh dilihat. Menggabungkan `min-h-[100dvh]` memastikan ketinggian awal padan tepat dengan *Small Viewport Height* (`100svh`), membolehkan profil dengan pautan ringkas muat 100% pada satu skrin tanpa sebarang tatalan (*zero-scroll fit*).
---

# Penghapusan Tatalan Phantom Mudah Alih & Pembuangan Butang Kongsi Bio (Zero Mobile Phantom Scroll & Remove Share Button) ✅ SELESAI
- [x] 1. Kenal pasti & selesaikan punca halaman boleh diskrol walaupun banyak ruang kosong di bawah:
  - [x] 1.1 `min-h-screen` (`min-height: 100vh`) dalam CSS Tailwind v4 mengatasi `min-h-[100dvh]`. Pada pelayar mudah alih, `100vh` tidak tolak bar URL (~56px lebih panjang), memaksa pelayar mencipta tatalan ke bawah walaupun kandungan muat sepenuhnya.
  - [x] 1.2 Buang `min-h-screen` sepenuhnya dan gunakan `min-h-[100dvh]` secara mutlak bagi memastikan bekas halaman mengikut ketinggian sebenar pelayar mudah alih (`100svh`), menghapuskan tatalan phantom secara 100%.
- [x] 2. Buang butang kongsi (Share button) di sudut atas kanan dan komponen modal berkaitan:
  - [x] 2.1 Buang `<div className="absolute top-4 right-4 z-10"><Button ...><Share2 /></Button></div>`.
  - [x] 2.2 Buang modal dialog perkongsian dan bersihkan kod / import yang tidak lagi digunakan (`shareOpen`, `copied`, `qrRef`, `downloadQR`, `handleCopy`, `QRCodeSVG`, `Dialog...`).
- [x] 3. Selaraskan aliran kemas kini Vercel:
  - [x] 3.1 GitHub repository telah dipautkan (*git-connected*) secara langsung dengan Vercel. Tolak (*push*) ke `origin/master` sahaja secara automatik mencetuskan satu deployment pengeluaran tanpa perlu menjalankan CLI `npx vercel --prod` serentak (mengelakkan binaan berganda dua kali).
- [x] 4. Jalankan pengesahan kualiti:
  - [x] 4.1 `npm run typecheck` (0 ralat).
  - [x] 4.2 `npm run lint` (0 ralat).
  - [x] 4.3 `npm test` (345/345 ujian lulus).
- [x] 5. Kemas kini `lessons.md`, `memory.md`, dan `task.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Review)
1. **Punca Tatalan Pada Ruang Kosong (Phantom Mobile Overflow)**: Kelas CSS `min-h-screen` (`100vh`) ditakrifkan selepas `.min-h-[100dvh]` dalam fail CSS kompilasi Tailwind. Apabila kedua-duanya wujud serentak, `100vh` menimpa `100dvh`. Pada pelayar telefon pintar (Chrome Android / Safari iOS), `100vh` tidak memotong ketinggian bar alamat URL (~56px). Ini menyebabkan halaman menjadi 56px lebih panjang daripada tingkap pelayar walaupun kandungan ringkas. Membuang `min-h-screen` dan menetapkan `min-h-[100dvh]` secara mutlak menghapuskan lebihan ini sepenuhnya — halaman profil ringkas terkunci tepat pada skrin telefon tanpa sebarang tatalan (*zero scroll*).
2. **Pembersihan Antaramuka Profil**: Butang kongsi terapung dan modal QR dialog dibuang sepenuhnya dari `app/(public)/bio/[username]/client.tsx`, mengembalikan fokus visual 100% kepada penjenamaan profil pengguna dan pautan interaktif.
---

# Penetapan Lencana Penjenamaan Sentiasa di Bawah (Always Pinned to Bottom with min-h-[100dvh]) ✅ SELESAI
- [x] 1. Penuhi kehendak pengguna ("sy nak ni sentiasa di bawah"):
  - [x] 1.1 Kembalikan susun atur `justify-between` pada `<main className="min-h-[100dvh] flex flex-col justify-between items-center px-4 pt-6 pb-6 ...">`.
  - [x] 1.2 Kerana `min-h-screen` (`100vh`) telah disingkirkan sepenuhnya dan digantikan dengan `min-h-[100dvh]`, bekas tidak lagi mengalami limpahan (overflow) pada pelayar telefon pintar.
  - [x] 1.3 Lencana *"Create your own with KlikForm"* kini sentiasa berlabuh kemas di bahagian paling bawah skrin (*anchored at bottom*), kelihatan penuh 100% serta-merta tanpa terpotong dan tanpa sebarang tatalan (*zero-scroll*).
  - [x] 1.4 Mockup telefon di `app/(dashboard)/bio-builder/[id]/client.tsx` turut diselaraskan dengan `justify-between` agar serasi sepenuhnya.
- [x] 2. Pengesahan Kualiti:
  - [x] 2.1 `npm run typecheck` (0 ralat).
  - [x] 2.2 `npm run lint` (0 ralat).
  - [x] 2.3 `npm test` (345/345 ujian lulus).
- [x] 3. Kemas kini `lessons.md`, `memory.md`, dan tolak ke GitHub (`origin/master`) untuk binaan tunggal automatik Vercel.

---

# Penambahan Butang Reset Rekod Kehadiran (Clear / Reset Attendance Records) ✅ SELESAI
- [x] 1. Lapisan Storan (Database Storage):
  - [x] 1.1 Tambah `clearAttendanceRecordsForForm(formId, userId)` dalam `lib/storage/attendance.ts` (padam rekod dalam `attendance_records` & `form_responses` bagi borang berkaitan).
  - [x] 1.2 Tambah `getAttendanceStatsForForm(formId, userId)` dalam `lib/storage/attendance.ts` (kira jumlah rekod kehadiran, checked_in vs completed).
- [x] 2. Lapisan Tindakan Pelayan (Server Actions):
  - [x] 2.1 Tambah `clearAttendanceRecordsAction(formId)` dalam `actions/attendance.ts` dengan kawalan sekuriti pemilikan borang (`user.id === form.userId`).
  - [x] 2.2 Tambah `getAttendanceStatsAction(formId)` dalam `actions/attendance.ts` untuk memaparkan statistik rekod kehadiran kepada pemilik borang.
- [x] 3. Lapisan Antaramuka Pengguna (UI):
  - [x] 3.1 Tambah panel "Attendance Records & Reset" di Form Builder (`app/builder/[id]/client.tsx`) di bawah kad Smart Attendance (Check-In & Check-Out):
    - Paparkan bilangan rekod kehadiran sedia ada secara langsung (`X records (Y in, Z completed)`).
    - Butang "Reset Records" dengan `AlertDialog` pengesahan amaran.
    - Mengemas kini status rekod serta-merta tanpa perlu muat semula halaman.
  - [x] 3.2 Tambah butang Reset Kehadiran di halaman Responses (`app/(dashboard)/responses/client.tsx`) bagi borang yang mengaktifkan Smart Attendance lengkap dengan `AlertDialog` pengesahan.
- [x] 4. Ujian Unit & Kualiti (Testing & Quality Assurance):
  - [x] 4.1 Tambah ujian unit untuk storan dan tindakan reset dalam `tests/attendance-storage.test.ts` & `tests/attendance-actions.test.ts`.
  - [x] 4.2 Sahkan `npm run typecheck` (0 ralat TypeScript).
  - [x] 4.3 Sahkan `npm run lint` (0 ralat ESLint).
  - [x] 4.4 Sahkan `npm test` (353 / 353 ujian lulus merentas 39 suite).
- [x] 5. Kemas kini dokumentasi:
  - [x] 5.1 Kemas kini `task.md`, `lessons.md`, dan `memory.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Dwi-Akses Pengurusan Kehadiran (Form Builder & Responses Dashboard)**: Butang reset diletakkan di kedua-dua tempat strategik: di dalam Form Builder (`/builder/[id]`) di bawah tetapan Smart Attendance (tempat penganjur menguji syarat jam/PIN), dan di Responses Dashboard (`/responses`) di sebelah butang Google Sheet (tempat penganjur melihat data jawapan masuk).
2. **Pembersihan Atomik Berkembar (`attendance_records` & `form_responses`)**: Fungsi `clearAttendanceRecordsForForm` membersihkan kedua-dua rekod keluar-masuk kehadiran dan salinan respons tempatan bagi borang tersebut, memastikan tiada entri ujian lapuk atau kunci idempotensi lama yang mengganggu pendaftaran baharu.
3. **Perlindungan Data Google Sheet & Pengesahan Selamat (`AlertDialog`)**: Baris Google Sheet milik penganjur sengaja dipelihara tanpa disentuh (pengguna boleh simpan atau arkib data Sheet secara berasingan), manakala tindakan pemadaman di pangkalan data Supabase dilindungi oleh modal pengesahan `AlertDialog` dengan makluman yang jelas bagi mengelakkan salah tekan tidak sengaja.

---

# Pembaikan Kelebaran Pop-up Modal Mudah Alih (Mobile View Modal Dialog Margin & Width Fix) ✅ SELESAI
- [x] 1. Kenal pasti punca teknikal pop-up melekat ke birai kiri & kanan pada telefon:
  - [x] 1.1 `AlertDialogContent` (`components/ui/alert-dialog.tsx`) & `DialogContent` (`components/ui/dialog.tsx`) menggunakan `w-full max-w-[calc(100%-2rem)]`.
  - [x] 1.2 Apabila komponen pengguna (cth: `app/(public)/form/[id]/client.tsx`) membekalkan `className="max-w-md ..."`, enjin `tailwind-merge` (`twMerge`) menimpa utiliti `max-w-[calc(100%-2rem)]` dengan `max-w-md` (448px).
  - [x] 1.3 Pada skrin telefon pintar (kelebaran 360px - 412px yang lebih kecil daripada 448px), kelas `w-full` mengembang ke 100% kelebaran viewport tanpa sebarang kekangan had kiri-kanan, menyebabkan kotak putih pop-up melekat rapat ke birai skrin tanpa margin.
- [x] 2. Kukuhkan perlindungan lapisan asas (`components/ui/alert-dialog.tsx` & `components/ui/dialog.tsx`):
  - [x] 2.1 Tetapkan `w-[calc(100%-2rem)] sm:w-full max-w-[calc(100%-2rem)]` agar pada mod mudah alih kelebaran terkunci secara konsisten dengan ruang margin 16px (1rem) di kiri dan kanan walaupun utiliti `max-w-*` tanpa awalan breakpoint dibekalkan.
- [x] 3. Kemas kini penggunaan modal merentas aplikasi:
  - [x] 3.1 Tukar `className="max-w-md ..."` kepada `className="sm:max-w-md ..."` serta padding responsif `p-5 sm:p-6` pada modal amaran keluar awal `app/(public)/form/[id]/client.tsx`.
  - [x] 3.2 Tukar `className="max-w-md ..."` kepada `className="sm:max-w-md ..."` pada dialog pengesahan reset di `app/builder/[id]/client.tsx` dan `app/(dashboard)/responses/client.tsx`.
  - [x] 3.3 Tukar `className="max-w-4xl ..."` kepada `className="sm:max-w-4xl ..."` pada dialog penyesuaian QR di `app/builder/[id]/client.tsx`.
  - [x] 3.4 Tukar `className="max-w-sm ..."` kepada `className="sm:max-w-sm ..."` pada dialog QR di `app/(dashboard)/bio-builder/[id]/client.tsx`.
- [x] 4. Pengesahan Kualiti Tempatan (Local QA - Sifar kemas kini / deployment ke Vercel):
  - [x] 4.1 `npm run typecheck` (0 ralat TypeScript).
  - [x] 4.2 `npm run lint` (0 ralat / 0 amaran ESLint).
  - [x] 4.3 `npm test` (353 / 353 ujian unit lulus merentas 39 suite).
- [x] 5. Kemas kini `lessons.md` dan `memory.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Punca Pertembungan `twMerge` pada Mod Mudah Alih**: Komponen asas shadcn `AlertDialogContent` dan `DialogContent` menggunakan `max-w-[calc(100%-2rem)]` untuk memastikan margin kiri-kanan 16px (1rem). Apabila pengguna menyalurkan `className="max-w-md"` tanpa awalan `sm:`, fungsi penggabungan kelas `tailwind-merge` menganggap kedua-duanya berada dalam kategori sifat CSS yang sama (`max-width`) lalu menyingkirkan `max-w-[calc(100%-2rem)]`. Pada skrin telefon (360px - 412px), `max-w-md` (448px) tidak lagi menyekat kelebaran, menyebabkan `w-full` menarik dialog selebar 100% skrin telefon dan menyentuh birai peranti.
2. **Pertahanan Berlapis Asas (`w-[calc(100%-2rem)] sm:w-full`)**: Dengan menyuntik `w-[calc(100%-2rem)]` secara eksplisit pada lapisan asas komponen UI dan beralih ke `sm:w-full` pada paparan desktop/tablet, sifat kelebaran (`width`) dan kekangan maksimum (`max-width`) kini saling melindungi. Walaupun ada pemaju lain yang terlupa meletakkan awalan `sm:` pada `max-w-*` pada masa akan datang, dialog tetap dijamin mempunyai sekurang-kurangnya 16px margin dari birai skrin mudah alih.
3. **Penyelarasan Konsisten Merentas Semua Modal**: Semua rujukan `max-w-*` tanpa awalan pada dialog amaran kehadiran dan dialog pembina diselaraskan ke `sm:max-w-*`, memastikan tipografi, padding kad (`p-5 sm:p-6`), dan lengkungan bucu (`rounded-2xl`) terpapar dengan anggun dan seimbang di telefon pintar.

---

# Pengindahan Reka Bentuk Susun Atur Kad Kehadiran (Attendance Card Layout Polish & Modernization) ✅ SELESAI
- [x] 1. Kenal pasti elemen reka bentuk yang perlu diperkemaskan:
  - [x] 1.1 Kad Check-Out: Bar 2px hijau mendadak, pautan "Not you?" berganda (di atas dan di bawah), kotak amaran waktu baki bertindih dengan butang disabled, maklumat masa & ID sesak dalam grid kecil.
  - [x] 1.2 Kad Selesai Kehadiran: Susun atur warna biru kaku, ikon bulat biasa, teks masa kehadiran kurang kontras estetik.
  - [x] 1.3 Elemen Mengganggu: Bar kemajuan atas (`Progress`) dan lencana terapung bawah `X / Y Answered` masih muncul sewaktu paparan kad kehadiran walaupun pengguna tidak menjawab sebarang soalan.
- [x] 2. Rombak & Indahkan Kad Check-Out (`app/(public)/form/[id]/client.tsx`):
  - [x] 2.1 Tukar kontena kad kepada gaya moden: `rounded-3xl border-emerald-200/80 shadow-xl shadow-emerald-950/5` dengan bar aksen gradien zamrud lembut (`from-emerald-500 via-teal-500 to-emerald-600`).
  - [x] 2.2 Kemas kini pengepala status: lencana status denyutan langsung (*pulse live badge*), nama peserta diserlahkan kemas, dan tiket pas acara (*digital event pass*) dengan ikon `Clock` dan `UserCheck`.
  - [x] 2.3 Cantikkan kotak baki masa minimum: kad amaran bersatu dengan ikon jam pasir beranimasi lembut (*pulse*) tanpa teks berganda lewah.
  - [x] 2.4 Tingkatkan butang Check-Out: butang gradien zamrud premium dengan bayang halus dan butang tukar akaun dengan ikon `UserPlus` yang sopan di bahagian bawah.
- [x] 3. Rombak & Indahkan Kad Selesai Hadir (`app/(public)/form/[id]/client.tsx`):
  - [x] 3.1 Ikon kejayaan moden: lencana cek bulat bertingkat 3D (`from-blue-600 to-indigo-600` dengan denyutan *ping glow* lembut).
  - [x] 3.2 Tiket resit kehadiran digital: kad maklumat dua lajur berkotak putih berkembar, pemisah bertitik (*dashed divider*), dan lencana durasi penuh warna zamrud.
  - [x] 3.3 Butang tuntutan e-Sijil premium bertemakan anugerah dengan ikon `Award` keemasan bersinar.
- [x] 4. Sembunyikan bar kemajuan dan lencana terapung semasa mod kehadiran aktif (`isAttendanceCardShowing`).
- [x] 5. Pengesahan Kualiti Tempatan (TypeScript 0 ralat, ESLint 0 ralat, Unit Tests 353/353 lulus - sifar push/deploy ke Vercel).
- [x] 6. Kemas kini `lessons.md` dan `memory.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Pemisahan Pengalaman Borang vs Pengesahan Kehadiran (`isAttendanceCardShowing`)**: Sebelum ini, widget global borang seperti bar kemajuan atas (`Progress`) dan lencana kiraan terapung di bawah kanan (`X / Y Answered`) terus dipaparkan walaupun peserta sedang melihat kad kehadiran (Check-Out atau Selesai). Ini menimbulkan gangguan visual yang mengelirukan kerana peserta tidak lagi mengisi soalan. Menyembunyikan widget ini melalui bendera `isAttendanceCardShowing` menghasilkan antaramuka skrin tunggal yang bersih dan fokus 100% pada tindakan kehadiran.
2. **Penyatuan Maklumat ala Tiket Pas Acara Digital (Digital Event Pass Pattern)**: Maklumat masa masuk (*Check-In*) dan masa keluar (*Check-Out*) disusun dalam bentuk kad berkembar dengan ikon semantik serta tipografi kod mono yang kemas. Jumlah jam kehadiran dipersembahkan melalui lencana zamrud berkontras tinggi dengan pemisah bertitik (*dashed divider*), meniru rupa pas masuk persidangan / tiket penerbangan digital yang eksklusif dan meyakinkan.
3. **Penyederhanaan Aliran Tindakan & Penghapusan Gandingan Lewah**: Pautan "Not you?" di sudut atas kanan dibuang kerana bertembung dengan tindakan pertukaran peserta di bahagian bawah. Teks peringatan baki masa digabungkan ke dalam kad amaran jam pasir (*Hourglass card*) tunggal yang elegan, menghapuskan pengulangan mesej antara kotak amaran dan butang terkunci.




---

# Pembaikan Keserasian Paparan Projektor QR pada Tablet/Peranti Android Lama (Presenter Screen Legacy Device Compatibility Fix) ✅ SELESAI
- [x] 1. Kenal pasti punca perbezaan paparan antara telefon moden dan tablet lama:
  - [x] 1.1 Pada telefon moden (Gambar 2): Latar gelap mendalam (`slate-950`), tajuk acara putih tebal yang jelas timbul, kad QR kontras tinggi, dan bar kemajuan hijau bertenaga.
  - [x] 1.2 Pada tablet lama (Gambar 1): Latar belakang bertukar menjadi **putih/cerah**, tajuk acara **ghaib 100%**, kad QR hilang kontras, dan bar kemajuan hijau tiada warna.
  - [x] 1.3 Punca Akar: Tailwind CSS v4 menjana warna lalai menggunakan fungsi `oklch(...)`. Pelayar Chromium lama (Chrome < 111 pada Android 7-9) tidak menyokong `oklch()` dan menolak sintaks CSS gradien tersebut. Latar `<main>` jatuh balik ke warna putih dokumen (`body bg-background: #ffffff`), menyebabkan teks tajuk `text-white` bertukar menjadi putih di atas putih (ghaib).
- [x] 2. Laksanakan sandaran warna HEX standard kebal & sokongan skrol landskap (`app/(public)/present/[id]/client.tsx`):
  - [x] 2.1 Tambah gaya sandaran terus: `style={{ backgroundColor: '#020617', color: '#ffffff' }}` dan kelas `bg-[#020617]` pada bekas utama `<main>`.
  - [x] 2.2 Kunci warna tajuk program dengan `style={{ color: '#ffffff' }}` supaya tidak pernah ghaib walau dalam apa jua versi pelayar.
  - [x] 2.3 Tambah sandaran HEX pada trek dan isian bar kemajuan (`#1e293b` & `#10b981`), jam digital (`#0f172a`), dan kad QR (`#1e293b`).
  - [x] 2.4 Tukar `overflow-hidden` kepada `overflow-y-auto lg:overflow-hidden` dan laraskan padding menegak (`my-3 sm:my-6`) supaya pada tablet mod landskap berketinggian rendah, footer dan kawalan tidak terpotong.
- [x] 3. Pengesahan Kualiti Tempatan (Local QA - Sifar kemas kini / deployment ke Vercel):
  - [x] 3.1 `npm run typecheck` (0 ralat TypeScript).
  - [x] 3.2 `npm run lint` (0 ralat / 0 amaran ESLint).
  - [x] 3.3 `npm test` (353 / 353 ujian unit lulus merentas 39 fail).
- [x] 4. Kemas kini `lessons.md` dan `memory.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Punca Kegagalan Warna OKLCH pada Enjin Pelayar Lama**: Tailwind CSS v4 menggunakan ruang warna moden `oklch()` secara terbina untuk palet standard (`slate`, `emerald`, dsb.). Chrome versi lama (sebelum v111, Mac 2023) yang biasa terdapat pada Android 7, 8, atau 9 menolak deklarasi CSS yang mengandungi fungsi warna yang tidak difahaminya. Kegagalan deklarasi ini mendedahkan latar belakang `#ffffff` daripada `body`, menukarkan tema skrin gelap kepada kanvas putih secara tidak sengaja dan menjadikan teks putih ghaib.
2. **Prinsip Sandaran Berganda (Dual Fallback Pattern)**: Dengan menyuntik `style={{ backgroundColor: '#020617', color: '#ffffff' }}` berserta kelas utiliti HEX eksplisit (`bg-[#020617]`), pelayar moden tetap menikmati gradien Tailwind v4 yang anggun, manakala pelayar lama mendapat sandaran warna HEX tulen yang terbukti stabil sejak era awal web.
3. **Ketahanan Susun Atur Mod Landskap Skrin Terhad**: Tablet lazimnya diletakkan secara melintang (landskap) dengan bar pelayar Chrome yang tebal di atas, meninggalkan ketinggian menegak yang sempit. Peralihan ke `overflow-y-auto lg:overflow-hidden` dan pelarasan saiz dinamik menjamin kandungan skrin projektor sentiasa boleh diakses sepenuhnya tanpa sebarang elemen terpotong.


---

# Ciri Pemilihan Masa Putaran Kod QR Kehadiran (Customizable Live Rotating QR Interval) ✅ SELESAI
- [x] 1. Kenal pasti permintaan pengguna: "30 saat ni macam cepat sgt, boleh tak buat option utk set berapa masa yg nak" (bersama tangkapan skrin bulatan pada baki masa "22s left").
- [x] 2. Tambah kawalan pemilihan masa putaran pada Form Builder (`app/builder/[id]/client.tsx`):
  - [x] 2.1 Butang pratetap pantas (*preset buttons*): `15s`, `30s (Std)`, `45s`, `60s (1m)`, `90s`, `120s (2m)`.
  - [x] 2.2 Input durasi tersuai (*custom number input*): Membolehkan pengguna memasukkan sebarang nilai dari 10 saat hingga 600 saat (10 minit).
  - [x] 2.3 Kekalkan tetapan `intervalSeconds` terpilih apabila suis Live Rotating QR dihidupkan atau dimatikan.
  - [x] 2.4 Penyelarasan bahasa Inggeris standard pada kad tetapan projektor dewan (*Hall Projector Screen*).
- [x] 3. Kemas kini paparan skrin projektor awam (`app/(public)/present/[id]/client.tsx`):
  - [x] 3.1 Gantikan teks statik "every 30 seconds" kepada nilai dinamik `every {intervalSec} seconds`.
- [x] 4. Ujian Unit & Jaminan Kualiti Tempatan:
  - [x] 4.1 Tambah ujian unit baharu mengesahkan penjanaan dan pengesahan token bagi pelbagai nilai durasi tersuai (15s, 60s, 90s, 120s) dalam `tests/rotating-qr.test.ts`.
  - [x] 4.2 `npm run typecheck` (0 ralat TypeScript).
  - [x] 4.3 `npm run lint` (0 ralat / 0 amaran ESLint).
  - [x] 4.4 `npm test` (354 / 354 ujian lulus merentas 39 fail ujian).
- [x] 5. Kemas kini dokumentasi: `task.md`, `memory.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Seni Bina Sedia Ada yang Fleksibel**: Lapisan pengesahan pelayan (`actions/attendance.ts`, `actions/forms.ts`, dan `lib/forms/rotating-qr.ts`) sememangnya telah direka bentuk untuk menerima `intervalSeconds` dinamik. Penambahan kawalan UI di Form Builder membolehkan pengguna mengawal parameter ini secara langsung tanpa sebarang perubahan skema pangkalan data.
2. **Kombinasi Pratetap & Input Bebas (Hybrid UX)**: Pengguna diberikan 6 butang pilihan pantas paling lazim (15s hingga 120s) untuk kemudahan 1-klik, di samping kotak input saat bebas (10s – 600s) bagi acara yang memerlukan kawalan khusus mengikut kapasiti dan kelajuan dewan masing-masing.

---

# Pengukuhan Aliran Rekod & Penyelarasan Check-Out Kehadiran (Attendance Check-Out Sync Hardening) ✅ SELESAI
- [x] 1. Siasat punca rekod Check-Out tidak masuk walaupun peserta hadir cukup 6 jam:
  - [x] 1.1 **Token Luput Pramatang (*Premature Token Expiry*)**: Token berputar luput dalam 30 saat. Peserta yang mengambil masa 30–60 saat untuk memuatkan borang dan menaip PIN pentas ditolak oleh pelayan dengan ralat `QR code has expired`.
  - [x] 1.2 **Sekatan RLS Carian Tetapan Google**: `getSettingsByFormId` menggunakan `createClient()` kuki. Peserta awam tanpa sesi kuki menyebabkan `settings` menjadi `undefined`, lalu penyelarasan kemas kini Google Sheet dilangkau secara senyap (*silent skip*).
  - [x] 1.3 **Padanan Kolum Google Sheet**: Pengepala kolum dengan perbezaan jarak atau huruf kecil/besar gagal ditemui oleh `r.get(col)`.
  - [x] 1.4 **Faktor Tolakan Rehat**: Penetapan `breakMinutes` (cth: 60 minit) menolak masa bersih kehadiran peserta 6 jam fizikal kepada 5 jam.
- [x] 2. Laksanakan pembaikan teknikal:
  - [x] 2.1 Luaskan tempoh ihsan token berputar kepada 2 tetingkap penuh (`wNum < currentWindow - 2`) dalam `lib/forms/rotating-qr.ts`.
  - [x] 2.2 Tukar `getSettingsByFormId` dalam `lib/storage/settings.ts` kepada `createAdminClient()`.
  - [x] 2.3 Perhebatkan penemuan kolum `actualCol` dalam `lib/api/google-sheets.ts` (`updateSheetRow`).
- [x] 3. Pengesahan Kualiti Tempatan:
  - [x] 3.1 `npm run typecheck` (0 ralat TypeScript).
  - [x] 3.2 `npm run lint` (0 ralat ESLint).
  - [x] 3.3 `npm test` (354 / 354 ujian lulus merentas 39 suite).
- [x] 4. Kemas kini `lessons.md` dan `memory.md`.

---

# Pembaikan Ralat React setState in Render pada Skrin Projektor (PresenterClient setState Fix) ✅ SELESAI
- [x] 1. Kenal pasti log ralat: `Cannot update a component (Router) while rendering a different component (PresenterClient)` pada `app/(public)/present/[id]/client.tsx:106`.
- [x] 2. Punca: Panggilan `fetchToken()` (Server Action) berada di dalam fungsi penurun masa `setSecondsRemaining((prev) => { fetchToken(); ... })`.
- [x] 3. Pembaikan:
  - [x] 3.1 Bersihkan `setSecondsRemaining` kepada fungsi tulen: `(prev) => (prev > 0 ? prev - 1 : 0)`.
  - [x] 3.2 Asingkan pencetus `fetchToken()` ke dalam `useEffect` yang bertindak balas kepada `secondsRemaining === 0 && !isLoading`.
- [x] 4. Pengesahan Kualiti Tempatan:
  - [x] 4.1 `npm run typecheck` (0 ralat TypeScript).
  - [x] 4.2 `npm run lint` (0 ralat ESLint).
  - [x] 4.3 `npm test` (354 / 354 ujian lulus merentas 39 suite).
- [x] 5. Kemas kini `lessons.md` dan `memory.md`.

---

# Pelancaran Pengeluaran Vercel (Production Deployment to Vercel) ✅ SELESAI
- [x] 1. Semakan Kualiti Kod Tempatan (Local Quality Assurance):
  - [x] 1.1 `npm run typecheck` (0 ralat TypeScript).
  - [x] 1.2 `npm run lint` (0 ralat / 0 amaran ESLint).
  - [x] 1.3 `npm test` (354/354 ujian unit lulus merentas 39 suite).
- [x] 2. Komit Git & Tolak ke Cawangan Utama (`origin/master`):
  - [x] 2.1 Git stage semua 14 fail yang diubah suai.
  - [x] 2.2 Komit dengan format Conventional Commit: `feat(attendance): modernize layout, fix dialog margins, add QR intervals, and harden checkout sync` (`02ec23d`).
  - [x] 2.3 Tolak (`git push origin master`) ke repositori GitHub untuk pelancaran tunggal automatik ke Vercel (satu binaan sahaja, tanpa binaan berganda CLI).
- [x] 3. Pengesahan & Kemas Kini Rekod:
  - [x] 3.1 Binaan Vercel Pengeluaran: `dpl_At5DaetBiE794yo11WAr6YK7nVwN` (● Ready dalam masa ~55s).
  - [x] 3.2 URL Pengeluaran: `https://www.klikform.com` (Deployment: `https://klikform-f47gjhvod-sofwan-jailanis-projects.vercel.app`).
  - [x] 3.3 Catatkan SHA commit `02ec23d` dan status pengeluaran dalam `task.md` dan `memory.md`.

---

# Penguncian Borang Live Rotating QR & Pencegahan Masuk Semula Lepas Check-In (Rotating QR Gate & Re-entry Prevention) ✅ SELESAI
- [x] 1. Kenal pasti punca pengguna boleh masuk semula ke dalam borang:
  - [x] 1.1 Butang "Submit another response" dipaparkan secara lalai pada skrin kejayaan, dan menekan butang tersebut menjalankan `window.location.reload()` dengan URL yang mengandungi token lama.
  - [x] 1.2 Pengesahan token Rotating QR sebelum ini hanya berjalan sewaktu `submitFormAction` (POST), bukan sewaktu memuatkan halaman `/form/[id]` (GET). Oleh itu, borang dan soalan dipaparkan walaupun dibuka secara terus atau token telah luput.
  - [x] 1.3 Selepas Check-In, peserta tidak sepatutnya mengisi borang sekali lagi, sebaliknya perlu menunggu waktu Check-Out.
- [x] 2. Penguncian Halaman Muat Borang (Page-Load Anti-Fraud Gate):
  - [x] 2.1 Semak kesahihan token `rq_w` dan `rq_sig` di `app/(public)/form/[id]/page.tsx` menggunakan `verifyRotatingQrToken`.
  - [x] 2.2 Jika Live Rotating QR diaktifkan dan token tidak sah/tiada/luput:
    - Jika peserta telah berstatus `checked_in` dalam sesi tempatan (`localStorage`), paparkan Kad Pas Kehadiran Aktif ("You are already checked in").
    - Jika bukan, sekat pemaparan soalan dan paparkan Skrin Kunci Anti-Fraud ("Live QR Code Required / Expired — Sila imbas kod QR terkini di skrin projektor").
- [x] 3. Sembunyikan Butang "Submit another response" & Pembersihan URL:
  - [x] 3.1 Sembunyikan butang "Submit another response" pada skrin kejayaan jika `rotatingQr.enabled`, atau peserta baru selesai `checkInResult`, atau selesai `checkOutResult`.
  - [x] 3.2 Bersihkan parameter carian `_rq_w` dan `_rq_sig` dari bar alamat pelayar selepas penghantaran berjaya menggunakan `window.history.replaceState`.
  - [x] 3.3 Paparkan peringatan mesra kehadiran pada skrin Check-In berjaya tanpa pautan pendaftaran berulang yang mengelirukan.
- [x] 4. Ujian Unit & Jaminan Kualiti:
  - [x] 4.1 Tambah ujian unit untuk pengesahan gate dan penyekatan reload dalam `tests/rotating-qr.test.ts`.
  - [x] 4.2 Sahkan `npm run typecheck` (0 ralat TypeScript).
  - [x] 4.3 Sahkan `npm run lint` (0 ralat / 0 amaran ESLint).
  - [x] 4.4 Sahkan `npm test` (357/357 ujian lulus merentas 39 suite).
- [x] 5. Kemas kini `lessons.md`, `memory.md`, dan `task.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Pengesahan Dua Peringkat (Two-Stage Anti-Fraud Enforcement)**:
   - *Peringkat Muat Halaman (GET)*: Menilai kesahihan token berputar sebelum merender sebarang elemen borang. Pengguna yang membuka pautan terus tanpa mengimbas skrin projektor atau memuat semula pautan lama disekat dengan serta-merta tanpa didedahkan kepada soalan borang.
   - *Peringkat Penyerahan (POST)*: Mengekalkan semakan integriti kriptografi dan tetingkap masa sewaktu penyerahan bagi menghalang cubaan memintas di peringkat API.
2. **Pengalaman Pengguna Kehadiran (Active Attendance Pass Pattern)**:
   - Selepas mendaftar masuk (Check-In), peserta tidak sepatutnya dilayan seperti pengisi borang kaji selidik biasa yang dibenarkan "hantar respon lain".
   - Sekiranya peserta memuat semula halaman semasa acara berlangsung, sistem secara pintar mengenalpasti status `checked_in` dan memaparkan pas kehadiran aktif yang menenangkan pengguna bahawa kehadiran mereka telah sah direkodkan, di samping memberi panduan untuk mengimbas semula pada akhir acara bagi tujuan Check-Out.
3. **Pembersihan Keadaan URL (*URL Query Sanitization*)**:
   - Memadam parameter `?rq_w=...&rq_sig=...` daripada bar alamat pelayar melalui `window.history.replaceState` sebaik sahaja borang dihantar memastikan penyerahan tersebut tidak boleh dimainkan semula (*replay attack*) atau dicetuskan secara tidak sengaja melalui butang refresh pelayar.

---

### Maklumat Pelancaran Pengeluaran Vercel
- **Status**: ● Ready
- **Komit Git**: `eea4805`
- **Deployment URL**: `https://klikform-499pgh06l-sofwan-jailanis-projects.vercel.app`
- **Domain Pengeluaran**: `https://www.klikform.com`

---

# Pemulihan Butang "Submit another response" Berdasarkan Tetapan Form Builder & Tetapan Semula Bersih (Clean State Reset) ✅ SELESAI
- [x] 1. Kenal pasti & baiki sekatan paparan butang "Submit another response" dalam `app/(public)/form/[id]/client.tsx`:
  - [x] 1.1 Hormati tetapan `form.allowMultipleSubmissions` dari Form Builder (`(form.allowMultipleSubmissions ?? true)`) tanpa menyekatnya dengan syarat sampingan kehadiran atau rotating QR.
  - [x] 1.2 Bina fungsi `handleResetForAnotherResponse` bagi membersihkan keadaan borang secara dalam memori (*clean state reset*): `submitted`, `checkInResult`, `checkOutResult`, `attendanceSummary`, `formData`, `pdpaConsent`, `currentPage`, dan kunci sesi tanpa menggunakan `window.location.reload()`.
- [x] 2. Selaras ujian unit dalam `tests/rotating-qr.test.ts`:
  - [x] 2.1 Kemas kini ujian pengesahan supaya butang patuh kepada tetapan `allowMultipleSubmissions` penganjur.
- [x] 3. Jaminan Kualiti:
  - [x] 3.1 Sahkan `npm run typecheck` (0 ralat TypeScript).
  - [x] 3.2 Sahkan `npm run lint` (0 ralat ESLint).
  - [x] 3.3 Sahkan `npm test` (357/357 ujian unit lulus).
- [x] 4. Pelancaran Vercel & Dokumentasi:
  - [x] 4.1 Tolak ke GitHub (`origin/master`) untuk binaan tunggal pengeluaran Vercel.
  - [x] 4.2 Kemas kini `task.md`, `memory.md`, dan `lessons.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Keutamaan Mutlak Tetapan Penganjur (*Organizer Preference Takes Precedence*)**:
   - Togol Form Builder `Show "Submit another response" button` adalah kawalan rasmi yang dipilih oleh penganjur borang.
   - Mengabaikan atau menyekat butang tersebut secara automatik berdasarkan mod kehadiran (`isCheckIn`, `checkOutResult`, `rotatingQr.enabled`) bercanggah dengan apa yang telah diaktifkan oleh pengguna di Form Builder.
   - Dengan mengikat pemaparan butang strictly kepada `(form.allowMultipleSubmissions ?? true)`, penganjur mempunyai kawalan penuh sama ada mahu memaparkan butang tersebut atau tidak.
2. **Tetapan Semula Keadaan Dalam Memori (*In-Memory State Reset*)**:
   - Menggantikan `window.location.reload()` dengan `handleResetForAnotherResponse` membuang sebarang isu muat semula pelayar (seperti tersekat di skrin kunci token luput atau memuat semula fail aset).
   - Pembersihan menyeluruh `formData`, `localStorage` sesi peserta, dan `sessionStorage` kunci idempotensi membolehkan borang sedia serta-merta untuk pendaftaran peserta seterusnya (contohnya pendaftaran berbilang peserta di kaunter/kiosk yang sama).

---

### Maklumat Pelancaran Pengeluaran Vercel
- **Status**: ● Ready
- **Komit Git**: `4086f35`
- **Deployment ID**: `dpl_Wrf8TCFH9T2K9kzDeFnBFJ9bBx2i`
- **Deployment URL**: `https://klikform-on6csccyy-sofwan-jailanis-projects.vercel.app`
- **Domain Pengeluaran**: `https://www.klikform.com`

---

# Penghapusan Lopong Ruang Atas Kad Kehadiran (Card Top Spacing & Flush Accent Bar Fix) ✅ SELESAI
- [x] 1. Kenal pasti & baiki punca lopong ruang putih di atas dan di bawah bar aksen warna pada kad kehadiran:
  - [x] 1.1 Pada Active Attendance Pass (`client.tsx` baris 808): tambah `p-0 gap-0` pada `Card` agar bar aksen gradien melekat kemas di birai atas (*flush top*) mengikut lengkungan `rounded-3xl overflow-hidden`.
  - [x] 1.2 Laraskan `CardHeader` (`pt-6 pb-4` dan ruang ikon) bagi menghapuskan jurang ruang kosong yang berlebihan di atas ikon jam.
  - [x] 1.3 Selaraskan penetapan `p-0 gap-0` yang sama pada kad Check-Out (`client.tsx` baris 1287) dan kad Selesai Hadir (`client.tsx` baris 1476) bagi mengelakkan isu lopong berulang.
- [x] 2. Jaminan Kualiti:
  - [x] 2.1 Sahkan `npm run typecheck` (0 ralat TypeScript).
  - [x] 2.2 Sahkan `npm run lint` (0 ralat ESLint).
  - [x] 2.3 Sahkan `npm test` (357/357 ujian unit lulus).
- [ ] 3. Pelancaran Vercel & Dokumentasi:
  - [ ] 3.1 Tolak ke GitHub (`origin/master`) untuk penyelarasan automatik Vercel.
  - [x] 3.2 Kemas kini `task.md`, `memory.md`, dan `lessons.md`.

---

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Punca Lopong Putih / Jurang Atas (*Card Default Padding Collision*)**:
   - Komponen asas shadcn `Card` di `components/ui/card.tsx` mempunyai kelas lalai `py-6 gap-6` (`padding-top: 24px`, `padding-bottom: 24px`, dan `gap: 24px`).
   - Apabila elemen bar warna `<div className="h-2 bg-gradient-to-r ...">` diletakkan sebagai anak pertama `Card`, ia ditolak ke bawah sebanyak 24px oleh `py-6`, menghasilkan jalur ruang putih di atas bar hijau.
   - Selain itu, `gap-6` menambah jarak kosong 24px di bawah bar hijau sebelum `CardHeader`, dan `CardHeader` menambah lagi 32px (`pt-8`). Jumlah ruang kosong di bawah bar hijau mencecah 56px.
2. **Penyelesaian Melekat Kemas (*Flush Top Accent Bar Pattern*)**:
   - Dengan menetapkan `p-0 gap-0` pada `Card`, bar aksen melekat 100% rapat ke birai atas kad dan dipotong secara bersih mengikut bucu lengkung `rounded-3xl overflow-hidden`.
   - `CardHeader` diselaraskan ke `pt-6 pb-4` dengan latar belakang gradien halus dari birai atas hingga ke bawah, menghapuskan terus lopong kosong dan memberikan nisbah visual yang seimbang dan estetik.










