# Serverless ETL Service with Generative AI

A scalable, serverless ETL (Extract, Transform, Load) service with generative AI capabilities built on Azure Functions, MongoDB, and Ollama with the Mistral language model.

![ETL Process](https://img.shields.io/badge/ETL-Process-blue)
![Azure Functions](https://img.shields.io/badge/Azure-Functions-0078D4)
![Node.js](https://img.shields.io/badge/Node.js-14+-339933)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248)
![Ollama](https://img.shields.io/badge/Ollama-Mistral-663399)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Local Development](#local-development)
- [Usage](#usage)
  - [Health Check](#health-check)
  - [Extract](#extract)
  - [Transform](#transform)
  - [Load](#load)
  - [Orchestrate](#orchestrate)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Dashboard](#dashboard)

## Overview

This service provides a scalable, serverless ETL pipeline with integrated generative AI capabilities. It allows you to extract data from various sources, transform and enrich it using AI via Ollama with Mistral, and load it into different destinations.

The service can be used as a standalone local application or deployed to Azure Functions for a fully serverless experience.

## Features

- **Serverless Architecture**: Built on Azure Functions for scalable, event-driven processing
- **Flexible Data Sources**: Extract data from:
  - REST APIs
  - MongoDB collections
  - Azure Blob Storage
- **Powerful Transformations**:
  - Data cleaning (remove empty fields, format dates, clean text)
  - Data validation against schemas
  - Data enrichment using AI
- **Generative AI Integration**: Enrich data using Ollama with the Mistral model for:
  - Text summarization
  - Sentiment analysis
  - Content generation
  - Data categorization
- **Multiple Destinations**: Load data to:
  - MongoDB collections
  - Azure Blob Storage
- **End-to-End Pipeline**: Orchestrated ETL process or use individual components
- **Authentication**: API Key-based authentication for secure endpoints

## Dashboard

A Next.js dashboard application is included to provide a user interface for the ETL service. The dashboard allows you to:

- View system health and metrics
- Create and manage ETL pipelines
- Monitor pipeline executions
- Use the AI Studio for interactive data enrichment

### Dashboard Setup

1. Navigate to the `etl-dashboard` directory
2. Copy `.env.local.example` to `.env.local` and update the values:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_API_KEY=your-secret-api-key-here
   ```
3. Ensure the API key matches the one configured in the backend's `.env` file
4. Install dependencies with `npm install`
5. Start the dashboard with `npm run dev`
6. The dashboard will be available at `http://localhost:3001`

### API Authentication

The dashboard communicates with the backend API using the configured API key. The key is stored in the environment variables and used for all API requests.

For security, the dashboard includes:
- A middleware that protects API routes
- A proxy API endpoint that forwards requests to the backend
- An API test page at `/api-test` to verify authentication

## Architecture

The service follows a modular architecture with these main components:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Extractors │    │ Transformers│    │   Loaders   │
│             │    │             │    │             │
│  - API      │    │  - Cleaner  │    │  - MongoDB  │
│  - MongoDB  │ => │  - Validator│ => │  - Blob     │
│  - Blob     │    │  - Enricher │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                          ↑
                   ┌──────────────┐
                   │   Ollama     │
                   │  (Mistral)   │
                   └──────────────┘
        ┌─────────────────────────────────┐
        │           Orchestrator          │
        └─────────────────────────────────┘
```

- **Extractors**: Fetch data from various sources
  - `apiExtractor.js`: Extract data from REST APIs
  - `mongoExtractor.js`: Extract data from MongoDB
  - `blobExtractor.js`: Extract data from Azure Blob Storage

- **Transformers**: Process and enrich data
  - `dataCleaner.js`: Clean and format data
  - `dataValidator.js`: Validate data against schemas
  - `dataEnricher.js`: Enrich data using Ollama/Mistral

- **Loaders**: Save data to destinations
  - `mongoLoader.js`: Load data to MongoDB
  - `blobLoader.js`: Load data to Azure Blob Storage

- **Orchestrator**: Coordinate the ETL process
  - `orchestratorHandler.js`: Manage the entire ETL pipeline

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or remote)
- Ollama with the Mistral model
- Azure Subscription (for deployment)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/serverless-etl-genai.git
   cd serverless-etl-genai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install and run Ollama with Mistral:
   - Visit [Ollama's website](https://ollama.ai/) to download and install Ollama
   - Pull the Mistral model:
     ```bash
     ollama pull mistral
     ```
   - Run Ollama server:
     ```bash
     ollama serve
     ```
   - Verify it's working:
     ```bash
     curl -X POST http://localhost:11434/api/generate -d '{"model": "mistral", "prompt": "Hello, how are you?", "stream": false}'
     ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

## Configuration

Create or edit the `.env` file with the following variables:

```
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/etl-genai

# Ollama Configuration
OLLAMA_ENDPOINT=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral
OLLAMA_MAX_TOKENS=2048
OLLAMA_TEMPERATURE=0.5

# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=etl-data

# Azure Function Configuration
AZURE_SUBSCRIPTION_ID=your_azure_subscription_id
AZURE_RESOURCE_GROUP=serverless-etl-genai-rg
AZURE_APP_NAME=serverless-etl-genai

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info
PORT=3000

# ETL Configuration
ETL_BATCH_SIZE=100
ETL_RETRY_ATTEMPTS=3
ETL_RETRY_DELAY=1000

# API Configuration
API_KEY=your_api_key_here
REQUIRE_AUTH=false
```

## Local Development

After installation and configuration:

1. Start the local development server:
   ```bash
   npm run dev
   ```

2. The server will be available at http://localhost:3000 with these endpoints:
   - GET /health - Health check endpoint
   - POST /extract - Extract data from sources
   - POST /transform - Transform and enrich data
   - POST /load - Load data to destinations
   - POST /orchestrate - Run the complete ETL pipeline

3. Access the documentation at http://localhost:3000/docs

## Usage

### Health Check

Check if the service is running and verify Ollama availability:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "OK",
  "message": "Service is running",
  "ollama": "available",
  "timestamp": "2025-03-21T12:30:45.123Z"
}
```

### Extract

Extract data from various sources:

```bash
curl -X POST http://localhost:3000/extract \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "source": {
      "type": "api",
      "url": "https://jsonplaceholder.typicode.com/users",
      "method": "GET"
    },
    "options": {
      "saveToDb": true
    }
  }'
```

Response:
```json
{
  "success": true,
  "data": [...],
  "recordId": "6094c1c9a8c3e3c6f8d7e2f1"
}
```

### Transform

Transform and enrich data:

```bash
curl -X POST http://localhost:3000/transform \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "data": [
      {"id": 1, "name": "Product A", "description": "A basic product"},
      {"id": 2, "name": "Product B", "description": "Another basic product"}
    ],
    "transformations": {
      "clean": {
        "removeEmpty": true,
        "textFields": ["name", "description"]
      },
      "enrich": {
        "instruction": "Generate a more detailed product description with at least 3 benefits",
        "fields": ["description"]
      }
    }
  }'
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Product A",
      "description": "A premium quality Product A that offers excellent durability, easy maintenance, and superior performance. Designed with the user in mind, this product provides long-lasting value for everyday use."
    },
    {
      "id": 2,
      "name": "Product B",
      "description": "Product B is an innovative solution that saves time, increases efficiency, and simplifies your workflow. Its versatile design makes it perfect for multiple applications while maintaining high quality standards."
    }
  ],
  "transformations": ["clean", "enrich"]
}
```

### Load

Load data to a destination:

```bash
curl -X POST http://localhost:3000/load \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "data": [
      {"id": 1, "name": "Product A", "description": "A premium quality product..."},
      {"id": 2, "name": "Product B", "description": "An innovative solution..."}
    ],
    "destination": {
      "type": "mongodb",
      "collection": "enriched_products",
      "upsert": true,
      "upsertKey": "id"
    }
  }'
