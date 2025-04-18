# Deployment Guide

## Local Development
1. Use `.env.local` for local development
2. Make sure the backend API is running at http://localhost:3000
3. Start the frontend with `npm run dev`

## Cloud Deployment

### Backend Deployment
1. Deploy the backend to Azure App Service
2. Set the environment variables in Azure App Service configuration:
   - `API_KEY=serverless-etl-dashboard-key-2024` (or a more secure key for production)
   - `REQUIRE_AUTH=true`
   - Other environment variables as needed

### Frontend Deployment
1. Create a production build with `npm run build`
2. Deploy the frontend to Azure Static Web Apps or Vercel
3. Set the environment variables in your cloud provider:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com`
   - `NEXT_PUBLIC_API_KEY=your-production-api-key`

## Security Recommendations
1. Use different API keys for development and production
2. Consider implementing Azure Key Vault for storing sensitive values
3. Implement proper CORS settings for production
