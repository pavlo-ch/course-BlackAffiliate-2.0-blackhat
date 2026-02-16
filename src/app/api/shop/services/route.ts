import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { data: services, error } = await supabaseAdmin
      .from('shop_services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true }); // Or order by created_at

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error('Error in services route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
