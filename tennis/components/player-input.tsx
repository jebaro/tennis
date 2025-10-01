// components/player-input.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlayerInputProps {
  onSubmit: (playerName: string) => void;
  onCancel: () => void;
  usedPlayers: Set<string>;
}

interface PlayerSuggestion {
  name: string;
  nationality: string | null;
  id: string;
}

export function PlayerInput({ onSubmit, onCancel, usedPlayers }: PlayerInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch player suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search-players?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (data.success) {
          // Filter out already used players
          const availablePlayers = data.players.filter(
            (player: PlayerSuggestion) => !usedPlayers.has(player.name.toLowerCase())
          );
          setSuggestions(availablePlayers);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, usedPlayers]);

  const handleSubmit = async (playerName: string) => {
    if (!playerName.trim()) return;

    // Check if player already used
    const normalizedName = playerName.toLowerCase().trim();
    if (usedPlayers.has(normalizedName)) {
      alert("⚠️ This player has already been used! Each player can only be used once.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(playerName.trim());
      setSearchTerm("");
      setSuggestions([]);
    } catch (error) {
      console.error("Error submitting player:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectSuggestion = (playerName: string) => {
    handleSubmit(playerName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }

    if (suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(searchTerm);
      }
      return;
    }

    // Navigate suggestions with arrow keys
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex].name);
      } else if (searchTerm.trim()) {
        handleSubmit(searchTerm);
      }
    }
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Search for a Player</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Start typing player name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                className="text-base"
                autoComplete="off"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="max-h-64 overflow-y-auto border rounded-lg divide-y"
              >
                {suggestions.map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectSuggestion(player.name)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors ${
                      index === selectedIndex 
                        ? 'bg-blue-100 dark:bg-blue-900' 
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="font-medium">{player.name}</div>
                    {player.nationality && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {player.nationality}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {searchTerm.length >= 2 && !isLoading && suggestions.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No players found matching "{searchTerm}"
                <div className="mt-2">
                  <Button 
                    onClick={() => handleSubmit(searchTerm)}
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    Try submitting anyway
                  </Button>
                </div>
              </div>
            )}

            {/* Help text */}
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
                <span>Navigate</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Enter</kbd>
                <span>Select</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Esc</kbd>
                <span>Cancel</span>
              </div>
              {usedPlayers.size > 0 && (
                <div className="mt-2">
                  {usedPlayers.size} player{usedPlayers.size > 1 ? 's' : ''} already used
                </div>
              )}
            </div>

            {/* Cancel Button */}
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}