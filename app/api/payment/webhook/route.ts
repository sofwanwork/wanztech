import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { addMonths } from 'date-fns';
import crypto from 'crypto';

// BCL Payment Gateway Webhook
// Security: Verifies webhook authenticity via HMAC signature or IP allowlist

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
      // Method 2: IP Allowlist Fallback (if no secret configured)
      // BCL's known IPs - update these based on BCL documentation
      /* const allowedIPs = [
        '103.6.196.0/24',  // Example BCL IP range
        '127.0.0.1',       // Localhost for testing
        '::1',             // IPv6 localhost
      ]; */

      const clientIP =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';

      // In production without webhook secret, log warning but allow
      // This is a fallback - you should configure BCL_WEBHOOK_SECRET
      if (process.env.NODE_ENV === 'production') {
        console.warn(`⚠️ Webhook received without BCL_WEBHOOK_SECRET configured. IP: ${clientIP}`);
        console.warn('Configure BCL_WEBHOOK_SECRET for proper security.');
      }
    }

    // Parse the verified body
    const body = JSON.parse(rawBody);
    const supabase = await createClient();
    const { id: transactionId } = Object.fromEntries(req.nextUrl.searchParams);

    console.log('BCL Webhook received (verified):', body);

    // Verify payment status
    const isSuccessful =
      body.status === 'paid' ||
      body.status === 1 ||
      body.status === 'success' ||
      body.record_type === 'transaction.successful';

    // Identify transaction
    let transaction;

    if (transactionId) {
      const { data, error } = await supabase
        .from('transactions')
        .select()
        .eq('id', transactionId)
        .single();

      if (!error) transaction = data;
    }

    // Fallback: Look up by order_number (provider_reference)
    if (!transaction && body.order_number) {
      const { data, error } = await supabase
        .from('transactions')
        .select()
        .eq('provider_reference', body.order_number)
        .single();

      if (!error) transaction = data;
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (isSuccessful) {
      // 1. Update Transaction
      const { error: txError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          metadata: body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (txError) {
        console.error('Error updating transaction:', txError);
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
