// app/api/populate-grid-categories/route.ts - POPULATE DYNAMIC CATEGORIES
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🏆 Populating grid categories from achievements...');

    // Get unique achievement types from the database
    const { data: achievements, error: achievementsError } = await supabase
      .from('player_achievements')
      .select('achievement_type')
      .not('achievement_type', 'is', null);

    if (achievementsError) {
      throw new Error('Failed to fetch achievements: ' + achievementsError.message);
    }

    // Get unique achievement types
    const uniqueAchievements = [...new Set(
      achievements?.map(a => a.achievement_type).filter(Boolean) || []
    )];

    console.log(`Found ${uniqueAchievements.length} unique achievement types`);

    // Define dynamic categories based on achievements and other criteria
    const gridCategories = [
      // Achievement-based categories
      ...uniqueAchievements.map(achievement => ({
        name: formatAchievementName(achievement),
        description: `Player with ${achievement} achievement`,
        category_type: 'achievement',
        validation_rule: { achievement_type: achievement },
        difficulty_level: getAchievementDifficulty(achievement),
        active: true
      })),

      // Surface specialization categories
      {
        name: 'Clay Court Specialist',
        description: 'Player with multiple clay court titles',
        category_type: 'surface_specialist',
        validation_rule: { surface: 'clay', min_titles: 3 },
        difficulty_level: 3,
        active: true
      },
      {
        name: 'Hard Court Expert',
        description: 'Player with multiple hard court titles',
        category_type: 'surface_specialist',
        validation_rule: { surface: 'hard', min_titles: 5 },
        difficulty_level: 2,
        active: true
      },
      {
        name: 'Grass Court Winner',
        description: 'Player who has won on grass courts',
        category_type: 'surface_specialist',
        validation_rule: { surface: 'grass', min_titles: 1 },
        difficulty_level: 4,
        active: true
      },

      // Career milestone categories
      {
        name: 'Career Golden Slam',
        description: 'Won all 4 Grand Slams + Olympic Gold',
        category_type: 'career_milestone',
        validation_rule: { golden_slam: true },
        difficulty_level: 5,
        active: true
      },
      {
        name: 'Multiple Grand Slam Winner',
        description: 'Won 2+ different Grand Slam tournaments',
        category_type: 'career_milestone',
        validation_rule: { different_grand_slams: 2 },
        difficulty_level: 3,
        active: true
      },
      {
        name: 'ATP Finals Winner',
        description: 'Won the ATP Finals (Year-End Championships)',
        category_type: 'tournament_specific',
        validation_rule: { tournament: 'ATP Finals' },
        difficulty_level: 3,
        active: true
      },

      // Ranking-based categories
      {
        name: 'Year-End #1',
        description: 'Finished year as ATP #1',
        category_type: 'ranking_achievement',
        validation_rule: { year_end_ranking: 1 },
        difficulty_level: 4,
        active: true
      },
      {
        name: 'Longest #1 Streak',
        description: 'Held #1 ranking for extended period',
        category_type: 'ranking_achievement',
        validation_rule: { weeks_at_number_one: 50 },
        difficulty_level: 5,
        active: true
      },

      // Age-based achievements
      {
        name: 'Teenage Grand Slam Winner',
        description: 'Won Grand Slam before age 20',
        category_type: 'age_achievement',
        validation_rule: { grand_slam_age: 19 },
        difficulty_level: 4,
        active: true
      },
      {
        name: 'Veteran Winner (35+)',
        description: 'Won major title after age 35',
        category_type: 'age_achievement',
        validation_rule: { title_age: 35 },
        difficulty_level: 4,
        active: true
      },

      // Rivalry-based categories
      {
        name: 'Big 3 Era Player',
        description: 'Active during Federer/Nadal/Djokovic era',
        category_type: 'era_specific',
        validation_rule: { active_years: [2004, 2023] },
        difficulty_level: 2,
        active: true
      },

      // Olympic categories
      {
        name: 'Olympic Gold Medalist',
        description: 'Won Olympic gold in tennis',
        category_type: 'olympic',
        validation_rule: { olympic_gold: true },
        difficulty_level: 4,
        active: true
      },
      {
        name: 'Olympic Medalist',
        description: 'Won any Olympic medal in tennis',
        category_type: 'olympic',
        validation_rule: { olympic_medal: true },
        difficulty_level: 3,
        active: true
      },

      // Masters/Premier categories
      {
        name: 'Masters 1000 Winner',
        description: 'Won at least one ATP Masters 1000 event',
        category_type: 'masters',
        validation_rule: { masters_titles: 1 },
        difficulty_level: 2,
        active: true
      },
      {
        name: 'Multiple Masters Winner',
        description: 'Won 5+ ATP Masters 1000 events',
        category_type: 'masters',
        validation_rule: { masters_titles: 5 },
        difficulty_level: 3,
        active: true
      }
    ];

    // Insert categories into database
    let insertedCount = 0;
    let skippedCount = 0;

    for (const category of gridCategories) {
      try {
        const { error: insertError } = await supabase
          .from('grid_categories')
          .upsert(category, { 
            onConflict: 'name',
            ignoreDuplicates: true 
          });

        if (insertError) {
          console.warn(`Failed to insert category "${category.name}":`, insertError.message);
          skippedCount++;
        } else {
          insertedCount++;
        }
      } catch (error) {
        console.warn(`Error inserting category "${category.name}":`, error);
        skippedCount++;
      }
    }

    console.log(`✅ Inserted ${insertedCount} categories, skipped ${skippedCount}`);

    // Get final count
    const { count: totalCategories } = await supabase
      .from('grid_categories')
      .select('id', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: 'Grid categories populated successfully',
      stats: {
        inserted: insertedCount,
        skipped: skippedCount,
        total: totalCategories,
        uniqueAchievements: uniqueAchievements.length
      },
      categories: gridCategories.map(c => c.name)
    });

  } catch (error) {
    console.error('❌ Error populating grid categories:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to populate grid categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current categories stats
    const [categoriesResult, achievementsResult] = await Promise.all([
      supabase.from('grid_categories').select('*').eq('active', true),
      supabase.from('player_achievements').select('achievement_type').not('achievement_type', 'is', null)
    ]);

    const uniqueAchievements = [...new Set(
      achievementsResult.data?.map(a => a.achievement_type).filter(Boolean) || []
    )];

    return NextResponse.json({
      currentCategories: categoriesResult.data?.length || 0,
      availableAchievements: uniqueAchievements.length,
      categories: categoriesResult.data?.map(c => ({
        name: c.name,
        type: c.category_type,
        difficulty: c.difficulty_level
      })) || [],
      achievements: uniqueAchievements
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get categories stats' 
    }, { status: 500 });
  }
}

// Helper functions
function formatAchievementName(achievement: string): string {
  return achievement
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getAchievementDifficulty(achievement: string): number {
  // Assign difficulty based on achievement type
  const difficultyMap: { [key: string]: number } = {
    'grand_slam_winner': 4,
    'masters_winner': 3,
    'atp_500_winner': 2,
    'tournament_winner': 2,
    'finalist': 2,
    'semifinalist': 1,
    'olympic_gold': 5,
    'olympic_medal': 4,
    'year_end_number_one': 5,
    'weeks_at_number_one': 4,
    'career_titles': 2,
    'prize_money': 1
  };

  // Try to match achievement type with difficulty
  for (const [key, difficulty] of Object.entries(difficultyMap)) {
    if (achievement.toLowerCase().includes(key)) {
      return difficulty;
    }
  }

  return 2; // Default difficulty
}