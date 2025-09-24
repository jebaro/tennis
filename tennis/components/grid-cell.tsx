"use client";

import { cn } from "@/lib/utils";

interface GridCellProps {
  rowCategory: string;
  colCategory: string;
  player: string;
  isCorrect: boolean | null;
  onClick: () => void;
  isActive: boolean;
}

export function GridCell({ 
  rowCategory, 
  colCategory, 
  player, 
  isCorrect, 
  onClick, 
  isActive 
}: GridCellProps) {
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
      className={cn(
        "aspect-square rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 hover:shadow-md",
        getCellStyle()
      )}
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