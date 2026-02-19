import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, created_at, access_level, last_seen, is_active, payment_reminder, overdue_message, expired_message, access_expires_at, team_id, total_time_minutes, last_session_start, last_session_duration_minutes')
      .order('created_at', { ascending: false });

    if (users) {
      try {
        const { data: deviceProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, device_token, device_fingerprint, device_info, first_fingerprint, first_device_info, last_fingerprint, last_device_info');

        if (deviceProfiles) {
          const deviceMap = new Map(deviceProfiles.map((p: any) => [p.id, p]));
          users.forEach((u: any) => {
            const dp = deviceMap.get(u.id);
            if (dp) {
              u.device_token = dp.device_token ? 'set' : null;
              u.device_fingerprint = dp.device_fingerprint;
              u.device_info = dp.device_info;
              u.first_fingerprint = dp.first_fingerprint;
              u.first_device_info = dp.first_device_info;
              u.last_fingerprint = dp.last_fingerprint;
              u.last_device_info = dp.last_device_info;
            }
          });
        }
      } catch {}
    }
    
    if (users) {


      try {
        const { data: teams } = await supabaseAdmin.from('teams').select('id, name');
        if (teams) {
          const teamMap = new Map(teams.map((t: any) => [t.id, t.name]));
          users.forEach((u: any) => {
            u.team_name = u.team_id ? teamMap.get(u.team_id) || null : null;
          });
        }
      } catch {}

      try {
        const { data: balances } = await supabaseAdmin.from('user_balances').select('user_id, balance');
        if (balances) {
          const balanceMap = new Map(balances.map((b: any) => [b.user_id, Number(b.balance)]));
          users.forEach((u: any) => {
            u.balance = balanceMap.get(u.id) || 0;
          });
        }
      } catch {}

      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      
      users.forEach((user: any) => {
        if (user.last_seen) {
          const lastSeen = new Date(user.last_seen);
          user.is_active = lastSeen > twoMinutesAgo;
        } else {
          user.is_active = false;
        }
      });
    }
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, users: users || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, access_level } = await request.json();
    
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingProfile) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 400 });
    }
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json({ success: false, message: 'Failed to create user' }, { status: 500 });
    }
    
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        name: name || email,
        role: role || 'user',
        access_level: access_level || 1,
        is_approved: true,
        access_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ success: false, message: 'Failed to create user profile' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User created',
      user: {
        id: newProfile.id,
        email: newProfile.email,
        role: newProfile.role,
        createdAt: newProfile.created_at
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, access_level, role, password, overdue_message, expired_message, access_expires_at } = await request.json();
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'User ID not specified' }, { status: 400 });
    }
    
    // Зміна пароля через Supabase Auth Admin API
    if (password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: password
      });
      
      if (authError) {
        console.error('Error updating password:', authError);
        return NextResponse.json({ success: false, message: 'Failed to update password' }, { status: 500 });
      }
      
      // Якщо тільки пароль - повертаємо успіх
      if (access_level === undefined && role === undefined) {
        return NextResponse.json({ 
          success: true, 
          message: 'Password updated successfully'
        });
      }
    }
    
    // Оновлення профілю (access_level, role, overdue_message)
    const updateData: any = {};
    if (access_level !== undefined) updateData.access_level = access_level;
    if (role !== undefined) updateData.role = role;
    if (overdue_message !== undefined) updateData.overdue_message = overdue_message;
    if (expired_message !== undefined) updateData.expired_message = expired_message;
    if (access_expires_at !== undefined) updateData.access_expires_at = access_expires_at;
    
    if (Object.keys(updateData).length > 0) {
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json({ success: false, message: 'Failed to update user profile' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
        message: password ? 'User and password updated' : 'User updated',
      user: updatedProfile
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User updated'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID not specified' }, { status: 400 });
    }
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return NextResponse.json({ success: false, message: 'Failed to delete user profile' }, { status: 500 });
    }
    
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error deleting auth user:', authError);
    }
    
    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}