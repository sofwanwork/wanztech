# Arahan Ejen

## Pengurusan Aliran Kerja

### 1. Mod Perancangan Lalai
- Masuk ke mod perancangan untuk SEBARANG tugasan yang kompleks (3+ langkah atau keputusan seni bina).
- Jika berlaku masalah, BERHENTI dan rancang semula serta-merta - jangan terus mendesak.
- Gunakan mod perancangan untuk langkah pengesahan, bukan sekadar membina.
- Tulis spesifikasi terperinci di awal untuk mengurangkan kekaburan.

### 2. Strategi Sub-ejen
- Gunakan sub-ejen secara meluas untuk memastikan ruang tetingkap konteks (context window) utama kekal bersih.
- Serahkan tugasan penyelidikan, penerokaan, dan analisis selari kepada sub-ejen.
- Untuk masalah yang rumit, gunakan lebih banyak kuasa pemprosesan melalui sub-ejen.
- Fokus kepada satu arah (tack) setiap sub-ejen untuk pelaksanaan yang rapi.

### 3. Kitaran Pembaikan Diri
- Selepas SEBARANG pembetulan daripada pengguna: kemas kini `lessons.md` dengan corak kesilapan tersebut.
- Tulis peraturan untuk diri sendiri yang menghalang kesilapan yang sama berulang.
- Ulang dengan tegas pada pengajaran ini sehingga kadar kesilapan menurun.
- Semak semula pengajaran pada permulaan sesi untuk projek yang berkaitan.

### 4. Pengesahan Sebelum Selesai
- Jangan sesekali tandakan tugasan sebagai selesai tanpa membuktikan kod tersebut berfungsi.
- Bandingkan kelakuan (diff behavior) antara kod utama dengan perubahan anda jika berkaitan.
- Tanya pada diri: "Adakah jurutera perisian kanan (staff engineer) akan meluluskan perkara ini?"
- Jalankan ujian dan semak log untuk mendemonstrasikan ketepatannya.

### 5. Kekalkan Keanggunan (Seimbang)
- Untuk perubahan yang tidak remeh: jeda dan tanya "adakah terdapat cara yang lebih elegan?"
- Jika suatu pembaikan itu terasa selekeh (hacky): "Berdasarkan semua yang saya tahu sekarang, laksanakan penyelesaian yang lebih elegan."
- Abaikan untuk masalah remeh (simple & obvious fixes) - elakkan terlebih bina (over-engineer).
- Cabar dan ragui kerja sendiri sebelum menunjukkannya.

### 6. Pembaikan Pepijat Autonomi
- Setelah menerima laporan pepijat (bug report): terus membaikinya. Jangan tanya dan tunggu arahan susulan.
- Tuding pada log, ralat, dan ujian gagal - lalu selesaikan masalah tersebut.
- Sifar sentuhan/pertukaran konteks (context switching) diperlukan daripada pengguna.
- Jika ujian CI gagal, pergi baiki tanpa diberitahu cara.

## Pengurusan Tugasan

1. **Muat Memori (Load Memory)**: Wajib baca `memory.md` (dan `lessons.md`) sebelum memulakan sebarang tugasan baharu untuk mengembalikan konteks kerja terdahulu dan mengelakkan kesilapan berulang.
2. **Rancang Dahulu**: Tulis perancangan pada `task.md` dengan item yang boleh ditandai.
3. **Sahkan Rancangan**: Lapor masuk (check in) sebelum mula membina aplikasi.
4. **Jejak Kemajuan**: Tanda siap pada item-item tersebut ketika proses sedang berjalan.
5. **Terangkan Perubahan**: Berikan ringkasan asas pada setiap langkah kerja.
6. **Dokumentasikan Keputusan**: Tambah seksyen reviu pada `task.md`.
7. **Simpan Pengajaran**: Kemas kini `lessons.md` selepas melakukan pembaikan.
8. **Kemas Kini Memori**: Wajib kemas kini di `memory.md` untuk merakam apa-apa perubahan, keputusan seni bina, atau status terkini.

## Prinsip Teras

- **Utamakan Kesederhanaan**: Bina sebarang perubahan dengan cara seringkas mungkin. Gunakan pendekatan yang paling kurang memberi kesan sampingan (minimize side effects).
- **Jangan Malas**: Cari punca asal ralat (root causes). Jangan lakukan pembaikan sementara (temporary fixes). Kekalkan standard Jurutera Perisian Kanan (Senior Engineer).
- **Kesan Minimum**: Hanya ubah hal yang perlu diubah. Elak menghasilkan sebarang pepijat (bugs) baharu.

## Peraturan Tambahan (Komunikasi & Pembangunan)

- **Komunikasi Ringkas & Padat**: Kurangkan penjelasan teks yang meleret. Berikan respons yang ringkas, padat, dan terus kepada kod melainkan diminta untuk menerangkan konsep.
- **Kesedaran Seni Bina (Architecture Awareness)**: Sentiasa semak `README.md`, fail konfigurasi, atau struktur direktori utama sebelum mencadangkan sebarang perubahan seni bina yang besar.
- **Sifar Kebocoran Rahsia (Zero Secrets Leak)**: Jangan sesekali mencetak (print) atau mendedahkan API key, kata laluan, atau pemboleh ubah persekitaran (environment variables) di dalam log atau respons teks.
- **Pengurusan Versi**: Jika melakukan commit Git, gunakan format *Conventional Commits* (contoh: `feat:`, `fix:`, `refactor:`).