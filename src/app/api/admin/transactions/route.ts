import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { data: transactions, error } = await supabaseAdmin
      .from('deposit_transactions')
      .select(`
        *,
        profiles:user_id (email, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id || !['confirmed', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    // Get the transaction first to know the amount and user
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('deposit_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Transaction already processed' }, { status: 400 });
    }

    // Update status
    const { error: updateError } = await supabaseAdmin
      .from('deposit_transactions')
      .update({ status, confirmed_at: status === 'confirmed' ? new Date().toISOString() : null })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // If confirmed, update user balance
    if (status === 'confirmed') {
      const { data: currentBalance, error: balanceFetchError } = await supabaseAdmin
        .from('user_balances')
        .select('balance')
        .eq('user_id', transaction.user_id)
        .single();

      if (balanceFetchError && balanceFetchError.code !== 'PGRST116') {
        throw balanceFetchError;
      }

      if (currentBalance) {
        // Update existing balance
        const { error: balanceUpdateError } = await supabaseAdmin
          .from('user_balances')
          .update({ 
            balance: Number(currentBalance.balance) + Number(transaction.amount),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', transaction.user_id);
        
        if (balanceUpdateError) throw balanceUpdateError;
      } else {
        // Create new balance record
        const { error: balanceInsertError } = await supabaseAdmin
          .from('user_balances')
          .insert({
            user_id: transaction.user_id,
            balance: transaction.amount,
            currency: 'USD'
          });
        
        if (balanceInsertError) throw balanceInsertError;
      }
    }

    return NextResponse.json({ success: true, message: `Transaction ${status}` });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
