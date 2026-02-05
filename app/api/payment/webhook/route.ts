import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { addMonths } from 'date-fns';

export async function GET() {
  // BCL might use GET for redirect callback
  return NextResponse.json({ message: 'Webhook endpoint ready' });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse Payload
    const body = await req.json();
    const { id: transactionId } = Object.fromEntries(req.nextUrl.searchParams);

    console.log('BCL Webhook received:', body);

    // Verify payment status
    // BCL status could be: 'paid', 'success', 1, or similar
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
