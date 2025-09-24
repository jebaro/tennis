"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlayerInputProps {
  onSubmit: (playerName: string) => void;
  onCancel: () => void;
  usedPlayers: string[];
}

// Sample tennis players for autocomplete - we'll make this dynamic later
const SAMPLE_PLAYERS = [
  "Roger Federer", "Rafael Nadal", "Novak Djokovic", "Andy Murray",
  "Serena Williams", "Venus Williams", "Maria Sharapova", "Simona Halep",
  "Pete Sampras", "Andre Agassi", "Stefan Edberg", "John McEnroe",
  "Steffi Graf", "Martina Navratilova", "Chris Evert", "Monica Seles",
  "Carlos Alcaraz", "Jannik Sinner", "Daniil Medvedev", "Alexander Zverev",
  "Iga Swiatek", "Aryna Sabalenka", "Coco Gauff", "Jessica Pegula"
];

export function PlayerInput({ onSubmit, onCancel, usedPlayers }: PlayerInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (inputValue.length >= 2) {
      const filtered = SAMPLE_PLAYERS.filter(player =>
        player.toLowerCase().includes(inputValue.toLowerCase()) &&
        !usedPlayers.includes(player.toLowerCase())
      ).slice(0, 8); // Limit to 8 suggestions
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, usedPlayers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue("");
    }
  };

  const handleSuggestionClick = (player: string) => {
    onSubmit(player);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enter Tennis Player</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Type player name..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full"
              />
              
              {/* Autocomplete suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto z-10 shadow-lg">
                  {suggestions.map((player, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                      onClick={() => handleSuggestionClick(player)}
                    >
                      {player}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Show used players warning */}
            {usedPlayers.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <div className="font-semibold mb-1">Already used:</div>
                <div className="flex flex-wrap gap-1">
                  {usedPlayers.slice(-5).map((player, index) => (
                    <span key={index} className="bg-muted px-2 py-1 rounded text-xs">
                      {player}
                    </span>
                  ))}
                  {usedPlayers.length > 5 && (
                    <span className="text-muted-foreground">+{usedPlayers.length - 5} more</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={!inputValue.trim()} className="flex-1">
                Submit
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}