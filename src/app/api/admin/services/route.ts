import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { data: services, error } = await supabaseAdmin
      .from('shop_services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin services:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error('Error in admin services route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, price, type, duration_days, image_url, is_active } = body;
    
    // Basic validation
    if (!title || price === undefined) {
      return NextResponse.json({ success: false, message: 'Title and price are required' }, { status: 400 });
    }

    const { data: service, error } = await supabaseAdmin
      .from('shop_services')
      .insert({
        title,
        description,
        price,
        type: type || 'other',
        duration_days: duration_days || 0,
        image_url,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const { data: service, error } = await supabaseAdmin
      .from('shop_services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('shop_services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
