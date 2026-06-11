import { Resend } from 'resend';

// Lazy-initialized Resend client
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const client = getResendClient();

  if (!client) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'KlikForm <noreply@klikform.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Design system — single-color (indigo), minimalist & premium.
// One accent color across every email; the rest is neutral ink + whitespace.
// ──────────────────────────────────────────────────────────────────────────
const BRAND = '#4f46e5'; // indigo-600 — the one accent
const BRAND_DARK = '#4338ca'; // indigo-700
const INK = '#18181b'; // primary text
const BODY = '#52525b'; // secondary text
const MUTED = '#a1a1aa'; // tertiary / captions
const SOFT = '#eef2ff'; // accent-tinted surface
const LINE = '#ececf1'; // hairline dividers/borders

// Uppercase accent label above the title.
function eyebrow(label: string): string {
  return `<p style="margin: 0 0 14px; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: ${BRAND};">${label}</p>`;
}

// Title.
function heading(title: string): string {
  return `<h1 style="margin: 0 0 18px; font-size: 24px; line-height: 1.25; font-weight: 700; color: ${INK}; letter-spacing: -0.4px;">${title}</h1>`;
}

// Body paragraph.
function para(text: string, marginTop = 0): string {
  return `<p style="margin: ${marginTop}px 0 16px; font-size: 15px; line-height: 1.65; color: ${BODY};">${text}</p>`;
}

// Bulletproof, single-color CTA button.
function button(href: string, label: string): string {
  return `
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px auto 4px;">
              <tr>
                <td align="center" style="border-radius: 10px; background-color: ${BRAND};">
                  <a href="${href}" style="display: inline-block; padding: 15px 38px; font-size: 15px; font-weight: 600; color: #ffffff; letter-spacing: 0.2px; border-radius: 10px;">${label}</a>
                </td>
              </tr>
            </table>`;
}

// Soft accent-tinted note box (used for security/expiry reminders).
function note(text: string): string {
  return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 0;">
              <tr>
                <td style="background: ${SOFT}; border: 1px solid #e0e7ff; border-radius: 10px; padding: 14px 18px; font-size: 13px; line-height: 1.6; color: ${BRAND_DARK};">${text}</td>
              </tr>
            </table>`;
}

// Caption line (muted, centered).
function caption(text: string): string {
  return `<p style="margin: 28px 0 0; color: ${MUTED}; font-size: 13px; line-height: 1.6; text-align: center;">${text}</p>`;
}

// Key/value table (receipts, submission data, summaries).
function kvRow(key: string, value: string): string {
  return `
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: ${MUTED}; border-bottom: 1px solid ${LINE}; width: 42%; vertical-align: top;">${key}</td>
                  <td style="padding: 12px 18px; font-size: 13px; color: ${INK}; font-weight: 500; border-bottom: 1px solid ${LINE};">${value}</td>
                </tr>`;
}
function kvTable(rowsHtml: string): string {
  return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 0; border: 1px solid ${LINE}; border-radius: 12px; overflow: hidden;">${rowsHtml}
            </table>`;
}

