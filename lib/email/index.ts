import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'KlikForm <noreply@klikform.com>',
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

// Base email template wrapper
function emailWrapper(content: string, accentColor: string = '#6366f1') {
    return `
    <!DOCTYPE html>
    <html lang="ms">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100vh;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <!-- Logo -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <div style="display: inline-flex; align-items: center; gap: 12px;">
                      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, ${accentColor}, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-size: 24px; font-weight: 700;">K</span>
                      </div>
                      <span style="color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">KlikForm</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Main Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                ${content}
              </table>
              
              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
                <tr>
                  <td align="center" style="padding: 30px 20px;">
                    <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.6); font-size: 14px;">
                      © 2026 KlikForm. All rights reserved.
                    </p>
                    <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px;">
                      Create forms, collect data seamlessly ✨
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

// Email templates
export function getSubscriptionReminderEmail(userName: string, daysRemaining: number, renewUrl: string) {
    const content = `
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); padding: 40px 40px 30px; text-align: center;">
            <div style="font-size: 56px; margin-bottom: 16px;">⏰</div>
            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Peringatan Langganan</h1>
            <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 15px;">Langganan Pro anda hampir tamat</p>
          </td>
        </tr>
        
        <!-- Body -->
        <tr>
          <td style="padding: 40px;">
            <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
              Hai <strong>${userName}</strong> 👋
            </p>
            
            <!-- Alert Box -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 600;">
                ⚠️ Langganan Pro anda akan tamat dalam <span style="background: #f59e0b; color: white; padding: 2px 10px; border-radius: 20px; font-weight: 700;">${daysRemaining} hari</span>
              </p>
            </div>
            
            <p style="margin: 24px 0 16px 0; color: #374151; font-size: 15px; font-weight: 600;">Selepas tamat, anda akan:</p>
            
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #ef4444; margin-right: 12px;">✕</span>
                <span style="color: #4b5563; font-size: 14px;">Tidak boleh create form baru</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #ef4444; margin-right: 12px;">✕</span>
                <span style="color: #4b5563; font-size: 14px;">Akses features Pro disekat</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="color: #10b981; margin-right: 12px;">✓</span>
                <span style="color: #4b5563; font-size: 14px;">Form sedia ada kekal (terhad)</span>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${renewUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                Renew Sekarang →
              </a>
            </div>
            
            <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
              Renew sebelum tamat untuk elak gangguan perkhidmatan
            </p>
          </td>
        </tr>
    `;

    return {
        subject: `⏰ Langganan Pro KlikForm anda akan tamat dalam ${daysRemaining} hari`,
        html: emailWrapper(content, '#f59e0b'),
    };
}

export function getGracePeriodStartedEmail(userName: string, graceDays: number, renewUrl: string) {
    const content = `
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 40px 30px; text-align: center;">
            <div style="font-size: 56px; margin-bottom: 16px;">🚨</div>
            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Langganan Telah Tamat!</h1>
            <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 15px;">Grace period telah bermula</p>
          </td>
        </tr>
        
        <!-- Body -->
        <tr>
          <td style="padding: 40px;">
            <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
              Hai <strong>${userName}</strong>,
            </p>
            
            <!-- Alert Box -->
            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 15px; font-weight: 600;">
                ⚠️ Langganan Pro anda telah tamat!
              </p>
              <p style="margin: 0; color: #b91c1c; font-size: 14px;">
                Anda mempunyai <span style="background: #dc2626; color: white; padding: 2px 10px; border-radius: 20px; font-weight: 700;">${graceDays} hari</span> untuk renew sebelum akaun disekat.
              </p>
            </div>
            
            <!-- Countdown Timer Look -->
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border-radius: 16px; padding: 24px 40px;">
                <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Masa Berbaki</p>
                <p style="margin: 0; color: white; font-size: 42px; font-weight: 800;">${graceDays} HARI</p>
              </div>
            </div>
            
            <p style="margin: 24px 0 16px 0; color: #374151; font-size: 15px; font-weight: 600;">Status akaun anda:</p>
            
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #ef4444; margin-right: 12px;">✕</span>
                <span style="color: #4b5563; font-size: 14px;">Tidak boleh create form/certificate baru</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #f59e0b; margin-right: 12px;">⏳</span>
                <span style="color: #4b5563; font-size: 14px;">Form sedia ada masih active (sementara)</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="color: #ef4444; margin-right: 12px;">⚠️</span>
                <span style="color: #4b5563; font-size: 14px;">Selepas ${graceDays} hari = akaun disekat</span>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${renewUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4); animation: pulse 2s infinite;">
                🔓 Renew Sekarang
              </a>
            </div>
            
            <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
              Jangan biar pelanggan anda terganggu!
            </p>
          </td>
        </tr>
    `;

    return {
        subject: `🚨 URGENT: Langganan KlikForm tamat - ${graceDays} hari untuk renew`,
        html: emailWrapper(content, '#dc2626'),
    };
}

export function getAccountBlockedEmail(userName: string, renewUrl: string) {
    const content = `
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 40px 40px 30px; text-align: center;">
            <div style="font-size: 56px; margin-bottom: 16px;">🔒</div>
            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Akaun Disekat</h1>
            <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.7); font-size: 15px;">Grace period telah tamat</p>
          </td>
        </tr>
        
        <!-- Body -->
        <tr>
          <td style="padding: 40px;">
            <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
              Hai <strong>${userName}</strong>,
            </p>
            
            <!-- Alert Box -->
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border-left: 4px solid #374151;">
              <p style="margin: 0; color: #374151; font-size: 15px; font-weight: 600;">
                🔒 Akaun anda telah disekat kerana langganan Pro tamat.
              </p>
            </div>
            
            <p style="margin: 24px 0 16px 0; color: #374151; font-size: 15px; font-weight: 600;">Apa yang berlaku:</p>
            
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #ef4444; margin-right: 12px;">✕</span>
                <span style="color: #4b5563; font-size: 14px;">Tidak boleh create form/certificate</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #ef4444; margin-right: 12px;">✕</span>
                <span style="color: #4b5563; font-size: 14px;">Form tidak boleh terima submission</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="color: #10b981; margin-right: 12px;">✓</span>
                <span style="color: #4b5563; font-size: 14px;">Data anda selamat & boleh dipulihkan</span>
              </div>
            </div>
            
            <!-- Reassurance -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                💾 <strong>Data anda selamat!</strong><br>
                Renew bila-bila untuk akses semula semua forms dan data anda.
              </p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${renewUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                🔓 Unlock Akaun Sekarang
              </a>
            </div>
            
            <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
              Hanya RM29/bulan untuk akses penuh semula
            </p>
          </td>
        </tr>
    `;

    return {
        subject: `🔒 Akaun KlikForm disekat - Unlock sekarang`,
        html: emailWrapper(content, '#6366f1'),
    };
}

// Welcome email for new Pro subscribers
export function getWelcomeProEmail(userName: string, dashboardUrl: string) {
    const content = `
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 40px 30px; text-align: center;">
            <div style="font-size: 56px; margin-bottom: 16px;">🎉</div>
            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Selamat Datang ke Pro!</h1>
            <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 15px;">Terima kasih kerana upgrade</p>
          </td>
        </tr>
        
        <!-- Body -->
        <tr>
          <td style="padding: 40px;">
            <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
              Hai <strong>${userName}</strong> 👋
            </p>
            
            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
              Tahniah! Akaun anda telah diupgrade ke <strong style="color: #6366f1;">KlikForm Pro</strong>. Anda kini boleh menikmati semua features premium.
            </p>
            
            <p style="margin: 24px 0 16px 0; color: #374151; font-size: 15px; font-weight: 600;">✨ Features Pro anda:</p>
            
            <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px; padding: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #6366f1; margin-right: 12px;">✓</span>
                <span style="color: #4b5563; font-size: 14px;"><strong>Unlimited Forms</strong> - create tanpa had</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #6366f1; margin-right: 12px;">✓</span>
                <span style="color: #4b5563; font-size: 14px;"><strong>Unlimited Submissions</strong> - terima response tanpa limit</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #6366f1; margin-right: 12px;">✓</span>
                <span style="color: #4b5563; font-size: 14px;"><strong>E-Certificate Builder</strong> - design sijil profesional</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #6366f1; margin-right: 12px;">✓</span>
                <span style="color: #4b5563; font-size: 14px;"><strong>Remove Branding</strong> - no KlikForm watermark</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="color: #6366f1; margin-right: 12px;">✓</span>
                <span style="color: #4b5563; font-size: 14px;"><strong>Priority Support</strong> - fast response time</span>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                Mula Sekarang →
              </a>
            </div>
            
            <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
              Ada soalan? Reply email ini untuk bantuan.
            </p>
          </td>
        </tr>
    `;

    return {
        subject: `🎉 Welcome to KlikForm Pro, ${userName}!`,
        html: emailWrapper(content, '#6366f1'),
    };
}

// Payment success confirmation
export function getPaymentSuccessEmail(userName: string, amount: string, renewalDate: string, receiptUrl: string) {
    const content = `
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; text-align: center;">
            <div style="font-size: 56px; margin-bottom: 16px;">✅</div>
            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Pembayaran Berjaya!</h1>
            <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 15px;">Terima kasih atas pembayaran anda</p>
          </td>
        </tr>
        
        <!-- Body -->
        <tr>
          <td style="padding: 40px;">
            <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
              Hai <strong>${userName}</strong>,
            </p>
            
            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
              Pembayaran anda untuk langganan KlikForm Pro telah berjaya diproses.
            </p>
            
            <!-- Receipt Box -->
            <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 16px; padding: 24px; margin: 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Jumlah Dibayar</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${amount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Pelan</td>
                  <td style="padding: 8px 0; color: #6366f1; font-size: 14px; font-weight: 600; text-align: right;">Pro Monthly</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Renewal Date</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${renewalDate}</td>
                </tr>
              </table>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${receiptUrl}" style="display: inline-block; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 14px;">
                📄 View Receipt
              </a>
            </div>
            
            <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
              Simpan email ini sebagai bukti pembayaran
            </p>
          </td>
        </tr>
    `;

    return {
        subject: `✅ Pembayaran KlikForm Pro berjaya - ${amount}`,
        html: emailWrapper(content, '#10b981'),
    };
}
