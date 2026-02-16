import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency = 'USD', crypto_address, transaction_hash, wallet_currency } = body;

    if (!amount || !transaction_hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Insert deposit transaction
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('deposit_transactions')
      .insert([
        {
          user_id: user.id,
          amount,
          currency,
          crypto_address,
          transaction_hash,
          status: 'pending',
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating deposit request:', insertError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 2. Fetch user profile for name in notification
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();
    
    const userName = profile?.name || 'Unknown';
    const userEmail = profile?.email || user.email;

    // 3. Send Telegram Notification
    const message = `<b>New Deposit Request</b>\n\n` +
      `User: ${userName} (${userEmail})\n` +
      `Amount: ${amount} ${currency}\n` +
      `Crypto: ${wallet_currency || 'Unknown'}\n` +
      `Address: <code>${crypto_address}</code>\n` +
      `Hash: <code>${transaction_hash}</code>\n` +
      `Date: ${new Date().toLocaleString()}`;

    await sendTelegramNotification(message);

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('Server error in deposit route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
