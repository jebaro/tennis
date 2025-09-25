// app/api/daily-quiz/route.ts - ENHANCED DB-DRIVEN VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define category type interface
interface Category {
  type: string;
  id: string;
  label: string;
  description: string;
  value: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get today's date as seed for consistent daily generation
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if this is a debug/test request
    const { searchParams } = new URL(request.url);
    const testMode = searchParams.get('t'); // Cache busting parameter
    const debugMode = searchParams.get('debug'); // Debug mode
    
    // For testing, add some randomness to the seed while keeping it deterministic per day
    let dateNumber = parseInt(today.replace(/-/g, '')); // Convert to number for seeding
    if (testMode) {
      // For debug/testing, use the timestamp to get different combinations
      const timeVariation = Math.floor(parseInt(testMode) / 1000) % 50000; // Much bigger variation
      dateNumber = dateNumber + timeVariation;
      console.log(`Test mode: original seed ${parseInt(today.replace(/-/g, ''))}, variation ${timeVariation}, final seed ${dateNumber}`);
    }

    console.log(`Generating daily quiz for ${today} (seed: ${dateNumber})`);

    // Generate deterministic "random" categories based on today's date
    const quiz = await generateDailyCategories(dateNumber, !!debugMode);

    return NextResponse.json({
      success: true,
      date: today,
      categories: quiz.categories,
      seed: dateNumber,
      debug: quiz.debug,
      message: `Daily quiz generated for ${today}`
    });

  } catch (error) {
    console.error('Daily quiz generation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to generate daily quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generate daily categories using database data
async function generateDailyCategories(seed: number, debug: boolean = false) {
  // Deterministic pseudo-random function using date as seed
  const pseudoRandom = (max: number, offset: number = 0) => {
    const value = Math.abs(Math.sin((seed + offset) * 9999) * 10000) % max;
    return Math.floor(value);
  };

  // Get available data from database - Enhanced to include grid_categories
  const [
    countriesResult, 
    tournamentsResult, 
    gridCategoriesResult,
    achievementTypesResult
  ] = await Promise.all([
    supabase
      .from('players')
      .select('nationality')
      .not('nationality', 'is', null),
    supabase
      .from('tournaments')
      .select('short_name, name, level')
      .not('level', 'eq', 'achievement'),
    supabase
      .from('grid_categories')
      .select('*')
      .eq('active', true),
    supabase
      .from('player_achievements')
      .select('achievement_type')
      .not('achievement_type', 'is', null)
  ]);

  if (countriesResult.error || tournamentsResult.error) {
    throw new Error('Failed to fetch quiz data from database');
  }

  // Get unique countries with good representation
  const countryCounts = countriesResult.data?.reduce((acc: any, player: any) => {
    acc[player.nationality] = (acc[player.nationality] || 0) + 1;
    return acc;
  }, {});

  // Filter countries with at least 5 players for viable quiz options
  const viableCountries = Object.entries(countryCounts)
    .filter(([_, count]) => (count as number) >= 5)
    .map(([country, _]) => country);

  // Get tournaments by level for variety
  const grandSlams = tournamentsResult.data?.filter(t => t.level === 'grand_slam') || [];
  const masters = tournamentsResult.data?.filter(t => t.level === 'atp_masters_1000') || [];
  const atp500s = tournamentsResult.data?.filter(t => t.level === 'atp_500') || [];

  // Get unique achievement types
  const uniqueAchievements = [...new Set(
    achievementTypesResult.data?.map(a => a.achievement_type).filter(Boolean) || []
  )];

  // Build all possible category types dynamically
  const allCategoryTypes: Category[] = [];

  // 1. Add country categories
  viableCountries.forEach(country => {
    allCategoryTypes.push({
      type: 'country',
      id: `country_${country}`,
      label: getCountryName(country),
      description: `Tennis player from ${getCountryName(country)}`,
      value: country
    });
  });

  // 2. Add tournament winner categories
  grandSlams.forEach(tournament => {
    allCategoryTypes.push({
      type: 'tournament',
      id: `winner_${tournament.short_name.toLowerCase().replace(/\s+/g, '_')}`,
      label: `${tournament.short_name} Winner`,
      description: `Won ${tournament.short_name}`,
      value: tournament.short_name
    });
  });

  masters.forEach(tournament => {
    allCategoryTypes.push({
      type: 'tournament',
      id: `winner_${tournament.short_name.toLowerCase().replace(/\s+/g, '_')}`,
      label: `${tournament.short_name} Winner`,
      description: `Won ${tournament.short_name}`,
      value: tournament.short_name
    });
  });

  // Add some ATP 500 tournaments for more variety
  atp500s.slice(0, 5).forEach(tournament => {
    allCategoryTypes.push({
      type: 'tournament',
      id: `winner_${tournament.short_name.toLowerCase().replace(/\s+/g, '_')}`,
      label: `${tournament.short_name} Winner`,
      description: `Won ${tournament.short_name}`,
      value: tournament.short_name
    });
  });

  // 3. Add database-driven grid categories
  if (gridCategoriesResult.data) {
    gridCategoriesResult.data.forEach(category => {
      allCategoryTypes.push({
        type: category.category_type || 'custom',
        id: `grid_${category.id}`,
        label: category.name,
        description: category.description || category.name,
        value: category.validation_rule ? JSON.stringify(category.validation_rule) : category.name
      });
    });
  }

  // 4. Add achievement-based categories
  uniqueAchievements.slice(0, 10).forEach(achievement => {
    allCategoryTypes.push({
      type: 'achievement',
      id: `achievement_${achievement.toLowerCase().replace(/\s+/g, '_')}`,
      label: formatAchievementLabel(achievement),
      description: `Player with ${achievement} achievement`,
      value: achievement
    });
  });

  // 5. Add era categories (hardcoded but essential)
  const eraCats = [
    {
      type: 'era',
      id: 'era_2020s',
      label: 'Active in 2020s',
      description: 'Played professionally in the 2020s',
      value: '2020s'
    },
    {
      type: 'era',
      id: 'era_2010s',
      label: 'Active in 2010s',
      description: 'Played professionally in the 2010s',
      value: '2010s'
    },
    {
      type: 'era',
      id: 'era_2000s',
      label: 'Active in 2000s',
      description: 'Played professionally in the 2000s',
      value: '2000s'
    }
  ];
  allCategoryTypes.push(...eraCats);

  // 6. Add style categories
  const styleCats = [
    {
      type: 'style',
      id: 'lefthand',
      label: 'Left-Handed',
      description: 'Left-handed tennis player',
      value: 'left'
    },
    {
      type: 'ranking',
      id: 'former_no1',
      label: 'Former World #1',
      description: 'Reached #1 in ATP/WTA rankings',
      value: 'world_no1'
    },
    {
      type: 'ranking',
      id: 'top10',
      label: 'Former Top 10',
      description: 'Reached top 10 in rankings',
      value: 'top10'
    }
  ];
  allCategoryTypes.push(...styleCats);

  // Enhanced selection algorithm with better variety
  const categorySelection = selectDiverseCategories(allCategoryTypes, seed, 6);

  // Split into rows and columns
  const rows: Category[] = categorySelection.slice(0, 3);
  const columns: Category[] = categorySelection.slice(3, 6);

  const result = {
    categories: { rows, columns },
    debug: debug ? {
      totalAvailableCategories: allCategoryTypes.length,
      availableCountries: viableCountries.length,
      availableGrandSlams: grandSlams.length,
      availableMasters: masters.length,
      availableGridCategories: gridCategoriesResult.data?.length || 0,
      availableAchievements: uniqueAchievements.length,
      selectedCategories: categorySelection.map(c => `${c.type}: ${c.label}`),
      allCategories: allCategoryTypes.map(c => `${c.type}: ${c.label}`).slice(0, 20) // First 20 for debug
    } : undefined
  };

  return result;
}

// Enhanced category selection with better diversity
function selectDiverseCategories(allCategories: Category[], seed: number, count: number): Category[] {
  // Group categories by type for balanced selection
  const categoryGroups = allCategories.reduce((groups: { [key: string]: Category[] }, category) => {
    if (!groups[category.type]) groups[category.type] = [];
    groups[category.type].push(category);
    return groups;
  }, {});

  const selectedCategories: Category[] = [];
  const usedTypes = new Set<string>();
  
  // Deterministic pseudo-random with better distribution
  const getVariedIndex = (max: number, offset: number): number => {
    const combined = seed * 12347 + offset * 9887; // Different primes for better variety
    return Math.abs(combined) % max;
  };

  // Phase 1: Ensure variety by picking one from major types first
  const priorityTypes = ['country', 'tournament', 'era', 'ranking'];
  let selectionOffset = 0;

  priorityTypes.forEach(type => {
    if (categoryGroups[type] && categoryGroups[type].length > 0 && selectedCategories.length < count) {
      const typeCategories = categoryGroups[type];
      const index = getVariedIndex(typeCategories.length, selectionOffset++);
      selectedCategories.push(typeCategories[index]);
      usedTypes.add(type);
    }
  });

  // Phase 2: Fill remaining slots with diverse selection
  while (selectedCategories.length < count) {
    // Get available categories not already selected
    const availableCategories = allCategories.filter(cat => 
      !selectedCategories.some(selected => selected.id === cat.id)
    );
    
    if (availableCategories.length === 0) break;
    
    // Prefer categories from types we haven't used yet
    const unusedTypeCategories = availableCategories.filter(cat => !usedTypes.has(cat.type));
    const selectionPool = unusedTypeCategories.length > 0 ? unusedTypeCategories : availableCategories;
    
    const index = getVariedIndex(selectionPool.length, selectionOffset++);
    const selected = selectionPool[index];
    selectedCategories.push(selected);
    usedTypes.add(selected.type);
  }

  return selectedCategories;
}

// Helper function to format achievement labels
function formatAchievementLabel(achievement: string): string {
  return achievement
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to convert country codes to readable names
function getCountryName(countryCode: string): string {
  const countryNames: { [key: string]: string } = {
    'USA': 'USA',
    'ESP': 'Spain',
    'SRB': 'Serbia',
    'SUI': 'Switzerland',
    'GBR': 'Great Britain',
    'FRA': 'France',
    'GER': 'Germany',
    'ITA': 'Italy',
    'AUS': 'Australia',
    'RUS': 'Russia',
    'ARG': 'Argentina',
    'POL': 'Poland',
    'CZE': 'Czech Republic',
    'BEL': 'Belgium',
    'GRE': 'Greece',
    'NOR': 'Norway',
    'CAN': 'Canada',
    'JPN': 'Japan',
    'CHN': 'China',
    'BRA': 'Brazil',
    'CHI': 'Chile',
    'COL': 'Colombia',
    'CRO': 'Croatia',
    'DEN': 'Denmark',
    'NED': 'Netherlands',
    'URU': 'Uruguay',
    'MEX': 'Mexico',
    'PER': 'Peru',
    'ECU': 'Ecuador',
    'VEN': 'Venezuela'
  };
  
  return countryNames[countryCode] || countryCode;
}