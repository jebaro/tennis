// app/api/precompute-category-pairs/route.ts
// This API pre-calculates which category pairs have valid players
// Run this once to build a compatibility matrix

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/api-client';
import type { Category } from '@/lib/types';

const supabase = getServerSupabase();

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting category pair pre-computation...');
    
    // Clear existing data
    console.log('🗑️ Clearing old compatibility data...');
    await supabase.from('category_compatibility').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('category_metadata').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Get all categories
    const categories = await getAllCategories();
    
    console.log(`📊 Testing ${categories.length} categories...`);
    console.log(`   Total pairs to check: ${categories.length * categories.length}`);
    
    let pairsChecked = 0;
    let validPairs = 0;
    const categoryStats: Record<string, { compatible: number; totalPlayers: number; avgPairPlayers: number }> = {};
    
    // Initialize stats
    categories.forEach(c => {
      categoryStats[c.id] = { compatible: 0, totalPlayers: 0, avgPairPlayers: 0 };
    });
    
    // Check each pair and save to database
    for (let i = 0; i < categories.length; i++) {
      const cat1 = categories[i];
      
      for (let j = 0; j < categories.length; j++) {
        if (i === j) continue; // Skip same category
        
        const cat2 = categories[j];
        pairsChecked++;
        
        // Check if this pair has any valid players
        const result = await countPlayersForPair(cat1, cat2);
        const playerCount = result.count;
        const samplePlayers = result.samplePlayers;
        
        const isCompatible = playerCount > 0;
        
        if (isCompatible) {
          validPairs++;
          categoryStats[cat1.id].compatible++;
          categoryStats[cat1.id].totalPlayers += playerCount;
        }
        
        // Save to database
        await supabase.from('category_compatibility').insert({
          category1_id: cat1.id,
          category1_type: cat1.type,
          category1_label: cat1.label,
          category1_value: cat1.value,
          category2_id: cat2.id,
          category2_type: cat2.type,
          category2_label: cat2.label,
          category2_value: cat2.value,
          is_compatible: isCompatible,
          player_count: playerCount,
          sample_players: samplePlayers
        });
        
        // Log progress every 100 pairs
        if (pairsChecked % 100 === 0) {
          console.log(`Progress: ${pairsChecked}/${categories.length * categories.length} pairs, ${validPairs} valid`);
        }
      }
      
      // Calculate and save category metadata
      const stats = categoryStats[cat1.id];
      const avgPairPlayers = stats.compatible > 0 ? stats.totalPlayers / stats.compatible : 0;
      
      // Quality score: based on how many categories it pairs with and average players per pair
      const qualityScore = Math.min(100, Math.round(
        (stats.compatible / categories.length * 50) + // 50% based on compatibility
        (Math.min(avgPairPlayers / 10, 1) * 50) // 50% based on avg players
      ));
      
      await supabase.from('category_metadata').insert({
        category_id: cat1.id,
        category_type: cat1.type,
        category_label: cat1.label,
        category_value: cat1.value,
        compatible_count: stats.compatible,
        total_player_count: stats.totalPlayers,
        avg_pair_player_count: avgPairPlayers,
        quality_score: qualityScore,
        is_safe: stats.compatible >= (categories.length * 0.3), // Safe if pairs with 30%+ of categories
        is_active: stats.compatible > 0 // Active if has any compatible pairs
      });
      
      console.log(`✓ ${i + 1}/${categories.length}: ${cat1.label} - ${stats.compatible} compatible pairs, quality ${qualityScore}`);
    }
    
    console.log('\n🎉 Pre-computation complete!');
    console.log(`   Valid pairs: ${validPairs} / ${pairsChecked}`);
    console.log(`   Compatibility rate: ${(validPairs / pairsChecked * 100).toFixed(2)}%`);
    console.log(`   Data saved to database!`);
    
    return NextResponse.json({
      success: true,
      summary: {
        totalCategories: categories.length,
        totalPairsChecked: pairsChecked,
        validPairs: validPairs,
        invalidPairs: pairsChecked - validPairs,
        compatibilityRate: (validPairs / pairsChecked * 100).toFixed(2) + '%'
      }
    });

  } catch (error) {
    console.error('❌ Pre-computation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to pre-compute category pairs',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function getAllCategories(): Promise<Category[]> {
  // Same logic as daily-quiz route
  const [countriesResult, tournamentsResult, achievementTypesResult] = await Promise.all([
    supabase.from('players').select('nationality').not('nationality', 'is', null),
    supabase.from('tournaments').select('short_name, name, level').not('level', 'eq', 'achievement'),
    supabase.from('player_achievements').select('achievement_type').not('achievement_type', 'is', null)
  ]);

  const countryCounts = countriesResult.data?.reduce((acc: Record<string, number>, p: any) => {
    acc[p.nationality] = (acc[p.nationality] || 0) + 1;
    return acc;
  }, {}) || {};

  const viableCountries = Object.entries(countryCounts)
    .filter(([_, count]) => count >= 3)
    .map(([country]) => country);

  const grandSlams = tournamentsResult.data?.filter(t => t.level === 'grand_slam') || [];
  const masters = tournamentsResult.data?.filter(t => t.level === 'atp_masters_1000') || [];
  const atp500s = tournamentsResult.data?.filter(t => t.level === 'atp_500') || [];

  const uniqueAchievements = [...new Set(
    achievementTypesResult.data?.map(a => a.achievement_type).filter(Boolean) || []
  )];

  const allCategories: Category[] = [];

  // Add all categories
  viableCountries.forEach(country => {
    allCategories.push({
      type: 'country',
      id: `country_${country}`,
      label: country,
      description: `From ${country}`,
      value: country
    });
  });

  [...grandSlams, ...masters, ...atp500s.slice(0, 10)].forEach(t => {
    allCategories.push({
      type: 'tournament',
      id: `tournament_${t.short_name}`,
      label: t.short_name,
      description: `Won ${t.short_name}`,
      value: t.short_name
    });
  });

  [
    { value: '2020s', label: '2020s' },
    { value: '2010s', label: '2010s' },
    { value: '2000s', label: '2000s' },
    { value: '1990s', label: '1990s' },
  ].forEach(era => {
    allCategories.push({
      type: 'era',
      id: `era_${era.value}`,
      label: era.label,
      description: `Active in ${era.label}`,
      value: era.value
    });
  });

  [
    { value: 'left', label: 'Left-Handed' },
    { value: 'right', label: 'Right-Handed' },
  ].forEach(style => {
    allCategories.push({
      type: 'style',
      id: `style_${style.value}`,
      label: style.label,
      description: style.label,
      value: style.value
    });
  });

  [
    { value: 'world_no1', label: 'World #1' },
    { value: 'top10', label: 'Top 10' },
  ].forEach(ranking => {
    allCategories.push({
      type: 'ranking',
      id: `ranking_${ranking.value}`,
      label: ranking.label,
      description: ranking.label,
      value: ranking.value
    });
  });

  uniqueAchievements.slice(0, 20).forEach(achievement => {
    allCategories.push({
      type: 'achievement',
      id: `achievement_${achievement}`,
      label: achievement,
      description: achievement,
      value: achievement
    });
  });

  return allCategories;
}

async function countPlayersForPair(cat1: Category, cat2: Category): Promise<{ count: number; samplePlayers: string[] }> {
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select(`
        id, name, nationality, turned_pro, retired, plays_hand,
        player_achievements(id, tournament_id, result, achievement_type, tournaments(short_name)),
        player_rankings(singles_ranking)
      `)
      .limit(500);

    if (error || !players) return { count: 0, samplePlayers: [] };

    const matchingPlayers: string[] = [];
    for (const player of players) {
      const match1 = validateCategory(player, cat1);
      const match2 = validateCategory(player, cat2);
      if (match1 && match2) {
        matchingPlayers.push(player.name);
      }
    }

    return {
      count: matchingPlayers.length,
      samplePlayers: matchingPlayers.slice(0, 5) // Store up to 5 sample players
    };
  } catch {
    return { count: 0, samplePlayers: [] };
  }
}

function validateCategory(player: any, category: Category): boolean {
  try {
    switch (category.type) {
      case 'country':
        return player.nationality === category.value;
      
      case 'tournament':
        return player.player_achievements?.some((a: any) => 
          a.tournaments?.short_name === category.value && a.result === 'winner'
        ) || false;
      
      case 'era':
        const turnedPro = player.turned_pro || 1990;
        const retired = player.retired || new Date().getFullYear();
        switch (category.value) {
          case '2020s': return retired >= 2020;
          case '2010s': return turnedPro <= 2019 && retired >= 2010;
          case '2000s': return turnedPro <= 2009 && retired >= 2000;
          case '1990s': return turnedPro <= 1999 && retired >= 1990;
          default: return false;
        }
      
      case 'style':
        return player.plays_hand === category.value;
      
      case 'ranking':
        if (category.value === 'world_no1') {
          return player.player_rankings?.some((r: any) => r.singles_ranking === 1) || false;
        }
        if (category.value === 'top10') {
          return player.player_rankings?.some((r: any) => r.singles_ranking <= 10) || false;
        }
        return false;
      
      case 'achievement':
        return player.player_achievements?.some((a: any) => a.achievement_type === category.value) || false;
      
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'POST to this endpoint to pre-compute category compatibility matrix',
    info: 'This will check all category pairs and store which ones have valid players',
    estimatedTime: '5-10 minutes for 100 categories'
  });
}