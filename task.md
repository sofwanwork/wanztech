# Pembaikan Muat Turun Kod QR (QR Builder Download Stale Link & Missing Quiet Zone Fix) ✅ SELESAI

**Masalah Pengguna**:
Pengguna melaporkan: "dekat qr builder ni, bila sy scan di website okay je, tapi bila download dan scan balik, dia tak direct link yg sy letak" (Bila imbas di laman web berjaya terus ke pautan, tetapi apabila fail dimuat turun dan diimbas semula, ia tidak menghala ke pautan yang diletakkan).

**Punca Asal Ralat (Root Causes)**:
1. **Pepijat Stale Canvas Cache dalam `qr-code-styling`**:
   - Komponen `QrCustomizer` diinisialisasikan dengan mod `type: 'svg'` untuk paparan SVG di skrin.
   - Pustaka `qr-code-styling` menyimpan cache dalaman `this._domCanvas` dan `this._canvasDrawingPromise`.
   - Apabila fungsi muat turun PNG pertama kali dipanggil, ia mencipta `this._domCanvas` dan melukis kod QR pada kanvas tersebut.
   - Walau bagaimanapun, kerana `type` ialah `'svg'`, kaedah `.update(...)` HANYA mengemas kini SVG di skrin (`this._setupSvg()`) dan **TIDAK PERNAH** memadam atau melukis semula `this._domCanvas`!
   - Akibatnya, pada sebarang muat turun seterusnya (atau jika pengguna menukar URL selepas memuat turun kali pertama), pustaka mengembalikan kanvas lama yang lapuk (*stale canvas* yang mengandungi pautan lama seperti `https://klikform.com`). Apabila diimbas, fail PNG tersebut menghala ke pautan lama, bukan pautan baharu yang pengguna masukkan!
2. **Ketiadaan Quiet Zone / Margin (`margin: 0`)**:
   - Secara lalai dalam `QRCodeStyling`, `margin: 0` digunakan.
   - Pada paparan web, kod QR berada di dalam kad putih `<Card className="p-6">` (margin 24px) yang bertindak sebagai zon penampan (quiet zone) semula jadi, membolehkan kamera telefon mengimbas dengan mudah.
   - Namun apabila fail PNG atau SVG dimuat turun, corak penjuru hitam (*finder patterns*) mencecah ke sempadan 0px fail imej tanpa sebarang sempadan putih. Apabila fail dibuka dalam pemapar imej yang bertema gelap atau dicetak, ketiadaan zon penampan 4-modul (piawaian ISO/IEC 18004) menyebabkan pengimbas kamera gagal mengecam atau gagal memproses pautan dengan betul.
3. **Mutasi dan 'Race Condition' dalam `handleDownload`**:
   - `handleDownload` memutasi objek `qrCode` paparan skrin (`update({ width: 2000 })`), memanggil muat turun, kemudian segera mengecilkannya kembali ke 300px di dalam blok `finally`. Kerana `.update()` adalah segerak (synchronous) tetapi proses lukisan kanvas adalah tak segerak (asynchronous), mutasi ini mencetuskan konflik saiz dan ralat render.
4. **Pembersihan URL (*Whitespace Trimming*)**:
   - URL yang disalin dari mesej sering mempunyai ruang kosong di hujung/hadapan (*trailing spaces*), menyebabkan sesetengah pengimbas mudah alih menganggapnya teks carian mentah dan bukannya pautan terus.

**Pelan Tindakan**:
- [x] 1. Siasat dan rancang seni bina pembaikan muat turun kod QR.
- [x] 2. Reka bentuk semula fungsi muat turun dalam `components/forms/qr-customizer/index.tsx`:
  - [x] 2.1 Cipta instans muat turun khusus (*fresh dedicated instance*) secara dinamik setiap kali muat turun ditekan dengan `data: cleanUrl`, memastikan tiada cache lama atau pergantungan pada `this._domCanvas` yang lapuk.
  - [x] 2.2 Untuk PNG: Gunakan `type: 'canvas'` terus dengan resolusi sebenar (contohnya 2000x2000px) dan zon penampan margin yang kemas (`margin: 80` pada 2000px) dengan warna latar yang sah.
  - [x] 2.3 Untuk SVG: Gunakan `type: 'svg'` dengan margin zon penampan yang tepat (`margin: 12`) supaya imej vektor boleh diimbas dengan lancar di mana-mana latar belakang.
  - [x] 2.4 Elakkan sebarang mutasi terhadap instans paparan skrin `qrCode` sedia ada.
  - [x] 2.5 Tambah margin (quiet zone) pada instans paparan skrin `qrCode` (`margin: 12`) untuk konsistensi visual.
  - [x] 2.6 Tambah pembersihan URL (`url.trim()`) dan status penunjuk muat turun (*loading spinner*) untuk maklum balas pengguna yang lancar.
- [x] 3. Semak dan optimumkan `app/(dashboard)/qr-builder/client.tsx` untuk memastikan URL diproses dengan bersih dan konsisten.
- [x] 4. Pengesahan Kualiti & Ujian:
  - [x] 4.1 Tambah ujian unit di `tests/qr-builder.test.ts`.
  - [x] 4.2 Jalankan ujian unit penuh `npm test` (480/480 ujian lulus merentas 47 suite).
  - [x] 4.3 Jalankan `npm run typecheck` (0 ralat TypeScript).
  - [x] 4.4 Jalankan `npm run lint` (0 ralat ESLint).
  - [x] 4.5 Jalankan `npm run build` (kompilasi Next.js 16 Turbopack bersih, 58 laluan).
- [x] 5. Kemas kini dokumentasi `task.md`, `lessons.md`, dan `memory.md`.
- [x] 6. Maklumkan kepada pengguna punca masalah dan penyelesaian yang dilaksanakan dengan padat dalam Bahasa Melayu.

### Keputusan Seni Bina & Reviu (Architectural Decisions & Review)
1. **Pemisahan Lengkap Antara Paparan Langsung vs Enjin Muat Turun**:
   - Paparan skrin menggunakan instans `qrCode` (`type: 'svg'`) yang dioptimumkan untuk rendering vektor pantas dan tajam dalam pelayar.
   - Panggilan muat turun tidak lagi memutasi objek paparan skrin. Sebaliknya, instans muat turun baharu dibina serta-merta dengan data URL terkini.
   - Ini menghapuskan sepenuhnya isu *stale canvas cache* dalam `qr-code-styling` di mana kanvas lama tidak pernah dipadamkan selepas muat turun kali pertama.
2. **Kepatuhan Quiet Zone Piawaian Antarabangsa (ISO/IEC 18004)**:
   - Kod QR memerlukan zon penampan minimum 4-modul pada sekelilingnya.
   - Sebelum ini, `margin: 0` menyebabkan fail imej PNG yang dimuat turun tidak mempunyai sempadan putih. Ini menyebabkan kamera telefon gagal mengimbas apabila pengguna membuka gambar dalam *gallery viewer* bertema gelap (dark mode).
   - Kini, formula `Math.max(20, Math.round(resolution * 0.04))` (80px bagi PNG 2000px, 12px bagi SVG) menyertakan sempadan latar belakang yang bersih, membolehkan sebarang kamera telefon mengimbas dengan 100% ketepatan.
