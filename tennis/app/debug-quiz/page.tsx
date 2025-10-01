// app/debug-quiz/page.tsx - COMPLETE WORKING VERSION
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from "lucide-react";

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
  debug?: any;
  message: string;
};

type CellSolution = {
  rowIndex: number;
  colIndex: number;
  solutions: Array<{
    name: string;
    nationality: string | null;
  }>;
  count: number;
  loading: boolean;
};

export default function DebugQuizPage() {
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [cellSolutions, setCellSolutions] = useState<Map<string, CellSolution>>(new Map());
  const [showingSolutions, setShowingSolutions] = useState(false);
  const [checkingAllCells, setCheckingAllCells] = useState(false);

  // Load initial quiz
  useEffect(() => {
    fetchDebugQuiz();
  }, []);

  const fetchDebugQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const timestamp = Date.now();
      const response = await fetch(`/api/daily-quiz?debug=true&t=${timestamp}`);
      const data: QuizResponse = await response.json();
      
      if (data.success) {
        setQuizData(data);
        // Clear previous solutions when new quiz loads
        setCellSolutions(new Map());
        setShowingSolutions(false);
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

  const checkCellSolutions = async (rowIndex: number, colIndex: number) => {
    if (!quizData) return;

    const cellKey = `${rowIndex}-${colIndex}`;
    
    // Mark as loading
    setCellSolutions(prev => new Map(prev).set(cellKey, {
      rowIndex,
      colIndex,
      solutions: [],
      count: 0,
      loading: true
    }));

    try {
      const response = await fetch('/api/check-cell-solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowCategory: quizData.categories.rows[rowIndex],
          colCategory: quizData.categories.columns[colIndex]
        })
      });

      const data = await response.json();

      if (data.success) {
        setCellSolutions(prev => new Map(prev).set(cellKey, {
          rowIndex,
          colIndex,
          solutions: data.solutions,
          count: data.count,
          loading: false
        }));
      } else {
        console.error('Failed to check cell:', data);
        setCellSolutions(prev => new Map(prev).set(cellKey, {
          rowIndex,
          colIndex,
          solutions: [],
          count: 0,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error checking cell solutions:', error);
      setCellSolutions(prev => new Map(prev).set(cellKey, {
        rowIndex,
        colIndex,
        solutions: [],
        count: 0,
        loading: false
      }));
    }
  };

  const checkAllCells = async () => {
    if (!quizData) return;

    setCheckingAllCells(true);
    setShowingSolutions(true);
    
    // Check all 9 cells sequentially
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        await checkCellSolutions(row, col);
      }
    }
    
    setCheckingAllCells(false);
  };

  const clearSolutions = () => {
    setCellSolutions(new Map());
    setShowingSolutions(false);
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
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
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
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🎾 Tennis Quiz Debugger</h1>
        <p className="text-muted-foreground">
          Test and debug the daily quiz generation system - refresh to see different combinations
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <Button 
          onClick={handleRefresh} 
          disabled={loading}
          className="gap-2"
          size="lg"
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

        <Button
          onClick={showingSolutions ? clearSolutions : checkAllCells}
          disabled={checkingAllCells || !quizData}
          variant={showingSolutions ? "destructive" : "default"}
          className="gap-2"
        >
          {checkingAllCells ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking Solutions...
            </>
          ) : showingSolutions ? (
            <>Clear Solutions</>
          ) : (
            <>🔍 Check All Cell Solutions</>
          )}
        </Button>
        
        <div className="flex items-center gap-3 ml-auto">
          <Badge variant="secondary">Refreshes: {refreshCount}</Badge>
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {quizData.debug.totalCategories || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Total Categories</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {quizData.debug.categoryBreakdown?.countries || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Countries</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {quizData.debug.categoryBreakdown?.grandSlams || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Grand Slams</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Selected Row Categories:</h4>
                    <div className="flex flex-wrap gap-2">
                      {quizData.debug.selectedRows?.map((cat: string, index: number) => (
                        <Badge key={index} variant="default">
                          {cat}
                        </Badge>
                      )) || <span className="text-muted-foreground">No debug data</span>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Selected Column Categories:</h4>
                    <div className="flex flex-wrap gap-2">
                      {quizData.debug.selectedColumns?.map((cat: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {cat}
                        </Badge>
                      )) || <span className="text-muted-foreground">No debug data</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Solution Grid */}
          {showingSolutions && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">🎯 Cell Solutions Grid</CardTitle>
                <CardDescription>
                  Valid players for each cell combination - Green = good, Orange = hard, Red = impossible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-muted"></th>
                        {quizData.categories.columns.map((col, colIndex) => (
                          <th key={colIndex} className="border p-2 bg-blue-50 dark:bg-blue-950 text-sm font-semibold">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {quizData.categories.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="border p-2 bg-green-50 dark:bg-green-950 text-sm font-semibold text-center">
                            {row.label}
                          </td>
                          {quizData.categories.columns.map((col, colIndex) => {
                            const cellKey = `${rowIndex}-${colIndex}`;
                            const cellData = cellSolutions.get(cellKey);
                            
                            return (
                              <td
                                key={cellKey}
                                className="border p-3 align-top"
                              >
                                {cellData?.loading ? (
                                  <div className="flex items-center justify-center h-24">
                                    <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                                  </div>
                                ) : cellData ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      {cellData.count === 0 ? (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                      ) : cellData.count < 3 ? (
                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                      <span className={`text-sm font-bold ${
                                        cellData.count === 0 ? 'text-red-600' : 
                                        cellData.count < 3 ? 'text-orange-600' : 
                                        'text-green-600'
                                      }`}>
                                        {cellData.count} solution{cellData.count !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    {cellData.count === 0 ? (
                                      <div className="text-xs text-red-600 font-semibold">
                                        ⚠️ IMPOSSIBLE CELL!
                                      </div>
                                    ) : (
                                      <div className="text-xs space-y-1 max-h-24 overflow-y-auto">
                                        {cellData.solutions.slice(0, 8).map((player, idx) => (
                                          <div key={idx} className="truncate text-muted-foreground">
                                            • {player.name}
                                          </div>
                                        ))}
                                        {cellData.count > 8 && (
                                          <div className="text-muted-foreground font-semibold">
                                            +{cellData.count - 8} more
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => checkCellSolutions(rowIndex, colIndex)}
                                    className="text-xs text-blue-600 hover:underline w-full h-24 flex items-center justify-center"
                                  >
                                    Check cell
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Stats */}
                {Array.from(cellSolutions.values()).filter(c => !c.loading).length === 9 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded">
                      <div className="text-2xl font-bold text-red-600">
                        {Array.from(cellSolutions.values()).filter(c => c.count === 0).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Impossible Cells</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded">
                      <div className="text-2xl font-bold text-orange-600">
                        {Array.from(cellSolutions.values()).filter(c => c.count > 0 && c.count < 3).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Hard Cells (1-2)</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {Array.from(cellSolutions.values()).filter(c => c.count >= 3).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Good Cells (3+)</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Category Display Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="default">Rows</Badge>
                  Quiz Categories (Vertical)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quizData.categories.rows.map((category, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <Badge variant="outline">{category.type}</Badge>
                      <div className="flex-1">
                        <div className="font-medium">{category.label}</div>
                        <div className="text-sm text-muted-foreground">{category.description}</div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          value: {category.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="secondary">Columns</Badge>
                  Quiz Categories (Horizontal)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quizData.categories.columns.map((category, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Badge variant="outline">{category.type}</Badge>
                      <div className="flex-1">
                        <div className="font-medium">{category.label}</div>
                        <div className="text-sm text-muted-foreground">{category.description}</div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          value: {category.value}
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
              <CardTitle className="text-lg">💡 How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• <strong>Generate New Quiz:</strong> Create different category combinations</p>
                <p>• <strong>Check All Cell Solutions:</strong> Find all valid players for each cell (takes ~10 seconds)</p>
                <p>• <strong>Color Meanings:</strong> 🟢 Green (3+ solutions) = Good | 🟠 Orange (1-2) = Hard | 🔴 Red (0) = Impossible</p>
                <p>• <strong>Debug Mode:</strong> Shows category selection logic and data sources</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}