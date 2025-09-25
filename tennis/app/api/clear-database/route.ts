// app/api/clear-database/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Clearing all database tables...');
    
    // Clear in correct order due to foreign key constraints
    await supabase.from('player_achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('player_rankings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tournaments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Database cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully'
    });

  } catch (error) {
    console.error('❌ Clear database error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to clear database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Clear database endpoint. Use POST to clear all data.',
    warning: 'This will permanently delete all players, tournaments, rankings, and achievements.'
  });
}