"use client";

import { useEffect, useState } from "react";
import { BarChart, AlertTriangle, BrainCircuit, Loader2, ServerCrash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMetrics } from "@/lib/apiClient";

interface MetricsData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  ollamaCalls: number;
  ollamaErrors: number;
  ollamaAverageResponseTime: number;
}

export function SystemMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMetrics() {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError("Could not load metrics: API may be unavailable or requires authentication");
      console.error("Metrics error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 30 seconds
    const intervalId = setInterval(fetchMetrics, 30000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart className="h-4 w-4" />
            System Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading metrics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ServerCrash className="h-4 w-4" />
            System Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="mt-2 text-sm text-center">{error}</p>
          <button 
            onClick={fetchMetrics}
            className="mt-4 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart className="h-4 w-4" />
            System Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">No metrics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart className="h-4 w-4" />
          System Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <p className="text-xs font-medium">API Requests</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{metrics.totalRequests}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.errorRate !== undefined && metrics.errorRate !== null ? metrics.errorRate.toFixed(1) : '0.0'}%</p>
              <p className="text-xs text-muted-foreground">Error Rate</p>
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <p className="text-xs font-medium">Performance</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{metrics.averageResponseTime !== undefined && metrics.averageResponseTime !== null ? metrics.averageResponseTime.toFixed(1) : '0.0'}ms</p>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.successfulRequests}</p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <p className="text-xs font-medium">AI Enrichment</p>
            <BrainCircuit className="ml-1 h-3 w-3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{metrics.ollamaCalls}</p>
              <p className="text-xs text-muted-foreground">Total Calls</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.ollamaAverageResponseTime !== undefined && metrics.ollamaAverageResponseTime !== null ? metrics.ollamaAverageResponseTime.toFixed(1) : '0.0'}ms</p>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 