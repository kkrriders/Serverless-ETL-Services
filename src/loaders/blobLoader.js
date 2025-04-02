const { BlobServiceClient } = require('@azure/storage-blob');
const logger = require('../utils/logger');
const { config } = require('../config/config');

/**
 * Load data to Azure Blob Storage
 * @param {Object|Array|string} data - The data to load
 * @param {Object} options - Loading options
 * @returns {Promise<Object>} Loading result
 */
async function loadToBlob(data, options = {}) {
  try {
    const {
      containerName = config.azureStorage.containerName,
      blobName,
      contentType = 'application/json',
      format = 'json',
      _overwrite = true,
    } = options;

    if (!containerName) {
      throw new Error('Blob container name is required');
    }

    if (!blobName) {
      throw new Error('Blob name is required');
    }

    logger.info(`Loading data to blob: ${containerName}/${blobName}`);

    // Create the BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      config.azureStorage.connectionString,
    );

    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create the container if it doesn't exist
    try {
      await containerClient.createIfNotExists();
    } catch (error) {
      logger.warn(`Error creating container: ${error.message}`);
    }

    // Get a blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Convert data to the specified format
    let content;
    let finalContentType = contentType;

    switch (format.toLowerCase()) {
      case 'json':
        content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        finalContentType = 'application/json';
        break;
      case 'csv':
        content = typeof data === 'string' ? data : convertToCSV(data);
        finalContentType = 'text/csv';
        break;
      case 'text':
        content = typeof data === 'string' ? data : JSON.stringify(data);
        finalContentType = 'text/plain';
        break;
      default:
        content = typeof data === 'string' ? data : JSON.stringify(data);
    }

    // Upload the data
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: finalContentType,
      },
    };

    const uploadResponse = await blockBlobClient.upload(content, content.length, uploadOptions);

    logger.info(`Successfully loaded data to blob: ${containerName}/${blobName}`);

    return {
      success: true,
      etag: uploadResponse.etag,
      url: blockBlobClient.url,
    };
  } catch (error) {
    logger.error(`Error loading data to blob: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Convert data to CSV format
 * @param {Array<Object>} data - The data to convert
 * @returns {string} The CSV string
 */
function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create CSV data rows
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      
      // Handle different types of values
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'object') {
        // Convert objects to JSON strings
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } else if (typeof value === 'string') {
        // Escape quotes in strings
        return `"${value.replace(/"/g, '""')}"`;
      } else {
        return value;
      }
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...rows].join('\n');
}

module.exports = {
  loadToBlob,
}; 