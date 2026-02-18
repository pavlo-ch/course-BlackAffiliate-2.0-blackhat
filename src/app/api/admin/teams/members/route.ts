import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { teamId, userId } = await request.json();

    if (!teamId || !userId) {
      return NextResponse.json({ success: false, message: 'teamId and userId are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ team_id: teamId })
      .eq('id', userId);

    if (error) {
      console.error('Error adding user to team:', error);
      return NextResponse.json({ success: false, message: 'Failed to add user to team' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding user to team:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ team_id: null })
      .eq('id', userId);

    if (error) {
      console.error('Error removing user from team:', error);
      return NextResponse.json({ success: false, message: 'Failed to remove user from team' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user from team:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
