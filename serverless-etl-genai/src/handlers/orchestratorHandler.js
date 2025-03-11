const { extract } = require('./extractHandler');
const { transform } = require('./transformHandler');
const { load } = require('./loadHandler');
const { formatErrorResponse } = require('../utils/errorHandler');
const { validateConfig } = require('../config/config');
const logger = require('../utils/logger');

/**
 * Orchestrate the ETL process
 * @param {Object} context - Azure Functions context
 * @param {Object} req - HTTP request
 * @returns {Object} HTTP response
 */
async function orchestrate(context, req) {
  try {
    logger.info('Orchestrating ETL process...');
    validateConfig();
    
    const { source, transformations, destination, options } = req.body || {};
    
    if (!source || !source.type) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Source configuration is required',
        },
      };
    }
    
    if (!destination || !destination.type) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Destination configuration is required',
        },
      };
    }
    
    const startTime = Date.now();
    
    // Step 1: Extract data
    logger.info('Step 1: Extracting data...');
    const extractRequest = {
      body: {
        source,
        options: {
          saveToDb: options?.saveIntermediateResults !== false,
        },
      },
    };
    
    const extractResponse = await extract(context, extractRequest);
    
    if (extractResponse.status !== 200 || !extractResponse.body.success) {
      logger.error('Extract step failed');
      return extractResponse;
    }
    
    logger.info('Extract step completed successfully');
    
    const extractedData = extractResponse.body.data;
    const recordId = extractResponse.body.recordId;
    
    // Step 2: Transform data
    logger.info('Step 2: Transforming data...');
    const transformRequest = {
      body: {
        data: extractedData,
        recordId,
        transformations,
        options: {
          saveToDb: options?.saveIntermediateResults !== false,
        },
      },
    };
    
    const transformResponse = await transform(context, transformRequest);
    
    if (transformResponse.status !== 200 || !transformResponse.body.success) {
      logger.error('Transform step failed');
      return transformResponse;
    }
    
    logger.info('Transform step completed successfully');
    
    const transformedData = transformResponse.body.data;
    const transformRecordId = transformResponse.body.recordId || recordId;
    
    // Step 3: Load data
    logger.info('Step 3: Loading data...');
    const loadRequest = {
      body: {
        data: transformedData,
        recordId: transformRecordId,
        destination,
      },
    };
    
    const loadResponse = await load(context, loadRequest);
    
    if (loadResponse.status !== 200 || !loadResponse.body.success) {
      logger.error('Load step failed');
      return loadResponse;
    }
    
    logger.info('Load step completed successfully');
    
    const endTime = Date.now();
    const processingDuration = endTime - startTime;
    
    logger.info(`ETL process completed in ${processingDuration}ms`);
    
    return {
      status: 200,
      body: {
        success: true,
        extractResult: {
          success: extractResponse.body.success,
        },
        transformResult: {
          success: transformResponse.body.success,
          transformations: transformResponse.body.transformations,
        },
        loadResult: loadResponse.body.result,
        recordId: loadResponse.body.recordId,
        processingDuration,
      },
    };
  } catch (error) {
    logger.error(`Error orchestrating ETL process: ${error.message}`);
    
    return {
      status: error.statusCode || 500,
      body: formatErrorResponse(error),
    };
  }
}

// If running this file directly
if (require.main === module) {
  // Set up environment variables for local development
  require('dotenv').config();
  
  // Example usage
  const exampleReq = {
    body: {
      source: {
        type: 'api',
        url: 'https://jsonplaceholder.typicode.com/users',
      },
      transformations: {
        clean: {
          removeEmpty: true,
          textFields: ['name', 'email', 'phone'],
          textOptions: {
            trim: true,
            lowercase: false,
          },
        },
        enrich: {
          instruction: 'Add a personalized greeting for each user based on their name.',
          fields: ['name'],
        },
      },
      destination: {
        type: 'mongodb',
        collection: 'enriched_users',
      },
    },
  };
  
  // Run the orchestrator
  orchestrate({}, exampleReq)
    .then(response => {
      console.log('Example ETL process response:', JSON.stringify(response, null, 2));
    })
    .catch(error => {
      console.error('Example ETL process error:', error);
    });
}

module.exports = { orchestrate }; 