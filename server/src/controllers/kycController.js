const { User, KYCDocument } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const config = require('../config');

/**
 * KYC Controller
 * Handle document submission and compliance validation
 */
class KYCController {
    /**
     * Get KYC status and required documents for user
     * GET /api/kyc/status
     */
    static async getStatus(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findByPk(userId, {
                attributes: ['id', 'email', 'status', 'company_type', 'company_name', 'validated_at']
            });

            const documents = await KYCDocument.findAll({
                where: { user_id: userId },
                order: [['created_at', 'DESC']]
            });

            // Define required documents based on company type
            const requiredDocs = user.company_type === 'individual'
                ? ['national_id', 'proof_of_address']
                : ['rccm', 'company_statutes', 'tax_number', 'rib', 'shareholder_id'];

            // Calculate completion status
            const submittedTypes = new Set(
                documents
                    .filter(doc => doc.status !== 'rejected')
                    .map(doc => doc.document_type)
            );

            const completionStatus = requiredDocs.map(docType => ({
                type: docType,
                required: true,
                submitted: submittedTypes.has(docType),
                status: documents.find(d => d.document_type === docType)?.status || 'not_submitted',
                document: documents.find(d => d.document_type === docType) || null
            }));

            const completionPercentage = Math.round(
                (completionStatus.filter(d => d.submitted).length / requiredDocs.length) * 100
            );

            res.json({
                success: true,
                data: {
                    user_status: user.status,
                    company_type: user.company_type,
                    completion_percentage: completionPercentage,
                    validated_at: user.validated_at,
                    required_documents: completionStatus,
                    all_documents: documents
                }
            });

        } catch (error) {
            logger.error('KYC status retrieval error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du statut KYC',
                error: error.message
            });
        }
    }

    /**
     * Upload a KYC document
     * POST /api/kyc/upload
     */
    static async uploadDocument(req, res) {
        try {
            const { document_type, metadata } = req.body;
            const userId = req.user.id;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun fichier fourni'
                });
            }

            // Validate document type
            const validTypes = [
                'national_id', 'passport', 'id_nat', 'rccm',
                'company_statutes', 'tax_number', 'rib',
                'proof_of_address', 'shareholder_id', 'other'
            ];

            if (!validTypes.includes(document_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Type de document invalide'
                });
            }

            // Check for existing document of same type
            const existingDoc = await KYCDocument.findOne({
                where: {
                    user_id: userId,
                    document_type,
                    status: ['pending', 'approved']
                }
            });

            if (existingDoc && existingDoc.status === 'approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Un document de ce type est déjà approuvé'
                });
            }

            // Create document record
            const document = await KYCDocument.create({
                user_id: userId,
                document_type,
                file_name: req.file.originalname,
                file_path: req.file.path,
                file_size: req.file.size,
                mime_type: req.file.mimetype,
                status: 'pending',
                metadata: metadata ? JSON.parse(metadata) : {},
                expires_at: KYCController.calculateExpiryDate(document_type)
            });

            logger.info(`KYC document uploaded: ${document_type} by user ${userId}`);

            // Check if user can be moved to pending_validation
            await KYCController.checkAndUpdateUserStatus(userId);

            res.status(201).json({
                success: true,
                message: 'Document soumis avec succès',
                data: document
            });

        } catch (error) {
            logger.error('KYC document upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du téléchargement du document',
                error: error.message
            });
        }
    }

    /**
     * Delete a KYC document (only if pending or rejected)
     * DELETE /api/kyc/documents/:id
     */
    static async deleteDocument(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const document = await KYCDocument.findOne({
                where: { id, user_id: userId }
            });

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document non trouvé'
                });
            }

            if (document.status === 'approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Impossible de supprimer un document approuvé'
                });
            }

            // Delete file from filesystem
            try {
                await fs.unlink(document.file_path);
            } catch (err) {
                logger.warn(`Failed to delete file: ${document.file_path}`, err);
            }

            await document.destroy();

            res.json({
                success: true,
                message: 'Document supprimé avec succès'
            });

        } catch (error) {
            logger.error('KYC document deletion error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du document',
                error: error.message
            });
        }
    }

    /**
     * ADMIN: Review and approve/reject document
     * PUT /api/kyc/documents/:id/review
     */
    static async reviewDocument(req, res) {
        try {
            const { id } = req.params;
            const { status, rejection_reason } = req.body;
            const reviewerId = req.user.id;

            // Verify admin/super_admin role
            if (!['admin', 'super_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé'
                });
            }

            const document = await KYCDocument.findByPk(id);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document non trouvé'
                });
            }

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Statut invalide'
                });
            }

            if (status === 'rejected' && !rejection_reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Raison de rejet requise'
                });
            }

            // Update document
            document.status = status;
            document.rejection_reason = rejection_reason || null;
            document.reviewed_by = reviewerId;
            document.reviewed_at = new Date();
            await document.save();

            logger.info(`KYC document ${status}: ${id} by admin ${reviewerId}`);

            // Check if all required documents are approved
            if (status === 'approved') {
                await KYCController.checkAndUpdateUserStatus(document.user_id);
            }

            res.json({
                success: true,
                message: `Document ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`,
                data: document
            });

        } catch (error) {
            logger.error('KYC document review error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la révision du document',
                error: error.message
            });
        }
    }

    /**
     * ADMIN: Get all pending KYC submissions
     * GET /api/kyc/pending
     */
    static async getPendingSubmissions(req, res) {
        try {
            if (!['admin', 'super_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé'
                });
            }

            const documents = await KYCDocument.findAll({
                where: { status: 'pending' },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'company_name', 'company_type', 'status']
                }],
                order: [['created_at', 'ASC']]
            });

            // Group by user
            const groupedByUser = {};
            documents.forEach(doc => {
                if (!groupedByUser[doc.user_id]) {
                    groupedByUser[doc.user_id] = {
                        user: doc.user,
                        documents: []
                    };
                }
                groupedByUser[doc.user_id].documents.push(doc);
            });

            res.json({
                success: true,
                data: {
                    total: documents.length,
                    submissions: Object.values(groupedByUser)
                }
            });

        } catch (error) {
            logger.error('Pending KYC retrieval error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des soumissions',
                error: error.message
            });
        }
    }

    /**
     * Helper: Calculate expiry date for document
     */
    static calculateExpiryDate(documentType) {
        // Most documents expire after 1 year
        const expiryMonths = {
            'national_id': 60,          // 5 years
            'passport': 60,              // 5 years
            'id_nat': 60,                // 5 years
            'rccm': 12,                  // 1 year
            'company_statutes': null,    // No expiry
            'tax_number': 12,            // 1 year
            'rib': 12,                   // 1 year
            'proof_of_address': 6,       // 6 months
            'shareholder_id': 60,        // 5 years
            'other': 12
        };

        const months = expiryMonths[documentType];
        if (!months) return null;

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + months);
        return expiryDate;
    }

    /**
     * Helper: Check if user has all required documents and update status
     */
    static async checkAndUpdateUserStatus(userId) {
        try {
            const user = await User.findByPk(userId);
            if (!user) return;

            // Only process if user is in sandbox or pending_validation
            if (!['sandbox', 'pending_validation'].includes(user.status)) {
                return;
            }

            const requiredDocs = user.company_type === 'individual'
                ? ['national_id', 'proof_of_address']
                : ['rccm', 'company_statutes', 'tax_number', 'rib', 'shareholder_id'];

            const documents = await KYCDocument.findAll({
                where: { user_id: userId }
            });

            // Check if all required documents are submitted
            const submittedTypes = documents.map(d => d.document_type);
            const allSubmitted = requiredDocs.every(type => submittedTypes.includes(type));

            if (allSubmitted && user.status === 'sandbox') {
                user.status = 'pending_validation';
                await user.save();
                logger.info(`User ${userId} moved to pending_validation`);
            }

            // Check if all required documents are approved
            const approvedDocs = documents.filter(d => d.status === 'approved');
            const approvedTypes = approvedDocs.map(d => d.document_type);
            const allApproved = requiredDocs.every(type => approvedTypes.includes(type));

            if (allApproved && user.status === 'pending_validation') {
                user.status = 'active';
                user.validated_at = new Date();
                await user.save();
                logger.info(`User ${userId} KYC approved - activated`);

                // TODO: Send email notification
                // TODO: Generate production API keys
            }

        } catch (error) {
            logger.error('User status check error:', error);
        }
    }
}

module.exports = KYCController;
