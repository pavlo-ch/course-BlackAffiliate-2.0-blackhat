import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, type } = await request.json(); // type: 'set' or 'add'

    if (!userId || amount === undefined || !['set', 'add'].includes(type)) {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    const { data: currentBalance, error: balanceFetchError } = await supabaseAdmin
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (balanceFetchError && balanceFetchError.code !== 'PGRST116') {
      throw balanceFetchError;
    }

    let finalBalance = Number(amount);
    if (type === 'add' && currentBalance) {
      finalBalance = Number(currentBalance.balance) + Number(amount);
    }

    if (currentBalance) {
      const { error: updateError } = await supabaseAdmin
        .from('user_balances')
        .update({ 
          balance: finalBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('user_balances')
        .insert({
          user_id: userId,
          balance: finalBalance,
          currency: 'USD'
        });
      
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, message: 'Balance updated', newBalance: finalBalance });
  } catch (error) {
    console.error('Error adjusting balance:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
