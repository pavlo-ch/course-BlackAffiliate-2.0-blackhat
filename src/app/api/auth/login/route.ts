import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramNotification } from '@/lib/telegram';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fingerprint, deviceInfo } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { success: false, message: 'Login failed' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role, created_at, is_approved, access_level, payment_reminder, overdue_message, expired_message, access_expires_at, device_token, first_fingerprint, last_fingerprint, last_device_info')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: 'Could not load user profile' },
        { status: 404 }
      );
    }

    if (!profile.is_approved) {
      return NextResponse.json(
        { success: false, message: 'Your account is not approved yet.' },
        { status: 403 }
      );
    }

    if (profile.role === 'admin') {
      const response = NextResponse.json({
        success: true,
        session: authData.session,
        user: buildUserPayload(profile, authData.user.email!),
      });
      return response;
    }

    const cookieToken = request.cookies.get('device_token')?.value;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') || 'unknown';

    if (!profile.device_token) {
      const newToken = crypto.randomUUID();

      await supabaseAdmin
        .from('profiles')
        .update({
          device_token: newToken,
          first_fingerprint: fingerprint || null,
          first_device_info: deviceInfo || null,
          last_fingerprint: fingerprint || null,
          last_device_info: deviceInfo || null,
        })
        .eq('id', authData.user.id);

      const response = NextResponse.json({
        success: true,
        session: authData.session,
        user: buildUserPayload(profile, authData.user.email!),
      });

      response.cookies.set('device_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    if (cookieToken === profile.device_token) {
      if (fingerprint) {
        await supabaseAdmin
          .from('profiles')
          .update({
            last_fingerprint: fingerprint,
            last_device_info: deviceInfo || null,
          })
          .eq('id', authData.user.id);
      }

      const response = NextResponse.json({
        success: true,
        session: authData.session,
        user: buildUserPayload(profile, authData.user.email!),
      });

      response.cookies.set('device_token', profile.device_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    if (fingerprint && profile.last_fingerprint && fingerprint === profile.last_fingerprint) {
      const newToken = crypto.randomUUID();

      await supabaseAdmin
        .from('profiles')
        .update({
          device_token: newToken,
          last_device_info: deviceInfo || null,
        })
        .eq('id', authData.user.id);

      const response = NextResponse.json({
        success: true,
        session: authData.session,
        user: buildUserPayload(profile, authData.user.email!),
      });

      response.cookies.set('device_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    try {
      await supabaseAdmin
        .from('device_login_attempts')
        .insert({
          user_id: authData.user.id,
          fingerprint: fingerprint || 'no-fingerprint',
          device_info: deviceInfo || {},
          ip_address: ip,
          blocked: true,
        });
    } catch {}

    try {
      await supabaseClient.auth.signOut();
    } catch {}

    const userName = profile.name || email;
    const cookieStatus = cookieToken ? `Cookie mismatch (got: ${cookieToken.slice(0, 8)}...)` : 'No cookie';
    const fpStatus = fingerprint
      ? `FP mismatch (got: ${fingerprint}, stored: ${profile.last_fingerprint || 'none'})`
      : 'No fingerprint sent';

    try {
      const message = `🚫 <b>Blocked Login Attempt</b>\n\n` +
        `👤 User: ${userName}\n` +
        `📧 Email: ${email}\n` +
        `🌐 IP: ${ip}\n` +
        `🔑 ${cookieStatus}\n` +
        `📱 ${fpStatus}\n` +
        `🖥️ Browser: ${(deviceInfo as any)?.browser || 'Unknown'}\n` +
        `💻 OS: ${(deviceInfo as any)?.os || 'Unknown'}\n` +
        `📅 ${new Date().toLocaleString('en-US')}`;
      await sendTelegramNotification(message);
    } catch {}

    return NextResponse.json(
      { success: false, message: 'Access denied. This account is linked to another device. Contact administrator.' },
      { status: 403 }
    );
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during login' },
      { status: 500 }
    );
  }
}

function buildUserPayload(profile: any, email: string) {
  return {
    id: profile.id,
    email,
    name: profile.name,
    role: profile.role,
    access_level: profile.access_level,
    created_at: profile.created_at,
    isApproved: true,
    payment_reminder: profile.payment_reminder,
    overdue_message: profile.overdue_message,
    expired_message: profile.expired_message,
    access_expires_at: profile.access_expires_at,
  };
}
