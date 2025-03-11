# Serverless ETL Service with Generative AI

A serverless ETL (Extract, Transform, Load) service with generative AI capabilities built on Azure Functions, MongoDB, and OpenAI.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
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
- **Generative AI Integration**: Enrich data using OpenAI's powerful models
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
- OpenAI API Key

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

## Configuration

Create a `.env` file with the following variables:

```
# MongoDB Configuration
MONGODB_URI=mongodb://username:password@hostname:port/database

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

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