// app/api/populate-from-sportradar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY;
const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/tennis/trial/v3/en';

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  if (!SPORTRADAR_API_KEY) {
    return NextResponse.json({ 
      error: 'SportRadar API key not configured. Add SPORTRADAR_API_KEY to your .env.local' 
    }, { status: 400 });
  }

  try {
    console.log('🎾 Fetching tennis data from SportRadar...');
    
    let totalPlayers = 0;
    let newPlayers = 0;
    let errors = 0;

    // Test API connection first
    console.log('📊 Fetching ATP rankings...');
    const atpResponse = await fetch(
      `${SPORTRADAR_BASE_URL}/rankings.json?api_key=${SPORTRADAR_API_KEY}`
    );

    console.log(`API Response Status: ${atpResponse.status}`);
    
    if (!atpResponse.ok) {
      const errorText = await atpResponse.text();
      console.error('ATP Rankings API error:', atpResponse.status, errorText);
      return NextResponse.json({ 
        error: `SportRadar API Error: ${atpResponse.status}`,
        details: errorText,
        hint: 'Check your API key and make sure it has tennis access'
      }, { status: 400 });
    }

    const responseText = await atpResponse.text();
    console.log('Raw API Response (first 200 chars):', responseText.substring(0, 200));

    let atpData;
    try {
      atpData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON response from SportRadar API',
        details: 'The API response is not valid JSON',
        rawResponse: responseText.substring(0, 500)
      }, { status: 500 });
    }

    const rankings = atpData.rankings || [];
    console.log(`Found ${rankings.length} ranking categories`);

    if (rankings.length === 0) {
      return NextResponse.json({
        error: 'No rankings found in response',
        details: 'The API returned no ranking categories',
        apiResponse: atpData
      }, { status: 400 });
    }

    // Find ATP men's rankings
    const atpRanking = rankings.find((r: any) => 
      r.name === 'ATP' && r.gender === 'men'
    );

    if (!atpRanking || !atpRanking.competitor_rankings) {
      return NextResponse.json({
        error: 'No ATP men\'s rankings found',
        details: 'Could not find ATP men\'s competitor rankings',
        availableRankings: rankings.map((r: any) => ({ name: r.name, gender: r.gender }))
      }, { status: 400 });
    }

    const competitorRankings = atpRanking.competitor_rankings;
    console.log(`Found ${competitorRankings.length} ATP players`);

    // Process players (limit to top 50 for now to avoid rate limits)
    const playersToProcess = Math.min(competitorRankings.length, 50);
    console.log(`Processing top ${playersToProcess} players...`);

    for (let i = 0; i < playersToProcess; i++) {
      const ranking = competitorRankings[i];
      const player = ranking.competitor;
      
      if (!player || !player.id || !player.name) {
        console.log(`Skipping invalid player at rank ${ranking.rank}`);
        continue;
      }

      try {
        // Convert SportRadar data to our format
        const playerData = {
          sportradar_id: player.id,
          name: player.name,
          first_name: player.first_name || null,
          last_name: player.last_name || null,
          nationality: player.country_code || player.country || null,
          birth_date: player.date_of_birth ? 
            new Date(player.date_of_birth).toISOString().split('T')[0] : null,
          height_cm: player.height || null,
          weight_kg: player.weight || null,
          plays_hand: player.handedness?.toLowerCase() || null,
          backhand: player.backhand?.toLowerCase()?.replace(' ', '_') || null,
          turned_pro: player.pro_year || null,
          retired: player.retired ? new Date().getFullYear() : null,
        };

        console.log(`Processing player: ${player.name} (Rank #${ranking.rank})`);

        // Insert or update player
        const { data, error } = await supabase
          .from('players')
          .upsert(playerData, { 
            onConflict: 'sportradar_id',
            ignoreDuplicates: false 
          })
          .select('id')
          .single();

        if (error) {
          console.error(`Error upserting ${player.name}:`, error.message);
          errors++;
        } else {
          // Insert current ranking
          const { error: rankingError } = await supabase
            .from('player_rankings')
            .upsert({
              player_id: data.id,
              ranking_date: new Date().toISOString().split('T')[0],
              singles_ranking: ranking.rank,
              ranking_points: ranking.points || null,
            }, { 
              onConflict: 'player_id,ranking_date',
              ignoreDuplicates: false 
            });

          if (rankingError) {
            console.error(`Error inserting ranking for ${player.name}:`, rankingError.message);
          }

          newPlayers++;
          console.log(`✅ Added: ${player.name} (#${ranking.rank})`);
        }

        totalPlayers++;
        
        // Rate limiting - wait 1 second between requests for free tier
        if (i < playersToProcess - 1) {
          await delay(1000);
        }
        
      } catch (playerError) {
        console.error(`Error processing player ${player.name}:`, playerError);
        errors++;
      }
    }

    // Add essential tournaments
    console.log('🏆 Adding tournaments...');
    const tournaments = [
      {
        sportradar_id: 'sr:tournament:wimbledon',
        name: 'The Championships, Wimbledon',
        short_name: 'Wimbledon',
        surface: 'grass',
        level: 'grand_slam',
        category: 'ATP',
        location: 'London',
        country: 'GBR'
      },
      {
        sportradar_id: 'sr:tournament:french_open',
        name: 'French Open',
        short_name: 'French Open',
        surface: 'clay',
        level: 'grand_slam',
        category: 'ATP',
        location: 'Paris',
        country: 'FRA'
      },
      {
        sportradar_id: 'sr:tournament:us_open',
        name: 'US Open',
        short_name: 'US Open',
        surface: 'hard',
        level: 'grand_slam',
        category: 'ATP',
        location: 'New York',
        country: 'USA'
      },
      {
        sportradar_id: 'sr:tournament:australian_open',
        name: 'Australian Open',
        short_name: 'Australian Open',
        surface: 'hard',
        level: 'grand_slam',
        category: 'ATP',
        location: 'Melbourne',
        country: 'AUS'
      }
    ];

    const { error: tournamentsError } = await supabase
      .from('tournaments')
      .upsert(tournaments, { onConflict: 'sportradar_id', ignoreDuplicates: true });

    if (tournamentsError) {
      console.error('Error adding tournaments:', tournamentsError);
    } else {
      console.log('✅ Added tournaments');
    }

    console.log('✅ SportRadar integration completed!');

    return NextResponse.json({
      success: true,
      message: 'Database populated from SportRadar API',
      stats: {
        totalProcessed: totalPlayers,
        newPlayers: newPlayers,
        errors: errors,
        tournamentsAdded: 4
      }
    });

  } catch (error) {
    console.error('❌ SportRadar integration error:', error);
    return NextResponse.json({ 
      error: 'Integration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'SportRadar integration endpoint. Use POST to populate database.',
    endpoints: {
      POST: 'Populate database from SportRadar API',
      GET: 'This help message'
    }
  });
}