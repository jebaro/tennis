// app/api/check-players/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get all current players in database
    const { data: players, error } = await supabase
      .from('players')
      .select('id, name, nationality, sportradar_id')
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by first letter for easier viewing
    const groupedPlayers = players?.reduce((acc: any, player: any) => {
      const firstLetter = player.name[0].toUpperCase();
      if (!acc[firstLetter]) acc[firstLetter] = [];
      acc[firstLetter].push(player);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      totalPlayers: players?.length || 0,
      players: players,
      groupedPlayers: groupedPlayers,
      sampleNames: players?.slice(0, 20).map(p => p.name) || []
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch players',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}