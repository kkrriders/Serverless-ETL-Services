const { loadToMongo } = require('../loaders/mongoLoader');
const { loadToBlob } = require('../loaders/blobLoader');
const { formatErrorResponse } = require('../utils/errorHandler');
const { validateConfig } = require('../config/config');
const logger = require('../utils/logger');
const DataModel = require('../models/dataModel');

/**
 * Load data to various destinations
 * @param {Object} context - Azure Functions context
 * @param {Object} req - HTTP request
 * @returns {Object} HTTP response
 */
async function load(context, req) {
  try {
    logger.info('Loading data...');
    validateConfig();
    
    const { data, recordId, destination, options } = req.body || {};
    
    if (!data && !recordId) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Data or recordId is required',
        },
      };
    }
    
    if (!destination) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Destination configuration is required',
        },
      };
    }
    
    if (!destination.type) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Destination type is required',
        },
      };
    }
    
    let sourceData;
    let dataRecord;
    
    // Get data from the database if recordId is provided
    if (recordId) {
      try {
        dataRecord = await DataModel.findById(recordId);
        
        if (!dataRecord) {
          return {
            status: 404,
            body: {
              success: false,
              error: `Record not found with ID: ${recordId}`,
            },
          };
        }
        
        // Use transformed data if available, otherwise use raw data
        sourceData = dataRecord.transformed || dataRecord.raw;
      } catch (dbError) {
        logger.error(`Error retrieving data from database: ${dbError.message}`);
        
        return {
          status: 500,
          body: {
            success: false,
            error: `Error retrieving data from database: ${dbError.message}`,
          },
        };
      }
    } else {
      sourceData = data;
    }
    
    if (!sourceData) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'No data to load',
        },
      };
    }
    
    let loadResult;
    
    // Load data based on destination type
    switch (destination.type) {
      case 'mongodb':
        loadResult = await loadToMongo(sourceData, {
          collection: destination.collection,
          batchSize: destination.batchSize || 100,
          upsert: destination.upsert || false,
          upsertKey: destination.upsertKey || '_id',
        });
        break;
        
      case 'blob':
        if (!destination.blobName) {
          return {
            status: 400,
            body: {
              success: false,
              error: 'Blob name is required',
            },
          };
        }
        
        loadResult = await loadToBlob(sourceData, {
          containerName: destination.containerName,
          blobName: destination.blobName,
          format: destination.format || 'json',
          contentType: destination.contentType,
          overwrite: destination.overwrite !== false,
        });
        break;
        
      default:
        return {
          status: 400,
          body: {
            success: false,
            error: `Unsupported destination type: ${destination.type}`,
          },
        };
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
        
        return {
          status: 200,
          body: {
            success: true,
            result: loadResult,
            warning: 'Failed to update data in database',
          },
        };
      }
    }
    
    logger.info('Successfully loaded data');
    
    return {
      status: 200,
      body: {
        success: true,
        result: loadResult,
        recordId: dataRecord?._id,
      },
    };
  } catch (error) {
    logger.error(`Error loading data: ${error.message}`);
    
    return {
      status: error.statusCode || 500,
      body: formatErrorResponse(error),
    };
  }
}

module.exports = { load }; 