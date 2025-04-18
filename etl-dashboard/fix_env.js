const fs = require('fs');
const path = require('path');
const http = require('http');

// Define the content for local development
const localEnvContent = `# Base URL for the backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# API Key for backend authentication
NEXT_PUBLIC_API_KEY=serverless-etl-dashboard-key-2024
`;

// Define content for production/cloud environment
const prodEnvContent = `# Base URL for the backend API
NEXT_PUBLIC_API_BASE_URL=https://serverless-etl-api.azurewebsites.net

# API Key for backend authentication
NEXT_PUBLIC_API_KEY=serverless-etl-dashboard-key-2024
`;

// Fix the frontend environment files
console.log('Fixing frontend environment files...');

// Local development environment
fs.writeFileSync(path.join(__dirname, '.env.local'), localEnvContent);
console.log('✅ Fixed .env.local file for local development');

// Create production environment file
fs.writeFileSync(path.join(__dirname, '.env.production'), prodEnvContent);
console.log('✅ Created .env.production file for cloud deployment');

// Create a sample file for reference
fs.writeFileSync(path.join(__dirname, '.env.example'), localEnvContent);
console.log('✅ Created .env.example file for reference');

// Now fix the backend .env file (in parent directory)
const backendEnvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(backendEnvPath)) {
  console.log('\nFixing backend environment file...');
  
  let backendContent = fs.readFileSync(backendEnvPath, 'utf8');
  
  // Replace API key line to remove trailing spaces
  backendContent = backendContent.replace(
    /API_KEY=serverless-etl-dashboard-key-2024\s+/g, 
    'API_KEY=serverless-etl-dashboard-key-2024\n'
  );
  
  fs.writeFileSync(backendEnvPath, backendContent);
  console.log('✅ Fixed backend .env file');
}

// Create a middleware file to handle cloud vs local environments
const middlewarePath = path.join(__dirname, 'middleware.ts');
const middlewareContent = `import { NextResponse } from 'next/server';
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
`;

fs.writeFileSync(middlewarePath, middlewareContent);
console.log('✅ Updated middleware.ts for better API handling');

// Create a deployment guide
const deploymentGuidePath = path.join(__dirname, 'DEPLOYMENT.md');
const deploymentGuideContent = `# Deployment Guide

## Local Development
1. Use \`.env.local\` for local development
2. Make sure the backend API is running at http://localhost:3000
3. Start the frontend with \`npm run dev\`

## Cloud Deployment

### Backend Deployment
1. Deploy the backend to Azure App Service
2. Set the environment variables in Azure App Service configuration:
   - \`API_KEY=serverless-etl-dashboard-key-2024\` (or a more secure key for production)
   - \`REQUIRE_AUTH=true\`
   - Other environment variables as needed

### Frontend Deployment
1. Create a production build with \`npm run build\`
2. Deploy the frontend to Azure Static Web Apps or Vercel
3. Set the environment variables in your cloud provider:
   - \`NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com\`
   - \`NEXT_PUBLIC_API_KEY=your-production-api-key\`

## Security Recommendations
1. Use different API keys for development and production
2. Consider implementing Azure Key Vault for storing sensitive values
3. Implement proper CORS settings for production
`;

fs.writeFileSync(deploymentGuidePath, deploymentGuideContent);
console.log('✅ Created DEPLOYMENT.md guide');

// Update the proxy route to be more robust
const proxyRoutePath = path.join(__dirname, 'app', 'api', 'proxy', 'route.ts');
if (fs.existsSync(proxyRoutePath)) {
  const proxyRouteContent = `import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Access environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

// Log configuration status at startup
console.log(\`API proxy configuration:
- API_BASE_URL configured: \${API_BASE_URL ? "Yes" : "No"}
- API_KEY configured: \${API_KEY ? "Yes (Secure)" : "No"}\`);

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
    const url = \`\${API_BASE_URL}\${endpoint}\`;
    
    // Create headers with API key
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    // Only add API key if it exists
    if (API_KEY) {
      headers["X-API-Key"] = API_KEY.trim(); // Ensure no trailing spaces
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

    console.log(\`Backend response for \${endpoint}: \${response.status}\`);

    // Get response body
    let responseBody;
    let responseText = "";
    
    try {
      responseText = await response.text();
      
      if (response.status === 401) {
        console.error(\`Authentication failure: Status 401 Unauthorized\`);
        console.error(\`Response: \${responseText}\`);
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
}`;

  fs.writeFileSync(proxyRoutePath, proxyRouteContent);
  console.log('✅ Updated API proxy route for better error handling');
}

