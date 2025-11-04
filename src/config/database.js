const mongoose = require('mongoose');
const { config } = require('./environment');
const { logger } = require('../utils/logger');

const connectDatabase = async () => {
  try {
    const uri = config.nodeEnv === 'test' ? config.database.testUri : config.database.uri;
    
    await mongoose.connect(uri, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
      bufferCommands: false, // Disable mongoose buffering
    });

    logger.info(`MongoDB connected successfully to ${config.nodeEnv} database`);

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

module.exports = { connectDatabase, disconnectDatabase };
