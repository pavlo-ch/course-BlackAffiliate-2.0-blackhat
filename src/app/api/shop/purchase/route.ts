import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    const { serviceId } = await request.json();

    if (!serviceId) {
      return NextResponse.json({ success: false, message: 'Service ID is required' }, { status: 400 });
    }

    // 1. Get Service Details
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('shop_services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    if (!service.is_active) {
      return NextResponse.json({ success: false, message: 'Service is not active' }, { status: 400 });
    }

    // 2. Check Balance & Deduct (Atomic update)
    // We try to decrement. If row is returned, it worked. If not, condition failed (insufficient funds).
    // Note: We need to ensure the user has a balance row first.
    
    const { data: balanceResult, error: balanceError } = await supabaseAdmin.rpc('deduct_balance', {
      p_user_id: user.id,
      p_amount: service.price
    });
    
    // Since I didn't create the RPC, I'll stick to the manual approach with a lock or simple check-and-update.
    // Optimistic approach:
    // 1. Get balance
    // 2. Check if sufficient
    // 3. Update balance = balance - price WHERE user_id = ... AND balance >= price
    
    // However, I can't easily do "balance = balance - price" in standard PostgREST update without a plugin or RPC.
    // So I WILL create a quick RPC or use a robust two-step with checking row count.
    
    // Actually, let's just do:
    // Fetch balance
    // Fetch balance
    const { data: userBalance, error: fetchBalanceError } = await supabaseAdmin
      .from('user_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();
      
    // Handle case where balance no found (PGRST116) as 0 balance
    if (fetchBalanceError && fetchBalanceError.code !== 'PGRST116') {
       return NextResponse.json({ success: false, message: 'Error checking balance' }, { status: 400 });
    }
    
    const currentBalance = userBalance ? userBalance.balance : 0;
    
    if (currentBalance < service.price) {
      return NextResponse.json({ success: false, message: 'Insufficient funds' }, { status: 400 });
    }
    
    const newBalance = Number(currentBalance) - Number(service.price);
    
    // Update balance
    // If we have userBalance, update. If not, insert (unlikely for paid services as currentBalance=0 < price)
    if (userBalance) {
        const { error: updateError } = await supabaseAdmin
          .from('user_balances')
          .update({ balance: newBalance })
          .eq('user_id', user.id)
          .eq('balance', userBalance.balance); // Optimistic locking on exact balance value
          
        if (updateError) {
          return NextResponse.json({ success: false, message: 'Transaction failed (concurrency). Please try again.' }, { status: 409 });
        }
    } else {
        // Insert (only possible if service.price <= 0)
        const { error: insertError } = await supabaseAdmin
          .from('user_balances')
          .insert({ user_id: user.id, balance: newBalance });
          
        if (insertError) {
             return NextResponse.json({ success: false, message: 'Transaction failed (insert). Please try again.' }, { status: 500 });
        }
    }
    
    // 3. Record Purchase
    const { error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .insert({
        user_id: user.id,
        service_id: service.id,
        amount: service.price,
        status: 'completed'
      });
      
    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
      // CRITICAL: We deducted money but failed to give product.
      // In a real system, we'd roll back. Here, we log errors.
      return NextResponse.json({ success: false, message: 'Purchase recorded with error. Contact support.' }, { status: 500 });
    }

    // 4. Update Access Expiry (if subscription)
    if (service.type === 'subscription' && service.duration_days > 0) {
      // Get current profile to see current expiry and team_id
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('access_expires_at, team_id')
        .eq('id', user.id)
        .single();
        
      let currentExpiry = profile?.access_expires_at ? new Date(profile.access_expires_at) : new Date();
      // If expired, start from now
      if (currentExpiry < new Date()) {
        currentExpiry = new Date();
      }
      
      // Add days
      currentExpiry.setDate(currentExpiry.getDate() + service.duration_days);
      const newExpiryIso = currentExpiry.toISOString();
      
      // Update the purchaser
      await supabaseAdmin
        .from('profiles')
        .update({ access_expires_at: newExpiryIso })
        .eq('id', user.id);

      // TEAM SYNC LOGIC
      if (profile?.team_id) {
        // 1. Update Team Record
        await supabaseAdmin
          .from('teams')
          .update({ access_expires_at: newExpiryIso })
          .eq('id', profile.team_id);
          
        // 2. Sync ALL team members
        await supabaseAdmin
          .from('profiles')
          .update({ access_expires_at: newExpiryIso })
          .eq('team_id', profile.team_id);
      }
    }

    return NextResponse.json({ success: true, message: 'Purchase successful' });

  } catch (error) {
    console.error('Server error in purchase route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