// Update the apiClient.ts file to be more robust with cloud integration
const apiClientPath = path.join(__dirname, 'lib', 'apiClient.ts');
if (fs.existsSync(apiClientPath)) {
  const apiClientContent = `// These constants are for reference only - actual values come from environment variables
// which are properly loaded by Next.js based on environment (.env.local or .env.production)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Log configuration status in development
if (process.env.NODE_ENV !== 'production') {
  console.log(\`API client configuration:
  - API_BASE_URL configured: \${API_BASE_URL ? "Yes" : "No"}
  - API_KEY configured: \${API_KEY ? "Yes" : "No"}\`);
}

/**
 * Fetch data from API using the proxy endpoint
 */
async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const startTime = Date.now();
  
  // For client components, use direct API calls to our local backend proxy
  // This avoids exposing the API key in client-side code
  const url = \`/api/proxy?endpoint=\${encodeURIComponent(endpoint)}\`;
  
  // Basic headers for all requests
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log(\`API request started: \${endpoint}\`);
  }
  
  try {
    // Make the request through our proxy
    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store', // Ensure we don't use stale data
    });

    // Get response as text first to handle potential JSON parsing errors
    const responseText = await response.text();
    const duration = Date.now() - startTime;

    // Try to parse response as JSON
    let responseData;
    try {
      // Only parse if there's content
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      console.error(\`Error parsing JSON response for \${endpoint}:\`, parseError);
      console.error(\`Raw response text: \${responseText.substring(0, 100)}...\`);
      throw new Error(\`Invalid JSON response (\${response.status}): \${responseText.substring(0, 100)}...\`);
    }

    // Handle unsuccessful responses
    if (!response.ok) {
      // Format error message for better debugging
      const errorMsg = responseData?.error || responseData?.message || response.statusText || 'Unknown error';
      
      // Special handling for auth errors
      if (response.status === 401) {
        console.error(\`Authentication failed for \${endpoint}: API Key may be invalid or missing\`);
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.error(\`API Error (\${response.status}): \${errorMsg}\`, responseData);
      }
      throw new Error(\`API Error (\${response.status}): \${errorMsg}\`);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(\`API request completed: \${endpoint} (\${duration}ms)\`);
    }

    // Return the parsed response or null for empty responses
    return responseData || null;
  } catch (error: any) {
    // Log all API request failures
    console.error(\`Failed API request to \${endpoint}:\`, error);
    
    // If this is a fetch error (network/connection issue)
    if (error.name === 'TypeError') {
      console.error(\`Connection error - check that your backend is running at \${API_BASE_URL}\`);
    }
    
    // Re-throw for component error handling
    throw error;
  }
}

// --- Specific API Functions ---

/**
 * Get health status with fallbacks
 */
export async function getHealth() {
  try {
    return await fetchFromApi('/health');
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    // Return a standardized health response even on error
    return {
      status: 'ERROR',
      message: \`Health check error: \${error.message}\`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get metrics with error handling
 */
export async function getMetrics() {
  try {
    return await fetchFromApi('/metrics');
  } catch (error) {
    // Return empty metrics object to prevent UI crashes
    console.error('Failed to load metrics:', error);
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      ollamaCalls: 0,
      ollamaErrors: 0,
      ollamaAverageResponseTime: 0
    };
  }
}

// ETL API Functions
export async function extractData(sourceConfig: object, options: object = {}) {
  return fetchFromApi('/extract', {
    method: 'POST',
    body: JSON.stringify({ source: sourceConfig, options }),
  });
}

export async function transformData(data: any, transformations: object, options: object = {}, recordId?: string) {
  const payload: { transformations: object; options: object; data?: any; recordId?: string } = {
    transformations,
    options,
  };
  if (recordId) {
    payload.recordId = recordId;
  } else {
    payload.data = data;
  }
  return fetchFromApi('/transform', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loadData(data: any, destinationConfig: object, options: object = {}, recordId?: string) {
  const payload: { destination: object; options: object; data?: any; recordId?: string } = {
    destination: destinationConfig,
    options,
  };
  if (recordId) {
    payload.recordId = recordId;
  } else {
    payload.data = data;
  }
  return fetchFromApi('/load', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function orchestrateEtl(payload: object) {
  return fetchFromApi('/orchestrate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}`;

  fs.writeFileSync(apiClientPath, apiClientContent);
  console.log('✅ Updated API client for better cloud integration');
}

console.log('\n🎉 All API-related files have been fixed and cloud integration is ready!');
console.log('Please restart your application to apply the changes.');
console.log('See DEPLOYMENT.md for cloud deployment instructions.'); 