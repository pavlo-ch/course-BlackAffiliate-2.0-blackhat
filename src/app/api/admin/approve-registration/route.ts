import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { requestId, access_level } = await request.json();
    console.log('🔍 Approve Registration: Request ID:', requestId, 'Access Level:', access_level);

    if (!requestId) {
      return NextResponse.json({ success: false, message: 'Request ID is required' }, { status: 400 });
    }

    if (!access_level || (access_level < 1 || access_level > 7)) {
      return NextResponse.json({ success: false, message: 'Valid access level (1-7) is required' }, { status: 400 });
    }

    // 0. Check Blacklist safety
    const { data: requestToApprove } = await supabaseAdmin
      .from('registration_requests')
      .select('email')
      .eq('id', requestId)
      .single();

    if (requestToApprove) {
      const { data: blacklisted } = await supabaseAdmin
        .from('blacklist')
        .select('email')
        .eq('email', requestToApprove.email.toLowerCase())
        .single();
      
      if (blacklisted) {
        return NextResponse.json({ success: false, message: 'This email is blacklisted' }, { status: 403 });
      }
    }

    // 1. Fetch the registration request
    const { data: registrationRequest, error: requestError } = await supabaseAdmin
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    console.log('📋 Registration request:', registrationRequest);
    console.log('❌ Request error:', requestError);

    if (requestError || !registrationRequest) {
      return NextResponse.json({ success: false, message: 'Registration request not found' }, { status: 404 });
    }

    // 2. Check if user already exists, if not, invite them
    console.log('👤 Checking/creating user with email:', registrationRequest.email);
    
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('💥 Error listing users:', listError);
      return NextResponse.json({ success: false, message: listError.message || 'Error checking for existing user' }, { status: 500 });
    }

    const existingUser = users.find(user => user.email === registrationRequest.email);
    let userId: string;

    if (existingUser) {
      console.log('✅ User already exists:', existingUser.id);
      userId = existingUser.id;
    } else {
      console.log('➕ Creating new user:', registrationRequest.email);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: registrationRequest.email,
        password: registrationRequest.password,
        email_confirm: true,
        user_metadata: { name: registrationRequest.name },
      });

      if (createError || !newUser.user) {
        console.error('💥 Error creating user:', createError);
        return NextResponse.json({ success: false, message: createError?.message || 'Error creating user' }, { status: 500 });
      }
      
      console.log('✅ User created successfully:', newUser.user.id);
      userId = newUser.user.id;
    }

    // 3. Update the existing profile to mark as approved
    console.log(`✍️ Updating profile for user ID: ${userId}`);
    const accessExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_approved: true,
        name: registrationRequest.name,
        access_level: access_level,
        access_expires_at: accessExpiresAt,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('💥 Error updating profile:', profileError);
      return NextResponse.json({ success: false, message: profileError.message || 'Error creating profile' }, { status: 500 });
    }
    console.log('✅ Profile updated successfully.');

    if (registrationRequest.company_name && registrationRequest.company_name.trim() !== '') {
      const { data: existingTeam } = await supabaseAdmin
        .from('teams')
        .select('id')
        .ilike('name', registrationRequest.company_name)
        .single();

      let teamId: string;

      if (existingTeam) {
        teamId = existingTeam.id;
      } else {
        const { data: newTeam, error: newTeamError } = await supabaseAdmin
          .from('teams')
          .insert({
            name: registrationRequest.company_name,
            access_level: access_level,
            access_expires_at: accessExpiresAt,
          })
          .select('id')
          .single();

        if (newTeamError || !newTeam) {
          console.error('Error creating team:', newTeamError);
          return NextResponse.json({ success: false, message: newTeamError?.message || 'Error creating team' }, { status: 500 });
        }

        teamId = newTeam.id;
      }

      const { error: teamAssignError } = await supabaseAdmin
        .from('profiles')
        .update({ team_id: teamId })
        .eq('id', userId);

      if (teamAssignError) {
        console.error('Error assigning team to profile:', teamAssignError);
      }
    }

    // 4. Delete the registration request
    const { error: deleteError } = await supabaseAdmin
      .from('registration_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      console.error('Error deleting registration request:', deleteError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}