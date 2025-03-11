const { extractFromApi } = require('../extractors/apiExtractor');
const { extractFromMongo } = require('../extractors/mongoExtractor');
const { extractFromBlob } = require('../extractors/blobExtractor');
const { formatErrorResponse } = require('../utils/errorHandler');
const { validateConfig } = require('../config/config');
const logger = require('../utils/logger');
const DataModel = require('../models/dataModel');

/**
 * Extract data from various sources
 * @param {Object} context - Azure Functions context
 * @param {Object} req - HTTP request
 * @returns {Object} HTTP response
 */
async function extract(context, req) {
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
        
        extractedData = await extractFromApi({
          url: source.url,
          method: source.method || 'GET',
          headers: source.headers || {},
          params: source.params || {},
          data: source.data || {},
          timeout: source.timeout || 10000,
        });
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
        
        extractedData = await extractFromMongo({
          collection: source.collection,
          query: source.query || {},
          projection: source.projection || {},
          sort: source.sort || {},
          limit: source.limit || 0,
          skip: source.skip || 0,
        });
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
        
        extractedData = await extractFromBlob({
          containerName: source.containerName,
          blobName: source.blobName,
        });
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
    
    return {
      status: 200,
      body: {
        success: true,
        data: extractedData,
      },
    };
  } catch (error) {
    logger.error(`Error extracting data: ${error.message}`);
    
    return {
      status: error.statusCode || 500,
      body: formatErrorResponse(error),
    };
  }
}

module.exports = { extract }; 