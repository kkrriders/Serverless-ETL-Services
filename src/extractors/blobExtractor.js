/**
 * Blob Storage Extractor
 * Module to extract data from Azure Blob Storage
 */
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');
const { getBlobClient } = require('../utils/blobUtils');
const monitor = require('../utils/monitor');
const { BlobServiceClient } = require('@azure/storage-blob');
const config = require('../config/config');

/**
 * Extract data from Azure Blob Storage
 * @param {Object} source - Source configuration
 * @returns {Promise<Object>} Extracted data
 */
async function extractFromBlob(source) {
  const startTime = Date.now();
  
  try {
    if (!source.containerName || !source.blobName) {
      throw new AppError('Blob source must include containerName and blobName', 400);
    }

    logger.info(`Extracting data from blob: ${source.containerName}/${source.blobName}`);

    const blobClient = await getBlobClient(source.containerName, source.blobName);
    
    try {
      // Check if blob exists
      const properties = await blobClient.getProperties();
      logger.debug(`Blob found: ${source.blobName} (${properties.contentLength} bytes)`);
    } catch (error) {
      if (error.statusCode === 404) {
        throw new AppError(`Blob not found: ${source.containerName}/${source.blobName}`, 404);
      }
      throw error;
    }
    
    // Download the blob
    const downloadResponse = await blobClient.download();
    
    // Convert the stream to buffer
    const buffers = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      buffers.push(chunk);
    }
    
    const content = Buffer.concat(buffers);
    const contentString = content.toString();
    
    // Determine content type and parse accordingly
    const contentType = downloadResponse.contentType || '';
    let data;
    
    if (contentType.includes('json') || source.format === 'json') {
      try {
        data = JSON.parse(contentString);
        logger.info(`Successfully parsed JSON data from blob (${content.length} bytes)`);
      } catch (parseError) {
        throw new AppError(`Failed to parse JSON data from blob: ${parseError.message}`, 400);
      }
    } else if (contentType.includes('csv') || source.format === 'csv') {
      // For CSV, we'll return the raw content for now - the caller can use a CSV parser
      data = { content: contentString, format: 'csv' };
      logger.info(`Extracted CSV data from blob (${content.length} bytes)`);
    } else {
      // For other types, return raw content
      data = { content: contentString };
      logger.info(`Extracted raw data from blob (${content.length} bytes)`);
    }
    
    const duration = Date.now() - startTime;
    logger.info(`Blob extraction completed in ${duration}ms`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Blob extraction failed in ${duration}ms: ${error.message}`);
    
    // Track error
    monitor.trackError(error, 'blobExtractor');
    
    if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError(`Blob extraction failed: ${error.message}`, 500);
    }
  }
}

/**
 * List blobs in a container
 * @param {Object} options - Blob listing options
 * @param {string} options.containerName - Blob container name
 * @param {string} options.prefix - Blob name prefix
 * @returns {Promise<Array<string>>} List of blob names
 */
async function listBlobs(options) {
  try {
    const { containerName = config.azureStorage.containerName, prefix = '' } = options;

    if (!containerName) {
      throw new Error('Blob container name is required');
    }

    logger.info(`Listing blobs in container: ${containerName}`);

    // Create the BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      config.azureStorage.connectionString,
    );

    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // List the blobs
    const blobs = [];
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobs.push(blob.name);
    }

    logger.info(`Found ${blobs.length} blobs in container: ${containerName}`);

    return blobs;
  } catch (error) {
    logger.error(`Error listing blobs: ${error.message}`);
    throw error;
  }
}

/**
 * Convert a stream to a string
 * @param {ReadableStream} readableStream - The readable stream
 * @returns {Promise<string>} The stream content as a string
 */
async function _streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', data => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}

/**
 * Parse CSV content
 * @param {string} content - CSV content
 * @returns {Array<Object>} Parsed CSV data
 */
function _parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',').map(value => value.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {});
  });
}

module.exports = {
  extractFromBlob,
  listBlobs,
}; 