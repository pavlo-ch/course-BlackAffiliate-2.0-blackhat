import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      const authCookie = allCookies.find(cookie => 
        cookie.name.includes('auth-token') || cookie.name.includes('access-token')
      );
      
      if (!authCookie) {
        console.log('❌ No auth token found in header or cookies');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.log('❌ Invalid token or user not found:', userError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      console.log('❌ User is not admin:', user.email);
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    console.log('📋 API: Fetching registration requests for admin:', user.email);
    const { data: requests, error } = await supabaseAdmin
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('💥 Error fetching requests:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    
    console.log('✅ API: Found requests:', requests?.length || 0);
    return NextResponse.json({ success: true, requests: requests || [] });
  } catch (error) {
    console.error('💥 Error fetching requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    console.log('📝 API: Creating registration request for:', email);
    const normalizedEmail = email.toLowerCase();
    
    // Check Blacklist
    const { data: blacklisted } = await supabaseAdmin
      .from('blacklist')
      .select('email')
      .eq('email', normalizedEmail)
      .single();
    
    if (blacklisted) {
      return NextResponse.json({ error: 'This email is blacklisted' }, { status: 403 });
    }
    
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();
    
    if (existingProfile) {
      console.log('❌ API: User already exists:', email);
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    const { data: existingRequest } = await supabaseAdmin
      .from('registration_requests')
      .select('id')
      .eq('email', normalizedEmail)
      .single();
    
    if (existingRequest) {
      console.log('❌ API: Registration request already exists:', email);
      return NextResponse.json({ error: 'Registration request already exists' }, { status: 400 });
    }
    
    const { data: newRequest, error: insertError } = await supabaseAdmin
      .from('registration_requests')
      .insert({ email: normalizedEmail, password, name })
      .select()
      .single();
    
    if (insertError) {
      console.error('💥 Error creating request:', insertError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    
    console.log('✅ API: Registration request created:', newRequest.id);
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('💥 Error creating request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}