import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { data: purchases, error } = await supabaseAdmin
      .from('purchases')
      .select(`
        *,
        user:profiles(email, name),
        service:shop_services(title)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin purchases:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, purchases });
  } catch (error) {
    console.error('Error in admin purchases route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
