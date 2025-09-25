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
    const dateNumber = parseInt(today.replace(/-/g, '')); // Convert to number for seeding

    console.log(`Generating daily quiz for ${today}`);

    // Generate deterministic "random" categories based on today's date
    const quiz = await generateDailyCategories(dateNumber);

    return NextResponse.json({
      success: true,
      date: today,
      categories: quiz,
      message: `Daily quiz generated for ${today}`
    });

  } catch (error) {
    console.error('Daily quiz generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate daily quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generate daily categories using database data
async function generateDailyCategories(seed: number) {
  // Deterministic pseudo-random function using date as seed
  const pseudoRandom = (max: number, offset: number = 0) => {
    return Math.abs(Math.sin(seed + offset) * 10000) % max;
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
  const usedTypes = new Set<string>();

  // First, ensure we have at least one of each major type
  const priorityTypes = ['country', 'tournament', 'era'];
  
  for (let i = 0; i < priorityTypes.length && selectedCategories.length < 6; i++) {
    const type = priorityTypes[i];
    const typeCategories = allCategoryTypes.filter(cat => cat.type === type);
    if (typeCategories.length > 0) {
      const index = Math.floor(pseudoRandom(typeCategories.length, i));
      selectedCategories.push(typeCategories[index]);
      usedTypes.add(type);
    }
  }

  // Fill remaining slots with variety
  while (selectedCategories.length < 6) {
    const availableCategories = allCategoryTypes.filter(cat => 
      !selectedCategories.some(selected => selected.id === cat.id)
    );
    
    if (availableCategories.length === 0) break;
    
    const index = Math.floor(pseudoRandom(availableCategories.length, selectedCategories.length));
    selectedCategories.push(availableCategories[index]);
  }

  // Split into rows and columns
  const rows: Category[] = selectedCategories.slice(0, 3);
  const columns: Category[] = selectedCategories.slice(3, 6);

  return {
    rows,
    columns
  };
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