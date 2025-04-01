/**
 * Azure Blob Storage Utilities
 */
const { BlobServiceClient } = require('@azure/storage-blob');
const logger = require('./logger');
const { AppError } = require('./errorHandler');
const { config } = require('../config/config');

// Cached blob service client
let blobServiceClient = null;

/**
 * Get a Blob Service Client
 * @returns {Promise<BlobServiceClient>} The blob service client
 */
async function getBlobServiceClient() {
  if (blobServiceClient) {
    return blobServiceClient;
  }

  const connectionString = config.azureStorage.connectionString;
  if (!connectionString) {
    throw new AppError('Azure Storage connection string is not configured', 500);
  }

  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    return blobServiceClient;
  } catch (error) {
    logger.error(`Error creating blob service client: ${error.message}`);
    throw new AppError(`Failed to create blob service client: ${error.message}`, 500);
  }
}

/**
 * Get a Blob Client for operations
 * @param {string} containerName - The container name
 * @param {string} blobName - The blob name
 * @returns {Promise<BlobClient>} The blob client
 */
async function getBlobClient(containerName, blobName) {
  try {
    const serviceClient = await getBlobServiceClient();
    const containerClient = serviceClient.getContainerClient(containerName);

    // Check if container exists, create if it doesn't
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      logger.info(`Container "${containerName}" does not exist, creating...`);
      await containerClient.create();
      logger.info(`Container "${containerName}" created successfully`);
    }

    return containerClient.getBlockBlobClient(blobName);
  } catch (error) {
    logger.error(`Error getting blob client: ${error.message}`);
    throw new AppError(`Failed to get blob client: ${error.message}`, 500);
  }
}

/**
 * List blobs in a container
 * @param {string} containerName - The container name
 * @param {Object} options - List options
 * @returns {Promise<Array>} Array of blob items
 */
async function listBlobs(containerName, options = {}) {
  try {
    const serviceClient = await getBlobServiceClient();
    const containerClient = serviceClient.getContainerClient(containerName);

    const containerExists = await containerClient.exists();
    if (!containerExists) {
      logger.warn(`Container "${containerName}" does not exist`);
      return [];
    }

    const blobs = [];
    const iterator = containerClient.listBlobsFlat(options);
    let blobItem = await iterator.next();
    
    while (!blobItem.done) {
      blobs.push(blobItem.value);
      blobItem = await iterator.next();
    }

    return blobs;
  } catch (error) {
    logger.error(`Error listing blobs: ${error.message}`);
    throw new AppError(`Failed to list blobs: ${error.message}`, 500);
  }
}

/**
 * Delete a blob
 * @param {string} containerName - The container name
 * @param {string} blobName - The blob name
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteBlob(containerName, blobName) {
  try {
    const blobClient = await getBlobClient(containerName, blobName);
    const response = await blobClient.deleteIfExists();
    
    if (response.succeeded) {
      logger.info(`Blob "${containerName}/${blobName}" deleted successfully`);
      return true;
    } else {
      logger.warn(`Blob "${containerName}/${blobName}" not found`);
      return false;
    }
  } catch (error) {
    logger.error(`Error deleting blob: ${error.message}`);
    throw new AppError(`Failed to delete blob: ${error.message}`, 500);
  }
}

module.exports = {
  getBlobServiceClient,
  getBlobClient,
  listBlobs,
  deleteBlob,
}; 