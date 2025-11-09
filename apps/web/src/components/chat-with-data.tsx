'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chatWithData } from '@/lib/api';
import { Send, Loader2, Database, Sparkles, AlertCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export function ChatWithData() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ query: string; response: any; timestamp: Date }>>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamedData, setStreamedData] = useState<any>({ sql: '', data: [], explanation: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query.trim();
    setLoading(true);
    setError(null);
    setResponse(null);
    setStreaming(false);
    setStreamedData({ sql: '', data: [], explanation: '' });

    try {
      // Try streaming first, fallback to regular request
      const useStreaming = true;
      
      if (useStreaming) {
        await handleStreamingQuery(currentQuery);
      } else {
        const data = await chatWithData(currentQuery);
        setResponse(data);
        // Add to chat history
        setChatHistory(prev => [...prev, { 
          query: currentQuery, 
          response: data, 
          timestamp: new Date() 
        }]);
      }
      setQuery(''); // Clear input after successful query
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process query');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }

  async function handleStreamingQuery(queryText: string) {
    setStreaming(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';
    
    try {
      const response = await fetch(`${API_BASE}/chat-with-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText, stream: true }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to process query';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.details || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentResponse: any = { sql: '', data: [], explanation: '' };

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'sql') {
                currentResponse.sql = data.content;
                setStreamedData({ ...currentResponse });
              } else if (data.type === 'data_row') {
                currentResponse.data.push(data.row);
                setStreamedData({ ...currentResponse });
              } else if (data.type === 'explanation') {
                currentResponse.explanation = data.content;
                setStreamedData({ ...currentResponse });
              } else if (data.type === 'done') {
                setResponse(currentResponse);
                setChatHistory(prev => [...prev, { 
                  query: queryText, 
                  response: currentResponse, 
                  timestamp: new Date() 
                }]);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      // Fallback to non-streaming
      try {
        const data = await chatWithData(queryText);
        setResponse(data);
        setChatHistory(prev => [...prev, { 
          query: queryText, 
          response: data, 
          timestamp: new Date() 
        }]);
      } catch (fallbackErr) {
        throw err; // Throw original streaming error
      }
    }
  }

  // Determine if data can be visualized as a chart
  const canVisualize = (data: any[]): { type: 'bar' | 'line' | 'pie' | null; chartData: any[] } => {
    if (!data || data.length === 0) return { type: null, chartData: [] };
    
    const keys = Object.keys(data[0]);
    
    // Check for numeric columns that could be visualized
    const numericKeys = keys.filter(key => {
      const value = data[0][key];
      return typeof value === 'number' || !isNaN(Number(value));
    });
    
    if (numericKeys.length === 0) return { type: null, chartData: [] };
    
    // If we have a category/name column and a numeric column, create chart data
    const categoryKey = keys.find(key => key.toLowerCase().includes('name') || 
                                         key.toLowerCase().includes('vendor') ||
                                         key.toLowerCase().includes('category') ||
                                         key.toLowerCase().includes('month') ||
                                         key.toLowerCase().includes('date'));
    const valueKey = numericKeys[0];
    
    if (categoryKey && valueKey) {
      const chartData = data.map(row => ({
        name: String(row[categoryKey] || ''),
        value: Number(row[valueKey]) || 0,
      }));
      
      // Determine chart type based on data
      if (data.length <= 10) {
        return { type: 'bar', chartData };
      } else {
        return { type: 'line', chartData };
      }
    }
    
    // Pie chart for 2-column data with one numeric
    if (keys.length === 2 && numericKeys.length === 1) {
      const nonValueKey = keys.find(k => k !== valueKey);
      const chartData = data.map(row => ({
        name: String(nonValueKey ? row[nonValueKey] : ''),
        value: Number(row[valueKey]) || 0,
      }));
      return { type: 'pie', chartData };
    }
    
    return { type: null, chartData: [] };
  };

  // Use streamed data if streaming, otherwise use response
  const displayData = streaming ? streamedData : response;
  const visualization = displayData?.data ? canVisualize(displayData.data) : { type: null, chartData: [] };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Chat Input Card */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Chat with Data</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Ask natural language questions about your invoice data. Powered by Vanna AI.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., What's the total spend in the last 90 days?"
                  disabled={loading}
                  className="pl-4 pr-12 h-12 text-base border border-gray-300 focus:border-blue-500 rounded-lg"
                />
                <Database className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <Button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ask
                  </>
                )}
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">Example queries:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>What's the total spend in the last 90 days?</li>
                <li>List top 5 vendors by spend.</li>
                <li>Show overdue invoices as of today.</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <div className="font-medium">{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {(response || (streaming && streamedData)) && (
        <div className="space-y-6">
          {(displayData?.sql || streamedData?.sql) && (
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Generated SQL
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-slate-800">
                  {displayData?.sql || streamedData?.sql || ''}
                  {streaming && <span className="animate-pulse">▋</span>}
                </pre>
              </CardContent>
            </Card>
          )}

          {displayData?.data && displayData.data.length > 0 && (
            <>
              {/* Optional Chart Visualization */}
              {visualization.type && (
                <Card className="border border-gray-200 shadow-sm bg-white">
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Visualization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {visualization.type === 'bar' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={visualization.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {visualization.type === 'line' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={visualization.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    {visualization.type === 'pie' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={visualization.chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {visualization.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Results Table */}
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Query Results
                    {streaming && displayData?.data && (
                      <span className="ml-2 text-sm text-gray-500">({displayData.data.length} rows loaded...)</span>
                    )}
                  </CardTitle>
                  {(displayData?.explanation || streamedData?.explanation) && (
                    <CardDescription className="text-sm text-gray-500">
                      {displayData?.explanation || streamedData?.explanation}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="rounded-lg border border-gray-200 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          {displayData.data[0] && Object.keys(displayData.data[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {displayData.data.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            {Object.values(row).map((value: any, colIdx: number) => (
                              <td key={colIdx} className="px-4 py-3 text-sm text-gray-900">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Chat History */}
      {chatHistory.length > 0 && (
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-base font-semibold text-gray-900">Recent Queries</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {chatHistory.slice(-5).reverse().map((item, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm font-medium text-gray-900 mb-1">{item.query}</p>
                  <p className="text-xs text-gray-500">
                    {item.timestamp.toLocaleTimeString()} - {item.response?.data?.length || 0} result(s)
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

