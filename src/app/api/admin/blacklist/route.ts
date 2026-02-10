import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Verify Admin (Optional check here as RLS is also enabled, but good for early exit)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      request.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );
    
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { data: blacklist, error } = await supabaseAdmin
      .from('blacklist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blacklist:', error);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, blacklist });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, reason, request_from } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('blacklist')
      .insert({ 
        email: email.toLowerCase(), 
        reason,
        request_from
      });

    if (error) {
      console.error('Error adding to blacklist:', error);
      if (error.code === '23505') {
        return NextResponse.json({ success: false, message: 'Email already blacklisted' }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email added to blacklist' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('blacklist')
      .delete()
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error removing from blacklist:', error);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email removed from blacklist' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
