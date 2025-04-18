import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  
  let response = null;
  let error = null;
  let responseData = null;
  
  if (!API_BASE_URL) {
    return NextResponse.json(
      {
        error: "API_BASE_URL is not configured",
        status: "error",
      },
      { status: 500 }
    );
  }

  try {
    console.log(`Making direct health check to: ${API_BASE_URL}/health`);
    
    // Attempt direct connection with the API key
    response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY || "",
      },
      cache: "no-store",
    });
    
    console.log(`Direct health check response: ${response.status} ${response.statusText}`);
    
    // Get response text
    const responseText = await response.text();
    
    // Try to parse as JSON
    try {
      if (responseText) {
        responseData = JSON.parse(responseText);
      }
    } catch (e) {
      console.error("Error parsing response:", e);
      responseData = { raw: responseText };
    }
    
    // Return combined data
    return NextResponse.json({
      directRequestStatus: response.status,
      directRequestOk: response.ok,
      backendResponse: responseData,
      apiUrl: API_BASE_URL,
      apiKeyConfigured: !!API_KEY,
      timestamp: new Date().toISOString(),
    });
    
  } catch (err) {
    console.error("Error in direct health check:", err);
    
    return NextResponse.json({
      error: String(err),
      status: "error",
      directRequestOk: false,
      apiUrl: API_BASE_URL,
      apiKeyConfigured: !!API_KEY,
      timestamp: new Date().toISOString(),
    }, 
    { status: 500 });
  }
} 