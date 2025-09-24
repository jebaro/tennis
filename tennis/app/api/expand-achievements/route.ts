// app/api/expand-achievements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Comprehensive achievements for current ATP top players
const ACHIEVEMENT_DATA = [
  // Grand Slam Titles
  { player: 'Alcaraz, Carlos', tournament: 'Wimbledon', years: [2023], result: 'winner' },
  { player: 'Alcaraz, Carlos', tournament: 'US Open', years: [2022], result: 'winner' },
  { player: 'Alcaraz, Carlos', tournament: 'French Open', years: [2024], result: 'winner' },
  
  { player: 'Sinner, Jannik', tournament: 'Australian Open', years: [2024], result: 'winner' },
  { player: 'Sinner, Jannik', tournament: 'US Open', years: [2024], result: 'winner' },
  
  { player: 'Djokovic, Novak', tournament: 'Australian Open', years: [2008, 2011, 2012, 2013, 2015, 2016, 2019, 2020, 2021, 2023], result: 'winner' },
  { player: 'Djokovic, Novak', tournament: 'French Open', years: [2016, 2021, 2023], result: 'winner' },
  { player: 'Djokovic, Novak', tournament: 'Wimbledon', years: [2011, 2014, 2015, 2018, 2019, 2021, 2022], result: 'winner' },
  { player: 'Djokovic, Novak', tournament: 'US Open', years: [2011, 2015, 2018, 2023], result: 'winner' },
  
  { player: 'Zverev, Alexander', tournament: 'French Open', years: [2022], result: 'finalist' },
  { player: 'Zverev, Alexander', tournament: 'US Open', years: [2020], result: 'finalist' },
  
  { player: 'Medvedev, Daniil', tournament: 'US Open', years: [2021], result: 'winner' },
  { player: 'Medvedev, Daniil', tournament: 'Australian Open', years: [2021, 2022, 2024], result: 'finalist' },
  
  { player: 'Ruud, Casper', tournament: 'French Open', years: [2022, 2023], result: 'finalist' },
  { player: 'Ruud, Casper', tournament: 'US Open', years: [2022], result: 'finalist' },
  
  { player: 'Tsitsipas, Stefanos', tournament: 'French Open', years: [2021], result: 'finalist' },
  { player: 'Tsitsipas, Stefanos', tournament: 'Australian Open', years: [2023], result: 'finalist' },
  
  // Masters 1000 Titles (Major tournaments)
  { player: 'Alcaraz, Carlos', tournament: 'Indian Wells', years: [2022, 2023], result: 'winner' },
  { player: 'Alcaraz, Carlos', tournament: 'Miami Open', years: [2022], result: 'winner' },
  { player: 'Alcaraz, Carlos', tournament: 'Madrid Open', years: [2022, 2024], result: 'winner' },
  
  { player: 'Sinner, Jannik', tournament: 'Miami Open', years: [2024], result: 'winner' },
  { player: 'Sinner, Jannik', tournament: 'Cincinnati Masters', years: [2024], result: 'winner' },
  
  { player: 'Zverev, Alexander', tournament: 'Madrid Open', years: [2018, 2022], result: 'winner' },
  { player: 'Zverev, Alexander', tournament: 'Rome Masters', years: [2017], result: 'winner' },
  
  { player: 'Medvedev, Daniil', tournament: 'Cincinnati Masters', years: [2019], result: 'winner' },
  { player: 'Medvedev, Daniil', tournament: 'Shanghai Masters', years: [2019], result: 'winner' },
  { player: 'Medvedev, Daniil', tournament: 'Paris Masters', years: [2020], result: 'winner' },
  { player: 'Medvedev, Daniil', tournament: 'Toronto Masters', years: [2021], result: 'winner' },
  
  { player: 'Rublev, Andrey', tournament: 'Monte Carlo Masters', years: [2023], result: 'winner' },
  { player: 'Rublev, Andrey', tournament: 'Madrid Open', years: [2023], result: 'finalist' },
  
  { player: 'Fritz, Taylor', tournament: 'Indian Wells', years: [2022], result: 'finalist' },
  { player: 'Fritz, Taylor', tournament: 'US Open', years: [2024], result: 'finalist' },
  
  { player: 'Hurkacz, Hubert', tournament: 'Miami Open', years: [2021], result: 'winner' },
  { player: 'Hurkacz, Hubert', tournament: 'Shanghai Masters', years: [2023], result: 'winner' },
  
  // ATP Finals
  { player: 'Djokovic, Novak', tournament: 'ATP Finals', years: [2008, 2012, 2013, 2014, 2015, 2022, 2023], result: 'winner' },
  { player: 'Medvedev, Daniil', tournament: 'ATP Finals', years: [2020], result: 'winner' },
  { player: 'Zverev, Alexander', tournament: 'ATP Finals', years: [2018, 2021], result: 'winner' },
  { player: 'Tsitsipas, Stefanos', tournament: 'ATP Finals', years: [2019], result: 'winner' },
  
  // Olympic Medals
  { player: 'Djokovic, Novak', tournament: 'Olympics', years: [2024], result: 'gold_medal' },
  { player: 'Zverev, Alexander', tournament: 'Olympics', years: [2021], result: 'gold_medal' },
  { player: 'Medvedev, Daniil', tournament: 'Olympics', years: [2021], result: 'silver_medal' },
  
  // Davis Cup
  { player: 'Djokovic, Novak', tournament: 'Davis Cup', years: [2010], result: 'winner' },
  { player: 'Sinner, Jannik', tournament: 'Davis Cup', years: [2023], result: 'winner' },
  
  // ATP 500 Events (notable ones)
  { player: 'Alcaraz, Carlos', tournament: 'Barcelona Open', years: [2022, 2023], result: 'winner' },
  { player: 'Alcaraz, Carlos', tournament: 'Rio Open', years: [2022], result: 'winner' },
  
  { player: 'Sinner, Jannik', tournament: 'Vienna Open', years: [2023], result: 'winner' },
  { player: 'Sinner, Jannik', tournament: 'Toronto Masters', years: [2023], result: 'winner' },
  
  // Year-end #1 Rankings
  { player: 'Alcaraz, Carlos', tournament: 'Year-End #1', years: [2022], result: 'achievement' },
  { player: 'Djokovic, Novak', tournament: 'Year-End #1', years: [2011, 2012, 2014, 2015, 2018, 2020, 2021, 2023], result: 'achievement' },
  { player: 'Medvedev, Daniil', tournament: 'Year-End #1', years: [2021], result: 'achievement' },
];

