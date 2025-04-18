// These constants are for reference only - actual values come from environment variables
// which are properly loaded by Next.js based on environment (.env.local or .env.production)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Log configuration status in development
if (process.env.NODE_ENV !== 'production') {
  console.log(`API client configuration:
  - API_BASE_URL configured: ${API_BASE_URL ? "Yes" : "No"}
  - API_KEY configured: ${API_KEY ? "Yes" : "No"}`);
}

/**
 * Fetch data from API using the proxy endpoint
 */
async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const startTime = Date.now();
  
  // For client components, use direct API calls to our local backend proxy
  // This avoids exposing the API key in client-side code
  const url = `/api/proxy?endpoint=${encodeURIComponent(endpoint)}`;
  
  // Basic headers for all requests
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log(`API request started: ${endpoint}`);
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
      console.error(`Error parsing JSON response for ${endpoint}:`, parseError);
      console.error(`Raw response text: ${responseText.substring(0, 100)}...`);
      throw new Error(`Invalid JSON response (${response.status}): ${responseText.substring(0, 100)}...`);
    }

    // Handle unsuccessful responses
    if (!response.ok) {
      // Format error message for better debugging
      const errorMsg = responseData?.error || responseData?.message || response.statusText || 'Unknown error';
      
      // Special handling for auth errors
      if (response.status === 401) {
        console.error(`Authentication failed for ${endpoint}: API Key may be invalid or missing`);
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.error(`API Error (${response.status}): ${errorMsg}`, responseData);
      }
      throw new Error(`API Error (${response.status}): ${errorMsg}`);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`API request completed: ${endpoint} (${duration}ms)`);
    }

    // Return the parsed response or null for empty responses
    return responseData || null;
  } catch (error: any) {
    // Log all API request failures
    console.error(`Failed API request to ${endpoint}:`, error);
    
    // If this is a fetch error (network/connection issue)
    if (error.name === 'TypeError') {
      console.error(`Connection error - check that your backend is running at ${API_BASE_URL}`);
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
      message: `Health check error: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get metrics with error handling
 */
export async function getMetrics() {
  try {
    const data = await fetchFromApi('/metrics');
    
    // Ensure all metric properties exist with defaults
    return {
      totalRequests: data?.totalRequests || 0,
      successfulRequests: data?.successfulRequests || 0,
      failedRequests: data?.failedRequests || 0,
      averageResponseTime: data?.averageResponseTime || 0,
      errorRate: data?.errorRate || 0,
      ollamaCalls: data?.ollamaCalls || 0,
      ollamaErrors: data?.ollamaErrors || 0,
      ollamaAverageResponseTime: data?.ollamaAverageResponseTime || 0
    };
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
}