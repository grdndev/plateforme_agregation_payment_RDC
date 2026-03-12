const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhookController');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   POST /api/webhooks/mpesa
 * @desc    Handle M-Pesa payment callback
 * @access  Public (from M-Pesa servers only - IP whitelisting recommended)
 */
router.post('/mpesa', asyncHandler(WebhookController.mpesa));

/**
 * @route   POST /api/webhooks/orange
 * @desc    Handle Orange Money payment callback
 * @access  Public (signature validated)
 */
router.post('/orange', asyncHandler(WebhookController.orange));

/**
 * @route   POST /api/webhooks/airtel
 * @desc    Handle Airtel Money payment callback
 * @access  Public (signature validated)
 */
router.post('/airtel', asyncHandler(WebhookController.airtel));

module.exports = router;
