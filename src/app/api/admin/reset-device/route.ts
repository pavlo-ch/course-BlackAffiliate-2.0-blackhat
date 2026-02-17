import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        device_token: null,
        device_fingerprint: null,
        device_info: null,
        last_fingerprint: null,
        last_device_info: null,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Reset device error:', updateError);
      return NextResponse.json({ success: false, message: 'Failed to reset device' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Device binding reset successfully. The user will register a new device on next login.'
    });
  } catch (error) {
    console.error('Reset device error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
