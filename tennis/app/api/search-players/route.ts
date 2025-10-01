// app/api/search-players/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, handleApiError } from '@/lib/supabase/api-client';

const supabase = getServerSupabase();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        players: []
      });
    }

    // Search players by name (case-insensitive, partial match)
    const { data: players, error } = await supabase
      .from('players')
      .select('id, name, nationality')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(10); // Limit to 10 suggestions

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      players: players || [],
      query
    });

  } catch (error) {
    console.error('Player search error:', error);
    return NextResponse.json(
      handleApiError(error, 'Failed to search players'),
      { status: 500 }
    );
  }
}