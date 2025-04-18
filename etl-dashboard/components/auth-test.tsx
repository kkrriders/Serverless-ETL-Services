"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";

export function AuthTest() {
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);

  // First check the configuration status
  const checkConfigStatus = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/local-health");
      const data = await response.json();
      setConfigStatus(data);
      setResult({ 
        success: true, 
        message: "Configuration check complete. See details below." 
      });
    } catch (error) {
      setResult({ 
        success: false, 
        error: `Error checking configuration: ${error}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const testPublicEndpoint = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      setResult({ success: true, message: "Public endpoint accessible: " + JSON.stringify(data) });
    } catch (error) {
      setResult({ success: false, error: `Error accessing public endpoint: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const testProxyEndpoint = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/proxy-health");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      setResult({ success: true, message: "Proxy endpoint test: " + JSON.stringify(data) });
    } catch (error) {
      setResult({ success: false, error: `Error accessing proxy endpoint: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const testProtectedEndpoint = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/test", {
        headers: {
          "X-API-Key": apiKey
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Status ${response.status}: ${errorData.message || errorData.error || "Unknown error"}`);
      }
      
      const data = await response.json();
      setResult({ success: true, message: "Protected endpoint accessible: " + JSON.stringify(data) });
    } catch (error) {
      setResult({ success: false, error: `${error}` });
    } finally {
      setLoading(false);
    }
  };

  // Add a debug environment check function
  const checkDebugEnv = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/debug-env");
      const data = await response.json();
      setResult({ 
        success: true, 
        message: "Debug environment check: " + JSON.stringify(data, null, 2)
      });
    } catch (error) {
      setResult({ 
        success: false, 
        error: `Error checking debug environment: ${error}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a direct health check function
  const checkDirectHealth = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/direct-health");
      const data = await response.json();
      setResult({ 
        success: true, 
        message: "Direct health check result: " + JSON.stringify(data, null, 2)
      });
    } catch (error) {
      setResult({ 
        success: false, 
        error: `Error checking direct health: ${error}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a debug auth function for detailed diagnostics
  const checkDebugAuth = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/debug-auth");
      const data = await response.json();
      setResult({ 
        success: true, 
        message: "Advanced diagnostics result: " + JSON.stringify(data, null, 2)
      });
    } catch (error) {
      setResult({ 
        success: false, 
        error: `Error running auth diagnostics: ${error}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a function to generate env file
  const createEnvFile = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/create-env");
      const data = await response.json();
      
      if (data.success) {
        setResult({ 
          success: true, 
          message: `Successfully generated .env file:\n\n${data.content}\n\n${data.instructions}`
        });
      } else {
        setResult({
          success: false,
          error: `Failed to generate .env file: ${data.error}`
        });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: `Error generating .env file: ${error}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>API Authentication Test</CardTitle>
        <CardDescription>Test API key authentication for endpoints</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {configStatus && (
          <div className="space-y-2 p-4 border rounded-md bg-muted/50">
            <h3 className="font-medium">Configuration Status</h3>
            <div>
              <p className="text-sm">Dashboard: <span className="font-medium">{configStatus.dashboard}</span></p>
              <p className="text-sm">Backend: <span className={`font-medium ${configStatus.backend === "available" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{configStatus.backend}</span></p>
              <p className="text-sm">API URL Configured: <span className={`font-medium ${configStatus.config.apiUrlConfigured ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{configStatus.config.apiUrlConfigured ? "Yes" : "No"}</span></p>
              <p className="text-sm">API Key Configured: <span className={`font-medium ${configStatus.config.apiKeyConfigured ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{configStatus.config.apiKeyConfigured ? "Yes" : "No"}</span></p>
              {configStatus.error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">Error: {configStatus.error}</p>
              )}
            </div>
          </div>
        )}
      
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription className="max-h-40 overflow-auto">
              {result.message || result.error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button onClick={checkConfigStatus} disabled={loading} variant="default">
          Check Config
        </Button>
        <Button onClick={checkDebugEnv} disabled={loading} variant="outline">
          Debug Env
        </Button>
        <Separator className="my-2" />
        <Button onClick={testPublicEndpoint} disabled={loading} variant="outline">
          Test Public 
        </Button>
        <Button onClick={testProxyEndpoint} disabled={loading} variant="outline">
          Test Proxy
        </Button>
        <Button onClick={testProtectedEndpoint} disabled={loading || !apiKey}>
          Test Protected
        </Button>
        <Button onClick={checkDirectHealth} disabled={loading} variant="outline">
          Direct Health
        </Button>
        <Button onClick={checkDebugAuth} disabled={loading} variant="outline">
          Debug Auth
        </Button>
        <Button onClick={createEnvFile} disabled={loading} variant="outline">
          Create Env File
        </Button>
      </CardFooter>
    </Card>
  );
} 