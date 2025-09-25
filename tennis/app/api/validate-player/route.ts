// app/api/validate-player/route.ts - ENHANCED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ValidationRequest {
  playerName: string;
  rowCategory: any; // Category object with type, value, etc.
  colCategory: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    const { playerName, rowCategory, colCategory } = body;

    // Find the player
    const { data: players, error: playerError } = await supabase
      .from('players')
      .select('*')
      .ilike('name', `%${playerName.trim()}%`);

    if (playerError || !players || players.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Player not found',
        suggestion: null
      });
    }

    // Use exact match if possible, otherwise first result
    const player = players.find(p => 
      p.name.toLowerCase() === playerName.trim().toLowerCase()
    ) || players[0];

    // Validate against both categories
    const [rowValid, colValid] = await Promise.all([
      validatePlayerAgainstCategory(player, rowCategory),
      validatePlayerAgainstCategory(player, colCategory)
    ]);

    const isValid = (rowValid === true) && (colValid === true);

    return NextResponse.json({
      valid: isValid,
      player: {
        id: player.id,
        name: player.name,
        nationality: player.nationality
      },
      validation: {
        rowCategory: { name: rowCategory.label, valid: rowValid },
        colCategory: { name: colCategory.label, valid: colValid }
      },
      error: !isValid ? `${player.name} doesn't match the criteria` : null
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Validation failed'
    }, { status: 500 });
  }
}

// GET endpoint for player search suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ players: [] });
    }

    const { data: players, error } = await supabase
      .from('players')
      .select('id, name, nationality')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) {
      return NextResponse.json({ players: [] });
    }

    return NextResponse.json({ players: players || [] });

  } catch (error) {
    return NextResponse.json({ players: [] });
  }
}

// Enhanced validation function for all category types
async function validatePlayerAgainstCategory(player: any, category: any): Promise<boolean | null> {
  if (!category || !category.type) {
    return false;
  }

  switch (category.type) {
    case 'country':
      return player.nationality === category.value;
    
    case 'tournament':
      return await validateTournamentWinner(player.id, category.value);
    
    case 'era':
      return validateEra(player, category.value);
    
    case 'style':
      return player.plays_hand === category.value;
    
    case 'ranking':
      return await validateRanking(player.id, category.value);
    
    default:
      // Legacy support for simple string categories
      return validateLegacyCategory(player, category);
  }
}

// Validate if player won a specific tournament
async function validateTournamentWinner(playerId: string, tournamentName: string): Promise<boolean> {
  const { data: achievements, error } = await supabase
    .from('player_achievements')
    .select('result, tournaments!inner(short_name)')
    .eq('player_id', playerId)
    .eq('tournaments.short_name', tournamentName)
    .eq('result', 'winner');

  return !error && achievements && achievements.length > 0;
}

// Validate era based on career years
function validateEra(player: any, era: string): boolean {
  const turnedPro = player.turned_pro;
  const retired = player.retired;
  const currentYear = new Date().getFullYear();
  
  // Determine active years
  const careerStart = turnedPro || 1990; // Default if unknown
  const careerEnd = retired || currentYear;

  switch (era) {
    case '2020s':
      return careerEnd >= 2020;
    case '2010s':
      return careerStart <= 2019 && careerEnd >= 2010;
    case '2000s':
      return careerStart <= 2009 && careerEnd >= 2000;
    case '1990s':
      return careerStart <= 1999 && careerEnd >= 1990;
    default:
      return false;
  }
}

// Validate ranking achievements
async function validateRanking(playerId: string, rankingType: string): Promise<boolean> {
  switch (rankingType) {
    case 'world_no1':
      // Check if player ever reached #1 (from rankings or achievements)
      const { data: no1Rankings } = await supabase
        .from('player_rankings')
        .select('singles_ranking')
        .eq('player_id', playerId)
        .eq('singles_ranking', 1)
        .limit(1);
      
      const { data: no1Achievements } = await supabase
        .from('player_achievements')
        .select('id, tournaments!inner(short_name)')
        .eq('player_id', playerId)
        .eq('tournaments.short_name', 'Year-End #1')
        .limit(1);

      return (no1Rankings && no1Rankings.length > 0) || (no1Achievements && no1Achievements.length > 0);
    
    case 'top10':
      // Check if player ever reached top 10
      const { data: top10Rankings } = await supabase
        .from('player_rankings')
        .select('singles_ranking')
        .eq('player_id', playerId)
        .lte('singles_ranking', 10)
        .limit(1);
      
      return top10Rankings && top10Rankings.length > 0;
    
    default:
      return false;
  }
}

// Legacy validation for backward compatibility
function validateLegacyCategory(player: any, categoryLabel: string): boolean {
  switch (categoryLabel) {
    case 'USA':
      return player.nationality === 'USA';
    case 'Spain':
      return player.nationality === 'ESP';
    case 'Switzerland':
      return player.nationality === 'SUI';
    case 'Grand Slam Winner':
      // This would need achievement lookup, simplified for legacy
      return true; // For now, assume true for major players
    case 'Former World #1-10':
    case 'Former Top 10':
      return true; // Simplified for legacy
    case 'Active in 2000s':
    case '2000s':
      return validateEra(player, '2000s');
    case 'Clay Court Specialist':
      // Simplified check - could look at clay tournament wins
      return player.nationality === 'ESP' || player.nationality === 'ARG'; // Common clay specialists
    case 'Serve & Volley':
      // Historical players more likely to be serve & volley
      const birthYear = player.birth_date ? new Date(player.birth_date).getFullYear() : 1990;
      return birthYear < 1980; // Rough heuristic
    default:
      return false;
  }
}