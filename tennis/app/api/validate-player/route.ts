// app/api/validate-player/route.ts - REFACTORED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, handleApiError } from '@/lib/supabase/api-client';
import type { Category, ValidationResult } from '@/lib/types';

const supabase = getServerSupabase();

export async function POST(request: NextRequest) {
  try {
    const { playerName, rowCategory, colCategory } = await request.json();

    console.log('\n🎾 VALIDATING PLAYER:', playerName);
    console.log('📋 Row Category:', rowCategory);
    console.log('📋 Col Category:', colCategory);

    // Fetch player with all related data in ONE query (optimized!)
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select(`
        id,
        name,
        nationality,
        turned_pro,
        retired,
        plays_hand,
        player_achievements (
          id,
          tournament_id,
          year,
          result,
          achievement_type,
          tournaments (
            short_name,
            name,
            level
          )
        ),
        player_rankings (
          singles_ranking
        )
      `)
      .ilike('name', playerName)
      .single();

    if (playerError || !player) {
      return NextResponse.json({
        valid: false,
        error: `Player "${playerName}" not found in database`
      });
    }

    console.log('✅ Player found:', player.name);

    // Validate both categories
    const rowMatch = await validateCategory(player, rowCategory);
    const colMatch = await validateCategory(player, colCategory);

    console.log(`\n🔍 Validation Results:`);
    console.log(`   Row (${rowCategory.label}): ${rowMatch ? '✅' : '❌'}`);
    console.log(`   Col (${colCategory.label}): ${colMatch ? '✅' : '❌'}`);

    const isValid = rowMatch && colMatch;

    const response: ValidationResult = {
      valid: isValid,
      player: {
        id: player.id,
        name: player.name,
        nationality: player.nationality
      },
      error: isValid ? undefined : `${player.name} doesn't match the criteria`,
      debug: {
        rowMatch,
        colMatch,
        rowCategory,
        colCategory
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Validation error:', error);
    return NextResponse.json(
      handleApiError(error, 'Failed to validate player'),
      { status: 500 }
    );
  }
}

/**
 * Validate a player against a category
 * Now includes the pre-loaded related data from the JOIN query
 */
async function validateCategory(player: any, category: Category): Promise<boolean> {
  try {
    console.log(`\n🔎 Validating category: ${category.type} (${category.value})`);
    
    switch (category.type) {
      case 'country':
        const countryResult = player.nationality === category.value;
        console.log(`Country check: ${player.nationality} === ${category.value} = ${countryResult}`);
        return countryResult;
      
      case 'tournament':
        // Now using pre-loaded achievements data (no additional query!)
        const tournamentResult = validateTournamentFromData(player, category.value);
        console.log(`Tournament check: ${category.value} = ${tournamentResult}`);
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
        // Now using pre-loaded rankings data (no additional query!)
        const rankingResult = validateRankingFromData(player, category.value);
        console.log(`Ranking check: ${category.value} = ${rankingResult}`);
        return rankingResult;
      
      case 'achievement':
        // Now using pre-loaded achievements data (no additional query!)
        const achievementResult = validateAchievementFromData(player, category.value);
        console.log(`Achievement check: ${category.value} = ${achievementResult}`);
        return achievementResult;
      
      default:
        console.log(`❓ Unknown category type: ${category.type}`);
        return false;
    }
  } catch (error) {
    console.error('❌ Category validation error:', error);
    return false;
  }
}

/**
 * OPTIMIZED: Validate tournament from pre-loaded data (no DB query)
 */
function validateTournamentFromData(player: any, tournamentName: string): boolean {
  if (!player.player_achievements || !Array.isArray(player.player_achievements)) {
    return false;
  }

  return player.player_achievements.some((achievement: any) => 
    achievement.tournaments?.short_name === tournamentName &&
    achievement.result === 'winner'
  );
}

/**
 * OPTIMIZED: Validate ranking from pre-loaded data (no DB query)
 */
function validateRankingFromData(player: any, rankingType: string): boolean {
  if (!player.player_rankings || !Array.isArray(player.player_rankings)) {
    return false;
  }

  switch (rankingType) {
    case 'world_no1':
      // Check if they ever achieved #1 ranking
      const hasNo1Ranking = player.player_rankings.some(
        (r: any) => r.singles_ranking === 1
      );
      
      // Also check for Year-End #1 achievement
      const hasYearEndNo1 = player.player_achievements?.some(
        (a: any) => a.tournaments?.short_name === 'Year-End #1'
      );
      
      return hasNo1Ranking || hasYearEndNo1;
    
    case 'top10':
      return player.player_rankings.some(
        (r: any) => r.singles_ranking <= 10
      );
    
    default:
      return false;
  }
}

/**
 * OPTIMIZED: Validate achievement from pre-loaded data (no DB query)
 */
function validateAchievementFromData(player: any, achievementType: string): boolean {
  if (!player.player_achievements || !Array.isArray(player.player_achievements)) {
    return false;
  }

  return player.player_achievements.some(
    (achievement: any) => achievement.achievement_type === achievementType
  );
}

/**
 * Validate era - handles both simple and complex formats
 */
function validateEra(player: any, era: string): boolean {
  const turnedPro = player.turned_pro;
  const retired = player.retired;
  const currentYear = new Date().getFullYear();
  
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
        console.log(`Complex era: career ${careerStart}-${careerEnd} overlaps ${start}-${end} = ${result}`);
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