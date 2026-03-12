const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { schemas } = require('../middleware/validator');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   POST /api/auth/register
 * @desc    Register new merchant account
 * @access  Public
 */
router.post('/register', schemas.register, asyncHandler(AuthController.register));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', schemas.login, asyncHandler(AuthController.login));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', asyncHandler(AuthController.refresh));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, asyncHandler(AuthController.getProfile));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, schemas.updateProfile, asyncHandler(AuthController.updateProfile));

/**
 * @route   GET /api/auth/api-keys
 * @desc    Get API keys
 * @access  Private
 */
router.get('/api-keys', authenticateToken, asyncHandler(AuthController.getApiKeys));

/**
 * @route   POST /api/auth/login/2fa
 * @desc    Complete login with 2FA code
 * @access  Public
 */
router.post('/login/2fa', schemas.login2fa, asyncHandler(AuthController.login2FA));

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Setup 2FA (step 1)
 * @access  Private
 */
router.post('/2fa/setup', authenticateToken, asyncHandler(AuthController.setup2FA));

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verify and enable 2FA (step 2)
 * @access  Private
 */
router.post('/2fa/verify', authenticateToken, schemas.verify2fa, asyncHandler(AuthController.verify2FA));

/**
 * @route   POST /api/auth/2fa/disable
 * @access  Private
 */
router.post('/2fa/disable', authenticateToken, schemas.disable2fa, asyncHandler(AuthController.disable2FA));

/**
 * @route   POST /api/auth/request-production
 * @desc    Request production access (sets status to pending_validation)
 * @access  Private
 */
router.post('/request-production', authenticateToken, asyncHandler(AuthController.requestProduction));

module.exports = router;
