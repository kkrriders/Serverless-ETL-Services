# ETL Dashboard

A Next.js dashboard for managing and monitoring the Serverless ETL Service with AI capabilities.

## Features

- System health and metrics monitoring
- Pipeline creation and management
- AI-powered data enrichment studio
- Interactive API testing

## Getting Started

### Prerequisites

- Node.js 18+ installed
- ETL backend service running (typically on port 3000)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Update the values:
     ```
     NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
     NEXT_PUBLIC_API_KEY=your-secret-api-key-here
     ```
   - Make sure the API key matches the one configured in the backend

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The dashboard will be available at http://localhost:3001

## API Authentication

The dashboard includes a robust API authentication system:

### Authentication Methods

- Public endpoints (like `/api/health`) don't require authentication
- Protected endpoints require an API key via:
  - `X-API-Key` header
  - `Authorization: Bearer <api-key>` header

### Security Features

1. **API Middleware**: A NextJS middleware that protects all `/api/*` routes except `/api/health`
2. **Proxy API**: A secure proxy endpoint at `/api/proxy` that forwards requests to the backend with the API key
3. **Authentication Testing**: Visit `/api-test` to test authentication with different API keys

### Configuring API Keys

The API key is stored in the `.env.local` file as `NEXT_PUBLIC_API_KEY`. This should match the API key configured in the backend service's environment variables.

## Development Notes

- The API client automatically uses the proxy endpoint for better security
- API keys are never exposed in client-side requests to external services
- The middleware provides detailed error responses for invalid or missing API keys 