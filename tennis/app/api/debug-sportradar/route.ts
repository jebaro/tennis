// app/api/debug-sportradar/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY;
const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/tennis/trial/v3/en';

export async function GET(request: NextRequest) {
  if (!SPORTRADAR_API_KEY) {
    return NextResponse.json({ 
      error: 'SportRadar API key not configured' 
    }, { status: 400 });
  }

  try {
    console.log('🔍 Debugging SportRadar API response structure...');
    
    const response = await fetch(
      `${SPORTRADAR_BASE_URL}/rankings.json?api_key=${SPORTRADAR_API_KEY}`
    );

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: `API Error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json({
        error: 'Invalid JSON response',
        rawResponse: responseText.substring(0, 1000)
      });
    }

    // Debug the actual structure
    return NextResponse.json({
      success: true,
      debug: {
        responseKeys: Object.keys(data),
        hasRankings: !!data.rankings,
        rankingsType: typeof data.rankings,
        rankingsLength: Array.isArray(data.rankings) ? data.rankings.length : 'not an array',
        firstRankingKeys: data.rankings?.[0] ? Object.keys(data.rankings[0]) : 'no first ranking',
        firstCompetitorKeys: data.rankings?.[0]?.competitor ? Object.keys(data.rankings[0].competitor) : 'no competitor',
        sampleRanking: data.rankings?.[0] || null,
        fullStructure: data
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}