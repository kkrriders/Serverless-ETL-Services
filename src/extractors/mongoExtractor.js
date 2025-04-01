/**
 * MongoDB Extractor
 * Module to extract data from MongoDB collections
 */
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');
const { connectToDatabase } = require('../utils/db');
const monitor = require('../utils/monitor');

/**
 * Extract data from MongoDB collection
 * @param {Object} source - Source configuration
 * @returns {Promise<Array>} Extracted data
 */
async function extractFromMongo(source) {
  const startTime = Date.now();
  
  try {
    if (!source.collection) {
      throw new AppError('MongoDB source must include a collection name', 400);
    }

    if (!process.env.MONGODB_URI) {
      throw new AppError('MongoDB URI is not configured', 500);
    }

    logger.info(`Extracting data from MongoDB collection: ${source.collection}`);

    const db = await connectToDatabase();
    const collection = db.collection(source.collection);

    const query = source.query || {};
    const projection = source.projection || {};
    const sort = source.sort || {};
    const limit = source.limit || 0;
    const skip = source.skip || 0;

    let cursor = collection.find(query, { projection });
    
    if (Object.keys(sort).length > 0) {
      cursor = cursor.sort(sort);
    }
    
    if (skip > 0) {
      cursor = cursor.skip(skip);
    }
    
    if (limit > 0) {
      cursor = cursor.limit(limit);
    }
    
    const data = await cursor.toArray();
    
    const duration = Date.now() - startTime;
    logger.info(`MongoDB extraction completed in ${duration}ms: ${data.length} records`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`MongoDB extraction failed in ${duration}ms: ${error.message}`);
    
    // Track error
    monitor.trackError(error, 'mongoExtractor');
    
    if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError(`MongoDB extraction failed: ${error.message}`, 500);
    }
  }
}

/**
 * Extract data from MongoDB with pagination
 * @param {Object} options - MongoDB extraction options
 * @param {string} options.collection - MongoDB collection name
 * @param {Object} options.query - MongoDB query
 * @param {Object} options.projection - MongoDB projection
 * @param {Object} options.sort - MongoDB sort
 * @param {number} options.pageSize - Page size
 * @param {number} options.maxPages - Maximum number of pages to fetch (default: 10)
 * @returns {Promise<Array<Object>>} The extracted data from all pages
 */
async function extractFromMongoWithPagination(options) {
  try {
    const {
      collection,
      query = {},
      projection = {},
      sort = {},
      pageSize = 100,
      maxPages = 10,
    } = options;

    if (!collection) {
      throw new Error('MongoDB collection name is required');
    }

    logger.info(`Extracting data from MongoDB collection with pagination: ${collection}`);

    // Connect to the database
    const db = await connectToDatabase();
    
    // Get the MongoDB connection
    const mongoose = db.connection.getClient();
    
    // Get the collection
    const coll = mongoose.db().collection(collection);

    // Get the total count of documents matching the query
    const totalCount = await coll.countDocuments(query);
    const totalPages = Math.min(Math.ceil(totalCount / pageSize), maxPages);

    logger.info(`Found ${totalCount} documents, fetching up to ${totalPages} pages`);

    let allData = [];

    // Fetch data page by page
    for (let page = 0; page < totalPages; page++) {
      const skip = page * pageSize;
      
      logger.info(`Fetching page ${page + 1} of ${totalPages} from MongoDB collection: ${collection}`);

      // Execute the query for the current page
      const pageResult = await coll
        .find(query, { projection })
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .toArray();

      // Add the current page data to the result
      allData = [...allData, ...pageResult];

      // If the current page has fewer documents than the page size, break the loop
      if (pageResult.length < pageSize) {
        break;
      }
    }

    logger.info(`Successfully extracted ${allData.length} documents from MongoDB collection: ${collection}`);

    return allData;
  } catch (error) {
    logger.error(`Error extracting data from MongoDB with pagination: ${error.message}`);
    throw error;
  }
}

module.exports = {
  extractFromMongo,
  extractFromMongoWithPagination,
}; 