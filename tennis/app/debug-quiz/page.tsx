// app/api/daily-quiz/route.ts - COMPLETE FIXED VERSION
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
      const timeVariation = Math.floor(parseInt(testMode) / 1000) % 10000; // Much bigger variation
      dateNumber = dateNumber + timeVariation;
      console.log(`Test mode: original seed ${parseInt(today.replace(/-/g, ''))}, variation ${timeVariation}, final seed ${dateNumber}`);
    }

    console.log(`Generating daily quiz for ${today} (seed: ${dateNumber})`);

    // Generate deterministic "random" categories based on today's date
    const quiz = await generateDailyCategories(dateNumber);

    return NextResponse.json({
      success: true,
      date: today,
      categories: quiz,
      seed: dateNumber,
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

  // Get available data from database
  const [countriesResult, tournamentsResult] = await Promise.all([
    supabase
      .from('players')
      .select('nationality')
      .not('nationality', 'is', null),
    supabase
      .from('tournaments')
      .select('short_name, name, level')
      .not('level', 'eq', 'achievement')
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

  // Define all possible category types
  const allCategoryTypes: Category[] = [
    // Country categories
    ...viableCountries.map(country => ({
      type: 'country',
      id: `country_${country}`,
      label: getCountryName(country),
      description: `Tennis player from ${getCountryName(country)}`,
      value: country
    })),

    // Tournament winner categories
    ...grandSlams.map(tournament => ({
      type: 'tournament',
      id: `winner_${tournament.short_name.toLowerCase().replace(/\s+/g, '_')}`,
      label: `${tournament.short_name} Winner`,
      description: `Won ${tournament.short_name}`,
      value: tournament.short_name
    })),

    ...masters.map(tournament => ({
      type: 'tournament',
      id: `winner_${tournament.short_name.toLowerCase().replace(/\s+/g, '_')}`,
      label: `${tournament.short_name} Winner`,
      description: `Won ${tournament.short_name}`,
      value: tournament.short_name
    })),

    // Era categories
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
    },

    // Playing style categories
    {
      type: 'style',
      id: 'lefthand',
      label: 'Left-Handed',
      description: 'Left-handed tennis player',
      value: 'left'
    },
    {
      type: 'style',
      id: 'righthand',
      label: 'Right-Handed',
      description: 'Right-handed tennis player',
      value: 'right'
    },

    // Ranking categories
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

  // Select 6 categories for 3x3 grid (3 rows + 3 columns)
  // Ensure variety by picking from different types
  const selectedCategories: Category[] = [];

  // Much simpler approach: just use different offsets based on seed
  const getVariedIndex = (max: number, offset: number): number => {
    const combined = seed * 9973 + offset * 7919; // Large primes for better distribution
    return Math.abs(combined) % max;
  };

  // Ensure we have enough categories
  if (allCategoryTypes.length < 6) {
    console.error('Not enough category types available:', allCategoryTypes.length);
    throw new Error('Insufficient categories for quiz generation');
  }

  // Simple selection with better distribution
  const selectedCategories: Category[] = [];
  const usedIndices = new Set<number>();

  // Select 6 unique categories using different offsets
  for (let i = 0; i < 6; i++) {
    let attempts = 0;
    let index;
    
    do {
      index = getVariedIndex(allCategoryTypes.length, i * 100 + attempts);
      attempts++;
    } while (usedIndices.has(index) && attempts < 50);
    
    if (attempts >= 50) {
      // Fallback: just pick the next available
      for (let j = 0; j < allCategoryTypes.length; j++) {
        if (!usedIndices.has(j)) {
          index = j;
          break;
        }
      }
    }
    
    usedIndices.add(index);
    selectedCategories.push(allCategoryTypes[index]);
  }

  console.log(`Selected categories with seed ${seed}:`, selectedCategories.map(c => c.label));

  // Ensure we have exactly 6 categories
  if (selectedCategories.length < 6) {
    console.warn(`Only selected ${selectedCategories.length} categories, padding with remaining`);
    for (let i = 0; i < allCategoryTypes.length && selectedCategories.length < 6; i++) {
      if (!selectedCategories.some(selected => selected.id === allCategoryTypes[i].id)) {
        selectedCategories.push(allCategoryTypes[i]);
      }
    }
  }

  // Split into rows and columns
  const rows: Category[] = selectedCategories.slice(0, 3);
  const columns: Category[] = selectedCategories.slice(3, 6);

  const result = {
    categories: { rows, columns },
    debug: debug ? {
      totalAvailableCategories: allCategoryTypes.length,
      availableCountries: viableCountries.length,
      availableGrandSlams: grandSlams.length,
      availableMasters: masters.length,
      selectedCategories: selectedCategories.map(c => `${c.type}: ${c.label}`)
    } : undefined
  };

  return result;
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
    'NED': 'Netherlands'
  };
  
  return countryNames[countryCode] || countryCode;
}