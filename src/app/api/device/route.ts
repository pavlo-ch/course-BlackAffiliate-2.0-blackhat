import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getAdminUser(request: NextRequest) {
  let token: string | null = null;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
      if (projectId) {
        const cookieValue = request.cookies.get(`sb-${projectId}-auth-token`)?.value;
        if (cookieValue) {
          try {
            const parsed = JSON.parse(cookieValue);
            token = parsed.access_token || parsed;
          } catch {
            token = cookieValue;
          }
        }
      }
    }
  }

  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const { data: attempts } = await supabaseAdmin
        .from('device_login_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      return NextResponse.json({ success: true, attempts: attempts || [] });
    }

    const { data: attempts } = await supabaseAdmin
      .from('device_login_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    return NextResponse.json({ success: true, attempts: attempts || [] });
  } catch (error) {
    console.error('Device attempts fetch error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });
    }

    await supabaseAdmin
      .from('profiles')
      .update({
        device_token: null,
        device_fingerprint: null,
        device_info: null,
        first_fingerprint: null,
        first_device_info: null,
        last_fingerprint: null,
        last_device_info: null,
      })
      .eq('id', userId);

    return NextResponse.json({ success: true, message: 'Device reset. User can login from any device now.' });
  } catch (error) {
    console.error('Device reset error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
