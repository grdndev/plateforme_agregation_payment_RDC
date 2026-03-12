const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const paymentRoutes = require('./payment');
const webhookRoutes = require('./webhook');
const walletRoutes = require('./wallet');
const withdrawalRoutes = require('./withdrawal');
const adminRoutes = require('./admin');
const kycRoutes = require('./kyc');
const developersRoutes = require('./developers');

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Alma Payment API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * API root
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Bienvenue sur l\'API Alma Payment Platform',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
            auth: '/api/auth',
            payments: '/api/payments',
            wallet: '/api/wallet',
            kyc: '/api/kyc',
            developers: '/api/developers',
            admin: '/api/admin'
        }
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/payments', paymentRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/wallet', walletRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/kyc', kycRoutes);
router.use('/developers', developersRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
