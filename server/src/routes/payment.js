const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { authenticateApiKey } = require('../middleware/apiAuth');
const { schemas } = require('../middleware/validator');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   POST /api/payments
 * @desc    Initiate a new payment
 * @access  Public (requires API key)
 */
router.post(
    '/',
    authenticateApiKey,
    schemas.createPayment,
    asyncHandler(PaymentController.create)
);

/**
 * @route   GET /api/payments/:transaction_ref
 * @desc    Get payment status
 * @access  Public (requires API key)
 */
router.get(
    '/:transaction_ref',
    authenticateApiKey,
    asyncHandler(PaymentController.getStatus)
);

module.exports = router;
