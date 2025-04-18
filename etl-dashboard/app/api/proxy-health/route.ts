import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Use the proxy API to call the backend health endpoint
    const response = await fetch(`/api/proxy?endpoint=${encodeURIComponent('/health')}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: "Backend health check failed",
          statusCode: response.status,
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(
      {
        status: "ok",
        message: "Backend health check successful via proxy",
        backendStatus: data,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in proxy health check:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to backend via proxy",
        error: String(error),
      },
      { status: 500 }
    );
  }
} 