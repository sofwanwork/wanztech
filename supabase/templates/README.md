# KlikForm — Supabase Auth Email Templates

Email auth (Confirm Signup, Reset Password, Magic Link) dirender oleh **Supabase**,
bukan oleh kod aplikasi. HTML-nya tinggal di dashboard Supabase. Fail di sini ialah
versi siap-tampal yang sepadan dengan reka bentuk email transaksi KlikForm
(`lib/email/index.ts` → `emailWrapper`).

## Cara guna (tampal manual ke dashboard)

1. Buka **Supabase Dashboard → Authentication → Emails**.
2. Pilih template yang berkenaan.
3. Salin **keseluruhan** kandungan fail HTML ke kotak **Message (HTML)**.
4. Tetapkan subjek yang dicadangkan, kemudian **Save**.

| Template Supabase | Fail | Subjek dicadangkan |
|---|---|---|
| Confirm signup | `confirm-signup.html` | `✅ Sahkan emel anda — KlikForm` |
| Reset password | `reset-password.html` | `🔑 Set semula kata laluan — KlikForm` |
| Magic Link | `magic-link.html` | `🔗 Pautan log masuk — KlikForm` |

## Nota

- **Magic Link** hanya digunakan jika anda mengaktifkan log masuk tanpa kata laluan
  (`supabase.auth.signInWithOtp`). Buat masa ini app guna kata laluan + Google OAuth.
- Pemboleh ubah Supabase yang digunakan: `{{ .ConfirmationURL }}`.
- Logo dirujuk dari `https://klikform.com/logo.png` (sama seperti email transaksi).
- Email transaksi (magic edit-link borang, pengesahan, notifikasi, langganan, dll.)
  dikawal dalam kod di `lib/email/index.ts` — ubah `emailWrapper()` untuk menyelaraskan
  reka bentuk semua sekali.
