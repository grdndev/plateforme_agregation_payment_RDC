/**
 * Database Seed Script
 * Populates database with initial test data
 * 
 * Usage: npm run seed
 */

require('dotenv').config();
const { User, Wallet } = require('../src/models');
const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

const seed = async () => {
    const transaction = await sequelize.transaction();

    try {
        logger.info('🌱 Starting database seeding...');

        // Create admin user
        const admin = await User.create({
            email: 'admin@almapay.cd',
            password: 'Admin@2026',
            first_name: 'Super',
            last_name: 'Admin',
            role: 'super_admin',
            status: 'active',
            email_verified_at: new Date(),
            validated_at: new Date()
        }, { transaction });

        await Wallet.create({
            user_id: admin.id
        }, { transaction });

        logger.info('✅ Admin user created: admin@almapay.cd / Admin@2026');

        // Create test merchant
        const merchant = await User.create({
            email: 'test@merchant.cd',
            password: 'Test@2026',
            first_name: 'Test',
            last_name: 'Merchant',
            company_name: 'Test Company SARL',
            company_type: 'company',
            phone: '+243999999999',
            website_url: 'https://test-merchant.cd',
            role: 'merchant_owner',
            status: 'sandbox',
            business_description: 'E-commerce de produits électroniques',
            estimated_monthly_volume: 10000
        }, { transaction });

        await Wallet.create({
            user_id: merchant.id
        }, { transaction });

        logger.info('✅ Test merchant created: test@merchant.cd / Test@2026');
        logger.info(`   Sandbox API Key: ${merchant.api_key_sandbox}`);

        await transaction.commit();

        logger.info('🎉 Database seeding completed successfully');
        logger.info('\n📝 Test Credentials:');
        logger.info('   Admin: admin@almapay.cd / Admin@2026');
        logger.info('   Merchant: test@merchant.cd / Test@2026');

        process.exit(0);
    } catch (error) {
        await transaction.rollback();
        logger.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