// Minimal single-color list. `marker`: 'check' (accent) or 'dot' (muted).
function bulletList(items: string[], marker: 'check' | 'dot' = 'check'): string {
  const glyph =
    marker === 'check'
      ? `<span style="color: ${BRAND}; font-weight: 700; padding-right: 12px;">&#10003;</span>`
      : `<span style="color: ${MUTED}; padding-right: 12px;">&bull;</span>`;
  const rows = items
    .map(
      (it) =>
        `<tr><td style="padding: 7px 0; font-size: 14px; line-height: 1.5; color: ${BODY};">${glyph}${it}</td></tr>`
    )
    .join('');
  return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 18px 0 0;">${rows}
            </table>`;
}

// New submission notification email
export function getNewSubmissionEmail(
  userName: string,
  formTitle: string,
  submissionData: Record<string, string>,
  googleSheetUrl?: string
) {
  const dataRows = Object.entries(submissionData)
    .slice(0, 10) // Limit to 10 fields to keep email clean
    .map(([key, value]) =>
      kvRow(escapeHtml(key), escapeHtml(String(value).substring(0, 100)))
    )
    .join('');

  const sheetButton = googleSheetUrl
    ? button(escapeHtml(googleSheetUrl), 'Buka Google Sheet')
    : '';

  const content = cardBody(`
            ${eyebrow('Response Baru')}
            ${heading('Anda menerima response baru')}
            ${para(`Hai <strong style="color:${INK};">${escapeHtml(userName)}</strong>, borang <strong style="color:${INK};">&ldquo;${escapeHtml(formTitle)}&rdquo;</strong> baru sahaja menerima satu response.`)}
            ${kvTable(dataRows)}
            ${sheetButton}
            ${caption('Email automatik daripada KlikForm.')}
  `);

  return {
    subject: `📬 Response baru: ${formTitle}`,
    html: emailWrapper(content, `Anda menerima response baru untuk "${formTitle}".`),
  };
}

// Edit-link email — sent to respondents when the form has edit-link
// enabled and the respondent provided an email.
export function getEditLinkEmail(
  formTitle: string,
  editUrl: string,
  expiryDays: number
) {
  const content = cardBody(`
            ${eyebrow('Sunting Jawapan')}
            ${heading('Sunting jawapan anda')}
            ${para(`Terima kasih kerana menghantar jawapan untuk borang <strong style="color:${INK};">&ldquo;${escapeHtml(formTitle)}&rdquo;</strong>. Jika anda perlu membuat perubahan, klik butang di bawah dalam tempoh <strong style="color:${INK};">${expiryDays} hari</strong>.`)}
            ${button(editUrl, 'Sunting Jawapan')}
            ${note(`Pautan ini hanya boleh digunakan <strong>sekali sahaja</strong> dan akan luput dalam ${expiryDays} hari. Jangan kongsi dengan orang lain.`)}
            ${caption('Jika anda tidak menghantar borang ini, abaikan email ini.')}
  `);

  return {
    subject: `✏️ Sunting jawapan anda: ${formTitle}`,
    html: emailWrapper(content, `Klik untuk menyunting jawapan anda bagi "${formTitle}".`),
  };
}

// Respondent confirmation email — sent to the respondent (not the owner) as an
// acknowledgement that their submission was received. Optional custom message
// and an optional summary table of their answers.
export function getRespondentConfirmationEmail(
  formTitle: string,
  message?: string,
  summary?: Record<string, string>
) {
  const customMessage = (message ?? '').trim();

  const summaryRows = summary
    ? Object.entries(summary)
        .slice(0, 12) // keep the email tidy
        .map(([key, value]) =>
          kvRow(escapeHtml(key), escapeHtml(String(value).substring(0, 200)))
        )
        .join('')
    : '';

  const summaryBlock = summaryRows
    ? `<p style="margin: 8px 0 0; font-size: 14px; font-weight: 600; color: ${INK};">Ringkasan jawapan anda:</p>${kvTable(summaryRows)}`
    : '';

  const messageBlock = customMessage
    ? para(escapeHtml(customMessage))
    : para(
        `Terima kasih! Jawapan anda untuk borang <strong style="color:${INK};">&ldquo;${escapeHtml(formTitle)}&rdquo;</strong> telah kami terima.`
      );

  const content = cardBody(`
            ${eyebrow('Pengesahan')}
            ${heading('Jawapan diterima')}
            <p style="margin: 0 0 18px; font-size: 13px; color: ${MUTED};">Borang: <strong style="color:${INK}; font-weight:600;">&ldquo;${escapeHtml(formTitle)}&rdquo;</strong></p>
            ${messageBlock}
            ${summaryBlock}
            ${caption('Email automatik daripada KlikForm sebagai pengesahan.')}
  `);

  return {
    subject: `✅ Pengesahan: ${formTitle}`,
    html: emailWrapper(
      content,
      customMessage || `Jawapan anda untuk "${formTitle}" telah kami terima.`
    ),
  };
}

// Minimal HTML-escaping for respondent-controlled values injected into the
// confirmation email. Prevents the respondent's own answers (or a malicious
// payload) from breaking out of the table cell / injecting markup.
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Card body wrapper — a single padded section. Every email shares this layout
// (no per-email colored headers; the accent comes from the eyebrow + button).
function cardBody(inner: string): string {
  return `
        <tr>
          <td class="kf-card-pad" style="padding: 44px 44px 40px;">${inner}
          </td>
        </tr>`;
}

// Base email template wrapper — light, airy, single-color.
// `content` is a sequence of <tr> rows rendered inside the white card.
// `preheader` is the hidden inbox-preview snippet (optional but recommended).
function emailWrapper(content: string, preheader?: string) {
  const year = new Date().getFullYear();
  const preheaderBlock = preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(preheader)}&#8202;&#8203;&#8204;&#8205;&#8206;&#8207;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>`
    : '';
  return `
    <!DOCTYPE html>
    <html lang="ms" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="color-scheme" content="light only">
        <meta name="supported-color-schemes" content="light only">
        <title>KlikForm</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          a { text-decoration: none; }
          @media only screen and (max-width: 600px) {
            .kf-card-pad { padding: 32px 26px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        ${preheaderBlock}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; width: 100%;">
          <tr>
            <td align="center" style="padding: 40px 20px; vertical-align: top;">
              <!-- Wordmark -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 10px;">
                          <img src="https://klikform.com/logo.png" alt="KlikForm" width="34" height="34" style="display: block; border: 0; border-radius: 9px;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="color: ${INK}; font-size: 21px; font-weight: 800; letter-spacing: -0.4px;">KlikForm</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid ${LINE}; box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 12px 32px -12px rgba(16,24,40,0.12);">
                <tr>
                  <td style="height: 4px; line-height: 4px; font-size: 0; background: ${BRAND};">&nbsp;</td>
                </tr>
                ${content}
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
                <tr>
                  <td align="center" style="padding: 26px 20px 6px;">
                    <p style="margin: 0 0 6px 0; color: ${BODY}; font-size: 13px; font-weight: 600;">
                      KlikForm — Borang &amp; e-Sijil tanpa kerumitan
                    </p>
                    <p style="margin: 0; font-size: 12px;">
                      <a href="https://klikform.com" style="color: ${BRAND}; text-decoration: none; font-weight: 500;">klikform.com</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 10px 20px 0;">
                    <p style="margin: 0; color: ${MUTED}; font-size: 11px;">
                      © ${year} KlikForm. Hak cipta terpelihara.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;
}

// Subscription expiring reminder
export function getSubscriptionReminderEmail(
  userName: string,
  daysRemaining: number,
  renewUrl: string
) {
  const content = cardBody(`
            ${eyebrow('Langganan')}
            ${heading('Langganan Pro hampir tamat')}
            ${para(`Hai <strong style="color:${INK};">${escapeHtml(userName)}</strong>, langganan Pro anda akan tamat dalam <strong style="color:${INK};">${daysRemaining} hari</strong>.`)}
            ${para('Selepas tamat, anda tidak lagi boleh:', 8)}
            ${bulletList(['Mencipta borang baharu', 'Mengakses ciri-ciri Pro'], 'dot')}
            ${para('Borang sedia ada anda kekal (secara terhad).', 18)}
            ${button(renewUrl, 'Renew Sekarang')}
            ${caption('Renew sebelum tamat untuk elak gangguan perkhidmatan.')}
  `);

  return {
    subject: `⏰ Langganan Pro KlikForm akan tamat dalam ${daysRemaining} hari`,
    html: emailWrapper(content, `Langganan Pro anda akan tamat dalam ${daysRemaining} hari.`),
  };
}

// Grace period started (subscription expired)
export function getGracePeriodStartedEmail(userName: string, graceDays: number, renewUrl: string) {
  const content = cardBody(`
            ${eyebrow('Langganan Tamat')}
            ${heading('Langganan Pro anda telah tamat')}
            ${para(`Hai <strong style="color:${INK};">${escapeHtml(userName)}</strong>, anda mempunyai <strong style="color:${INK};">${graceDays} hari</strong> untuk renew sebelum akaun disekat.`)}
            ${para('Status akaun anda sekarang:', 8)}
            ${bulletList([
              'Tidak boleh mencipta borang/sijil baharu',
              'Borang sedia ada masih aktif (sementara)',
              `Selepas ${graceDays} hari, akaun akan disekat`,
            ], 'dot')}
            ${button(renewUrl, 'Renew Sekarang')}
            ${caption('Jangan biarkan perkhidmatan anda terganggu.')}
  `);

  return {
    subject: `🚨 Langganan KlikForm tamat — ${graceDays} hari untuk renew`,
    html: emailWrapper(content, `Anda mempunyai ${graceDays} hari untuk renew sebelum akaun disekat.`),
  };
}

// Account blocked (grace period over)
export function getAccountBlockedEmail(userName: string, renewUrl: string) {
  const content = cardBody(`
            ${eyebrow('Akaun Disekat')}
            ${heading('Akaun anda telah disekat')}
            ${para(`Hai <strong style="color:${INK};">${escapeHtml(userName)}</strong>, akaun anda disekat kerana langganan Pro telah tamat.`)}
            ${para('Apa yang berlaku:', 8)}
            ${bulletList([
              'Tidak boleh mencipta borang/sijil',
              'Borang tidak boleh menerima response',
            ], 'dot')}
            ${note('<strong>Data anda selamat.</strong> Renew bila-bila masa untuk akses semula semua borang dan data anda.')}
            ${button(renewUrl, 'Unlock Akaun')}
            ${caption('Hanya RM29/bulan untuk akses penuh semula.')}
  `);

  return {
    subject: `🔒 Akaun KlikForm disekat — Unlock sekarang`,
    html: emailWrapper(content, 'Akaun anda disekat. Data anda selamat — renew untuk akses semula.'),
  };
}

// Welcome email for new Pro subscribers
export function getWelcomeProEmail(userName: string, dashboardUrl: string) {
  const content = cardBody(`
            ${eyebrow('Selamat Datang')}
            ${heading('Selamat datang ke KlikForm Pro')}
            ${para(`Hai <strong style="color:${INK};">${escapeHtml(userName)}</strong>, tahniah! Akaun anda kini Pro. Inilah yang anda boleh nikmati:`)}
            ${bulletList([
              '<strong>Borang tanpa had</strong> — cipta seberapa banyak yang perlu',
              '<strong>Response tanpa had</strong> — terima tanpa limit',
              '<strong>E-Certificate Builder</strong> — reka sijil profesional',
              '<strong>Tanpa jenama</strong> — buang watermark KlikForm',
              '<strong>Sokongan keutamaan</strong> — respons pantas',
            ], 'check')}
            ${button(dashboardUrl, 'Mula Sekarang')}
            ${caption('Ada soalan? Balas email ini untuk bantuan.')}
  `);

  return {
    subject: `🎉 Selamat datang ke KlikForm Pro, ${userName}`,
    html: emailWrapper(content, 'Akaun anda kini Pro — nikmati semua ciri premium.'),
  };
}

// Payment success confirmation
export function getPaymentSuccessEmail(
  userName: string,
  amount: string,
  renewalDate: string,
  receiptUrl: string
) {
  const rows =
    kvRow('Jumlah Dibayar', escapeHtml(amount)) +
    kvRow('Pelan', 'Pro Monthly') +
    kvRow('Tarikh Pembaharuan', escapeHtml(renewalDate));

  const content = cardBody(`
            ${eyebrow('Pembayaran')}
            ${heading('Pembayaran berjaya')}
            ${para(`Hai <strong style="color:${INK};">${escapeHtml(userName)}</strong>, pembayaran anda untuk langganan KlikForm Pro telah berjaya diproses.`)}
            ${kvTable(rows)}
            ${button(receiptUrl, 'Lihat Resit')}
            ${caption('Simpan email ini sebagai bukti pembayaran.')}
  `);

  return {
    subject: `✅ Pembayaran KlikForm Pro berjaya — ${amount}`,
    html: emailWrapper(content, `Pembayaran anda sebanyak ${amount} telah berjaya.`),
  };
}

// Re-engagement email for inactive users (2 weeks)
export function getInactivityReminderEmail(userName: string, loginUrl: string) {
  const content = cardBody(`
            ${eyebrow('Kami Rindu Anda')}
            ${heading('Dah lama tak nampak anda')}
            ${para(`Hai <strong style="color:${INK};">${escapeHtml(userName)}</strong>, anda belum log masuk ke KlikForm selama 2 minggu. Inilah yang menunggu anda:`)}
            ${bulletList([
              'Semak response borang anda',
              'Lihat statistik terkini',
              'Hantar sijil digital kepada peserta',
            ], 'check')}
            ${button(loginUrl, 'Log Masuk Sekarang')}
            ${caption('Jika anda tidak mahu menerima email ini, abaikan sahaja.')}
  `);

  return {
    subject: `👋 Kami rindu anda, ${userName} — log masuk ke KlikForm`,
    html: emailWrapper(content, 'Dah 2 minggu — log masuk semula ke KlikForm.'),
  };
}

// Deletion warning email (3 days before auto-delete)
export function getAccountDeletionWarningEmail(
  userName: string,
  deletionDate: string,
  loginUrl: string
) {
  const content = cardBody(`
            ${eyebrow('Tindakan Diperlukan')}
            ${heading('Akaun anda akan dipadam')}
            ${para(`Hai <strong style="color:${INK};">${escapeHtml(userName)}</strong>, akaun anda dijadualkan untuk dipadam pada <strong style="color:${INK};">${escapeHtml(deletionDate)}</strong> kerana tidak aktif selama 1 bulan.`)}
            ${para('Jika dipadam, anda akan kehilangan:', 8)}
            ${bulletList([
              'Semua data akaun anda',
              'Semua borang (jika ada)',
              'Semua response dan data',
            ], 'dot')}
            ${button(loginUrl, 'Log Masuk & Simpan Akaun')}
            ${caption(`Log masuk sebelum ${escapeHtml(deletionDate)} untuk mengelakkan pemadaman.`)}
  `);

  return {
    subject: `⚠️ Akaun KlikForm anda akan dipadam pada ${deletionDate}`,
    html: emailWrapper(content, `Log masuk sebelum ${deletionDate} untuk mengelakkan pemadaman akaun.`),
  };
}
