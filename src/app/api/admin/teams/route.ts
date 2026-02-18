import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data: teams, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, team_id')
      .not('team_id', 'is', null);

    const teamsWithMembers = (teams || []).map((team: any) => {
      const members = (profiles || []).filter((p: any) => p.team_id === team.id);
      return {
        ...team,
        members_count: members.length,
        members: members.map((m: any) => ({ id: m.id, email: m.email, name: m.name })),
      };
    });

    return NextResponse.json({ success: true, teams: teamsWithMembers });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, notes, access_level, access_expires_at } = await request.json();

    if (!name) {
      return NextResponse.json({ success: false, message: 'Team name is required' }, { status: 400 });
    }

    const insertData: any = { name };
    if (notes !== undefined) insertData.notes = notes;
    if (access_level !== undefined) insertData.access_level = access_level;
    if (access_expires_at !== undefined) insertData.access_expires_at = access_expires_at;

    const { data: team, error } = await supabaseAdmin
      .from('teams')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return NextResponse.json({ success: false, message: 'Failed to create team' }, { status: 500 });
    }

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, notes, access_level, access_expires_at } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Team ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (notes !== undefined) updateData.notes = notes;
    if (access_level !== undefined) updateData.access_level = access_level;
    if (access_expires_at !== undefined) updateData.access_expires_at = access_expires_at;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: 'Nothing to update' });
    }

    const { data: team, error } = await supabaseAdmin
      .from('teams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating team:', error);
      return NextResponse.json({ success: false, message: 'Failed to update team' }, { status: 500 });
    }

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Team ID is required' }, { status: 400 });
    }

    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .update({ team_id: null })
      .eq('team_id', id);

    if (profilesError) {
      console.error('Error clearing team members:', profilesError);
      return NextResponse.json({ success: false, message: 'Failed to clear team members' }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting team:', error);
      return NextResponse.json({ success: false, message: 'Failed to delete team' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
