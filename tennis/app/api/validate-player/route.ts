// app/api/validate-player/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ValidationRequest {
  playerName: string;
  rowCategory: string;
  colCategory: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    const { playerName, rowCategory, colCategory } = body;

    // Find the player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .ilike('name', `%${playerName.trim()}%`)
      .single();

    if (playerError || !player) {
      return NextResponse.json({
        valid: false,
        error: 'Player not found',
        suggestion: null
      });
    }

    // Validate against both categories
    const [rowValid, colValid] = await Promise.all([
      validatePlayerAgainstCategory(player, rowCategory),
      validatePlayerAgainstCategory(player, colCategory)
    ]);

    const isValid = rowValid && colValid;

    return NextResponse.json({
      valid: isValid,
      player: {
        id: player.id,
        name: player.name,
        nationality: player.nationality
      },
      validation: {
        rowCategory: { name: rowCategory, valid: rowValid },
        colCategory: { name: colCategory, valid: colValid }
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Validation failed'
    }, { status: 500 });
  }
}

// Helper function to validate player against a category
async function validatePlayerAgainstCategory(player: any, categoryName: string): Promise<boolean> {
  switch (categoryName) {
    case 'USA':
      return player.nationality === 'USA';
    
    case 'Spain':
      return player.nationality === 'ESP';
      
    case 'Switzerland':
      return player.nationality === 'SUI';
      
    case 'Grand Slam Winner':
      return await hasGrandSlamTitle(player.id);
      
    case 'Wimbledon Champion':
      return await hasWonTournament(player.id, 'Wimbledon');
      
    case 'French Open Champion':
      return await hasWonTournament(player.id, 'French Open');
      
    case 'US Open Champion':
      return await hasWonTournament(player.id, 'US Open');
      
    case 'Australian Open Champion':
      return await hasWonTournament(player.id, 'Australian Open');
      
    case 'Former World #1':
      return await hasReachedRanking(player.id, 1);
      
    case 'Top 10 Player':
      return await hasReachedRanking(player.id, 10);
      
    case 'Active in 2000s':
      return isActiveInDecade(player, 2000, 2009);
      
    case 'Active in 2010s':
      return isActiveInDecade(player, 2010, 2019);
      
    case 'Clay Court Specialist':
      return await hasWonTournament(player.id, 'French Open'); // Simple clay court check
      
    case 'Serve & Volley':
      // For now, we'll use era as a proxy (pre-2000 players more likely to be serve & volley)
      return player.turned_pro && player.turned_pro < 1990;
      
    default:
      return false;
  }
}

// Check if player has won any Grand Slam
async function hasGrandSlamTitle(playerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('player_achievements')
    .select('tournaments!inner(short_name)')
    .eq('player_id', playerId)
    .eq('result', 'winner')
    .in('tournaments.short_name', ['Wimbledon', 'French Open', 'US Open', 'Australian Open']);

  return !error && (data?.length || 0) > 0;
}

// Check if player has won a specific tournament
async function hasWonTournament(playerId: string, tournamentName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('player_achievements')
    .select('tournaments!inner(short_name)')
    .eq('player_id', playerId)
    .eq('result', 'winner')
    .eq('tournaments.short_name', tournamentName);

  return !error && (data?.length || 0) > 0;
}

// Check if player has reached a certain ranking
async function hasReachedRanking(playerId: string, maxRanking: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('player_rankings')
    .select('singles_ranking')
    .eq('player_id', playerId)
    .lte('singles_ranking', maxRanking)
    .limit(1);

  return !error && (data?.length || 0) > 0;
}

// Check if player was active in a decade
function isActiveInDecade(player: any, startYear: number, endYear: number): boolean {
  const prYear = player.turned_pro || 0;
  const retYear = player.retired || new Date().getFullYear();
  
  // Player was active if their career overlaps with the decade
  return prYear <= endYear && retYear >= startYear;
}

// GET endpoint to search for players (for autocomplete)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (query.length < 2) {
    return NextResponse.json({ players: [] });
  }

  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('id, name, nationality')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(10);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ players: [] });
    }

    return NextResponse.json({ 
      players: players || [],
      count: players?.length || 0 
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ players: [] });
  }
}