```

Response:
```json
{
  "success": true,
  "result": {
    "insertedCount": 2,
    "updatedCount": 0
  }
}
```

### Orchestrate

Run the complete ETL pipeline:

```bash
curl -X POST http://localhost:3000/orchestrate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "source": {
      "type": "api",
      "url": "https://jsonplaceholder.typicode.com/posts"
    },
    "transformations": {
      "clean": {
        "removeEmpty": true
      },
      "enrich": {
        "instruction": "Generate a more engaging title for each post",
        "fields": ["title"]
      }
    },
    "destination": {
      "type": "mongodb",
      "collection": "enriched_posts"
    }
  }'
```

Response:
```json
{
  "success": true,
  "extractResult": {
    "success": true
  },
  "transformResult": {
    "success": true,
    "transformations": ["clean", "enrich"]
  },
  "loadResult": {
    "insertedCount": 100,
    "updatedCount": 0
  },
  "processingDuration": 5230
}
```

## Deployment

### Deploy to Azure Functions

1. Make sure you have the Azure CLI installed and you're authenticated:
   ```bash
   az login
   ```

2. Set up Azure-specific configuration in your `.env` file.

3. Deploy the service:
   ```bash
   npm run deploy
   ```

4. For production deployment:
   ```bash
   npm run deploy:prod
   ```

## API Documentation

The API documentation is available when running the service:

- Local: http://localhost:3000/docs
- Azure: https://your-function-app.azurewebsites.net/docs

## Examples

### Data Enrichment Workflow

This example shows a complete workflow for enriching product data:

```javascript
const axios = require('axios');

