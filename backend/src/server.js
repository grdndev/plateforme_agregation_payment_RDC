require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./utils/logger');
const { testConnection, syncDatabase } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Create Express app
const app = express();

/**
 * Middleware Configuration
 */

// Security headers
app.use(helmet({
    contentSecurityPolicy: config.nodeEnv === 'production' ? undefined : false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Force HTTPS in production
if (config.nodeEnv === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(['https://', req.get('Host'), req.url].join(''));
        }
        next();
    });
}

// CORS configuration
app.use(cors({
    origin: config.appUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
    message: {
        success: false,
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000 / 60) + ' minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Trust proxy (for rate limiting and IP detection behind load balancer)
app.set('trust proxy', 1);

/**
 * Routes
 */
app.use('/api', routes);

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Server Initialization
 */
const startServer = async () => {
    try {
        logger.info('🚀 Starting Alma Payment Platform API...');
        logger.info(`📝 Environment: ${config.nodeEnv}`);
        logger.info(`🔧 Node version: ${process.version}`);

        // Test database connection
        logger.info('📊 Testing database connection...');
        const dbConnected = await testConnection();

        if (!dbConnected) {
            logger.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Sync database in development (use migrations in production)
        if (config.nodeEnv === 'development') {
            logger.info('🔄 Synchronizing database schema...');
            await syncDatabase({ alter: true });
        }

        // Start Express server
        const PORT = config.port;
        const server = app.listen(PORT, () => {
            logger.info('='.repeat(60));
            logger.info(`✅ Server is running on port ${PORT}`);
            logger.info(`🌍 API URL: ${config.apiUrl}`);
            logger.info(`📱 Frontend URL: ${config.appUrl}`);
            logger.info(`📚 Health Check: ${config.apiUrl}/api/health`);
            logger.info('='.repeat(60));
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`\n⚠️  ${signal} received: starting graceful shutdown`);

            server.close(async () => {
                logger.info('✅ HTTP server closed');

                // Close database connections
                try {
                    const { sequelize } = require('./config/database');
                    await sequelize.close();
                    logger.info('✅ Database connections closed');
                } catch (error) {
                    logger.error('❌ Error closing database connections:', error);
                }

                logger.info('👋 Process terminated gracefully');
                process.exit(0);
            });

            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger.error('❌ Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger.error('💥 Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });

    } catch (error) {
        logger.error('💥 Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = app;
