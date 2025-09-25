// app/debug-quiz/page.tsx - FIXED VERSION
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Eye, EyeOff } from "lucide-react";

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

type QuizResponse = {
  success: boolean;
  date: string;
  categories: DailyQuiz;
  seed: number;
  debug?: {
    totalAvailableCategories: number;
    availableCountries: number;
    availableGrandSlams: number;
    availableMasters: number;
    availableGridCategories: number;
    availableAchievements: number;
    selectedCategories: string[];
    allCategories: string[];
  };
  message: string;
};

export default function DebugQuizPage() {
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  // Load initial quiz
  useEffect(() => {
    fetchDebugQuiz();
  }, []);

  const fetchDebugQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use timestamp to ensure different results each time
      const timestamp = Date.now();
      const response = await fetch(`/api/daily-quiz?debug=true&t=${timestamp}`);
      const data: QuizResponse = await response.json();
      
      if (data.success) {
        setQuizData(data);
        console.log('🎾 Debug Quiz Data:', data);
      } else {
        setError(data.message || 'Failed to load quiz');
      }
    } catch (err) {
      setError('Failed to fetch debug quiz');
      console.error('Debug quiz error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
    fetchDebugQuiz();
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  if (loading && !quizData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading debug quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !quizData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button onClick={fetchDebugQuiz} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🎾 Tennis Quiz Debugger</h1>
        <p className="text-muted-foreground">
          Test and debug the daily quiz generation system
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-6">
        <Button 
          onClick={handleRefresh} 
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Generate New Quiz
        </Button>
        
        <Button 
          onClick={toggleDebugInfo} 
          variant="outline"
          className="gap-2"
        >
          {showDebugInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showDebugInfo ? 'Hide' : 'Show'} Debug Info
        </Button>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Refreshes: {refreshCount}</span>
          {quizData && <Badge variant="outline">Seed: {quizData.seed}</Badge>}
        </div>
      </div>

      {quizData && (
        <>
          {/* Debug Information */}
          {showDebugInfo && quizData.debug && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">🔍 Debug Information</CardTitle>
                <CardDescription>
                  Generated on {quizData.date} with seed {quizData.seed}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {quizData.debug.totalAvailableCategories}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {quizData.debug.availableCountries}
                    </div>
                    <div className="text-sm text-muted-foreground">Countries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {quizData.debug.availableGrandSlams}
                    </div>
                    <div className="text-sm text-muted-foreground">Grand Slams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {quizData.debug.availableGridCategories || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">DB Categories</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Selected Categories (6):</h4>
                    <div className="flex flex-wrap gap-2">
                      {quizData.debug.selectedCategories.map((cat, index) => (
                        <Badge key={index} variant="secondary">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {quizData.debug.allCategories && (
                    <div>
                      <h4 className="font-semibold mb-2">Available Categories (first 20):</h4>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {quizData.debug.allCategories.map((cat, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quiz Grid Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">🎯 Generated Quiz Grid</CardTitle>
              <CardDescription>
                This is how the quiz will appear to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {/* Empty top-left corner */}
                <div className="aspect-square"></div>
                
                {/* Column headers */}
                {quizData.categories.columns.map((category, index) => (
                  <div
                    key={`col-${index}`}
                    className="aspect-square bg-blue-100 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700 rounded-lg flex flex-col items-center justify-center p-2 text-center"
                  >
                    <div className="font-semibold text-sm">{category.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {category.description}
                    </div>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {category.type}
                    </Badge>
                  </div>
                ))}

                {/* Grid rows */}
                {quizData.categories.rows.map((rowCategory, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="contents">
                    {/* Row header */}
                    <div className="aspect-square bg-green-100 dark:bg-green-900 border-2 border-green-300 dark:border-green-700 rounded-lg flex flex-col items-center justify-center p-2 text-center">
                      <div className="font-semibold text-sm">{rowCategory.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {rowCategory.description}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {rowCategory.type}
                      </Badge>
                    </div>
                    
                    {/* Grid cells */}
                    {quizData.categories.columns.map((colCategory, colIndex) => (
                      <div
                        key={`cell-${rowIndex}-${colIndex}`}
                        className="aspect-square bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center p-2 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {rowCategory.type} + {colCategory.type}
                        </div>
                        <div className="text-sm font-medium">
                          Click to guess
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Details */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Row Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quizData.categories.rows.map((category, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Badge variant="secondary">{category.type}</Badge>
                      <div className="flex-1">
                        <div className="font-medium">{category.label}</div>
                        <div className="text-sm text-muted-foreground">{category.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Value: {category.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📈 Column Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quizData.categories.columns.map((category, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Badge variant="secondary">{category.type}</Badge>
                      <div className="flex-1">
                        <div className="font-medium">{category.label}</div>
                        <div className="text-sm text-muted-foreground">{category.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Value: {category.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">💡 Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• <strong>Refresh:</strong> Click "Generate New Quiz" to create different category combinations</p>
                <p>• <strong>Seed:</strong> Each refresh uses a different timestamp-based seed for variety</p>
                <p>• <strong>Categories:</strong> The system pulls from your database: countries, tournaments, grid_categories, and achievements</p>
                <p>• <strong>Validation:</strong> Each cell requires a player that matches both the row and column criteria</p>
                <p>• <strong>Debug Mode:</strong> Shows all available data and selection logic for troubleshooting</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}