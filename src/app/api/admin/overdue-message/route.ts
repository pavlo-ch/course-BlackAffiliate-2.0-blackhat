import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PUT(request: NextRequest) {
  try {
    // 1. Verify Admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[API] getUser failed:', authError);
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      console.error('[API] Not admin. Role:', profile?.role);
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // 2. Update overdue_message
    const body = await request.json();
    const { userId, overdue_message } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Missing userId' }, { status: 400 });
    }

    // overdue_message can be null (to clear) or string (to set)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ overdue_message })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating overdue_message:', updateError);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: overdue_message ? 'Overdue message updated' : 'Overdue message cleared' 
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
