const { extractFromApi } = require('../extractors/apiExtractor');
const { extractFromMongo } = require('../extractors/mongoExtractor');
const { extractFromBlob } = require('../extractors/blobExtractor');
const { extractFromFile } = require('../extractors/fileExtractor');
const { _formatErrorResponse } = require('../utils/errorHandler');
const { validateConfig } = require('../config/config');
const logger = require('../utils/logger');
const DataModel = require('../models/dataModel');
const _axios = require('axios');
const { AppError } = require('../utils/errorHandler');
const { _connectToDatabase } = require('../utils/db');
const { _readJsonFile, _readCsvFile } = require('../utils/fileUtils');
const { _getBlobClient } = require('../utils/blobUtils');
const monitor = require('../utils/monitor');

/**
 * Extract data from various sources
 * @param {Object} context - Azure Functions context
 * @param {Object} req - HTTP request
 * @returns {Object} HTTP response
 */
async function extract(context, req) {
  const startTime = Date.now();
  try {
    logger.info('Extracting data...');
    validateConfig();
    
    const { source, options } = req.body || {};
    
    if (!source) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Source configuration is required',
        },
      };
    }
    
    if (!source.type) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Source type is required',
        },
      };
    }
    
    let extractedData;
    let sourceDetails;
    
    // Extract data based on source type
    switch (source.type) {
      case 'api':
        if (!source.url) {
          return {
            status: 400,
            body: {
              success: false,
              error: 'API URL is required',
            },
          };
        }
        
        sourceDetails = {
          url: source.url,
          method: source.method || 'GET',
        };
        
        extractedData = await extractFromApi(source);
        break;
        
      case 'mongodb':
        if (!source.collection) {
          return {
            status: 400,
            body: {
              success: false,
              error: 'MongoDB collection name is required',
            },
          };
        }
        
        sourceDetails = {
          collection: source.collection,
          query: source.query || {},
        };
        
        extractedData = await extractFromMongo(source);
        break;
        
      case 'blob':
        if (!source.blobName) {
          return {
            status: 400,
            body: {
              success: false,
              error: 'Blob name is required',
            },
          };
        }
        
        sourceDetails = {
          containerName: source.containerName,
          blobName: source.blobName,
        };
        
        extractedData = await extractFromBlob(source);
        break;
        
      case 'file':
        extractedData = await extractFromFile(source);
        break;
        
      default:
        return {
          status: 400,
          body: {
            success: false,
            error: `Unsupported source type: ${source.type}`,
          },
        };
    }
    
    // Create a record in the database
    if (options?.saveToDb !== false) {
      try {
        const dataRecord = new DataModel({
          raw: extractedData,
          status: 'extracted',
          source: {
            type: source.type,
            name: source.name || source.type,
            details: sourceDetails,
          },
          destination: options?.destination || 'mongodb',
        });
        
        await dataRecord.save();
        
        logger.info(`Saved extracted data to database with ID: ${dataRecord._id}`);
        
        return {
          status: 200,
          body: {
            success: true,
            data: extractedData,
            recordId: dataRecord._id,
          },
        };
      } catch (dbError) {
        logger.error(`Error saving extracted data to database: ${dbError.message}`);
        
        return {
          status: 200,
          body: {
            success: true,
            data: extractedData,
            warning: 'Failed to save data to database',
          },
        };
      }
    }
    
    logger.info('Successfully extracted data');
    
    const _duration = Date.now() - startTime;
    logger.info(`Data extraction completed in ${_duration}ms`);
    
    return {
      status: 200,
      body: {
        success: true,
        data: extractedData,
        source: source.type,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const _duration = Date.now() - startTime;
    logger.error(`Error extracting data: ${error.message}`);
    monitor.trackError(error, 'extract');
    
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return {
      status: statusCode,
      body: {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Detect format from file path
 * @param {string} filePath - File path
 * @returns {string} Format (json, csv, etc.)
 */
function detectFormatFromPath(filePath) {
  if (filePath.endsWith('.json')) {
    return 'json';
  } else if (filePath.endsWith('.csv')) {
    return 'csv';
  } else {
    throw new AppError(`Unable to detect format from file path: ${filePath}`, 400);
  }
}

/**
 * Convert stream to buffer
 * @param {ReadableStream} readableStream - Readable stream
 * @returns {Promise<Buffer>} Buffer
 */
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', data => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

module.exports = {
  extract,
  detectFormatFromPath,
  streamToBuffer,
}; 