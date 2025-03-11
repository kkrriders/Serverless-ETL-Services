const mongoose = require('mongoose');
const logger = require('./logger');

// Cache the database connection
let cachedDb = null;

/**
 * Connect to MongoDB
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedDb) {
    logger.info('Using cached database connection');
    return cachedDb;
  }

  // Check if we have the MongoDB URI
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    // Connect to MongoDB
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Cache the database connection
    cachedDb = connection;
    logger.info('Connected to MongoDB');
    return cachedDb;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectFromDatabase() {
  if (cachedDb) {
    await mongoose.disconnect();
    cachedDb = null;
    logger.info('Disconnected from MongoDB');
  }
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
}; 