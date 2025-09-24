// app/admin/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DatabaseStats {
  players: number;
  tournaments: number;
  achievements: number;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [message, setMessage] = useState('');

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/populate-db');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const populateDatabase = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/populate-from-sportradar', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ SportRadar Integration Complete! 
        📊 Total processed: ${result.stats.totalProcessed}
        ➕ New players added: ${result.stats.newPlayers}
        🏆 Tournaments added: ${result.stats.tournamentsAdded}
        ❌ Errors: ${result.stats.errors}`);
        await fetchStats(); // Refresh stats
      } else {
        setMessage(`❌ Error: ${result.error}
        ${result.details ? `Details: ${result.details}` : ''}
        ${result.hint ? `Hint: ${result.hint}` : ''}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on component mount
  useState(() => {
    fetchStats();
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">TennisGrids Admin</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Database Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Database Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Players:</span>
                    <span className="font-bold">{stats.players}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tournaments:</span>
                    <span className="font-bold">{stats.tournaments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Achievements:</span>
                    <span className="font-bold">{stats.achievements}</span>
                  </div>
                </div>
              ) : (
                <p>Loading stats...</p>
              )}
              
              <Button 
                onClick={fetchStats} 
                variant="outline" 
                className="mt-4 w-full"
              >
                Refresh Stats
              </Button>
            </CardContent>
          </Card>

          {/* Database Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={async () => {
                    setMessage('Testing API connection...');
                    try {
                      const response = await fetch('/api/test-sportradar');
                      const result = await response.json();
                      
                      if (result.success) {
                        setMessage(`✅ API Test Successful! 
                        Found ${result.sampleData.totalRankings} ranked players.
                        Top 5: ${result.sampleData.topPlayers.map((p: any) => `${p.name} (${p.country})`).join(', ')}`);
                      } else {
                        setMessage(`❌ API Test Failed: ${result.error}`);
                      }
                    } catch (error) {
                      setMessage(`❌ Test Error: ${error}`);
                    }
                  }}
                  variant="outline"
                  className="w-full mb-2"
                >
                  🧪 Test SportRadar API Connection
                </Button>

                <Button 
                  onClick={async () => {
                    setMessage('Debugging API response structure...');
                    try {
                      const response = await fetch('/api/debug-sportradar');
                      const result = await response.json();
                      
                      if (result.success) {
                        setMessage(`🔍 API Debug Results:
                        Response Keys: ${result.debug.responseKeys.join(', ')}
                        Has Rankings: ${result.debug.hasRankings}
                        Rankings Length: ${result.debug.rankingsLength}
                        First Player: ${result.debug.sampleRanking?.competitor?.name || 'None'}
                        
                        Full Structure: ${JSON.stringify(result.debug.fullStructure, null, 2).substring(0, 500)}...`);
                      } else {
                        setMessage(`❌ Debug Failed: ${result.error}`);
                      }
                    } catch (error) {
                      setMessage(`❌ Debug Error: ${error}`);
                    }
                  }}
                  variant="secondary"
                  className="w-full mb-2"
                >
                  🔍 Debug API Response Structure
                </Button>

                <Button 
                  onClick={populateDatabase}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Fetching from SportRadar...' : '🎾 Populate from SportRadar API'}
                </Button>
                
                <Button 
                  onClick={async () => {
                    setLoading(true);
                    setMessage('Adding achievements...');
                    try {
                      const response = await fetch('/api/expand-achievements', { method: 'POST' });
                      const result = await response.json();
                      
                      if (result.success) {
                        setMessage(`✅ Achievements Added! 
                        🏆 Tournaments added: ${result.stats.tournamentsAdded}
                        🏅 Achievements added: ${result.stats.achievementsAdded}
                        ⚠️ Skipped: ${result.stats.achievementsSkipped}
                        ❌ Errors: ${result.stats.errors}`);
                        await fetchStats();
                      } else {
                        setMessage(`❌ Error: ${result.error}`);
                      }
                    } catch (error) {
                      setMessage(`❌ Error: ${error}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  variant="secondary" 
                  className="w-full"
                >
                  {loading ? 'Adding Achievements...' : '🏅 Add Player Achievements'}
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  This will fetch ~200 top ATP players with current rankings, detailed profiles, and achievements from SportRadar's professional tennis database.
                </p>
                
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  ⚠️ This makes ~250 API calls and may take 2-3 minutes due to rate limiting.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Messages */}
        {message && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p className="text-sm">{message}</p>
            </CardContent>
          </Card>
        )}

        {/* Future Features */}
        <Card>
          <CardHeader>
            <CardTitle>Future Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>🔜 SportRadar API integration for live data</p>
              <p>🔜 Automatic daily grid generation</p>
              <p>🔜 Player search and management</p>
              <p>🔜 Category management interface</p>
              <p>🔜 User analytics and stats</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}