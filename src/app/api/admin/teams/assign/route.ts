import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { userId, teamName } = await request.json();

    if (!userId || !teamName) {
      return NextResponse.json({ success: false, message: 'User ID and Team Name are required' }, { status: 400 });
    }

    // 1. Get User Access Levels/Expires to sync
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('access_expires_at, access_level')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // 2. Find or Create Team
    const { data: existingTeam } = await supabaseAdmin
      .from('teams')
      .select('*')
      .ilike('name', teamName.trim())
      .single();

    let teamId: string;
    let finalTeamExpiresAt = userProfile.access_expires_at ? new Date(userProfile.access_expires_at) : new Date(0);

    if (existingTeam) {
      teamId = existingTeam.id;
      const currentTeamExpiry = existingTeam.access_expires_at ? new Date(existingTeam.access_expires_at) : new Date(0);
      
      // If team outcome is later, use team's date (User inherits access)
      if (currentTeamExpiry > finalTeamExpiresAt) {
        finalTeamExpiresAt = currentTeamExpiry;
      }

      // Update Team
      await supabaseAdmin
        .from('teams')
        .update({ access_expires_at: finalTeamExpiresAt.toISOString() })
        .eq('id', teamId);
    } else {
      // Create Team
      const { data: newTeam, error: newTeamError } = await supabaseAdmin
        .from('teams')
        .insert({
          name: teamName.trim(),
          access_level: userProfile.access_level || 1, // Default to user's level
          access_expires_at: finalTeamExpiresAt.toISOString(),
        })
        .select('id')
        .single();

      if (newTeamError || !newTeam) {
        return NextResponse.json({ success: false, message: 'Failed to create team' }, { status: 500 });
      }
      teamId = newTeam.id;
    }

    // 3. Assign User & Sync ALL Members
    const { error: assignError } = await supabaseAdmin
      .from('profiles')
      .update({ team_id: teamId })
      .eq('id', userId);

    if (assignError) {
      return NextResponse.json({ success: false, message: 'Failed to assign user' }, { status: 500 });
    }

    // Sync all members (including the new one)
    await supabaseAdmin
      .from('profiles')
      .update({ access_expires_at: finalTeamExpiresAt.toISOString() })
      .eq('team_id', teamId);

    return NextResponse.json({ success: true, teamId });

  } catch (error) {
    console.error('Error assigning team:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
