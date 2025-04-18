import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get environment variables
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;

    // Get all request headers for debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = 
        key.toLowerCase() === 'x-api-key' || key.toLowerCase() === 'authorization' 
          ? `MASKED-${value.substring(0, 3)}****` 
          : value;
    });

    // Build up detailed debugging info
    const data = {
      request: {
        method: request.method,
        url: request.url,
        headers: headers,
      },
      environment: {
        apiUrlConfigured: Boolean(apiUrl),
        apiKeyConfigured: Boolean(apiKey),
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyStartsWith: apiKey ? apiKey.substring(0, 3) : "",
        apiKeyEndsWidth: apiKey ? apiKey.substring(apiKey.length - 3) : "",
        nodeEnv: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    };

    // Attempt to make a direct connection to backend
    if (apiUrl) {
      try {
        console.log(`Attempting direct backend connection to: ${apiUrl}/health`);
        
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        
        // Add API key if available
        if (apiKey) {
          headers["X-API-Key"] = apiKey;
        }
        
        const response = await fetch(`${apiUrl}/health`, {
          method: "GET",
          headers,
          cache: "no-store",
        });
        
        // Add backend connection info to the data
        data.backend = {
          directConnectionStatus: response.status,
          directConnectionOk: response.ok,
          directConnectionStatusText: response.statusText,
        };
        
        // Try to get response text
        try {
          const text = await response.text();
          data.backend.responseTextPreview = text.substring(0, 100) + (text.length > 100 ? "..." : "");
          
          try {
            data.backend.responseData = JSON.parse(text);
          } catch (e) {
            data.backend.parseError = "Could not parse response as JSON";
          }
        } catch (e) {
          data.backend.readError = "Could not read response text";
        }
      } catch (error) {
        data.backend = {
          connectionError: String(error),
          directConnectionOk: false,
        };
      }
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Debug error", message: String(error) },
      { status: 500 }
    );
  }
} 