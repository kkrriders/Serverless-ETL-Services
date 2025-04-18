"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Server, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getHealth } from "@/lib/apiClient"; // Import the API client function

interface SystemHealthProps {
  className?: string;
}

interface HealthStatus {
  status: string;
  message?: string;
  ollama?: string;
  timestamp?: string;
  loading?: boolean;
  error?: string;
}

export function SystemHealth({ className }: SystemHealthProps) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({ 
    status: "loading",
    loading: true 
  });

  async function fetchHealth() {
    setHealthStatus({ status: "loading", loading: true });
    
    try {
      // First try the direct health check
      const response = await fetch("/api/local-health");
      const data = await response.json();
      
      if (data.backend === "available") {
        setHealthStatus({ 
          status: "healthy", 
          message: "All systems operational",
          timestamp: new Date().toLocaleTimeString(),
          loading: false
        });
      } else {
        setHealthStatus({ 
          status: "warning", 
          message: `Backend issue: ${data.backend}`,
          error: data.error,
          timestamp: new Date().toLocaleTimeString(),
          loading: false
        });
      }
    } catch (error) {
      // Try the backend API as fallback
      try {
        const apiHealth = await getHealth();
        setHealthStatus({ 
          status: "healthy", 
          message: "All systems operational",
          ollama: apiHealth.ollama,
          timestamp: apiHealth.timestamp,
          loading: false
        });
      } catch (apiError) {
        console.error("Health check error:", apiError);
        setHealthStatus({ 
          status: "error", 
          message: "Connection error",
          error: String(apiError),
          timestamp: new Date().toLocaleTimeString(),
          loading: false
        });
      }
    }
  }

  useEffect(() => {
    fetchHealth();
    
    // Refresh health status every 60 seconds
    const intervalId = setInterval(fetchHealth, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle>System Health</CardTitle>
        <CardDescription>Overall system status and health</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          {healthStatus.loading ? (
            <>
              <Loader2 className="h-9 w-9 text-muted-foreground animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Checking system health...</p>
                <p className="text-xs text-muted-foreground">Please wait</p>
              </div>
            </>
          ) : healthStatus.status === "healthy" ? (
            <>
              <CheckCircle className="h-9 w-9 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{healthStatus.message}</p>
                <p className="text-xs text-muted-foreground">Updated: {healthStatus.timestamp}</p>
              </div>
            </>
          ) : healthStatus.status === "warning" ? (
            <>
              <AlertTriangle className="h-9 w-9 text-amber-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{healthStatus.message}</p>
                <p className="text-xs text-muted-foreground">Updated: {healthStatus.timestamp}</p>
                {healthStatus.error && (
                  <p className="text-xs text-red-500 mt-1">{healthStatus.error}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-9 w-9 text-red-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{healthStatus.message}</p>
                <p className="text-xs text-muted-foreground">Updated: {healthStatus.timestamp}</p>
                {healthStatus.error && (
                  <p className="text-xs text-red-500 mt-1">{healthStatus.error}</p>
                )}
              </div>
            </>
          )}
          <div className="ml-auto flex-shrink-0">
            <Server className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
