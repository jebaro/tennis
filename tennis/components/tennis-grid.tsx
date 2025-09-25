// components/tennis-grid.tsx - DYNAMIC VERSION
"use client";

import { useState, useEffect } from "react";

interface TennisGridProps {
  isLoggedIn: boolean;
}

type Category = {
  id: string;
  type: string;
  label: string;
  description: string;
  value: string;
};

type DailyQuiz = {
  rows: Category[];
  columns: Category[];
};

type GridState = {
  [key: string]: {
    player: string;
    isCorrect: boolean | null;
  };
};

export function TennisGrid({ isLoggedIn }: TennisGridProps) {
  const [dailyQuiz, setDailyQuiz] = useState<DailyQuiz | null>(null);
  const [gridState, setGridState] = useState<GridState>({});
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [usedPlayers, setUsedPlayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's quiz on component mount
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
    setActiveCell(cellKey);
  };

  const handlePlayerSubmit = async (playerName: string) => {
    if (!activeCell || !dailyQuiz) return;

    const normalizedName = playerName.toLowerCase().trim();
    
    // Check if player already used
    if (usedPlayers.has(normalizedName)) {
      alert("Player already used! Each player can only be used once.");
      return;
    }

    // Get the row and column categories for this cell
    const [rowIndex, colIndex] = activeCell.split('-').map(Number);
    const rowCategory = dailyQuiz.rows[rowIndex];
    const colCategory = dailyQuiz.columns[colIndex];

    try {
      // Validate with database
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
        // Player is valid for this cell
        setGridState(prev => ({
          ...prev,
          [activeCell]: {
            player: result.player.name, // Use the exact name from database
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

        // Show why it's invalid
        alert(result.error || `${playerName} doesn't match the criteria for ${rowCategory.label} + ${colCategory.label}`);
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
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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

  // Handle game completion
  const handleGameComplete = () => {
    if (isLoggedIn) {
      // TODO: Save stats to database
      console.log("Game completed - saving stats for logged-in user");
    } else {
      // For anonymous users, just show completion message
      console.log("Game completed - anonymous user");
    }
  };

  // Get today's date for display
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Daily Quiz Header */}
      <div className="mb-6 text-center">
        <div className="text-sm text-muted-foreground mb-2">
          Daily Challenge for {today}
        </div>
        <div className="text-lg font-semibold">
          Progress: {completedCells}/9 cells completed
        </div>
        {isGameComplete && (
          <div className="text-center space-y-3 mt-4">
            <div className="text-green-600 font-bold text-xl">
              🎉 Daily Challenge Complete!
            </div>
            <div className="text-sm text-muted-foreground">
              Come back tomorrow for a new challenge!
            </div>
            {!isLoggedIn && (
              <div className="text-sm text-muted-foreground">
                <a href="/auth/sign-up" className="text-blue-600 hover:underline font-medium">
                  Sign up
                </a> to track your daily streaks and stats!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid Container */}
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
          usedPlayers={Array.from(usedPlayers)}
        />
      )}
    </div>
  );
}

// GridCell component (same as before)
function GridCell({ 
  rowCategory, 
  colCategory, 
  player, 
  isCorrect, 
  onClick, 
  isActive 
}: {
  rowCategory: string;
  colCategory: string;
  player: string;
  isCorrect: boolean | null;
  onClick: () => void;
  isActive: boolean;
}) {
  const getCellStyle = () => {
    if (isActive) {
      return "border-4 border-blue-500 bg-blue-50 dark:bg-blue-950";
    }
    
    if (isCorrect === true) {
      return "border-2 border-green-500 bg-green-50 dark:bg-green-950";
    }
    
    if (isCorrect === false) {
      return "border-2 border-red-500 bg-red-50 dark:bg-red-950";
    }
    
    return "border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800";
  };

  return (
    <div
      className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 hover:shadow-md ${getCellStyle()}`}
      onClick={onClick}
      title={`${rowCategory} + ${colCategory}`}
    >
      {player ? (
        <div className="text-center">
          <div className="font-semibold text-sm leading-tight">
            {player}
          </div>
          {isCorrect === true && (
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              ✓ Correct
            </div>
          )}
          {isCorrect === false && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              ✗ Invalid
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          <div className="text-2xl mb-1">+</div>
          <div className="text-xs">Click to add player</div>
        </div>
      )}
    </div>
  );
}

// Enhanced PlayerInput with better search
function PlayerInput({ onSubmit, onCancel, usedPlayers }: {
  onSubmit: (playerName: string) => void;
  onCancel: () => void;
  usedPlayers: string[];
}) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{id: string, name: string, nationality: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch suggestions from database
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length >= 2) {
        setLoading(true);
        try {
          const response = await fetch(`/api/validate-player?q=${encodeURIComponent(inputValue)}`);
          const data = await response.json();
          
          // Filter out already used players
          const availablePlayers = data.players?.filter((player: any) => 
            !usedPlayers.includes(player.name.toLowerCase())
          ) || [];
          
          setSuggestions(availablePlayers);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, usedPlayers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (playerName: string) => {
    setInputValue(playerName);
    setShowSuggestions(false);
    onSubmit(playerName);
    setInputValue("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Enter Player Name</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type player name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              autoFocus
            />
            
            {loading && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => handleSuggestionClick(player.name)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                  >
                    <span>{player.name}</span>
                    <span className="text-xs text-gray-500">{player.nationality}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
        
        {usedPlayers.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            <p>Used players: {usedPlayers.slice(0, 3).join(", ")}
              {usedPlayers.length > 3 && ` +${usedPlayers.length - 3} more`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}