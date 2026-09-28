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
    ? button(escapeHtml(googleSheetUrl), 'Open Google Sheet')
    : '';

  const content = cardBody(`
            ${eyebrow('New Submission')}
            ${heading('You received a new submission')}
            ${para(`Hi <strong style="color:${INK};">${escapeHtml(userName)}</strong>, your form <strong style="color:${INK};">&ldquo;${escapeHtml(formTitle)}&rdquo;</strong> just received a new response.`)}
            ${kvTable(dataRows)}
            ${sheetButton}
            ${caption('Automated notification from KlikForm.')}
  `);

  const cleanTitle = (formTitle || 'Form').replace(/\r?\n/g, ' ').trim();

  return {
    subject: `📬 New submission: ${cleanTitle}`,
    html: emailWrapper(content, `You received a new submission for "${cleanTitle}".`),
  };
}

// Edit-link email — sent to respondents when the form has edit-link
// enabled and the respondent provided an email.
export function getEditLinkEmail(
  formTitle: string,
  editUrl: string,
  expiryDays: number
) {
  const cleanTitle = (formTitle || 'Form').replace(/\r?\n/g, ' ').trim();
  const content = cardBody(`
            ${eyebrow('Edit Response')}
            ${heading('Edit your submission')}
            ${para(`Thank you for submitting your response for <strong style="color:${INK};">&ldquo;${escapeHtml(formTitle)}&rdquo;</strong>. If you need to make changes, click the button below within <strong style="color:${INK};">${expiryDays} days</strong>.`)}
            ${button(editUrl, 'Edit Response')}
            ${note(`This link can only be used <strong>once</strong> and expires in ${expiryDays} days. Do not share this link with anyone else.`)}
            ${caption('If you did not submit this form, please ignore this email.')}
  `);

  return {
    subject: `✏️ Edit your response: ${cleanTitle}`,
    html: emailWrapper(content, `Click to edit your submission for "${cleanTitle}".`),
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
  const cleanTitle = (formTitle || 'Form').replace(/\r?\n/g, ' ').trim();
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
    ? `<p style="margin: 8px 0 0; font-size: 14px; font-weight: 600; color: ${INK};">Summary of your response:</p>${kvTable(summaryRows)}`
    : '';

  const messageBlock = customMessage
    ? para(escapeHtml(customMessage))
    : para(
        `Thank you! Your response for <strong style="color:${INK};">&ldquo;${escapeHtml(formTitle)}&rdquo;</strong> has been received.`
      );

  const content = cardBody(`
            ${eyebrow('Confirmation')}
            ${heading('Response received')}
            <p style="margin: 0 0 18px; font-size: 13px; color: ${MUTED};">Form: <strong style="color:${INK}; font-weight:600;">&ldquo;${escapeHtml(formTitle)}&rdquo;</strong></p>
            ${messageBlock}
            ${summaryBlock}
            ${caption('Automated confirmation email from KlikForm.')}
  `);

  return {
    subject: `✅ Confirmation: ${cleanTitle}`,
    html: emailWrapper(
      content,
      customMessage || `Your response for "${cleanTitle}" has been received.`
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
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
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
                      KlikForm — Hassle-free Online Forms &amp; E-Certificates
                    </p>
                    <p style="margin: 0; font-size: 12px;">
                      <a href="https://klikform.com" style="color: ${BRAND}; text-decoration: none; font-weight: 500;">klikform.com</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 10px 20px 0;">
                    <p style="margin: 0; color: ${MUTED}; font-size: 11px;">
                      © ${year} KlikForm. All rights reserved.
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
            ${eyebrow('Subscription')}
            ${heading('Pro subscription expiring soon')}
            ${para(`Hi <strong style="color:${INK};">${escapeHtml(userName)}</strong>, your KlikForm Pro subscription will expire in <strong style="color:${INK};">${daysRemaining} days</strong>.`)}
            ${para('After expiration, you will no longer be able to:', 8)}
            ${bulletList(['Create new forms or e-certificates', 'Access Pro features & integrations'], 'dot')}
            ${para('Your existing forms will remain active with limited quota.', 18)}
            ${button(renewUrl, 'Renew Now')}
            ${caption('Renew before expiration to avoid any workflow interruption.')}
  `);

  return {
    subject: `⏰ Your KlikForm Pro subscription expires in ${daysRemaining} days`,
    html: emailWrapper(content, `Your Pro subscription will expire in ${daysRemaining} days.`),
  };
}

// Grace period started (subscription expired)
export function getGracePeriodStartedEmail(userName: string, graceDays: number, renewUrl: string) {
  const content = cardBody(`
            ${eyebrow('Subscription Expired')}
            ${heading('Your Pro subscription has expired')}
            ${para(`Hi <strong style="color:${INK};">${escapeHtml(userName)}</strong>, you have a <strong style="color:${INK};">${graceDays}-day grace period</strong> to renew before your account is restricted.`)}
            ${para('Your current account status:', 8)}
            ${bulletList([
              'Cannot create new forms or certificates',
              'Existing forms remain active temporarily',
              `After ${graceDays} days, your account will be locked`,
            ], 'dot')}
            ${button(renewUrl, 'Renew Now')}
            ${caption('Do not let your automated forms be interrupted.')}
  `);

  return {
    subject: `🚨 KlikForm subscription expired — ${graceDays} days to renew`,
    html: emailWrapper(content, `You have ${graceDays} days to renew before your account is restricted.`),
  };
}

// Account blocked (grace period over)
export function getAccountBlockedEmail(userName: string, renewUrl: string) {
  const content = cardBody(`
            ${eyebrow('Account Locked')}
            ${heading('Your account has been locked')}
            ${para(`Hi <strong style="color:${INK};">${escapeHtml(userName)}</strong>, your account is currently locked because your Pro subscription has expired.`)}
            ${para('What happens now:', 8)}
            ${bulletList([
              'Cannot create new forms or certificates',
              'Forms can no longer accept new submissions',
            ], 'dot')}
            ${note('<strong>Your data is completely safe.</strong> Renew anytime to restore full access to all your forms and collected data.')}
            ${button(renewUrl, 'Unlock Account')}
            ${caption('Only RM 15/month for full unlimited access.')}
  `);

  return {
    subject: `🔒 KlikForm account locked — Unlock now`,
    html: emailWrapper(content, 'Your account is locked. Your data is safe — renew anytime to restore access.'),
  };
}

// Welcome email for new Pro subscribers
export function getWelcomeProEmail(userName: string, dashboardUrl: string) {
  const content = cardBody(`
            ${eyebrow('Welcome')}
            ${heading('Welcome to KlikForm Pro')}
            ${para(`Hi <strong style="color:${INK};">${escapeHtml(userName)}</strong>, congratulations! Your account is now Pro. Here is what you can enjoy:`)}
            ${bulletList([
              '<strong>Unlimited forms</strong> — create as many forms as you need',
              '<strong>Unlimited responses</strong> — collect without limits',
              '<strong>Canva-Style E-Cert Studio</strong> — design professional certificates',
              '<strong>No branding</strong> — remove KlikForm watermarks',
              '<strong>Fast priority support</strong> — quick assistance whenever you need it',
            ], 'check')}
            ${button(dashboardUrl, 'Go to Dashboard')}
            ${caption('Have any questions? Reply directly to this email.')}
  `);

  return {
    subject: `🎉 Welcome to KlikForm Pro, ${userName}`,
    html: emailWrapper(content, 'Your account is now Pro — enjoy all premium features.'),
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
    kvRow('Amount Paid', escapeHtml(amount)) +
    kvRow('Plan', 'Pro Monthly') +
    kvRow('Renewal Date', escapeHtml(renewalDate));

  const content = cardBody(`
            ${eyebrow('Payment')}
            ${heading('Payment successful')}
            ${para(`Hi <strong style="color:${INK};">${escapeHtml(userName)}</strong>, your payment for KlikForm Pro subscription has been processed successfully.`)}
            ${kvTable(rows)}
            ${button(receiptUrl, 'View Receipt')}
            ${caption('Keep this email as proof of payment.')}
  `);

  return {
    subject: `✅ KlikForm Pro payment successful — ${amount}`,
    html: emailWrapper(content, `Your payment of ${amount} was successful.`),
  };
}

// Re-engagement email for inactive users (2 weeks)
export function getInactivityReminderEmail(userName: string, loginUrl: string) {
  const content = cardBody(`
            ${eyebrow('We Miss You')}
            ${heading('It has been a while')}
            ${para(`Hi <strong style="color:${INK};">${escapeHtml(userName)}</strong>, you haven\'t logged in to KlikForm for 2 weeks. Here is what is waiting for you:`)}
            ${bulletList([
              'Check your form submissions',
              'View your real-time analytics',
              'Issue digital certificates to participants',
            ], 'check')}
            ${button(loginUrl, 'Log In to KlikForm')}
            ${caption('If you prefer not to receive these reminders, simply ignore this email.')}
  `);

  return {
    subject: `👋 We miss you, ${userName} — log in to KlikForm`,
    html: emailWrapper(content, 'It has been 2 weeks — log back in to your KlikForm dashboard.'),
  };
}

// Deletion warning email (3 days before auto-delete)
export function getAccountDeletionWarningEmail(
  userName: string,
  deletionDate: string,
  loginUrl: string
) {
  const content = cardBody(`
            ${eyebrow('Action Required')}
            ${heading('Your account is scheduled for deletion')}
            ${para(`Hi <strong style="color:${INK};">${escapeHtml(userName)}</strong>, your account is scheduled for deletion on <strong style="color:${INK};">${escapeHtml(deletionDate)}</strong> due to 1 month of inactivity.`)}
            ${para('If deleted, you will lose:', 8)}
            ${bulletList([
              'All your account data and settings',
              'All forms and respondent links',
              'All submission responses and records',
            ], 'dot')}
            ${button(loginUrl, 'Log In & Keep Account')}
            ${caption(`Log in before ${escapeHtml(deletionDate)} to prevent deletion.`)}
  `);

  return {
    subject: `⚠️ Your KlikForm account will be deleted on ${deletionDate}`,
    html: emailWrapper(content, `Log in before ${deletionDate} to prevent your account from being deleted.`),
  };
}
