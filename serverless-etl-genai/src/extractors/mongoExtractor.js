const logger = require('../utils/logger');
const { connectToDatabase } = require('../utils/db');

/**
 * Extract data from MongoDB
 * @param {Object} options - MongoDB extraction options
 * @param {string} options.collection - MongoDB collection name
 * @param {Object} options.query - MongoDB query
 * @param {Object} options.projection - MongoDB projection
 * @param {Object} options.sort - MongoDB sort
 * @param {number} options.limit - MongoDB limit
 * @param {number} options.skip - MongoDB skip
 * @returns {Promise<Array<Object>>} The extracted data
 */
async function extractFromMongo(options) {
  try {
    const { collection, query = {}, projection = {}, sort = {}, limit = 0, skip = 0 } = options;

    if (!collection) {
      throw new Error('MongoDB collection name is required');
    }

    logger.info(`Extracting data from MongoDB collection: ${collection}`);

    // Connect to the database
    const db = await connectToDatabase();
    
    // Get the MongoDB connection
    const mongoose = db.connection.getClient();
    
    // Get the collection
    const coll = mongoose.db().collection(collection);

    // Execute the query
    const result = await coll
      .find(query, { projection })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    logger.info(`Successfully extracted ${result.length} documents from MongoDB collection: ${collection}`);

    return result;
  } catch (error) {
    logger.error(`Error extracting data from MongoDB: ${error.message}`);
    throw error;
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