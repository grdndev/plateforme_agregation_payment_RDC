/**
 * Database Migration Script
 * Syncs all models with the database
 *
 * Usage: npm run migrate
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const logger = require('./logger');

const migrate = async () => {
    try {
        logger.info('🔄 Starting database migration...');

        // Import all models (this triggers model definitions)
        require('../models');

        // Sync database
        await sequelize.sync({ alter: true });

        logger.info('✅ Database migration completed successfully');
        logger.info('📊 All tables created/updated');

        process.exit(0);
    } catch (error) {
        logger.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
