const express = require('express');
const router = express.Router();
const WithdrawalController = require('../controllers/withdrawalController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { schemas } = require('../middleware/validator');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * MERCHANT ROUTES
 */

/**
 * @route   POST /api/withdrawals
 * @desc    Initiate withdrawal request
 * @access  Private (Merchant)
 */
router.post(
    '/',
    authenticateToken,
    schemas.withdrawal,
    asyncHandler(WithdrawalController.create)
);

/**
 * @route   GET /api/withdrawals/history
 * @desc    Get withdrawal history
 * @access  Private (Merchant)
 */
router.get(
    '/history',
    authenticateToken,
    asyncHandler(WithdrawalController.getHistory)
);

/**
 * @route   GET /api/withdrawals/statistics
 * @desc    Get withdrawal statistics
 * @access  Private (Merchant)
 */
router.get(
    '/statistics',
    authenticateToken,
    asyncHandler(WithdrawalController.getStatistics)
);

/**
 * @route   GET /api/withdrawals/bank-accounts
 * @desc    Get user's bank accounts
 * @access  Private (Merchant)
 */
router.get(
    '/bank-accounts',
    authenticateToken,
    asyncHandler(WithdrawalController.getBankAccounts)
);

/**
 * @route   POST /api/withdrawals/bank-accounts
 * @desc    Add new bank account
 * @access  Private (Merchant)
 */
router.post(
    '/bank-accounts',
    authenticateToken,
    asyncHandler(WithdrawalController.addBankAccount)
);

/**
 * ADMIN ROUTES
 */

/**
 * @route   GET /api/withdrawals/admin/pending
 * @desc    Get all pending withdrawals
 * @access  Private (Admin only)
 */
router.get(
    '/admin/pending',
    authenticateToken,
    requireRole('admin', 'super_admin'),
    asyncHandler(WithdrawalController.getPendingWithdrawals)
);

/**
 * @route   POST /api/withdrawals/admin/generate-batch
 * @desc    Generate batch file for bank processing
 * @access  Private (Admin only)
 */
router.post(
    '/admin/generate-batch',
    authenticateToken,
    requireRole('admin', 'super_admin'),
    asyncHandler(WithdrawalController.generateBatch)
);

/**
 * @route   PUT /api/withdrawals/admin/:transaction_ref/complete
 * @desc    Mark withdrawal as completed
 * @access  Private (Admin only)
 */
router.put(
    '/admin/:transaction_ref/complete',
    authenticateToken,
    requireRole('admin', 'super_admin'),
    asyncHandler(WithdrawalController.markCompleted)
);

/**
 * @route   PUT /api/withdrawals/admin/:transaction_ref/reject
 * @desc    Reject withdrawal and refund
 * @access  Private (Admin only)
 */
router.put(
    '/admin/:transaction_ref/reject',
    authenticateToken,
    requireRole('admin', 'super_admin'),
    asyncHandler(WithdrawalController.reject)
);

module.exports = router;
