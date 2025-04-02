const mongoose = require('mongoose');

/**
 * Schema for ETL source data
 */
const sourceSchema = new mongoose.Schema({
  // Source type (e.g., 'api', 'mongodb', 'file')
  type: {
    type: String,
    required: true,
    enum: ['api', 'mongodb', 'file', 'blob'],
  },
  // Source information
  name: {
    type: String,
    required: true,
  },
  // Source details (e.g., URL, connection string, file path)
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
});

/**
 * Schema for ETL data
 */
const dataSchema = new mongoose.Schema(
  {
    // Raw data
    raw: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Transformed data
    transformed: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Enriched data (with GenAI)
    enriched: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Processing status
    status: {
      type: String,
      required: true,
      enum: ['extracted', 'transformed', 'enriched', 'loaded', 'error'],
      default: 'extracted',
    },
    // Error information
    error: {
      message: String,
      stack: String,
      timestamp: Date,
    },
    // Data source
    source: {
      type: sourceSchema,
      required: true,
    },
    // Data destination
    destination: {
      type: String,
      required: true,
      enum: ['mongodb', 'blob', 'file', 'api'],
    },
    // Processing metadata
    metadata: {
      // Batch ID
      batchId: {
        type: String,
      },
      // Processing timestamp
      processedAt: {
        type: Date,
      },
      // Processing duration (in milliseconds)
      processingDuration: {
        type: Number,
      },
      // Load operation result
      loadResult: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
  },
  {
    // Add timestamps (createdAt, updatedAt)
    timestamps: true,
  },
);

// Create text indexes for better search performance
dataSchema.index({ 'raw.text': 'text', 'enriched.text': 'text' });

/**
 * Data model for ETL data
 */
const DataModel = mongoose.model('Data', dataSchema);

module.exports = DataModel; 