const express = require('express');
const router = express.Router();
const WalletController = require('../controllers/walletController');
const SegregationController = require('../controllers/segregationController');
const { authenticateToken } = require('../middleware/auth');
const { schemas } = require('../middleware/validator');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/wallet/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/balance', authenticateToken, asyncHandler(WalletController.getBalance));

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get wallet transactions
 * @access  Private
 */
router.get('/transactions', authenticateToken, schemas.pagination, asyncHandler(WalletController.getTransactions));

/**
 * @route   GET /api/wallet/statistics
 * @desc    Get wallet statistics
 * @access  Private
 */
router.get('/statistics', authenticateToken, asyncHandler(WalletController.getStatistics));

/**
 * @route   GET /api/wallet/rates
 * @desc    Get current exchange rates
 * @access  Private
 */
router.get('/rates', authenticateToken, asyncHandler(WalletController.getExchangeRates));

/**
 * @route   POST /api/wallet/convert/lock
 * @desc    Lock conversion rate for 60 seconds
 * @access  Private
 */
router.post('/convert/lock', authenticateToken, asyncHandler(WalletController.lockConversionRate));

/**
 * @route   POST /api/wallet/convert/execute
 * @desc    Execute conversion with locked rate
 * @access  Private
 */
router.post('/convert/execute', authenticateToken, asyncHandler(WalletController.executeConversion));

/**
 * @route   POST /api/wallet/convert
 * @desc    Convert currency (one-step: lock + execute)
 * @access  Private
 */
router.post('/convert', authenticateToken, schemas.convertCurrency, asyncHandler(WalletController.convertCurrency));

/**
 * Fund Segregation Routes (Cantonnement)
 */

/**
 * @route   GET /api/wallet/segregation/status
 * @desc    Get segregation status (wallet vs bank balances)
 * @access  Private
 */
router.get('/segregation/status', authenticateToken, asyncHandler(SegregationController.getStatus));

/**
 * @route   POST /api/wallet/segregation/sweep
 * @desc    Sweep funds from wallet to bank account
 * @access  Private
 */
router.post('/segregation/sweep', authenticateToken, asyncHandler(SegregationController.sweepToBank));

/**
 * @route   POST /api/wallet/segregation/fund
 * @desc    Request funding from bank to wallet
 * @access  Private
 */
router.post('/segregation/fund', authenticateToken, asyncHandler(SegregationController.fundFromBank));

module.exports = router;
