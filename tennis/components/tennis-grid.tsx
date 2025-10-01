// components/tennis-grid.tsx - REFACTORED VERSION
"use client";

import { useState, useEffect } from "react";
import { GridCell } from "./grid-cell";
import { PlayerInput } from "./player-input";
import type { DailyQuiz, GridState, TennisGridProps } from "@/lib/types";

export function TennisGrid({ isLoggedIn }: TennisGridProps) {
  const [dailyQuiz, setDailyQuiz] = useState<DailyQuiz | null>(null);
  const [gridState, setGridState] = useState<GridState>({});
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [usedPlayers, setUsedPlayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDailyQuiz();
  }, []);

  const fetchDailyQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/daily-quiz');
      const data = await response.json();
      
      if (data.success) {
        setDailyQuiz(data.categories);
        setError(null);
      } else {
        setError('Failed to load daily quiz');
      }
    } catch (err) {
      setError('Failed to load daily quiz');
      console.error('Error fetching daily quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCellKey = (rowIndex: number, colIndex: number) => `${rowIndex}-${colIndex}`;

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const cellKey = getCellKey(rowIndex, colIndex);
    
    // Don't allow clicking on already correct cells
    if (gridState[cellKey]?.isCorrect === true) {
      return;
    }
    
    setActiveCell(cellKey);
  };

  const handlePlayerSubmit = async (playerName: string) => {
    if (!activeCell || !dailyQuiz) return;

    const normalizedName = playerName.toLowerCase().trim();
    
    // Double-check if player already used (PlayerInput also checks this)
    if (usedPlayers.has(normalizedName)) {
      return;
    }

    const [rowIndex, colIndex] = activeCell.split('-').map(Number);
    const rowCategory = dailyQuiz.rows[rowIndex];
    const colCategory = dailyQuiz.columns[colIndex];

    try {
      const response = await fetch('/api/validate-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim(),
          rowCategory,
          colCategory
        })
      });

      const result = await response.json();

      if (result.valid) {
        // Player is valid
        setGridState(prev => ({
          ...prev,
          [activeCell]: {
            player: result.player.name,
            isCorrect: true
          }
        }));

        setUsedPlayers(prev => new Set([...prev, result.player.name.toLowerCase()]));
      } else {
        // Player is invalid
        setGridState(prev => ({
          ...prev,
          [activeCell]: {
            player: playerName.trim(),
            isCorrect: false
          }
        }));

        alert(result.error || `${playerName} doesn't match the criteria`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Error validating player. Please try again.');
    }

    setActiveCell(null);
  };

  const handlePlayerCancel = () => {
    setActiveCell(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading today's quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dailyQuiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">⚠️ {error}</p>
            <button 
              onClick={fetchDailyQuiz}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completedCells = Object.values(gridState).filter(cell => cell.isCorrect).length;
  const isGameComplete = completedCells === 9;

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="text-sm text-muted-foreground mb-2">
          Daily Challenge for {today}
        </div>
        <div className="text-lg font-semibold">
          Progress: {completedCells}/9 cells completed
        </div>
        {isGameComplete && (
          <div className="text-center space-y-3 mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-green-600 dark:text-green-400 font-bold text-xl">
              🎉 Daily Challenge Complete!
            </div>
            <div className="text-sm text-muted-foreground">
              Come back tomorrow for a new challenge!
            </div>
            {!isLoggedIn && (
              <div className="text-sm">
                <a 
                  href="/auth/sign-up" 
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                >
                  Sign up
                </a>
                {' '}to track your daily streaks and stats!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {/* Empty top-left corner */}
        <div className="aspect-square"></div>
        
        {/* Column headers */}
        {dailyQuiz.columns.map((category, index) => (
          <div
            key={`col-${index}`}
            className="aspect-square bg-blue-100 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700 rounded-lg flex flex-col items-center justify-center p-2 text-center"
          >
            <div className="font-semibold text-sm">{category.label}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {category.description}
            </div>
          </div>
        ))}

        {/* Grid rows */}
        {dailyQuiz.rows.map((rowCategory, rowIndex) => (
          <div key={`row-${rowIndex}`} className="contents">
            {/* Row header */}
            <div className="aspect-square bg-green-100 dark:bg-green-900 border-2 border-green-300 dark:border-green-700 rounded-lg flex flex-col items-center justify-center p-2 text-center">
              <div className="font-semibold text-sm">{rowCategory.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {rowCategory.description}
              </div>
            </div>
            
            {/* Grid cells */}
            {dailyQuiz.columns.map((colCategory, colIndex) => {
              const cellKey = getCellKey(rowIndex, colIndex);
              const cellData = gridState[cellKey];
              
              return (
                <GridCell
                  key={cellKey}
                  rowCategory={rowCategory.label}
                  colCategory={colCategory.label}
                  player={cellData?.player || ""}
                  isCorrect={cellData?.isCorrect || null}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  isActive={activeCell === cellKey}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Player Input Modal */}
      {activeCell && (
        <PlayerInput
          onSubmit={handlePlayerSubmit}
          onCancel={handlePlayerCancel}
          usedPlayers={usedPlayers}
        />
      )}
    </div>
  );
}