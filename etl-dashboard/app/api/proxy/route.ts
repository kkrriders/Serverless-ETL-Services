import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Access environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ? process.env.NEXT_PUBLIC_API_KEY.trim() : "";

// Log configuration status at startup
console.log(`API proxy configuration:
- API_BASE_URL configured: ${API_BASE_URL ? "Yes" : "No"}
- API_KEY configured: ${API_KEY ? "Yes (Secure)" : "No"}`);

export async function GET(request: NextRequest) {
  return handleRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, "DELETE");
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
    }
  });
}

async function handleRequest(request: NextRequest, method: string) {
  try {
    // Get the target endpoint from the search params
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint parameter" },
        { status: 400 }
      );
    }

    if (!API_BASE_URL) {
      console.error("API_BASE_URL is not configured");
      return NextResponse.json(
        { error: "API_BASE_URL is not configured" },
        { status: 500 }
      );
    }

    // Construct the full URL
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Create headers with API key
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    // Only add API key if it exists
    if (API_KEY) {
      headers["X-API-Key"] = API_KEY;
    }

    // Get the request body for non-GET requests
    let body = null;
    if (method !== "GET" && request.body) {
      body = await request.text();
    }

    // Forward the request to the backend
    const response = await fetch(url, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    console.log(`Backend response for ${endpoint}: ${response.status}`);

    // Get response body
    let responseBody;
    let responseText = "";
    
    try {
      responseText = await response.text();
      
      if (response.status === 401) {
        console.error(`Authentication failure: Status 401 Unauthorized`);
        console.error(`Response: ${responseText}`);
      }
      
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          responseBody = { message: "Non-JSON response from server", raw: responseText };
        }
      } else {
        responseBody = { message: "Empty response from server" };
      }
    } catch (e) {
      console.error("Error reading response:", e);
      responseBody = { message: "Error reading server response", error: String(e) };
    }

    // Return the response
    return NextResponse.json(responseBody, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
      }
    });
  } catch (error) {
    console.error("Error in proxy API route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}