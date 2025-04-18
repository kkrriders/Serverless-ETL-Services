"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ApiDiagnosticsProps {
  className?: string;
  onClose?: () => void;
}

export function ApiDiagnostics({ className, onClose }: ApiDiagnosticsProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/check-api-key');
      if (!response.ok) {
        throw new Error(`Diagnostics failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = () => {
    if (!results) return <Info className="h-6 w-6 text-blue-500" />;
    
    if (results.issues.length === 1 && results.issues[0] === "No issues detected") {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    
    return <AlertTriangle className="h-6 w-6 text-amber-500" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          API Diagnostics
          {getStatusIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Running diagnostics...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={runDiagnostics}>
              Try Again
            </Button>
          </div>
        ) : results ? (
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium mb-1">Configuration</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>API Base URL: {results.config.apiBaseUrl || 'Not configured'}</li>
                <li>API Key: {results.config.apiKeyConfigured ? 
                  `Configured (${results.config.apiKeyStart}...${results.config.apiKeyEnd})` : 
                  'Not configured'}</li>
                {results.config.hasWhitespaceIssue && (
                  <li className="text-amber-600 font-medium">
                    Warning: API key has whitespace issues
                  </li>
                )}
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Connection Status</h3>
              <p>{results.connectionStatus === 'success' ? 
                '✅ Connected successfully' : 
                results.connectionStatus === 'auth_failed' ?
                '❌ Authentication failed' :
                results.connectionStatus === 'error' ?
                '❌ API returned an error' :
                results.connectionStatus === 'connection_failed' ?
                '❌ Could not connect to API' :
                '⚠️ Connection not tested'}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Issues</h3>
              <ul className="list-disc pl-5 space-y-1">
                {results.issues.map((issue: string, i: number) => (
                  <li key={i} className={issue === "No issues detected" ? "text-green-600" : "text-red-600"}>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
            
            {results.apiResponse && (
              <div>
                <h3 className="font-medium mb-1">API Response</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-24">
                  {typeof results.apiResponse === 'string' ? results.apiResponse : JSON.stringify(results.apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={runDiagnostics} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Refresh
        </Button>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 