// Additional tournaments to add
const ADDITIONAL_TOURNAMENTS = [
  // Masters 1000
  { sportradar_id: 'sr:tournament:indian_wells', name: 'BNP Paribas Open', short_name: 'Indian Wells', surface: 'hard', level: 'atp_masters_1000', category: 'ATP', location: 'Indian Wells', country: 'USA' },
  { sportradar_id: 'sr:tournament:miami_open', name: 'Miami Open presented by Itau', short_name: 'Miami Open', surface: 'hard', level: 'atp_masters_1000', category: 'ATP', location: 'Miami', country: 'USA' },
  { sportradar_id: 'sr:tournament:monte_carlo', name: 'Rolex Monte-Carlo Masters', short_name: 'Monte Carlo Masters', surface: 'clay', level: 'atp_masters_1000', category: 'ATP', location: 'Monte Carlo', country: 'MON' },
  { sportradar_id: 'sr:tournament:madrid_open', name: 'Mutua Madrid Open', short_name: 'Madrid Open', surface: 'clay', level: 'atp_masters_1000', category: 'ATP', location: 'Madrid', country: 'ESP' },
  { sportradar_id: 'sr:tournament:rome_masters', name: 'Italian Open', short_name: 'Rome Masters', surface: 'clay', level: 'atp_masters_1000', category: 'ATP', location: 'Rome', country: 'ITA' },
  { sportradar_id: 'sr:tournament:toronto_masters', name: 'National Bank Open', short_name: 'Toronto Masters', surface: 'hard', level: 'atp_masters_1000', category: 'ATP', location: 'Toronto', country: 'CAN' },
  { sportradar_id: 'sr:tournament:cincinnati', name: 'Cincinnati Masters', short_name: 'Cincinnati Masters', surface: 'hard', level: 'atp_masters_1000', category: 'ATP', location: 'Cincinnati', country: 'USA' },
  { sportradar_id: 'sr:tournament:shanghai', name: 'Shanghai Masters', short_name: 'Shanghai Masters', surface: 'hard', level: 'atp_masters_1000', category: 'ATP', location: 'Shanghai', country: 'CHN' },
  { sportradar_id: 'sr:tournament:paris_masters', name: 'Paris Masters', short_name: 'Paris Masters', surface: 'hard', level: 'atp_masters_1000', category: 'ATP', location: 'Paris', country: 'FRA' },
  
  // ATP Finals
  { sportradar_id: 'sr:tournament:atp_finals', name: 'Nitto ATP Finals', short_name: 'ATP Finals', surface: 'hard', level: 'atp_finals', category: 'ATP', location: 'Turin', country: 'ITA' },
  
  // Olympics
  { sportradar_id: 'sr:tournament:olympics', name: 'Olympic Games', short_name: 'Olympics', surface: 'hard', level: 'olympics', category: 'ITF', location: 'Various', country: 'INT' },
  
  // Davis Cup
  { sportradar_id: 'sr:tournament:davis_cup', name: 'Davis Cup', short_name: 'Davis Cup', surface: 'various', level: 'team_event', category: 'ITF', location: 'Various', country: 'INT' },
  
  // ATP 500
  { sportradar_id: 'sr:tournament:barcelona', name: 'Barcelona Open Banc Sabadell', short_name: 'Barcelona Open', surface: 'clay', level: 'atp_500', category: 'ATP', location: 'Barcelona', country: 'ESP' },
  { sportradar_id: 'sr:tournament:rio_open', name: 'Rio Open', short_name: 'Rio Open', surface: 'clay', level: 'atp_500', category: 'ATP', location: 'Rio de Janeiro', country: 'BRA' },
  { sportradar_id: 'sr:tournament:vienna', name: 'Erste Bank Open', short_name: 'Vienna Open', surface: 'hard', level: 'atp_500', category: 'ATP', location: 'Vienna', country: 'AUT' },
  
  // Special
  { sportradar_id: 'sr:tournament:year_end_1', name: 'Year-End No. 1 Ranking', short_name: 'Year-End #1', surface: 'various', level: 'achievement', category: 'ATP', location: 'Global', country: 'INT' },
];

