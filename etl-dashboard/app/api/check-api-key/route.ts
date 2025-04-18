import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  // Get environment variables
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const rawApiKey = process.env.NEXT_PUBLIC_API_KEY || "";
  const apiKey = rawApiKey.trim(); // Remove any whitespace
  
  // Check if the API key has trailing or leading spaces
  const hasWhitespaceIssue = rawApiKey !== apiKey;
  
  const issues = [];
  
  if (!apiBaseUrl) {
    issues.push("Missing API base URL");
  }
  
  if (!apiKey) {
    issues.push("Missing API key");
  } else if (hasWhitespaceIssue) {
    issues.push("API key has whitespace issues (leading or trailing spaces)");
  }
  
  // Test the API connection if we have both values
  let connectionStatus = "untested";
  let apiResponse = null;
  
  if (apiBaseUrl && apiKey) {
    try {
      const response = await fetch(`${apiBaseUrl}/health`, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json"
        },
        cache: "no-store"
      });
      
      apiResponse = await response.text();
      
      if (response.ok) {
        connectionStatus = "success";
      } else if (response.status === 401) {
        connectionStatus = "auth_failed";
        issues.push("Authentication failed with status 401");
      } else {
        connectionStatus = "error";
        issues.push(`API returned error status: ${response.status}`);
      }
    } catch (error) {
      connectionStatus = "connection_failed";
      issues.push(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Generate a diagnostic report
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      apiBaseUrl,
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey.length,
      apiKeyStart: apiKey.substring(0, 3),
      apiKeyEnd: apiKey.substring(apiKey.length - 3),
      hasWhitespaceIssue
    },
    connectionStatus,
    issues: issues.length > 0 ? issues : ["No issues detected"],
    apiResponse: apiResponse ? (typeof apiResponse === 'string' && apiResponse.length < 1000 ? apiResponse : "Response too large to display") : null
  };
  
  return NextResponse.json(report);
} 