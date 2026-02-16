const express = require('express');
const router = express.Router();
const KYCController = require('../controllers/kycController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

/**
 * Multer configuration for file uploads
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.path);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `kyc-${req.user.id}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only images and PDFs
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Seuls les formats PDF, JPG et PNG sont acceptés.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.upload.maxSize
    },
    fileFilter: fileFilter
});

/**
 * @route   GET /api/kyc/status
 * @desc    Get user's KYC status and required documents
 * @access  Private
 */
router.get('/status', authenticateToken, KYCController.getStatus);

/**
 * @route   POST /api/kyc/upload
 * @desc    Upload a KYC document
 * @access  Private
 */
router.post(
    '/upload',
    authenticateToken,
    upload.single('document'),
    KYCController.uploadDocument
);

/**
 * @route   DELETE /api/kyc/documents/:id
 * @desc    Delete a KYC document (only if pending or rejected)
 * @access  Private
 */
router.delete('/documents/:id', authenticateToken, KYCController.deleteDocument);

/**
 * @route   PUT /api/kyc/documents/:id/review
 * @desc    Admin: Review and approve/reject document
 * @access  Admin only
 */
router.put('/documents/:id/review', authenticateToken, KYCController.reviewDocument);

/**
 * @route   GET /api/kyc/pending
 * @desc    Admin: Get all pending KYC submissions
 * @access  Admin only
 */
router.get('/pending', authenticateToken, KYCController.getPendingSubmissions);

module.exports = router;
