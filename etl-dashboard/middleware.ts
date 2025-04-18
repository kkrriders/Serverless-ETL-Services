import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get environment-specific API details
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

  // Add CORS headers for all responses
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');

  return response;
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
};
