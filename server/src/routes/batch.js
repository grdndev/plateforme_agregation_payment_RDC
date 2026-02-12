const express = require('express');
const router = express.Router();
const BatchTransferController = require('../controllers/batchTransferController');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * Batch Transfer Routes (Admin Only)
 * All routes require admin authentication
 */

/**
 * @route   POST /api/admin/batch/generate
 * @desc    Generate CSV batch file for local bank transfers
 * @access  Admin only
 */
router.post('/generate', authenticate, requireAdmin, BatchTransferController.generateBatch);

/**
 * @route   POST /api/admin/batch/generate-sepa
 * @desc    Generate SEPA XML file for European transfers
 * @access  Admin only
 */
router.post('/generate-sepa', authenticate, requireAdmin, BatchTransferController.generateSEPA);

/**
 * @route   POST /api/admin/batch/generate-swift
 * @desc    Generate SWIFT MT103 file for international transfers
 * @access  Admin only
 */
router.post('/generate-swift', authenticate, requireAdmin, BatchTransferController.generateSWIFT);

/**
 * @route   GET /api/admin/batch/files
 * @desc    List all generated batch files
 * @access  Admin only
 */
router.get('/files', authenticate, requireAdmin, BatchTransferController.listBatchFiles);

/**
 * @route   GET /api/admin/batch/download/:filename
 * @desc    Download a specific batch file
 * @access  Admin only
 */
router.get('/download/:filename', authenticate, requireAdmin, BatchTransferController.downloadBatch);

/**
 * @route   GET /api/admin/batch/stats
 * @desc    Get batch transfer statistics
 * @access  Admin only
 */
router.get('/stats', authenticate, requireAdmin, BatchTransferController.getBatchStats);

/**
 * @route   POST /api/admin/batch/:batchId/sent
 * @desc    Mark batch as sent to bank
 * @access  Admin only
 */
router.post('/:batchId/sent', authenticate, requireAdmin, BatchTransferController.markBatchAsSent);

module.exports = router;
