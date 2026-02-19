import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    
    // Get current profile to calculate session info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('last_seen, last_session_start, total_time_minutes')
      .eq('id', authUser.id)
      .single();

    const updateData: any = {
      last_seen: now.toISOString(),
      is_active: true,
    };

    if (profile) {
      const lastSeen = profile.last_seen ? new Date(profile.last_seen) : null;
      const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);
      
      // If last_seen > 3 min ago or no session, start a new session
      if (!lastSeen || lastSeen < threeMinutesAgo || !profile.last_session_start) {
        updateData.last_session_start = now.toISOString();
        updateData.last_session_duration_minutes = 0;
      } else {
        // Continue existing session - add 1 minute to total time
        updateData.total_time_minutes = (profile.total_time_minutes || 0) + 1;
        // Update session duration
        const sessionStart = new Date(profile.last_session_start);
        updateData.last_session_duration_minutes = Math.round((now.getTime() - sessionStart.getTime()) / 60000);
      }
    } else {
      updateData.last_session_start = now.toISOString();
      updateData.last_session_duration_minutes = 0;
      updateData.total_time_minutes = 0;
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', authUser.id);
    
    if (updateError) {
      console.error('Error updating activity:', updateError);
      return NextResponse.json({ success: false, message: 'Failed to update activity' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in activity endpoint:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('last_seen, is_active')
      .eq('id', authUser.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching activity:', profileError);
      return NextResponse.json({ success: false, message: 'Failed to fetch activity' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      last_seen: profile?.last_seen,
      is_active: profile?.is_active || false
    });
  } catch (error) {
    console.error('Error in activity GET endpoint:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
