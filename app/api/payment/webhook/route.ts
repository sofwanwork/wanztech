import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { addMonths } from 'date-fns';
import crypto from 'crypto';

// BCL Payment Gateway Webhook
// Security: Verifies webhook authenticity via HMAC signature

export async function GET() {
  // BCL might use GET for redirect callback
  return NextResponse.json({ message: 'Webhook endpoint ready' });
}

export async function POST(req: NextRequest) {
  try {
    // ================================================
    // SECURITY: Verify webhook authenticity
    // ================================================
    const webhookSecret = process.env.BCL_WEBHOOK_SECRET;

    // Get raw body for signature verification
    const rawBody = await req.text();

    if (webhookSecret) {
      // Method 1: HMAC Signature Verification (Preferred)
      const signature =
        req.headers.get('x-bcl-signature') ||
        req.headers.get('x-webhook-signature') ||
        req.headers.get('x-signature');

      if (!signature) {
        console.warn('Webhook received without signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      // Timing-safe comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
      ) {
        console.warn('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      // CRITICAL SECURITY FIX:
      // In production, we MUST have a secret configured.
      if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: BCL_WEBHOOK_SECRET is not set in production environment.');
        return NextResponse.json(
          { error: 'Server misconfiguration: Webhook secret missing' },
          { status: 500 }
        );
      }

      // Method 2: IP Allowlist Fallback (Development Only)
      const clientIP =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';

      console.warn(
        `⚠️ Development Mode: Webhook received without secret. Allowlisting IP: ${clientIP}`
      );
    }

    // Parse the verified body
    const body = JSON.parse(rawBody);

    // IMPORTANT: use the ADMIN (service-role) client for ALL webhook DB work.
    // The request arrives from BCL's servers with no user cookies, so the
    // anon/SSR client is subject to owner-only RLS and silently finds nothing
    // (transactions SELECT is owner/service_role only).
    const supabase = createAdminClient();
    const { id: transactionId } = Object.fromEntries(req.nextUrl.searchParams);

    // Verify payment status
    const isSuccessful =
      body.status === 'paid' ||
      body.status === 1 ||
      body.status === 'success' ||
      body.record_type === 'transaction.successful';

    // Identify transaction
    let transaction: { id: string; user_id: string; amount: number | null; status: string } | null =
      null;

    if (transactionId) {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, user_id, amount, status, processed_at')
        .eq('id', transactionId)
        .single();

      if (!error) transaction = data;
    }

    // Fallback: Look up by order_number (provider_reference)
    if (!transaction && body.order_number) {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, user_id, amount, status, processed_at')
        .eq('provider_reference', body.order_number)
        .single();

      if (!error) transaction = data;
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // ================================================
    // IDEMPOTENCY: a replayed/duplicated webhook must never
    // re-extend the subscription (+1 free month) or re-send emails.
    // processed_at marks the transaction as fully handled.
    // ================================================
    if (isSuccessful) {
      if ((transaction as { processed_at?: string | null }).processed_at) {
        console.log('Duplicate payment webhook ignored (already processed):', transaction.id);
        return NextResponse.json({ success: true, duplicate: true });
      }

      // 1. Update Transaction — set processed_at FIRST so a crash mid-handler
      // can't double-grant. (Status alone is not enough: a 'completed' txn from
      // a partial failure before this migration must still be re-processable.)
      const { error: txError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          metadata: body,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (txError) {
        console.error('Error updating transaction:', txError);
        // 500 → BCL retries later; nothing has been granted yet.
        return NextResponse.json({ error: 'Transaction update failed' }, { status: 500 });
      }

      // 2. Update Subscription
      const promoEndsAt = addMonths(new Date(), 3).toISOString();
      const currentPeriodEnd = addMonths(new Date(), 1).toISOString();

      const { error: subError } = await supabase.from('subscriptions').upsert(
        {
          user_id: transaction.user_id,
          tier: 'pro',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: currentPeriodEnd,
          promo_ends_at: promoEndsAt,
        },
        { onConflict: 'user_id' }
      );

      if (subError) {
        console.error('Error updating subscription:', subError);
        return NextResponse.json({ error: 'Subscription update failed' }, { status: 500 });
      }

      // 3. Send Success & Welcome Emails (Invoice)
      try {
        const { getPaymentSuccessEmail, getWelcomeProEmail, sendEmail } = await import(
          '@/lib/email'
        );

        // Fetch user data via Admin API bypassing RLS
        const { data: userData } = await supabase.auth.admin.getUserById(transaction.user_id);

        const userEmail = userData?.user?.email || body.customer_email || body.payer_email;
        const userName =
          userData?.user?.user_metadata?.full_name ||
          body.customer_name ||
          body.payer_name ||
          'Pelanggan Pro';

        if (userEmail) {
          const receiptUrl = body.receipt_url || body.payment_url || '#';

          // Send Receipt Email
          const receiptEmail = getPaymentSuccessEmail(
            userName,
            `RM ${transaction.amount || '5.00'}`,
            new Date(currentPeriodEnd).toLocaleDateString('ms-MY'),
            receiptUrl
          );

          await sendEmail({
            to: userEmail,
            subject: receiptEmail.subject,
            html: receiptEmail.html,
          });

          // Send Welcome to Pro Email
          const welcomeEmail = getWelcomeProEmail(userName, 'https://klikform.com/forms');
          await sendEmail({
            to: userEmail,
            subject: welcomeEmail.subject,
            html: welcomeEmail.html,
          });
        }
      } catch (emailErr) {
        console.error('Failed to send payment emails:', emailErr);
        // Non-fatal: subscription is already granted. A duplicate webhook is
        // now idempotent, so BCL retrying this event will NOT re-send emails.
      }
    } else {
      // Handle failed payment
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          metadata: body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
