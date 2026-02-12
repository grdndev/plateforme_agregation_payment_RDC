const express = require('express');
const router = express.Router();
const LedgerController = require('../controllers/ledgerController');
const batchRoutes = require('./batch');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * All admin routes require authentication and admin/super_admin role
 */
router.use(authenticateToken);
router.use(requireRole('admin', 'super_admin'));

/**
 * @route   GET /api/admin/ledger
 * @desc    Get general ledger entries
 * @access  Admin
 */
router.get('/ledger', asyncHandler(LedgerController.getEntries));

/**
 * @route   GET /api/admin/ledger/balances
 * @desc    Get ledger balances by account
 * @access  Admin
 */
router.get('/ledger/balances', asyncHandler(LedgerController.getBalances));

/**
 * Fund Segregation Admin Routes
 */
const SegregationController = require('../controllers/segregationController');

/**
 * @route   POST /api/admin/segregation/approve-funding
 * @desc    Approve bank funding request
 * @access  Admin
 */
router.post('/segregation/approve-funding', asyncHandler(SegregationController.approveFunding));

/**
 * @route   POST /api/admin/segregation/auto-sweep
 * @desc    Trigger auto-sweep for specific user
 * @access  Admin
 */
router.post('/segregation/auto-sweep', asyncHandler(SegregationController.triggerAutoSweep));

/**
 * @route   POST /api/admin/segregation/auto-sweep-all
 * @desc    Trigger auto-sweep for all users (cron job)
 * @access  Admin
 */
router.post('/segregation/auto-sweep-all', asyncHandler(SegregationController.triggerAutoSweepAll));

/**
 * Batch transfer routes
 */
router.use('/batch', batchRoutes);

module.exports = router;
