# Serverless ETL Service with Generative AI

A serverless ETL (Extract, Transform, Load) service with generative AI capabilities built on Azure Functions, MongoDB, and Ollama with the Mistral model.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Local Development](#local-development)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Extract](#extract)
  - [Transform](#transform)
  - [Load](#load)
  - [Orchestrate](#orchestrate)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Overview

This service provides a scalable, serverless ETL pipeline with integrated generative AI capabilities. It allows you to extract data from various sources, transform and enrich it using AI, and load it into different destinations.

## Features

- **Serverless Architecture**: Built on Azure Functions for scalable, event-driven processing
- **Flexible Data Sources**: Extract data from APIs, MongoDB, and Azure Blob Storage
- **Powerful Transformations**: Clean, validate, and transform data
- **Generative AI Integration**: Enrich data using Ollama with the Mistral model
- **Multiple Destinations**: Load data to MongoDB or Azure Blob Storage
- **End-to-End Pipeline**: Orchestrated ETL process or individual components

## Architecture

The service follows a modular architecture with these main components:

- **Extractors**: Fetch data from various sources
- **Transformers**: Process and enrich data
- **Loaders**: Save data to destinations
- **Orchestrator**: Coordinate the ETL process

## Prerequisites

- Node.js (v14 or higher)
- Azure Subscription
- MongoDB Database
- Ollama running locally or remotely with the Mistral model

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

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. Install and run Ollama with Mistral:
   - Visit [Ollama's website](https://ollama.ai/) to download and install Ollama
   - Pull the Mistral model:
     ```bash
     ollama pull mistral
     ```
   - Run Ollama server:
     ```bash
     ollama serve
     ```
   - Verify it's working by testing the model:
     ```bash
     curl -X POST http://localhost:11434/api/generate -d '{"model": "mistral", "prompt": "Hello, how are you?", "stream": false}'
     ```

## Local Development

After installation, you can run the project locally:

1. Start the local development server:
   ```bash
   npm run dev
   ```

2. The server will be available at http://localhost:3000 with these endpoints:
   - POST /extract
   - POST /transform
   - POST /load
   - POST /orchestrate

3. You can test the functionality using tools like curl, Postman, or any HTTP client.

Example using curl:
```bash
curl -X POST http://localhost:3000/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "source": {
      "type": "api",
      "url": "https://jsonplaceholder.typicode.com/users"
    },
    "transformations": {
      "clean": {
        "removeEmpty": true
      },
      "enrich": {
        "instruction": "Generate a personalized greeting for each user",
        "fields": ["name"]
      }
    },
    "destination": {
      "type": "mongodb",
      "collection": "enriched_users"
    }
  }'
```

## Configuration

Create a `.env` file with the following variables:

```
# MongoDB Configuration
MONGODB_URI=mongodb://username:password@hostname:port/database

# Ollama Configuration
OLLAMA_ENDPOINT=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral
OLLAMA_MAX_TOKENS=2048
OLLAMA_TEMPERATURE=0.5

# Azure Configuration
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=etl-data

# Azure Function Configuration
AZURE_SUBSCRIPTION_ID=your_azure_subscription_id
AZURE_RESOURCE_GROUP=serverless-etl-genai-rg
AZURE_APP_NAME=serverless-etl-genai

# Application Configuration
NODE_ENV=development
```

## Usage

### Extract

Extract data from various sources:

```json
POST /extract
{
  "source": {
    "type": "api",
    "url": "https://api.example.com/data",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer token"
    }
  },
  "options": {
    "saveToDb": true
  }
}
```

### Transform

Transform and enrich data:

```json
POST /transform
{
  "data": [...] || "recordId": "record-id-from-extract",
  "transformations": {
    "clean": {
      "removeEmpty": true,
      "dateFields": ["createdAt", "updatedAt"],
      "textFields": ["name", "description"]
    },
    "enrich": {
      "instruction": "Analyze the sentiment of each review and add a sentiment score.",
      "fields": ["content"]
    },
    "validate": {
      "schema": {
        "required": ["id", "name"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" }
        }
      }
    }
  }
}
```

### Load

Load data to a destination:

```json
POST /load
{
  "data": [...] || "recordId": "record-id-from-transform",
  "destination": {
    "type": "mongodb",
    "collection": "processed_data",
    "upsert": true,
    "upsertKey": "id"
  }
}
```

### Orchestrate

Run the complete ETL pipeline:

```json
POST /orchestrate
{
  "source": {
    "type": "api",
    "url": "https://api.example.com/data"
  },
  "transformations": {
    "clean": { "removeEmpty": true },
    "enrich": {
      "instruction": "Generate a summary for each item.",
      "fields": ["description"]
    }
  },
  "destination": {
    "type": "blob",
    "containerName": "processed-data",
    "blobName": "enriched-data.json"
  },
  "options": {
    "saveIntermediateResults": true
  }
}
```

## Examples

### Basic Example

```javascript
const axios = require('axios');

// Extract data from API
const response = await axios.post('https://your-function-app.azurewebsites.net/api/orchestrate', {
  source: {
    type: 'api',
    url: 'https://jsonplaceholder.typicode.com/posts'
  },
  transformations: {
    clean: {
      removeEmpty: true
    },
    enrich: {
      instruction: 'Generate a more engaging title for each post.',
      fields: ['title']
    }
  },
  destination: {
    type: 'mongodb',
    collection: 'enriched_posts'
  }
});

console.log(response.data);
```

### GenAI Enrichment Example

```javascript
// Enrich product descriptions
const response = await axios.post('https://your-function-app.azurewebsites.net/api/transform', {
  data: [
    { id: 1, name: 'Widget', description: 'A basic widget.' },
    { id: 2, name: 'Gadget', description: 'A simple gadget.' }
  ],
  transformations: {
    enrich: {
      instruction: 'Expand the product description to be more detailed and appealing to customers. Include at least 3 key benefits.',
      fields: ['description']
    }
  }
});

console.log(response.data);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.