// lib/hooks/useTennisGrid.ts
import { useState, useEffect, useCallback } from 'react';
import type { DailyQuiz, GridState, ValidationResult } from '@/lib/types';

interface UseTennisGridReturn {
  dailyQuiz: DailyQuiz | null;
  gridState: GridState;
  activeCell: string | null;
  usedPlayers: Set<string>;
  loading: boolean;
  error: string | null;
  completedCells: number;
  isGameComplete: boolean;
  selectCell: (rowIndex: number, colIndex: number) => void;
  submitPlayer: (playerName: string) => Promise<void>;
  cancelPlayerInput: () => void;
  retryFetch: () => void;
}

/**
 * Custom hook to manage tennis grid state and logic
 * Separates business logic from UI components
 */
export function useTennisGrid(): UseTennisGridReturn {
  const [dailyQuiz, setDailyQuiz] = useState<DailyQuiz | null>(null);
  const [gridState, setGridState] = useState<GridState>({});
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [usedPlayers, setUsedPlayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch daily quiz on mount
  useEffect(() => {
    fetchDailyQuiz();
  }, []);

  // Load saved progress from localStorage (for anonymous users)
  useEffect(() => {
    if (!dailyQuiz) return;

    const today = new Date().toISOString().split('T')[0];
    const savedKey = `tennis-grid-${today}`;
    const saved = localStorage.getItem(savedKey);

    if (saved) {
      try {
        const { gridState: savedGrid, usedPlayers: savedPlayers } = JSON.parse(saved);
        setGridState(savedGrid);
        setUsedPlayers(new Set(savedPlayers));
        console.log('✅ Restored saved progress from localStorage');
      } catch (err) {
        console.error('Failed to restore saved progress:', err);
      }
    }
  }, [dailyQuiz]);

  // Auto-save progress to localStorage
  useEffect(() => {
    if (!dailyQuiz || Object.keys(gridState).length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const savedKey = `tennis-grid-${today}`;
    
    const saveData = {
      gridState,
      usedPlayers: Array.from(usedPlayers),
      lastSaved: new Date().toISOString()
    };

    localStorage.setItem(savedKey, JSON.stringify(saveData));
  }, [gridState, usedPlayers, dailyQuiz]);

  const fetchDailyQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/daily-quiz');
      const data = await response.json();
      
      if (data.success) {
        setDailyQuiz(data.categories);
      } else {
        setError(data.error || 'Failed to load daily quiz');
      }
    } catch (err) {
      setError('Failed to load daily quiz. Please check your connection.');
      console.error('Error fetching daily quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCellKey = (rowIndex: number, colIndex: number) => `${rowIndex}-${colIndex}`;

  const selectCell = useCallback((rowIndex: number, colIndex: number) => {
    const cellKey = getCellKey(rowIndex, colIndex);
    
    // Don't allow selecting already correct cells
    if (gridState[cellKey]?.isCorrect === true) {
      return;
    }
    
    setActiveCell(cellKey);
  }, [gridState]);

  const submitPlayer = useCallback(async (playerName: string) => {
    if (!activeCell || !dailyQuiz) {
      console.warn('Cannot submit: no active cell or quiz data');
      return;
    }

    const normalizedName = playerName.toLowerCase().trim();
    
    // Check if player already used
    if (usedPlayers.has(normalizedName)) {
      throw new Error('Player already used! Each player can only be used once.');
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

      if (!response.ok) {
        throw new Error('Validation request failed');
      }

      const result: ValidationResult = await response.json();

      if (result.valid && result.player) {
        // Player is valid
        setGridState(prev => ({
          ...prev,
          [activeCell]: {
            player: result.player!.name,
            isCorrect: true
          }
        }));

        setUsedPlayers(prev => new Set([...prev, result.player!.name.toLowerCase()]));
        setActiveCell(null); // Close modal
      } else {
        // Player is invalid
        setGridState(prev => ({
          ...prev,
          [activeCell]: {
            player: playerName.trim(),
            isCorrect: false
          }
        }));

        throw new Error(
          result.error || 
          `${playerName} doesn't match the criteria for ${rowCategory.label} + ${colCategory.label}`
        );
      }
    } catch (error) {
      console.error('Validation error:', error);
      throw error; // Re-throw so component can handle it
    }
  }, [activeCell, dailyQuiz, usedPlayers]);

  const cancelPlayerInput = useCallback(() => {
    setActiveCell(null);
  }, []);

  const retryFetch = useCallback(() => {
    fetchDailyQuiz();
  }, []);

  // Calculate completion status
  const completedCells = Object.values(gridState).filter(cell => cell.isCorrect).length;
  const isGameComplete = completedCells === 9;

  // Clean up old localStorage entries (older than 7 days)
  useEffect(() => {
    const cleanupOldSaves = () => {
      const keys = Object.keys(localStorage);
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      keys.forEach(key => {
        if (key.startsWith('tennis-grid-')) {
          const dateStr = key.replace('tennis-grid-', '');
          const saveDate = new Date(dateStr);
          
          if (saveDate < sevenDaysAgo) {
            localStorage.removeItem(key);
            console.log(`Cleaned up old save: ${key}`);
          }
        }
      });
    };

    cleanupOldSaves();
  }, []);

  return {
    dailyQuiz,
    gridState,
    activeCell,
    usedPlayers,
    loading,
    error,
    completedCells,
    isGameComplete,
    selectCell,
    submitPlayer,
    cancelPlayerInput,
    retryFetch
  };
}