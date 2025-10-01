// app/api/check-cell-solutions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, handleApiError } from '@/lib/supabase/api-client';
import type { Category } from '@/lib/types';

const supabase = getServerSupabase();

export async function POST(request: NextRequest) {
  try {
    const { rowCategory, colCategory } = await request.json();

    console.log('🔍 Finding solutions for:', {
      row: rowCategory.label,
      col: colCategory.label
    });

    // Fetch all players with their related data
    const { data: players, error } = await supabase
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
      .limit(1000); // Limit for performance

    if (error || !players) {
      throw new Error('Failed to fetch players');
    }

    console.log(`📊 Checking ${players.length} players...`);

    // Test each player against both categories
    const validPlayers: Array<{
      name: string;
      nationality: string | null;
      rowMatch: boolean;
      colMatch: boolean;
    }> = [];

    for (const player of players) {
      const rowMatch = await validateCategory(player, rowCategory);
      const colMatch = await validateCategory(player, colCategory);

      if (rowMatch && colMatch) {
        validPlayers.push({
          name: player.name,
          nationality: player.nationality,
          rowMatch,
          colMatch
        });
      }
    }

    console.log(`✅ Found ${validPlayers.length} valid solutions`);

    return NextResponse.json({
      success: true,
      solutions: validPlayers,
      count: validPlayers.length,
      rowCategory: rowCategory.label,
      colCategory: colCategory.label
    });

  } catch (error) {
    console.error('❌ Check solutions error:', error);
    return NextResponse.json(
      handleApiError(error, 'Failed to check cell solutions'),
      { status: 500 }
    );
  }
}

/**
 * Validate a player against a category
 * Same logic as validate-player/route.ts
 */
async function validateCategory(player: any, category: Category): Promise<boolean> {
  try {
    switch (category.type) {
      case 'country':
        return player.nationality === category.value;
      
      case 'tournament':
        return validateTournamentFromData(player, category.value);
      
      case 'era':
        return validateEra(player, category.value);
      
      case 'style':
        return player.plays_hand === category.value;
      
      case 'ranking':
        return validateRankingFromData(player, category.value);
      
      case 'achievement':
        return validateAchievementFromData(player, category.value);
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Category validation error:', error);
    return false;
  }
}

function validateTournamentFromData(player: any, tournamentName: string): boolean {
  if (!player.player_achievements || !Array.isArray(player.player_achievements)) {
    return false;
  }

  return player.player_achievements.some((achievement: any) => 
    achievement.tournaments?.short_name === tournamentName &&
    achievement.result === 'winner'
  );
}

function validateRankingFromData(player: any, rankingType: string): boolean {
  if (!player.player_rankings || !Array.isArray(player.player_rankings)) {
    return false;
  }

  switch (rankingType) {
    case 'world_no1':
      const hasNo1Ranking = player.player_rankings.some(
        (r: any) => r.singles_ranking === 1
      );
      
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

function validateAchievementFromData(player: any, achievementType: string): boolean {
  if (!player.player_achievements || !Array.isArray(player.player_achievements)) {
    return false;
  }

  return player.player_achievements.some(
    (achievement: any) => achievement.achievement_type === achievementType
  );
}

function validateEra(player: any, era: string): boolean {
  const turnedPro = player.turned_pro;
  const retired = player.retired;
  const currentYear = new Date().getFullYear();
  
  const careerStart = turnedPro || 1990;
  const careerEnd = retired || currentYear;

  // Handle JSON format from database categories
  if (era.startsWith('{')) {
    try {
      const eraData = JSON.parse(era);
      if (eraData.active_years) {
        const { start, end } = eraData.active_years;
        return careerStart <= end && careerEnd >= start;
      }
    } catch (error) {
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