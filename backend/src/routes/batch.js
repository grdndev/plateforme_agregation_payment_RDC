const express = require('express');
const router = express.Router();
const BatchTransferController = require('../controllers/batchTransferController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Batch Transfer Routes (Admin Only)
 * All routes require admin authentication
 */

/**
 * @route   POST /api/admin/batch/generate
 * @desc    Generate CSV batch file for local bank transfers
 * @access  Admin only
 */
router.post('/generate', authenticateToken, requireRole('admin'), BatchTransferController.generateBatch);

/**
 * @route   POST /api/admin/batch/generate-sepa
 * @desc    Generate SEPA XML file for European transfers
 * @access  Admin only
 */
router.post('/generate-sepa', authenticateToken, requireRole('admin'), BatchTransferController.generateSEPA);

/**
 * @route   POST /api/admin/batch/generate-swift
 * @desc    Generate SWIFT MT103 file for international transfers
 * @access  Admin only
 */
router.post('/generate-swift', authenticateToken, requireRole('admin'), BatchTransferController.generateSWIFT);

/**
 * @route   GET /api/admin/batch/files
 * @desc    List all generated batch files
 * @access  Admin only
 */
router.get('/files', authenticateToken, requireRole('admin'), BatchTransferController.listBatchFiles);

/**
 * @route   GET /api/admin/batch/download/:filename
 * @desc    Download a specific batch file
 * @access  Admin only
 */
router.get('/download/:filename', authenticateToken, requireRole('admin'), BatchTransferController.downloadBatch);

/**
 * @route   GET /api/admin/batch/stats
 * @desc    Get batch transfer statistics
 * @access  Admin only
 */
router.get('/stats', authenticateToken, requireRole('admin'), BatchTransferController.getBatchStats);

/**
 * @route   POST /api/admin/batch/:batchId/sent
 * @desc    Mark batch as sent to bank
 * @access  Admin only
 */
router.post('/:batchId/sent', authenticateToken, requireRole('admin'), BatchTransferController.markBatchAsSent);

module.exports = router;
