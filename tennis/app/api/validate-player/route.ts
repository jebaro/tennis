// app/api/validate-player/route.ts - FINAL FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ValidationRequest {
  playerName: string;
  rowCategory: any;
  colCategory: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    const { playerName, rowCategory, colCategory } = body;

    console.log('🎾 Validating player:', {
      playerName,
      rowCategory: { type: rowCategory.type, label: rowCategory.label, value: rowCategory.value },
      colCategory: { type: colCategory.type, label: colCategory.label, value: colCategory.value }
    });

    // Find the player
    const { data: players, error: playerError } = await supabase
      .from('players')
      .select('*')
      .ilike('name', `%${playerName.trim()}%`);

    if (playerError || !players || players.length === 0) {
      console.log('❌ Player not found:', playerName);
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

    console.log('✅ Found player:', {
      name: player.name,
      nationality: player.nationality,
      turned_pro: player.turned_pro,
      retired: player.retired,
      plays_hand: player.plays_hand
    });

    // Validate against both categories
    const rowValid = await validatePlayerAgainstCategory(player, rowCategory);
    const colValid = await validatePlayerAgainstCategory(player, colCategory);

    const isValid = rowValid && colValid;

    console.log('🔍 Validation results:', {
      rowValid,
      colValid,
      isValid
    });

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
      error: !isValid ? `${player.name} doesn't match the criteria` : null,
      debug: {
        playerFound: player.name,
        rowCategoryCheck: `${rowCategory.type}: ${rowCategory.value} = ${rowValid}`,
        colCategoryCheck: `${colCategory.type}: ${colCategory.value} = ${colValid}`
      }
    });

  } catch (error) {
    console.error('❌ Validation error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
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

// FIXED: Main validation function - returns Promise<boolean> NOT boolean | null
async function validatePlayerAgainstCategory(player: any, category: any): Promise<boolean> {
  if (!category || !category.type) {
    console.log('❌ Invalid category:', category);
    return false;
  }

  console.log(`🔍 Validating ${category.type}: ${category.value} for player ${player.name}`);

  try {
    switch (category.type) {
      case 'country':
        const countryResult = player.nationality === category.value;
        console.log(`Country check: ${player.nationality} === ${category.value} = ${countryResult}`);
        return countryResult;
      
      case 'tournament':
        const tournamentResult = await validateTournamentWinner(player.id, category.value);
        console.log(`Tournament check: ${category.value} winner = ${tournamentResult}`);
        return tournamentResult;
      
      case 'era':
        const eraResult = validateEra(player, category.value);
        console.log(`Era check: ${category.value} = ${eraResult}`);
        return eraResult;
      
      case 'style':
        const styleResult = player.plays_hand === category.value;
        console.log(`Style check: ${player.plays_hand} === ${category.value} = ${styleResult}`);
        return styleResult;
      
      case 'ranking':
        const rankingResult = await validateRanking(player.id, category.value);
        console.log(`Ranking check: ${category.value} = ${rankingResult}`);
        return rankingResult;
      
      case 'achievement':
        const achievementResult = await validateAchievement(player.id, category.value);
        console.log(`Achievement check: ${category.value} = ${achievementResult}`);
        return achievementResult;
      
      default:
        // Legacy support
        const legacyResult = validateLegacyCategory(player, category);
        console.log(`Legacy check: ${category.label || category} = ${legacyResult}`);
        return legacyResult;
    }
  } catch (error) {
    console.error('❌ Category validation error:', error);
    return false;
  }
}

// Tournament validation
async function validateTournamentWinner(playerId: string, tournamentName: string): Promise<boolean> {
  try {
    console.log(`🏆 Checking tournament wins for ${playerId}: ${tournamentName}`);
    
    const { data: achievements, error } = await supabase
      .from('player_achievements')
      .select('result, tournaments!inner(short_name)')
      .eq('player_id', playerId)
      .eq('tournaments.short_name', tournamentName)
      .eq('result', 'winner');

    const result = !error && achievements && achievements.length > 0;
    console.log(`Tournament query result: ${achievements?.length || 0} wins found`);
    return result;
  } catch (error) {
    console.error('Tournament validation error:', error);
    return false;
  }
}

// Era validation - handles both simple and complex formats
function validateEra(player: any, era: string): boolean {
  const turnedPro = player.turned_pro;
  const retired = player.retired;
  const currentYear = new Date().getFullYear();
  
  // Use reasonable defaults if data is missing
  const careerStart = turnedPro || 1990;
  const careerEnd = retired || currentYear;

  console.log(`Era validation: Career ${careerStart}-${careerEnd}, checking ${era}`);

  // Handle JSON format from database categories
  if (era.startsWith('{')) {
    try {
      const eraData = JSON.parse(era);
      if (eraData.active_years) {
        const { start, end } = eraData.active_years;
        const result = careerStart <= end && careerEnd >= start;
        console.log(`Complex era check: career ${careerStart}-${careerEnd} overlaps with ${start}-${end}`);
        console.log(`Logic: ${careerStart} <= ${end} (${careerStart <= end}) AND ${careerEnd} >= ${start} (${careerEnd >= start}) = ${result}`);
        return result;
      }
    } catch (error) {
      console.error('Error parsing era JSON:', error);
      return false;
    }
  }

  // Handle simple string format
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

// Ranking validation
async function validateRanking(playerId: string, rankingType: string): Promise<boolean> {
  try {
    console.log(`📊 Checking ranking for ${playerId}: ${rankingType}`);
    
    switch (rankingType) {
      case 'world_no1':
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

        const result = (no1Rankings && no1Rankings.length > 0) || (no1Achievements && no1Achievements.length > 0);
        console.log(`World #1 check: rankings=${no1Rankings?.length || 0}, achievements=${no1Achievements?.length || 0}`);
        return result;
      
      case 'top10':
        const { data: top10Rankings } = await supabase
          .from('player_rankings')
          .select('singles_ranking')
          .eq('player_id', playerId)
          .lte('singles_ranking', 10)
          .limit(1);
        
        const top10Result = top10Rankings && top10Rankings.length > 0;
        console.log(`Top 10 check: ${top10Rankings?.length || 0} records found`);
        return top10Result;
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Ranking validation error:', error);
    return false;
  }
}

// Achievement validation
async function validateAchievement(playerId: string, achievementType: string): Promise<boolean> {
  try {
    console.log(`🏅 Checking achievement for ${playerId}: ${achievementType}`);
    
    const { data: achievements, error } = await supabase
      .from('player_achievements')
      .select('achievement_type')
      .eq('player_id', playerId)
      .eq('achievement_type', achievementType);

    const result = !error && achievements && achievements.length > 0;
    console.log(`Achievement check: ${achievements?.length || 0} records found`);
    return result;
  } catch (error) {
    console.error('Achievement validation error:', error);
    return false;
  }
}

// Legacy validation
function validateLegacyCategory(player: any, category: any): boolean {
  const categoryLabel = category.label || category;
  console.log(`🔄 Legacy validation for: ${categoryLabel}`);
  
  switch (categoryLabel) {
    case 'USA':
      return player.nationality === 'USA';
    case 'Spain':
      return player.nationality === 'ESP';
    case 'Switzerland':
      return player.nationality === 'SUI';
    case 'Serbia':
      return player.nationality === 'SRB';
    case 'Great Britain':
      return player.nationality === 'GBR';
    case 'France':
      return player.nationality === 'FRA';
    case 'Germany':
      return player.nationality === 'GER';
    case 'Australia':
      return player.nationality === 'AUS';
    case 'Active in 2000s':
    case '2000s':
      return validateEra(player, '2000s');
    case 'Active in 2010s':
    case '2010s':
      return validateEra(player, '2010s');
    case 'Active in 2020s':
    case '2020s':
      return validateEra(player, '2020s');
    case 'Left-Handed':
      return player.plays_hand === 'left';
    case 'Right-Handed':
      return player.plays_hand === 'right';
    case 'Former World #1':
      // Simplified for now - you can enhance this later
      return true;
    case 'Former Top 10':
      return true;
    default:
      console.log(`❓ Unknown legacy category: ${categoryLabel}`);
      return false;
  }
}