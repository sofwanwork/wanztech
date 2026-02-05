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

// Email templates
export function getSubscriptionReminderEmail(userName: string, daysRemaining: number, renewUrl: string) {
    return {
        subject: `⏰ Langganan Pro KlikForm anda akan tamat dalam ${daysRemaining} hari`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #eab308); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .warning-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .btn { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Peringatan Langganan</h1>
            </div>
            <div class="content">
              <p>Hai ${userName},</p>
              <div class="warning-box">
                <strong>⚠️ Langganan Pro anda akan tamat dalam ${daysRemaining} hari.</strong>
              </div>
              <p>Selepas tamat:</p>
              <ul>
                <li>Anda tidak boleh create form baru</li>
                <li>Form sedia ada akan kekal tapi terhad</li>
                <li>Akses ke features Pro akan disekat</li>
              </ul>
              <p>Renew sekarang untuk terus menikmati benefits Pro tanpa gangguan:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${renewUrl}" class="btn">Renew Subscription</a>
              </p>
            </div>
            <div class="footer">
              <p>KlikForm - Create forms, collect data seamlessly</p>
            </div>
          </div>
        </body>
      </html>
    `,
    };
}

export function getGracePeriodStartedEmail(userName: string, graceDays: number, renewUrl: string) {
    return {
        subject: `🚨 Langganan Pro KlikForm anda telah tamat - ${graceDays} hari grace period`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .warning-box { background: #fee2e2; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .btn { display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Langganan Telah Tamat</h1>
            </div>
            <div class="content">
              <p>Hai ${userName},</p>
              <div class="warning-box">
                <strong>⚠️ Langganan Pro anda telah tamat!</strong>
                <p>Anda mempunyai <strong>${graceDays} hari</strong> grace period sebelum akaun disekat sepenuhnya.</p>
              </div>
              <p>Apa yang berlaku sekarang:</p>
              <ul>
                <li>❌ Tidak boleh create form baru</li>
                <li>✅ Form sedia ada masih boleh terima submission (sementara)</li>
                <li>⏳ Selepas ${graceDays} hari, akses akan disekat sepenuhnya</li>
              </ul>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${renewUrl}" class="btn">Renew Sekarang</a>
              </p>
            </div>
            <div class="footer">
              <p>KlikForm - Create forms, collect data seamlessly</p>
            </div>
          </div>
        </body>
      </html>
    `,
    };
}

export function getAccountBlockedEmail(userName: string, renewUrl: string) {
    return {
        subject: `🔒 Akaun KlikForm anda telah disekat`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .blocked-box { background: #f3f4f6; border: 1px solid #9ca3af; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .btn { display: inline-block; background: #0f172a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Akaun Disekat</h1>
            </div>
            <div class="content">
              <p>Hai ${userName},</p>
              <div class="blocked-box">
                <strong>Akaun anda telah disekat kerana langganan tamat.</strong>
              </div>
              <p>Apa yang berlaku:</p>
              <ul>
                <li>❌ Tidak boleh create form atau certificate baru</li>
                <li>❌ Form sedia ada tidak boleh terima submission</li>
                <li>✅ Data anda masih selamat dan boleh diakses selepas renew</li>
              </ul>
              <p>Renew sekarang untuk unlock semula akaun anda:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${renewUrl}" class="btn">Renew dan Unlock Akaun</a>
              </p>
            </div>
            <div class="footer">
              <p>KlikForm - Create forms, collect data seamlessly</p>
            </div>
          </div>
        </body>
      </html>
    `,
    };
}
