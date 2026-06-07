# KlikForm — Senarai Semak Smoke Test (Produksi)

Ikut langkah ini selepas setiap deploy besar untuk sahkan aliran kritikal berfungsi
hidup. Fokus pada aliran yang bergantung pada **perkhidmatan luar** (Google, Resend,
BCL) kerana ujian automatik (`npm test`) **tidak** lindungi bahagian ini.

Tanda ✅ bila lulus, ❌ + catat ralat bila gagal.

---

## 1. Auth
- [ ] Daftar akaun baharu → tiada "database error" (sahkan trigger `handle_new_user` ok).
- [ ] Log masuk + log keluar.
- [ ] Reset kata laluan (emel sampai + boleh tukar).

## 2. Google Integration (paling kritikal — perubahan scope terkini)
- [ ] Settings → Integrations → **Connect with Google**.
- [ ] Lalui skrin "hasn't verified" (Advanced → Go to klikform.com) — sahkan callback berjaya, status jadi **Connected**.
- [ ] (Service Account) Tab Advanced → masukkan kunci → sahkan diterima.

## 3. Form Builder
- [ ] Cipta borang baharu (OAuth user) → tidak disekat/redirect ke Settings.
- [ ] Tambah pelbagai field (text, email, radio, checkbox, select, file, rating).
- [ ] **Multi-page**: tambah "Add Page Break" → sahkan borang awam berhalaman.
- [ ] **Conditional logic**: set satu rule → sahkan field sembunyi/papar di borang awam.
- [ ] **PDPA Consent**: toggle ON → sahkan checkbox wajib muncul di borang awam.
- [ ] **Emel Pengesahan Responden**: toggle ON + pilih field email.
- [ ] **Edit Link**: toggle ON + pilih field email.
- [ ] **Webhooks**: tambah URL + secret → klik **Test** → sahkan status hijau (HTTP 2xx).
- [ ] Auto-save berfungsi ("Tersimpan di awan") — sahkan simpan tak error (lajur jsonb baharu ok).

## 4. Public Form Submission (aliran teras)
- [ ] Buka pautan borang awam.
- [ ] Multi-page: butang **Back/Next** + indikator "Page X / Y" berfungsi.
- [ ] PDPA: cuba submit TANPA tick → disekat. Tick → boleh submit.
- [ ] Upload fail → sahkan masuk Google Drive.
- [ ] Submit berjaya → mesej terima kasih.
- [ ] **Sahkan data masuk Google Sheet** (termasuk lajur "PDPA Consent: Yes" + `_submission_id`).
- [ ] **Emel pengesahan** sampai ke emel responden (semak ringkasan jawapan + tiada HTML pelik).
- [ ] **Emel notifikasi pemilik** sampai (jika diaktifkan).

## 5. Edit Link
- [ ] Buka pautan edit dari emel → borang prefilled dengan jawapan asal.
- [ ] Ubah jawapan + submit → sahkan baris Sheet **dikemas kini** (bukan baris baharu).
- [ ] Buka pautan sama sekali lagi → sahkan disekat (single-use/expired).

## 6. E-Certificate
- [ ] Builder sijil: tambah elemen, seret/saiz semula → **lancar, tiada lag** (semak forced-reflow dah baik).
- [ ] Jana sijil tunggal → muat turun PNG/PDF (sahkan kualiti + tiada jalur putih).
- [ ] **Bulk dari CSV**: muat naik CSV → map lajur → jana ZIP.
- [ ] Verifikasi sijil (public): cari guna IC/Emel → sijil dipaparkan.

## 7. QR & Shortener
- [ ] Cipta QR code → muat turun.
- [ ] Cipta short link → buka `/s/[code]` → redirect betul.

## 8. Audit Log
- [ ] Cipta + padam borang → buka `/audit` → sahkan entri "Form created/deleted" muncul.

## 9. Analytics
- [ ] Buka borang awam beberapa kali + submit → buka Analytics → sahkan views/submits berubah.

## 10. Payment (BCL) — jika berkenaan
- [ ] Lalui aliran upgrade Pro → bayaran → sahkan webhook tukar tier + emel resit sampai.

## 11. Sentry (selepas set env — lihat README)
- [ ] Cetuskan satu ralat ujian → sahkan ia muncul di dashboard Sentry.

---

### Nota
- Ujian automatik: `npm run lint` (0), `npm test` (143/143), `npm run build` (bersih).
- Aliran #2–#6 tidak dilindungi ujian automatik — **wajib** smoke test manual.
