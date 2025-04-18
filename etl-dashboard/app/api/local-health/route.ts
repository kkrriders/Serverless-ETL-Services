import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  
  let backendStatus = "unknown";
  let error = null;
  
  // Only try to check backend if we have a URL
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY || "",
        },
        cache: "no-store",
      });
      
      if (response.ok) {
        backendStatus = "available";
      } else {
        backendStatus = `error (${response.status})`;
        const errorData = await response.text();
        error = errorData || response.statusText;
      }
    } catch (err) {
      backendStatus = "unavailable";
      error = String(err);
    }
  }
  
  return NextResponse.json(
    {
      status: "ok", 
      dashboard: "running",
      backend: backendStatus,
      error: error,
      config: {
        apiUrlConfigured: !!API_BASE_URL,
        apiKeyConfigured: !!API_KEY,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
} 