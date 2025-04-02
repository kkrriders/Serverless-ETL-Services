const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { connectToDatabase } = require('../utils/db');
const DataModel = require('../models/dataModel');

/**
 * Load data into MongoDB
 * @param {Object|Array} data - The data to load
 * @param {Object} options - Loading options
 * @returns {Promise<Object>} Loading result
 */
async function loadToMongo(data, options = {}) {
  try {
    const { collection, batchSize = 100, upsert = false, upsertKey = '_id' } = options;
    
    logger.info(`Loading data to MongoDB${collection ? ` collection: ${collection}` : ''}`);
    
    // Connect to the database
    await connectToDatabase();
    
    // Load an array of items
    if (Array.isArray(data)) {
      // Process in batches to avoid overwhelming the database
      const batches = [];
      
      // Create batches
      for (let i = 0; i < data.length; i += batchSize) {
        batches.push(data.slice(i, i + batchSize));
      }
      
      let insertedCount = 0;
      let updatedCount = 0;
      
      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        logger.info(`Processing batch ${i + 1} of ${batches.length}...`);
        
        const batch = batches[i];
        
        if (collection) {
          // Load to a custom collection
          const db = mongoose.connection;
          const coll = db.collection(collection);
          
          if (upsert) {
            // Perform upsert operations
            const _operations = batch.map(item => ({
              updateOne: {
                filter: { [upsertKey]: item[upsertKey] },
                update: { $set: item },
                upsert: true,
              },
            }));
            
            const result = await coll.bulkWrite(_operations);
            insertedCount += result.upsertedCount || 0;
            updatedCount += result.modifiedCount || 0;
          } else {
            // Perform insert operations
            const result = await coll.insertMany(batch);
            insertedCount += result.insertedCount || 0;
          }
        } else {
          // Load to the default Data model
          if (upsert) {
            // Perform upsert operations
            const _operations = await Promise.all(
              batch.map(async item => {
                const filter = { [upsertKey]: item[upsertKey] };
                const doc = await DataModel.findOne(filter);
                
                if (doc) {
                  await DataModel.updateOne(filter, { $set: item });
                  updatedCount++;
                } else {
                  await DataModel.create(item);
                  insertedCount++;
                }
              }),
            );
          } else {
            // Perform insert operations
            const result = await DataModel.insertMany(batch);
            insertedCount += result.length;
          }
        }
      }
      
      logger.info(`Successfully loaded ${insertedCount} items to MongoDB${updatedCount ? `, updated ${updatedCount} items` : ''}`);
      
      return {
        success: true,
        insertedCount,
        updatedCount,
      };
    } 
    // Load a single item
    else if (typeof data === 'object' && data !== null) {
      if (collection) {
        // Load to a custom collection
        const db = mongoose.connection;
        const coll = db.collection(collection);
        
        if (upsert && upsertKey in data) {
          // Perform upsert operation
          const result = await coll.updateOne(
            { [upsertKey]: data[upsertKey] },
            { $set: data },
            { upsert: true },
          );
          
          const isInserted = result.upsertedCount === 1;
          const isUpdated = result.modifiedCount === 1;
          
          logger.info(`Successfully ${isInserted ? 'inserted' : isUpdated ? 'updated' : 'processed'} item in MongoDB`);
          
          return {
            success: true,
            insertedCount: isInserted ? 1 : 0,
            updatedCount: isUpdated ? 1 : 0,
          };
        } else {
          // Perform insert operation
          const result = await coll.insertOne(data);
          logger.info('Successfully inserted item to MongoDB');
          
          return {
            success: true,
            insertedCount: 1,
            insertedId: result.insertedId,
          };
        }
      } else {
        // Load to the default Data model
        if (upsert && upsertKey in data) {
          // Perform upsert operation
          const filter = { [upsertKey]: data[upsertKey] };
          const doc = await DataModel.findOne(filter);
          
          if (doc) {
            await DataModel.updateOne(filter, { $set: data });
            logger.info('Successfully updated item in MongoDB');
            
            return {
              success: true,
              updatedCount: 1,
            };
          } else {
            const result = await DataModel.create(data);
            logger.info('Successfully inserted item to MongoDB');
            
            return {
              success: true,
              insertedCount: 1,
              insertedId: result._id,
            };
          }
        } else {
          // Perform insert operation
          const result = await DataModel.create(data);
          logger.info('Successfully inserted item to MongoDB');
          
          return {
            success: true,
            insertedCount: 1,
            insertedId: result._id,
          };
        }
      }
    }
    
    logger.warn('Data is not an object or array');
    return {
      success: false,
      error: 'Data must be an object or array',
    };
  } catch (error) {
    logger.error(`Error loading data to MongoDB: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  loadToMongo,
}; 