export async function POST(request: NextRequest) {
  try {
    console.log('🏆 Expanding achievements database...');

    // Step 1: Add additional tournaments
    console.log('➕ Adding tournaments...');
    const { data: tournamentsData, error: tournamentsError } = await supabase
      .from('tournaments')
      .upsert(ADDITIONAL_TOURNAMENTS, { onConflict: 'short_name', ignoreDuplicates: true })
      .select('id, short_name');

    if (tournamentsError) {
      console.error('Error adding tournaments:', tournamentsError);
      return NextResponse.json({ error: 'Failed to add tournaments' }, { status: 500 });
    }

    console.log(`✅ Added ${tournamentsData.length} tournaments`);

    // Step 2: Add achievements
    console.log('🏅 Adding achievements...');
    let achievementsAdded = 0;
    let achievementsSkipped = 0;
    let errors = 0;

    for (const achievement of ACHIEVEMENT_DATA) {
      try {
        // Find player by name (handle variations in naming)
        const { data: player, error: playerError } = await supabase
          .from('players')
          .select('id, name')
          .or(`name.ilike.%${achievement.player}%`)
          .single();

        if (playerError || !player) {
          console.log(`⚠️  Player not found: ${achievement.player}`);
          achievementsSkipped++;
          continue;
        }

        // Find tournament
        const { data: tournament, error: tournamentError } = await supabase
          .from('tournaments')
          .select('id, short_name')
          .eq('short_name', achievement.tournament)
          .single();

        if (tournamentError || !tournament) {
          console.log(`⚠️  Tournament not found: ${achievement.tournament}`);
          achievementsSkipped++;
          continue;
        }

        // Add achievements for each year
        for (const year of achievement.years) {
          const { error: achievementError } = await supabase
            .from('player_achievements')
            .upsert({
              player_id: player.id,
              tournament_id: tournament.id,
              year: year,
              result: achievement.result,
              achievement_type: 'tournament_result'
            }, { 
              onConflict: 'player_id,tournament_id,year,achievement_type',
              ignoreDuplicates: true 
            });

          if (achievementError) {
            console.error(`Error adding achievement for ${player.name} - ${achievement.tournament} ${year}:`, achievementError.message);
            errors++;
          } else {
            achievementsAdded++;
            console.log(`✅ Added: ${player.name} - ${achievement.tournament} ${year} (${achievement.result})`);
          }
        }

      } catch (error) {
        console.error(`Error processing achievement for ${achievement.player}:`, error);
        errors++;
      }
    }

    console.log('✅ Achievement expansion completed!');

    return NextResponse.json({
      success: true,
      message: 'Achievements database expanded successfully',
      stats: {
        tournamentsAdded: tournamentsData.length,
        achievementsAdded: achievementsAdded,
        achievementsSkipped: achievementsSkipped,
        errors: errors
      }
    });

  } catch (error) {
    console.error('❌ Achievement expansion error:', error);
    return NextResponse.json({ 
      error: 'Expansion failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Get current achievement stats
  try {
    const [achievementsCount, tournamentsCount] = await Promise.all([
      supabase.from('player_achievements').select('id', { count: 'exact', head: true }),
      supabase.from('tournaments').select('id', { count: 'exact', head: true })
    ]);

    return NextResponse.json({
      achievements: achievementsCount.count,
      tournaments: tournamentsCount.count
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}