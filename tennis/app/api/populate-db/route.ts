// app/api/populate-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Sample data for MVP - we'll replace this with SportRadar integration
const SAMPLE_PLAYERS = [
  {
    name: 'Roger Federer',
    nationality: 'SUI',
    birth_date: '1981-08-08',
    turned_pro: 1998,
    retired: 2022,
    plays_hand: 'right',
    backhand: 'one_handed'
  },
  {
    name: 'Rafael Nadal',
    nationality: 'ESP',
    birth_date: '1986-06-03',
    turned_pro: 2001,
    plays_hand: 'left',
    backhand: 'two_handed'
  },
  {
    name: 'Novak Djokovic',
    nationality: 'SRB',
    birth_date: '1987-05-22',
    turned_pro: 2003,
    plays_hand: 'right',
    backhand: 'two_handed'
  },
  {
    name: 'Serena Williams',
    nationality: 'USA',
    birth_date: '1981-09-26',
    turned_pro: 1995,
    retired: 2022,
    plays_hand: 'right',
    backhand: 'two_handed'
  },
  {
    name: 'Andy Murray',
    nationality: 'GBR',
    birth_date: '1987-05-15',
    turned_pro: 2005,
    plays_hand: 'right',
    backhand: 'two_handed'
  },
  {
    name: 'Maria Sharapova',
    nationality: 'RUS',
    birth_date: '1987-04-19',
    turned_pro: 2001,
    retired: 2020,
    plays_hand: 'right',
    backhand: 'two_handed'
  },
  {
    name: 'Pete Sampras',
    nationality: 'USA',
    birth_date: '1971-08-12',
    turned_pro: 1988,
    retired: 2002,
    plays_hand: 'right',
    backhand: 'one_handed'
  },
  {
    name: 'Steffi Graf',
    nationality: 'GER',
    birth_date: '1969-06-14',
    turned_pro: 1982,
    retired: 1999,
    plays_hand: 'right',
    backhand: 'one_handed'
  },
  {
    name: 'John McEnroe',
    nationality: 'USA',
    birth_date: '1959-02-16',
    turned_pro: 1978,
    retired: 1992,
    plays_hand: 'left',
    backhand: 'one_handed'
  },
  {
    name: 'Martina Navratilova',
    nationality: 'USA', // Born in Czech, became US citizen
    birth_date: '1956-10-18',
    turned_pro: 1975,
    retired: 2006,
    plays_hand: 'left',
    backhand: 'one_handed'
  },
  {
    name: 'Carlos Alcaraz',
    nationality: 'ESP',
    birth_date: '2003-05-05',
    turned_pro: 2018,
    plays_hand: 'right',
    backhand: 'two_handed'
  },
  {
    name: 'Jannik Sinner',
    nationality: 'ITA',
    birth_date: '2001-08-16',
    turned_pro: 2018,
    plays_hand: 'right',
    backhand: 'two_handed'
  },
  {
    name: 'Iga Swiatek',
    nationality: 'POL',
    birth_date: '2001-05-31',
    turned_pro: 2016,
    plays_hand: 'right',
    backhand: 'two_handed'
  },
  {
    name: 'Daniil Medvedev',
    nationality: 'RUS',
    birth_date: '1996-02-11',
    turned_pro: 2014,
    plays_hand: 'right',
    backhand: 'two_handed'
  },
  {
    name: 'Coco Gauff',
    nationality: 'USA',
    birth_date: '2004-03-13',
    turned_pro: 2018,
    plays_hand: 'right',
    backhand: 'two_handed'
  }
];

const SAMPLE_TOURNAMENTS = [
  {
    name: 'The Championships, Wimbledon',
    short_name: 'Wimbledon',
    surface: 'grass',
    level: 'grand_slam',
    category: 'ATP',
    location: 'London',
    country: 'GBR'
  },
  {
    name: 'French Open',
    short_name: 'French Open',
    surface: 'clay',
    level: 'grand_slam',
    category: 'ATP',
    location: 'Paris',
    country: 'FRA'
  },
  {
    name: 'US Open',
    short_name: 'US Open',
    surface: 'hard',
    level: 'grand_slam',
    category: 'ATP',
    location: 'New York',
    country: 'USA'
  },
  {
    name: 'Australian Open',
    short_name: 'Australian Open',
    surface: 'hard',
    level: 'grand_slam',
    category: 'ATP',
    location: 'Melbourne',
    country: 'AUS'
  },
  {
    name: 'ATP Masters 1000 Indian Wells',
    short_name: 'Indian Wells',
    surface: 'hard',
    level: 'atp_masters_1000',
    category: 'ATP',
    location: 'Indian Wells',
    country: 'USA'
  }
];

