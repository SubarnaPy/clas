const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { config } = require('./config/environment');
const { connectDatabase } = require('./config/database');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { setupSwagger } = require('./config/swagger');

const app = express();

// Security middleware (must run before routes to properly respond to preflight requests)
app.use(helmet());
// Configure CORS with environment-specific origins
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ensure preflight OPTIONS requests always receive CORS headers
app.options('*', cors({
  origin: config.cors.origin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security?.rateLimitWindowMs || 15 * 60 * 1000,
  max: config.security?.rateLimitMaxRequests || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Skip auth for public config endpoint
app.use('/api/mcq/config', (req, res, next) => next());

// Setup Swagger documentation
setupSwagger(app);

// Ensure models are registered
require('./models');

// Mount auth routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Mount user routes
const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

// Mount submission routes
const submissionRoutes = require('./routes/submission.routes');
app.use('/api/submissions', submissionRoutes);

// Mount MCQ routes
const mcqRoutes = require('./routes/mcq.routes');
app.use('/api/mcq', mcqRoutes);

// Mount file routes
const fileRoutes = require('./routes/file.routes');
app.use('/api/files', fileRoutes);

// Mount admin routes
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// Mount Excel sheet routes
const excelSheetRoutes = require('./routes/excelSheet.routes');
app.use('/api/excel-sheet', excelSheetRoutes);

// Mount analytics routes
const analyticsRoutes = require('./routes/analytics.routes');
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes will be added here
// app.use(config.apiPrefix, routes);

// Global error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      path: req.originalUrl
    }
  });
});

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`API documentation available at http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;
