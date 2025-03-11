const { BlobServiceClient } = require('@azure/storage-blob');
const logger = require('../utils/logger');
const { config } = require('../config/config');

/**
 * Extract data from Azure Blob Storage
 * @param {Object} options - Blob extraction options
 * @param {string} options.containerName - Blob container name
 * @param {string} options.blobName - Blob name
 * @returns {Promise<Object>} The extracted data
 */
async function extractFromBlob(options) {
  try {
    const { containerName = config.azureStorage.containerName, blobName } = options;

    if (!containerName) {
      throw new Error('Blob container name is required');
    }

    if (!blobName) {
      throw new Error('Blob name is required');
    }

    logger.info(`Extracting data from blob: ${containerName}/${blobName}`);

    // Create the BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      config.azureStorage.connectionString
    );

    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Get a reference to the blob
    const blobClient = containerClient.getBlobClient(blobName);

    // Download the blob content
    const downloadBlockBlobResponse = await blobClient.download();
    
    // Get the blob content as text
    const content = await streamToString(downloadBlockBlobResponse.readableStreamBody);

    // Parse the content based on file type
    const fileExtension = blobName.split('.').pop().toLowerCase();
    let parsedContent;

    switch (fileExtension) {
      case 'json':
        parsedContent = JSON.parse(content);
        break;
      case 'csv':
        parsedContent = parseCSV(content);
        break;
      case 'txt':
        parsedContent = content;
        break;
      default:
        parsedContent = content;
    }

    logger.info(`Successfully extracted data from blob: ${containerName}/${blobName}`);

    return {
      content: parsedContent,
      metadata: {
        containerName,
        blobName,
        fileExtension,
      },
    };
  } catch (error) {
    logger.error(`Error extracting data from blob: ${error.message}`);
    throw error;
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
      config.azureStorage.connectionString
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
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
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
function parseCSV(content) {
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