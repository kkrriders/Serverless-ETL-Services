# ETL Services Frontend-Backend Integration Guide

This guide explains how to integrate the ETL Dashboard (frontend) with the ETL Service (backend) for local development and production deployment.

## System Overview

The application consists of two main components:

1. **Backend (ETL Service)**: A Node.js Express server that provides API endpoints for extraction, transformation, and loading operations.
2. **Frontend (ETL Dashboard)**: A Next.js application that provides a user-friendly interface for configuring and monitoring ETL operations.

## Local Development Setup

### Prerequisites

- Node.js 18+ installed
- npm or pnpm installed
- Git

### Automated Setup

We provide an integration setup script that configures both the frontend and backend to work together:

```bash
# Run the setup script
node integration-setup.js
```

This script:
- Creates a `.env.local` file in the frontend directory with the correct API configuration
- Updates the backend environment variables to use the same API key
- Adds convenience scripts to package.json for running both servers

### Manual Setup

If you prefer to set up the integration manually:

#### 1. Configure the Backend

The backend server runs on port 3001 by default. Ensure it's configured with an API key:

```bash
# Set environment variable for the API key
export API_KEY=your-api-key-here
```

#### 2. Configure the Frontend

Create a `.env.local` file in the `etl-dashboard-backup/etl-dashboard` directory:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_KEY=your-api-key-here
```

### Running the Application

After setup, you can run both frontend and backend together:

```bash
# Run both servers together
npm run dev
```

Or run them separately:

```bash
# Run backend only (http://localhost:3000)
npm run dev:backend

# Run frontend only (http://localhost:3001)
npm run dev:frontend
```

## How the Integration Works

The frontend communicates with the backend through:

1. **API Proxy**: The Next.js application includes an API proxy at `/api/proxy` that forwards requests to the backend, adding the API key for authentication.

2. **API Client**: The frontend uses the `apiClient.ts` module to make requests to the backend through the proxy.

## Troubleshooting

Common integration issues and solutions:

### CORS Errors

If you see CORS errors in the browser console:
- Ensure the backend CORS configuration includes your frontend origin
- Check that your frontend is making requests to the correct backend URL

### Authentication Failures

If API requests return 401 Unauthorized:
- Verify that the API key is the same in both frontend .env.local and backend environment
- Ensure requests include the X-API-Key header

### API Endpoint Issues

If API endpoints are not responding:
- Confirm the backend server is running on the expected port
- Check the API paths in the frontend code match the backend routes

## Production Deployment

For production deployment:

1. **Backend Deployment**:
   - Set the appropriate environment variables including API_KEY
   - Configure CORS to allow your production frontend domain

2. **Frontend Deployment**:
   - Set the production API URL in environment variables
   - Ensure the API key is properly secured

See the DEPLOYMENT_GUIDE.md for detailed deployment instructions.

## Extending the Integration

When adding new API endpoints:

1. Add the route to the backend in `/src/routes/index.js`
2. Add the corresponding API function in the frontend's `apiClient.ts`
3. Create the necessary UI components that use the new API endpoint 