import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    // Validate plan
    if (plan !== 'pro') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Amount and description
    const amount = 10.0; // BCL expects number
    const description = 'KlikForm Pro Plan - Monthly Subscription (Promo)';

    // BCL API Configuration
    const bclToken = process.env.BCL_API_TOKEN;
    const bclPortalKey = process.env.BCL_PORTAL_KEY;
    const bclUrl = 'https://bcl.my/api'; // Correct BCL.my API base URL

    if (!bclToken) {
      console.error('BCL_API_TOKEN is missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!bclPortalKey) {
      console.error('BCL_PORTAL_KEY is missing');
      return NextResponse.json(
        { error: 'Server configuration error: Portal key required' },
        { status: 500 }
      );
    }

    // Generate unique order number
    const orderNumber = `KLIK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create a transaction record first (pending)
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        description: description,
        status: 'pending',
        provider_reference: orderNumber,
      })
      .select()
      .single();

    if (txError) {
      console.error('Database transaction error:', txError);
      return NextResponse.json(
        { error: 'Database error', details: txError.message },
        { status: 500 }
      );
    }

    // BCL.my /payment-link API payload
    // Based on official documentation: https://bcl.my/docs/api
    const payload = {
      order_number: orderNumber,
      amount: amount,
      payer_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      payer_email: user.email || '',
      payer_telephone_number: user.user_metadata?.phone || '+60123456789',
      portal_key: bclPortalKey,
      remarks: `KlikForm Pro Subscription - User: ${user.id}`,
      // Optional: let_user_choose_payment: true // Allow user to choose payment method
    };

    console.log('BCL Request URL:', `${bclUrl}/payment-link`);
    console.log('BCL Request Payload:', JSON.stringify(payload, null, 2));

    // Call BCL.my API
    const response = await fetch(`${bclUrl}/payment-link`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bclToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('BCL API Response:', JSON.stringify(data, null, 2));

    if (!response.ok || !data.success) {
      console.error('BCL API Error:', data);
      await supabase
        .from('transactions')
        .update({ status: 'failed', metadata: data })
        .eq('id', transaction.id);
      return NextResponse.json(
        {
          error: data.message || 'Payment gateway error',
          details: data.errors || data,
        },
        { status: 502 }
      );
    }

    // Update transaction with BCL data
    if (data.data?.order_number) {
      await supabase
        .from('transactions')
        .update({
          provider_transaction_id: data.data.order_number,
          metadata: data,
        })
        .eq('id', transaction.id);
    }

    // Return the payment URL
    const paymentUrl = data.data?.payment_link;

    if (!paymentUrl) {
      console.error('No payment URL in response:', data);
      return NextResponse.json(
        { error: 'No payment URL received', details: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: paymentUrl });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
