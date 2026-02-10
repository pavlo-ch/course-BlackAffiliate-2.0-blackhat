import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, created_at, access_level, last_seen, is_active, payment_reminder, overdue_message')
      .order('created_at', { ascending: false });
    
    if (users) {
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
        is_approved: true
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
    const { id, access_level, role, password, overdue_message } = await request.json();
    
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