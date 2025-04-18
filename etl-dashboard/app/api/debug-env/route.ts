import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get environment variables
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  
  // Mask API key for security
  const maskedApiKey = apiKey 
    ? `${apiKey.substring(0, 3)}${'*'.repeat(Math.max(0, apiKey.length - 3))}` 
    : null;
  
  return NextResponse.json(
    {
      environmentVariables: {
        NEXT_PUBLIC_API_BASE_URL: apiUrl || "(not set)",
        NEXT_PUBLIC_API_KEY: maskedApiKey || "(not set)",
      },
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
} 