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
      const response = await fetch('/api/populate-db', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ Success! Added ${result.playersCount} players and ${result.tournamentsCount} tournaments`);
        await fetchStats(); // Refresh stats
      } else {
        setMessage(`❌ Error: ${result.error}`);
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
                  onClick={populateDatabase}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Populating...' : 'Populate Database with Sample Data'}
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  This will add ~15 famous tennis players, 5 tournaments, and their Grand Slam achievements to get started.
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