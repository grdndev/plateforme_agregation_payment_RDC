const { Sequelize } = require('sequelize');
const config = require('./index');
const logger = require('../utils/logger');

// Initialize Sequelize
const sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
        host: config.database.host,
        port: config.database.port,
        dialect: config.database.dialect,
        logging: config.database.logging,
        pool: config.database.pool,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    }
);

// Test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        logger.info('✅ Database connection established successfully');
        return true;
    } catch (error) {
        logger.error('❌ Unable to connect to database:', error);
        return false;
    }
};

// Sync database (use with caution in production)
const syncDatabase = async (options = {}) => {
    try {
        await sequelize.sync(options);
        logger.info('✅ Database synchronized successfully');
    } catch (error) {
        logger.error('❌ Database synchronization failed:', error);
        throw error;
    }
};

module.exports = {
    sequelize,
    Sequelize,
    testConnection,
    syncDatabase
};
