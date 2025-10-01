// lib/types/index.ts

/**
 * Database Types
 */
export interface Player {
  id: string;
  name: string;
  nationality: string | null;
  turned_pro: number | null;
  retired: number | null;
  plays_hand: 'left' | 'right' | null;
  sportradar_id: string | null;
  created_at: string;
}

export interface Tournament {
  id: string;
  sportradar_id: string | null;
  name: string;
  short_name: string;
  surface: 'hard' | 'clay' | 'grass' | null;
  level: string | null;
  category: string | null;
  location: string | null;
  country: string | null;
  created_at: string;
}

export interface PlayerAchievement {
  id: string;
  player_id: string;
  tournament_id: string;
  year: number;
  result: string;
  achievement_type: string | null;
  created_at: string;
}

export interface PlayerRanking {
  id: string;
  player_id: string;
  ranking_date: string;
  singles_ranking: number | null;
  doubles_ranking: number | null;
  created_at: string;
}

export interface UserGameSession {
  id: string;
  user_id: string | null;
  grid_id: string | null;
  started_at: string;
  completed_at: string | null;
  grid_state: Record<string, any> | null;
  score: number | null;
  attempts: number;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_games_played: number;
  total_games_completed: number;
  current_streak: number;
  best_streak: number;
  total_correct_answers: number;
  total_attempts: number;
  average_completion_time: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Game Types
 */
export interface Category {
  id: string;
  type: 'country' | 'tournament' | 'era' | 'style' | 'ranking' | 'achievement';
  label: string;
  description: string;
  value: string;
}

export interface DailyQuiz {
  rows: Category[];
  columns: Category[];
}

export interface GridCellState {
  player: string;
  isCorrect: boolean | null;
}

export interface GridState {
  [cellKey: string]: GridCellState;
}

/**
 * API Response Types
 */
export interface ValidationResult {
  valid: boolean;
  player?: {
    id: string;
    name: string;
    nationality: string | null;
  };
  error?: string;
  debug?: {
    rowMatch: boolean;
    colMatch: boolean;
    rowCategory: Category;
    colCategory: Category;
  };
}

export interface DailyQuizResponse {
  success: boolean;
  date: string;
  categories: DailyQuiz;
  seed: number;
  debug?: any;
  message?: string;
  error?: string;
}

/**
 * Component Props Types
 */
export interface TennisGridProps {
  isLoggedIn: boolean;
}

export interface GridCellProps {
  rowCategory: string;
  colCategory: string;
  player: string;
  isCorrect: boolean | null;
  onClick: () => void;
  isActive: boolean;
}

export interface PlayerInputProps {
  onSubmit: (playerName: string) => void;
  onCancel: () => void;
  usedPlayers: Set<string>;
}

export interface PlayerSuggestion {
  id: string;
  name: string;
  nationality: string | null;
}

export interface PlayerSearchResponse {
  success: boolean;
  players: PlayerSuggestion[];
  query: string;
}