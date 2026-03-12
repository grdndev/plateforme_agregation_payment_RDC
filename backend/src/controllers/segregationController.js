const FundSegregationService = require('../services/escrow/FundSegregationService');
const logger = require('../utils/logger');

/**
 * Segregation Controller
 * Handles fund cantonnement between wallet and bank account
 */
class SegregationController {
    /**
     * Get segregation status
     * GET /api/wallet/segregation/status
     */
    static async getStatus(req, res) {
        try {
            const userId = req.user.id;

            const status = await FundSegregationService.getSegregationStatus(userId);

            res.json(status);

        } catch (error) {
            logger.error('Get segregation status error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du statut de cantonnement',
                error: error.message
            });
        }
    }

    /**
     * Sweep funds from wallet to bank account
     * POST /api/wallet/segregation/sweep
     */
    static async sweepToBank(req, res) {
        try {
            const userId = req.user.id;
            const { amount, currency, bank_account_id } = req.body;

            if (!amount || !currency || !bank_account_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Paramètres manquants: amount, currency, bank_account_id'
                });
            }

            if (!['USD', 'CDF'].includes(currency)) {
                return res.status(400).json({
                    success: false,
                    message: 'Devise invalide. Utilisez USD ou CDF.'
                });
            }

            if (parseFloat(amount) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Montant invalide'
                });
            }

            const result = await FundSegregationService.sweepToBank(
                userId,
                parseFloat(amount),
                currency,
                bank_account_id
            );

            res.json({
                success: true,
                message: 'Fonds transférés vers le compte bancaire avec succès',
                data: result
            });

        } catch (error) {
            logger.error('Sweep to bank error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erreur lors du transfert vers le compte bancaire'
            });
        }
    }

    /**
     * Request funding from bank to wallet
     * POST /api/wallet/segregation/fund
     */
    static async fundFromBank(req, res) {
        try {
            const userId = req.user.id;
            const { amount, currency, bank_account_id, reference, notes } = req.body;

            if (!amount || !currency || !bank_account_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Paramètres manquants: amount, currency, bank_account_id'
                });
            }

            if (!['USD', 'CDF'].includes(currency)) {
                return res.status(400).json({
                    success: false,
                    message: 'Devise invalide. Utilisez USD ou CDF.'
                });
            }

            if (parseFloat(amount) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Montant invalide'
                });
            }

            const result = await FundSegregationService.fundFromBank(
                userId,
                parseFloat(amount),
                currency,
                bank_account_id,
                { reference, notes }
            );

            res.json({
                success: true,
                message: 'Demande de financement créée. En attente de vérification.',
                data: result
            });

        } catch (error) {
            logger.error('Fund from bank error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erreur lors de la demande de financement'
            });
        }
    }

    /**
     * ADMIN: Approve funding request
     * POST /api/admin/segregation/approve-funding
     */
    static async approveFunding(req, res) {
        try {
            const adminId = req.user.id;
            const { transaction_ref } = req.body;

            if (!transaction_ref) {
                return res.status(400).json({
                    success: false,
                    message: 'transaction_ref requis'
                });
            }

            // Verify admin role
            if (!['admin', 'super_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Admin uniquement.'
                });
            }

            const result = await FundSegregationService.approveFunding(
                transaction_ref,
                adminId
            );

            res.json({
                success: true,
                message: 'Financement approuvé et wallet crédité',
                data: result
            });

        } catch (error) {
            logger.error('Approve funding error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erreur lors de l\'approbation du financement'
            });
        }
    }

    /**
     * ADMIN: Trigger auto-sweep for a user
     * POST /api/admin/segregation/auto-sweep
     */
    static async triggerAutoSweep(req, res) {
        try {
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: 'user_id requis'
                });
            }

            // Verify admin role
            if (!['admin', 'super_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Admin uniquement.'
                });
            }

            const result = await FundSegregationService.autoSweep(user_id);

            res.json({
                success: true,
                message: 'Auto-sweep exécuté',
                data: result
            });

        } catch (error) {
            logger.error('Auto-sweep error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erreur lors de l\'auto-sweep'
            });
        }
    }

    /**
     * ADMIN: Trigger auto-sweep for all users (cron job)
     * POST /api/admin/segregation/auto-sweep-all
     */
    static async triggerAutoSweepAll(req, res) {
        try {
            // Verify admin role
            if (!['admin', 'super_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Admin uniquement.'
                });
            }

            const { User } = require('../models');

            // Get all active users
            const users = await User.findAll({
                where: { status: 'active' },
                attributes: ['id', 'email']
            });

            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (const user of users) {
                try {
                    const result = await FundSegregationService.autoSweep(user.id);
                    if (result.success && result.sweeps_performed > 0) {
                        results.push({
                            user_id: user.id,
                            email: user.email,
                            sweeps: result.sweeps_performed
                        });
                        successCount++;
                    }
                } catch (error) {
                    logger.error(`Auto-sweep failed for user ${user.id}:`, error);
                    errorCount++;
                }
            }

            logger.info(`Auto-sweep all completed: ${successCount} success, ${errorCount} errors`);

            res.json({
                success: true,
                message: 'Auto-sweep global exécuté',
                total_users: users.length,
                successful_sweeps: successCount,
                errors: errorCount,
                details: results
            });

        } catch (error) {
            logger.error('Auto-sweep all error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erreur lors de l\'auto-sweep global'
            });
        }
    }
}

module.exports = SegregationController;