// Sample achievements for some players
const SAMPLE_ACHIEVEMENTS = [
  // Federer Grand Slams
  { player_name: 'Roger Federer', tournament: 'Wimbledon', years: [2003, 2004, 2005, 2006, 2007, 2009, 2012, 2017], result: 'winner' },
  { player_name: 'Roger Federer', tournament: 'US Open', years: [2004, 2005, 2006, 2007, 2008], result: 'winner' },
  { player_name: 'Roger Federer', tournament: 'Australian Open', years: [2004, 2006, 2007, 2010, 2017, 2018], result: 'winner' },
  { player_name: 'Roger Federer', tournament: 'French Open', years: [2009], result: 'winner' },
  
  // Nadal Grand Slams
  { player_name: 'Rafael Nadal', tournament: 'French Open', years: [2005, 2006, 2007, 2008, 2010, 2011, 2012, 2013, 2014, 2017, 2018, 2019, 2020, 2022], result: 'winner' },
  { player_name: 'Rafael Nadal', tournament: 'Wimbledon', years: [2008, 2010], result: 'winner' },
  { player_name: 'Rafael Nadal', tournament: 'US Open', years: [2010, 2013, 2017, 2019], result: 'winner' },
  { player_name: 'Rafael Nadal', tournament: 'Australian Open', years: [2009, 2022], result: 'winner' },
  
  // Djokovic Grand Slams
  { player_name: 'Novak Djokovic', tournament: 'Australian Open', years: [2008, 2011, 2012, 2013, 2015, 2016, 2019, 2020, 2021, 2023], result: 'winner' },
  { player_name: 'Novak Djokovic', tournament: 'Wimbledon', years: [2011, 2014, 2015, 2018, 2019, 2021, 2022], result: 'winner' },
  { player_name: 'Novak Djokovic', tournament: 'US Open', years: [2011, 2015, 2018, 2023], result: 'winner' },
  { player_name: 'Novak Djokovic', tournament: 'French Open', years: [2016, 2021, 2023], result: 'winner' },
];

export async function POST(request: NextRequest) {
  try {
    console.log('🎾 Starting database population...');

    // 1. Insert tournaments first
    console.log('🏆 Inserting tournaments...');
    const { error: tournamentsError } = await supabase
      .from('tournaments')
      .upsert(SAMPLE_TOURNAMENTS, { onConflict: 'short_name' });

    if (tournamentsError) {
      console.error('Error inserting tournaments:', tournamentsError);
      return NextResponse.json({ error: 'Failed to insert tournaments' }, { status: 500 });
    }

    // 2. Insert players
    console.log('👤 Inserting players...');
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .upsert(SAMPLE_PLAYERS, { onConflict: 'name' })
      .select('id, name');

    if (playersError) {
      console.error('Error inserting players:', playersError);
      return NextResponse.json({ error: 'Failed to insert players' }, { status: 500 });
    }

    // 3. Insert achievements
    console.log('🏆 Inserting achievements...');
    for (const achievement of SAMPLE_ACHIEVEMENTS) {
      // Get player ID
      const player = playersData?.find(p => p.name === achievement.player_name);
      if (!player) continue;

      // Get tournament ID
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('id')
        .eq('short_name', achievement.tournament)
        .single();

      if (!tournament) continue;

      // Insert achievements for each year
      for (const year of achievement.years) {
        await supabase
          .from('player_achievements')
          .upsert({
            player_id: player.id,
            tournament_id: tournament.id,
            year: year,
            result: achievement.result,
            achievement_type: 'tournament_result'
          }, { 
            onConflict: 'player_id,tournament_id,year,achievement_type'
          });
      }
    }

    // 4. Add some sample rankings (current top players)
    console.log('📊 Inserting sample rankings...');
    const currentRankings = [
      { name: 'Jannik Sinner', rank: 1 },
      { name: 'Carlos Alcaraz', rank: 2 },
      { name: 'Novak Djokovic', rank: 3 },
      { name: 'Daniil Medvedev', rank: 4 },
    ];

    for (const ranking of currentRankings) {
      const player = playersData?.find(p => p.name === ranking.name);
      if (player) {
        await supabase
          .from('player_rankings')
          .upsert({
            player_id: player.id,
            ranking_date: new Date().toISOString().split('T')[0],
            singles_ranking: ranking.rank
          }, { 
            onConflict: 'player_id,ranking_date'
          });
      }
    }

    console.log('✅ Database population completed!');

    return NextResponse.json({ 
      success: true, 
      message: 'Database populated successfully',
      playersCount: SAMPLE_PLAYERS.length,
      tournamentsCount: SAMPLE_TOURNAMENTS.length
    });

  } catch (error) {
    console.error('❌ Error populating database:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Get current database stats
  try {
    const [playersCount, tournamentsCount, achievementsCount] = await Promise.all([
      supabase.from('players').select('id', { count: 'exact', head: true }),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }),
      supabase.from('player_achievements').select('id', { count: 'exact', head: true })
    ]);

    return NextResponse.json({
      players: playersCount.count,
      tournaments: tournamentsCount.count,
      achievements: achievementsCount.count
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}