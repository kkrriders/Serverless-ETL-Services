import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // This route is protected by our middleware
  return NextResponse.json(
    {
      success: true,
      message: "Authentication successful",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
} 