async function enrichProducts() {
  const apiUrl = 'http://localhost:3000';
  const apiKey = 'your_api_key_here';
  
  try {
    // Extract product data from an API
    const extractResponse = await axios.post(
      `${apiUrl}/extract`,
      {
        source: {
          type: 'api',
          url: 'https://api.mystore.com/products',
          headers: {
            'Authorization': 'Bearer MY_TOKEN'
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      }
    );
    
    const products = extractResponse.data.data;
    
    // Transform and enrich the products
    const transformResponse = await axios.post(
      `${apiUrl}/transform`,
      {
        data: products,
        transformations: {
          clean: {
            removeEmpty: true,
            textFields: ['name', 'description', 'category'],
            textOptions: {
              trim: true,
              lowercase: false
            }
          },
          enrich: {
            instruction: 'For each product, generate an SEO-friendly description that highlights the key features and benefits, 60-80 words in length.',
            fields: ['description']
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      }
    );
    
    const enrichedProducts = transformResponse.data.data;
    
    // Load the enriched products back to our database
    const loadResponse = await axios.post(
      `${apiUrl}/load`,
      {
        data: enrichedProducts,
        destination: {
          type: 'mongodb',
          collection: 'seo_optimized_products',
          upsert: true,
          upsertKey: 'id'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      }
    );
    
    console.log('Process completed successfully!');
    console.log(`Inserted: ${loadResponse.data.result.insertedCount}`);
    console.log(`Updated: ${loadResponse.data.result.updatedCount}`);
    
  } catch (error) {
    console.error('Error in ETL process:', error.response?.data || error.message);
  }
}

enrichProducts();
```

## Troubleshooting

### Common Issues

1. **404 Not Found errors**
   - Make sure you're using the correct HTTP methods for endpoints
   - Check that your URL paths are correct
   - Use /health endpoint to verify the service is running

2. **Ollama connection issues**
   - Check that Ollama is running with: `curl http://localhost:11434/api/version`
   - Ensure the Mistral model is pulled: `ollama list`
   - Verify the OLLAMA_ENDPOINT in your .env file

3. **MongoDB connection errors**
   - Check that your MongoDB server is running
   - Verify the MONGODB_URI in your .env file
   - Ensure network connectivity to the MongoDB server

4. **Authentication failures**
   - Ensure you're passing the API key with the "X-API-Key" header
   - Check that the API_KEY in your .env file matches what you're sending
   - For development, set REQUIRE_AUTH=false to bypass authentication

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.