const express = require('express');
const router = express.Router();
const APIKeyController = require('../controllers/apiKeyController');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Developer API Routes
 * Manages API keys and developer resources
 */

/**
 * @route   GET /api/developers/keys
 * @desc    List all API keys for current user
 * @access  Private
 */
router.get('/keys', authenticateToken, asyncHandler(APIKeyController.listKeys));

/**
 * @route   POST /api/developers/keys
 * @desc    Generate new API key
 * @access  Private
 */
router.post('/keys', authenticateToken, asyncHandler(APIKeyController.generateKey));

/**
 * @route   PATCH /api/developers/keys/:keyId
 * @desc    Update API key name
 * @access  Private
 */
router.patch('/keys/:keyId', authenticateToken, asyncHandler(APIKeyController.updateKey));

/**
 * @route   DELETE /api/developers/keys/:keyId
 * @desc    Revoke API key
 * @access  Private
 */
router.delete('/keys/:keyId', authenticateToken, asyncHandler(APIKeyController.revokeKey));

module.exports = router;
