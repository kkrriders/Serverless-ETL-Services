const { loadToMongo } = require('../loaders/mongoLoader');
const { loadToBlob } = require('../loaders/blobLoader');
const { loadToFile } = require('../loaders/fileLoader');
const { formatErrorResponse } = require('../utils/errorHandler');
const { validateConfig } = require('../config/config');
const logger = require('../utils/logger');
const DataModel = require('../models/dataModel');
const { AppError } = require('../utils/errorHandler');
const { connectToDatabase } = require('../utils/db');
const { writeJsonFile, writeCsvFile } = require('../utils/fileUtils');
const { getBlobClient } = require('../utils/blobUtils');
const monitor = require('../utils/monitor');

/**
 * Load data to various destinations
 * @param {Object} context - Azure Functions context
 * @param {Object} req - HTTP request
 * @returns {Object} HTTP response
 */
async function load(context, req) {
  const startTime = Date.now();
  try {
    logger.info('Loading data...');
    validateConfig();
    
    const { data, recordId, destination, options } = req.body || {};
    
    if (!data && !recordId) {
      throw new AppError('Data or recordId is required', 400);
    }
    
    if (!destination) {
      throw new AppError('Destination configuration is required', 400);
    }
    
    if (!destination.type) {
      throw new AppError('Destination type is required', 400);
    }
    
    let sourceData;
    let dataRecord;
    
    // Get data from the database if recordId is provided
    if (recordId) {
      try {
        dataRecord = await DataModel.findById(recordId);
        
        if (!dataRecord) {
          throw new AppError(`Record not found with ID: ${recordId}`, 404);
        }
        
        // Use transformed data if available, otherwise use raw data
        sourceData = dataRecord.transformed || dataRecord.raw;
      } catch (dbError) {
        logger.error(`Error retrieving data from database: ${dbError.message}`);
        
        throw new AppError(`Error retrieving data from database: ${dbError.message}`, 500);
      }
    } else {
      sourceData = data;
    }
    
    if (!sourceData) {
      throw new AppError('No data to load', 400);
    }
    
    let loadResult;
    
    // Load data based on destination type
    switch (destination.type) {
      case 'mongodb':
        loadResult = await loadToMongo(sourceData, destination);
        break;
      case 'blob':
        loadResult = await loadToBlob(sourceData, destination);
        break;
      case 'file':
        loadResult = await loadToFile(sourceData, destination);
        break;
      default:
        throw new AppError(`Unsupported destination type: ${destination.type}`, 400);
    }
    
    // Update the record in the database if recordId is provided
    if (dataRecord) {
      try {
        dataRecord.status = 'loaded';
        dataRecord.metadata = {
          ...dataRecord.metadata,
          loadResult,
          processedAt: new Date(),
        };
        
        await dataRecord.save();
        
        logger.info(`Updated loaded data in database for record ID: ${recordId}`);
      } catch (dbError) {
        logger.error(`Error updating loaded data in database: ${dbError.message}`);
        
        throw new AppError('Failed to update data in database', 200);
      }
    }
    
    // Log success
    const duration = Date.now() - startTime;
    logger.info(`Data loading completed in ${duration}ms`);
    
    return {
      status: 200,
      body: {
        success: true,
        result: loadResult,
        recordId: dataRecord?._id,
        destination: destination.type,
        timestamp: new Date().toISOString()
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Error loading data: ${error.message}`);
    monitor.trackError(error, 'load');

    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return {
      status: statusCode,
      body: {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Detect format from file path
 * @param {string} filePath - File path to detect format from
 * @returns {string} Format (json, csv, etc.)
 */
function detectFormatFromPath(filePath) {
  const extension = filePath.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    case 'txt':
      return 'txt';
    default:
      return 'json'; // Default to JSON
  }
}

module.exports = {
  load,
  detectFormatFromPath
}; 