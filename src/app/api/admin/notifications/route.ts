import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    // Debug: Check token existence
    if (!token || token === 'null' || token === 'undefined') {
       console.error('[API] Token missing or invalid string');
       return NextResponse.json({ success: false, message: 'Token missing' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[API] getUser failed:', authError);
      return NextResponse.json({ success: false, message: 'Invalid token: ' + authError?.message }, { status: 401 });
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
        console.error('[API] Profile fetch error:', profileError);
    }

    if (profile?.role !== 'admin') {
      console.error('[API] Not admin. Role:', profile?.role, 'User:', user.id);
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // 2. Create Notification
    const body = await request.json();
    const { userId, title, message } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        is_read: false
      });

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Notification sent' });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
