const { cleanData } = require('../transformers/dataCleaner');
const { enrichData, generateSummaries, categorizeData } = require('../transformers/dataEnricher');
const { validateData } = require('../transformers/dataValidator');
const { formatErrorResponse } = require('../utils/errorHandler');
const { validateConfig } = require('../config/config');
const logger = require('../utils/logger');
const DataModel = require('../models/dataModel');
const mongoose = require('mongoose');

/**
 * Transform data using various transformers
 * @param {Object} context - Azure Functions context
 * @param {Object} req - HTTP request
 * @returns {Object} HTTP response
 */
async function transform(context, req) {
  try {
    logger.info('Transforming data...');
    validateConfig();
    
    const { data, recordId, transformations, options } = req.body || {};
    
    if (!data && !recordId) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Data or recordId is required',
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
        
        sourceData = dataRecord.raw;
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
          error: 'No data to transform',
        },
      };
    }
    
    // Apply transformations
    let transformedData = sourceData;
    const transformationResults = {};
    
    if (transformations) {
      // Clean data
      if (transformations.clean) {
        try {
          logger.info('Applying data cleaning transformation...');
          transformedData = cleanData(transformedData, transformations.clean);
          transformationResults.clean = { applied: true };
        } catch (error) {
          logger.error(`Error cleaning data: ${error.message}`);
          transformationResults.clean = { applied: false, error: error.message };
        }
      }
      
      // Validate data
      if (transformations.validate) {
        try {
          logger.info('Applying data validation transformation...');
          const validationResult = validateData(
            transformedData,
            transformations.validate.schema,
            transformations.validate.removeInvalid
          );
          
          transformationResults.validate = {
            applied: true,
            isValid: validationResult.isValid,
            invalidCount: validationResult.invalidItems?.length || 0,
          };
          
          // Update transformed data if removeInvalid is true
          if (transformations.validate.removeInvalid) {
            transformedData = validationResult.data;
          }
        } catch (error) {
          logger.error(`Error validating data: ${error.message}`);
          transformationResults.validate = { applied: false, error: error.message };
        }
      }
      
      // Enrich data
      if (transformations.enrich) {
        try {
          logger.info('Applying data enrichment transformation...');
          transformedData = await enrichData(transformedData, transformations.enrich);
          transformationResults.enrich = { applied: true };
        } catch (error) {
          logger.error(`Error enriching data: ${error.message}`);
          transformationResults.enrich = { applied: false, error: error.message };
        }
      }
      
      // Generate summaries
      if (transformations.summarize) {
        try {
          logger.info('Applying summarization transformation...');
          transformedData = await generateSummaries(
            transformedData,
            transformations.summarize.fields,
            transformations.summarize.maxLength
          );
          transformationResults.summarize = { applied: true };
        } catch (error) {
          logger.error(`Error generating summaries: ${error.message}`);
          transformationResults.summarize = { applied: false, error: error.message };
        }
      }
      
      // Categorize data
      if (transformations.categorize) {
        try {
          logger.info('Applying categorization transformation...');
          transformedData = await categorizeData(
            transformedData,
            transformations.categorize.categories,
            transformations.categorize.field
          );
          transformationResults.categorize = { applied: true };
        } catch (error) {
          logger.error(`Error categorizing data: ${error.message}`);
          transformationResults.categorize = { applied: false, error: error.message };
        }
      }
    }
    
    // Update the record in the database if recordId is provided
    if (dataRecord) {
      try {
        dataRecord.transformed = transformedData;
        dataRecord.status = 'transformed';
        dataRecord.metadata = {
          ...dataRecord.metadata,
          transformations: transformationResults,
          processedAt: new Date(),
        };
        
        await dataRecord.save();
        
        logger.info(`Updated transformed data in database for record ID: ${recordId}`);
      } catch (dbError) {
        logger.error(`Error updating transformed data in database: ${dbError.message}`);
        
        return {
          status: 200,
          body: {
            success: true,
            data: transformedData,
            transformations: transformationResults,
            warning: 'Failed to update data in database',
          },
        };
      }
    } 
    // Create a new record if saveToDb is true
    else if (options?.saveToDb && !recordId) {
      try {
        const newDataRecord = new DataModel({
          raw: sourceData,
          transformed: transformedData,
          status: 'transformed',
          source: {
            type: 'api',
            name: 'transform-api',
            details: {},
          },
          destination: options?.destination || 'mongodb',
          metadata: {
            transformations: transformationResults,
            processedAt: new Date(),
          },
        });
        
        await newDataRecord.save();
        
        logger.info(`Saved transformed data to database with ID: ${newDataRecord._id}`);
        
        return {
          status: 200,
          body: {
            success: true,
            data: transformedData,
            transformations: transformationResults,
            recordId: newDataRecord._id,
          },
        };
      } catch (dbError) {
        logger.error(`Error saving transformed data to database: ${dbError.message}`);
        
        return {
          status: 200,
          body: {
            success: true,
            data: transformedData,
            transformations: transformationResults,
            warning: 'Failed to save data to database',
          },
        };
      }
    }
    
    logger.info('Successfully transformed data');
    
    return {
      status: 200,
      body: {
        success: true,
        data: transformedData,
        transformations: transformationResults,
        recordId: dataRecord?._id,
      },
    };
  } catch (error) {
    logger.error(`Error transforming data: ${error.message}`);
    
    return {
      status: error.statusCode || 500,
      body: formatErrorResponse(error),
    };
  }
}

module.exports = { transform }; 