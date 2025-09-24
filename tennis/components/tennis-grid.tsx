"use client";

import { useState } from "react";

// You'll need to create these components too, or use relative imports
// import { GridCell } from "./grid-cell";
// import { PlayerInput } from "./player-input";

// For now, let's include simplified versions inline until you create the separate files

interface TennisGridProps {
  isLoggedIn: boolean;
}

// Sample categories for MVP - we'll make this dynamic later
const SAMPLE_CATEGORIES = {
  rows: [
    { id: "grand_slam_winner", label: "Grand Slam Winner", description: "Won at least one Grand Slam" },
    { id: "top_10", label: "Former World #1-10", description: "Reached top 10 in ATP/WTA rankings" },
    { id: "2000s", label: "Active in 2000s", description: "Played professionally in the 2000s" }
  ],
  columns: [
    { id: "usa", label: "USA", description: "American tennis player" },
    { id: "clay_specialist", label: "Clay Court Specialist", description: "Known for clay court success" },
    { id: "serve_volley", label: "Serve & Volley", description: "Known for serve and volley style" }
  ]
};

type GridState = {
  [key: string]: {
    player: string;
    isCorrect: boolean | null;
  };
};

export function TennisGrid({ isLoggedIn }: TennisGridProps) {
  const [gridState, setGridState] = useState<GridState>({});
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [usedPlayers, setUsedPlayers] = useState<Set<string>>(new Set());

  const getCellKey = (rowIndex: number, colIndex: number) => `${rowIndex}-${colIndex}`;

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const cellKey = getCellKey(rowIndex, colIndex);
    setActiveCell(cellKey);
  };

  const handlePlayerSubmit = (playerName: string) => {
    if (!activeCell) return;

    const normalizedName = playerName.toLowerCase().trim();
    
    // Check if player already used
    if (usedPlayers.has(normalizedName)) {
      alert("Player already used! Each player can only be used once.");
      return;
    }

    // For MVP, we'll accept any non-empty player name as correct
    // Later we'll add validation against database
    const isValid = playerName.trim().length > 0;

    setGridState(prev => ({
      ...prev,
      [activeCell]: {
        player: playerName.trim(),
        isCorrect: isValid
      }
    }));

    if (isValid) {
      setUsedPlayers(prev => new Set([...prev, normalizedName]));
    }

    setActiveCell(null);
  };

  const handlePlayerCancel = () => {
    setActiveCell(null);
  };

  const completedCells = Object.values(gridState).filter(cell => cell.isCorrect).length;
  const isGameComplete = completedCells === 9;

  // Handle game completion differently for logged-in vs anonymous users
  const handleGameComplete = () => {
    if (isLoggedIn) {
      // TODO: Save stats to database
      console.log("Game completed - saving stats for logged-in user");
    } else {
      // For anonymous users, just show completion message
      console.log("Game completed - anonymous user");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Game Status */}
      <div className="mb-6 text-center">
        <div className="text-lg font-semibold">
          Progress: {completedCells}/9 cells completed
        </div>
        {isGameComplete && (
          <div className="text-center space-y-3">
            <div className="text-green-600 font-bold text-xl">
              🎉 Congratulations! Grid completed!
            </div>
            {!isLoggedIn && (
              <div className="text-sm text-muted-foreground">
                <a href="/auth/sign-up" className="text-blue-600 hover:underline font-medium">
                  Sign up
                </a> to save your progress and track your stats!
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
        {SAMPLE_CATEGORIES.columns.map((category, index) => (
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
        {SAMPLE_CATEGORIES.rows.map((rowCategory, rowIndex) => (
          <div key={`row-${rowIndex}`} className="contents">
            {/* Row header */}
            <div className="aspect-square bg-green-100 dark:bg-green-900 border-2 border-green-300 dark:border-green-700 rounded-lg flex flex-col items-center justify-center p-2 text-center">
              <div className="font-semibold text-sm">{rowCategory.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {rowCategory.description}
              </div>
            </div>
            
            {/* Grid cells */}
            {SAMPLE_CATEGORIES.columns.map((colCategory, colIndex) => {
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

// Inline GridCell component for now
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

// Inline PlayerInput component for now  
function PlayerInput({ onSubmit, onCancel, usedPlayers }: {
  onSubmit: (playerName: string) => void;
  onCancel: () => void;
  usedPlayers: string[];
}) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Enter Tennis Player</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Type player name..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            autoFocus
          />

          <div className="flex gap-2">
            <button 
              type="submit" 
              disabled={!inputValue.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              Submit
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}