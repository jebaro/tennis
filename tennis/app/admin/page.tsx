// app/admin/page.tsx - SIMPLIFIED VERSION
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

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

  const superPopulate = async () => {
    setLoading(true);
    setMessage('🚀 Starting comprehensive database population...\n\nThis will take 5-10 minutes and will:\n• Add 500+ players from SportRadar\n• Add 25+ tournaments\n• Add comprehensive achievements\n• Replace ALL existing data\n\nPlease wait...');
    
    try {
      const response = await fetch('/api/super-populate', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setMessage(`🎉 SUPER POPULATE COMPLETE!
        
✅ ${result.stats.playersAdded} players added
🏆 ${result.stats.tournamentsAdded} tournaments added  
🏅 ${result.stats.achievementsAdded} achievements added
❌ ${result.stats.errors} errors

${result.summary}

🎮 Your database is now ready for daily tennis grids!`);
        await fetchStats();
      } else {
        setMessage(`❌ Error: ${result.error}\n${result.details || ''}`);
      }
    } catch (error) {
      setMessage(`❌ Connection Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('⚠️ This will DELETE ALL DATA. Are you sure?')) {
      return;
    }

    setLoading(true);
    setMessage('🗑️ Clearing all database tables...');
    
    try {
      // Call a server-side API route to clear data (since we need service role key)
      const response = await fetch('/api/clear-database', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setMessage('✅ Database cleared successfully. Ready for fresh population.');
      } else {
        setMessage(`❌ Clear Error: ${result.error}`);
      }
      
      await fetchStats();
    } catch (error) {
      setMessage(`❌ Clear Error: ${error}`);
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
        <h1 className="text-3xl font-bold mb-8">🎾 TennisGrids Admin</h1>
        
        {/* Database Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>📊 Database Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{stats.players}</div>
                  <div className="text-sm text-muted-foreground">Players</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{stats.tournaments}</div>
                  <div className="text-sm text-muted-foreground">Tournaments</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">{stats.achievements}</div>
                  <div className="text-sm text-muted-foreground">Achievements</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">Loading stats...</div>
            )}
            
            <Button 
              onClick={fetchStats}
              variant="outline"
              size="sm"
              className="w-full mt-4"
            >
              🔄 Refresh Stats
            </Button>
          </CardContent>
        </Card>

        {/* Main Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🎮 Database Population</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <Button 
              onClick={superPopulate}
              disabled={loading}
              size="lg"
              className="w-full h-16 text-lg"
            >
              {loading ? '⏳ Populating Database...' : '🚀 SUPER POPULATE (500+ Players)'}
            </Button>
            
            <div className="text-sm text-muted-foreground bg-muted/50 rounded p-4">
              <p className="font-medium mb-2">🎯 This ONE button will:</p>
              <ul className="space-y-1 text-xs">
                <li>✅ Fetch 500+ players from SportRadar API</li>
                <li>✅ Add 25+ major tournaments (Grand Slams, Masters, etc.)</li>
                <li>✅ Add comprehensive historical achievements</li>
                <li>✅ Add current rankings and detailed player profiles</li>
                <li>✅ Replace your current 62 players with production-ready data</li>
              </ul>
              <p className="text-orange-600 dark:text-orange-400 text-xs mt-2">
                ⚠️ Takes 5-10 minutes. Requires SportRadar API key.
              </p>
            </div>

            <Button 
              onClick={clearDatabase}
              disabled={loading}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              {loading ? 'Clearing...' : '🗑️ Clear All Data (Start Over)'}
            </Button>
            
          </CardContent>
        </Card>

        {/* Status Messages */}
        {message && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <pre className="text-sm whitespace-pre-wrap">{message}</pre>
            </CardContent>
          </Card>
        )}

        {/* Game Ready Status */}
        <Card>
          <CardHeader>
            <CardTitle>🎲 Game Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Minimum Players (200+):</span>
                <span className={stats && stats.players >= 200 ? "text-green-600 font-bold" : "text-red-600"}>
                  {stats && stats.players >= 200 ? "✅ Ready" : `❌ Need ${200 - (stats?.players || 0)} more`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tournaments (20+):</span>
                <span className={stats && stats.tournaments >= 20 ? "text-green-600 font-bold" : "text-red-600"}>
                  {stats && stats.tournaments >= 20 ? "✅ Ready" : `❌ Need ${20 - (stats?.tournaments || 0)} more`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Achievements (100+):</span>
                <span className={stats && stats.achievements >= 100 ? "text-green-600 font-bold" : "text-red-600"}>
                  {stats && stats.achievements >= 100 ? "✅ Ready" : `❌ Need ${100 - (stats?.achievements || 0)} more`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Overall Game Status:</span>
                <span className={stats && stats.players >= 200 && stats.tournaments >= 20 && stats.achievements >= 100 ? "text-green-600 font-bold" : "text-yellow-600"}>
                  {stats && stats.players >= 200 && stats.tournaments >= 20 && stats.achievements >= 100 ? "🎮 READY FOR DAILY GRIDS!" : "⏳ Needs Super Populate"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}