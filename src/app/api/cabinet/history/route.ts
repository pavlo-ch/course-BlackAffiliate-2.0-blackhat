import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
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

    // Fetch deposits
    const { data: deposits, error: depositsError } = await supabaseAdmin
      .from('deposit_transactions')
      .select('id, amount, currency, status, created_at, crypto_address, transaction_hash')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (depositsError) {
      console.error('Error fetching deposits:', depositsError);
      return NextResponse.json({ success: false, message: 'Error fetching deposits' }, { status: 500 });
    }

    // Fetch purchases
    const { data: purchases, error: purchasesError } = await supabaseAdmin
      .from('purchases')
      .select(`
        id, 
        amount, 
        status, 
        created_at, 
        service:shop_services(title)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return NextResponse.json({ success: false, message: 'Error fetching purchases' }, { status: 500 });
    }

    // Combine and sort
    const history = [
      ...deposits.map(d => ({ ...d, type: 'deposit' })),
      ...purchases.map(p => ({ ...p, type: 'purchase' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Server error in history route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
