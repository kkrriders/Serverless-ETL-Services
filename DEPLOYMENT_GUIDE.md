# Serverless ETL Service Deployment Guide

This guide documents all steps taken to develop, configure, and deploy the Serverless ETL Service with AI integration.

## Project Overview

A scalable, serverless ETL service that can:
- Extract data from various sources 
- Transform data using AI capabilities
- Load processed data to destinations
- Run as a containerized service

## Local Development Setup

### Backend Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create a `.env` file with:
```
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/etl-service

# API Configuration
API_KEY=serverless-etl-dashboard-key-2024
REQUIRE_AUTH=true

# Ollama Configuration
OLLAMA_ENDPOINT=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral
OLLAMA_MAX_TOKENS=2048
OLLAMA_TEMPERATURE=0.5

# CORS Configuration 
CORS_ORIGINS=http://localhost:3001,https://your-frontend.vercel.app

# Logging
LOG_LEVEL=info

# Server
PORT=8080
```

3. **Run locally:**
```bash
npm run dev
```

### Docker Setup

1. **Our Dockerfile:**
```dockerfile
FROM node:18-slim

WORKDIR /app

# Copy package.json files for backend 
COPY package.json ./

# Install backend dependencies
RUN npm install

# Copy backend source code
COPY src ./src
COPY serverless.yml ./
COPY jest.config.js ./
COPY .eslintrc.js ./

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Expose the backend port for Cloud Run
EXPOSE 8080

# Command to run the backend service
CMD ["node", "src/server.js"]
```

2. **Build and run Docker locally:**
```bash
# Build the Docker image
docker build -t serverless-etl-local .

# Run the Docker container
docker run -p 8080:8080 -d serverless-etl-local
```

3. **Test the Docker container:**
```bash
curl http://localhost:8080/health
```

## Project Configuration Details

### Package.json

```json
{
  "name": "serverless-etl-genai-backend",
  "version": "1.0.0",
  "description": "Serverless ETL service with generative AI capabilities",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:integration": "node tests/integration/test-etl.js",
    "lint": "eslint .",
    "build": "echo 'No build step required'",
    "format": "prettier --write .",
    "clean": "rm -rf node_modules",
    "docker:build": "docker build -t serverless-etl-service .",
    "docker:run": "docker run -p 8080:8080 --name etl-server -d serverless-etl-service"
  }
}
```

### CORS Configuration

We set up CORS middleware in `src/server.js` to allow connections from the frontend:

```javascript
// CORS configuration for Vercel frontend
const corsOptions = {
  origin: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3001', 'https://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
```

### API Authentication 

API authentication is implemented using API keys in the `src/middleware/auth.js` file:

```javascript
// Middleware verifies requests have valid API_KEY in:
// - X-API-Key header
// - Authorization: Bearer <token> header
```

### AI Integration Options

The project supports two approaches for AI integration:

1. **Self-hosted Ollama (Default)**
   - Uses a self-hosted Ollama instance
   - Configuration via environment variables:
     ```
     OLLAMA_ENDPOINT=http://localhost:11434/api/generate
     OLLAMA_MODEL=mistral
     ```

2. **Google Vertex AI**
   - Requires code modification to use Google's Vertex AI
   - Would require appropriate authentication for GCP

## GCP Deployment

### Cloud Build Configuration

We created a `cloudbuild.yaml` file to handle the build and deployment process:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/serverless-etl-service:$COMMIT_SHA', '-f', './Dockerfile', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/serverless-etl-service:$COMMIT_SHA']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'serverless-etl-service'
      - '--image=gcr.io/$PROJECT_ID/serverless-etl-service:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/serverless-etl-service:$COMMIT_SHA'

timeout: 1800s
```

### GCP Deployment Steps

1. **Install Google Cloud SDK:**
   - Download and install from https://cloud.google.com/sdk/docs/install

2. **Initialize GCP:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable Required APIs:**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

4. **Deploy using Cloud Build:**
   ```bash
   gcloud builds submit --config=cloudbuild.yaml
   ```

5. **Alternative: Direct Container Build and Deployment:**
   ```bash
   # Build locally and push to Container Registry
   docker build -t gcr.io/YOUR_PROJECT_ID/serverless-etl-service .
   docker push gcr.io/YOUR_PROJECT_ID/serverless-etl-service

   # Deploy to Cloud Run
   gcloud run deploy serverless-etl-service \
     --image gcr.io/YOUR_PROJECT_ID/serverless-etl-service \
     --platform managed \
     --region us-central1 \
     --set-env-vars "MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db,API_KEY=your-secure-key,CORS_ORIGINS=https://your-frontend.vercel.app" \
     --allow-unauthenticated
   ```

### MongoDB Atlas Integration

1. **Create MongoDB Atlas cluster**
2. **Configure network access** to allow connections from anywhere (or just GCP IPs)
3. **Create database user** with read/write permissions
4. **Get connection string** from MongoDB Atlas
5. **Set connection string** as environment variable in Cloud Run deployment

### Setting up Ollama in GCP

Option 1: Self-hosted VM:
1. Create a Compute Engine VM
2. Install Docker and run Ollama
3. Configure firewall rules to allow port 11434
4. Update `OLLAMA_ENDPOINT` environment variable in Cloud Run

Option 2: Use Google Vertex AI:
1. Update code to use Vertex AI API
2. Enable Vertex AI in your Google Cloud project
3. Set up appropriate service account and permissions

### Connecting Frontend on Vercel

1. Deploy dashboard to Vercel
2. Set environment variables in Vercel:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-cloudrun-service.run.app
   NEXT_PUBLIC_API_KEY=your-api-key
   ```

## Troubleshooting

### "Dockerfile not found" Error in Cloud Build

If you encounter "unable to prepare context: unable to evaluate symlinks in Dockerfile path: lstat /workspace/Dockerfile: no such file or directory", try:

1. Ensure Dockerfile is not ignored in `.gcloudignore`
2. Use explicit path in cloudbuild.yaml with `-f ./Dockerfile`
3. Try building and pushing locally, then deploying to Cloud Run directly

### CORS Issues

If frontend can't connect to backend due to CORS:
1. Verify backend CORS settings include your frontend domain
2. Check that frontend is using the correct URL for API calls
3. Ensure API key is being passed correctly

### MongoDB Connection Issues

1. Check network access settings in MongoDB Atlas
2. Verify connection string is correct
3. Check firewall rules if using self-hosted MongoDB 