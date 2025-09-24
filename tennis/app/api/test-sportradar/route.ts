// app/api/test-sportradar/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY;
const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/tennis/trial/v3/en';

export async function GET(request: NextRequest) {
  if (!SPORTRADAR_API_KEY) {
    return NextResponse.json({ 
      success: false,
      error: 'SportRadar API key not found in environment variables',
      hint: 'Add SPORTRADAR_API_KEY to your .env.local file'
    });
  }

  try {
    console.log('Testing SportRadar API connection...');
    console.log('Using API Key:', SPORTRADAR_API_KEY?.substring(0, 8) + '...');
    console.log('Full URL:', `${SPORTRADAR_BASE_URL}/rankings.json?api_key=${SPORTRADAR_API_KEY}`);
    
    // Test with a simple rankings call (just first few results)
    const response = await fetch(
      `${SPORTRADAR_BASE_URL}/rankings.json?api_key=${SPORTRADAR_API_KEY}`
    );

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `API Error: ${response.status} ${response.statusText}`,
        details: errorText,
        debugInfo: {
          url: `${SPORTRADAR_BASE_URL}/rankings.json`,
          hasApiKey: !!SPORTRADAR_API_KEY,
          apiKeyLength: SPORTRADAR_API_KEY?.length
        }
      });
    }

    const responseText = await response.text();
    console.log('Raw response (first 200 chars):', responseText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON response',
        details: `Parse error: ${parseError}`,
        rawResponse: responseText.substring(0, 500)
      });
    }

    const rankings = data.rankings || [];
    
    return NextResponse.json({
      success: true,
      message: 'SportRadar API connection successful!',
      apiKeyStatus: 'Valid',
      sampleData: {
        totalRankings: rankings.length,
        topPlayers: rankings.slice(0, 5).map((r: any) => ({
          rank: r.rank,
          name: r.competitor?.name,
          country: r.competitor?.country_code
        }))
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}