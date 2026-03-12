const { BankAccount } = require('../models');
const BankTransferProcessor = require('../services/withdrawal/BankTransferProcessor');
const { requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

class WithdrawalController {
    /**
     * Initiate withdrawal request
     * POST /api/withdrawals
     */
    static async create(req, res) {
        try {
            const userId = req.userId;
            const { amount, currency, bank_account_id, description } = req.body;

            const result = await BankTransferProcessor.initiateWithdrawal(userId, {
                amount,
                currency,
                bank_account_id,
                description
            });

            res.status(201).json({
                success: true,
                message: 'Demande de retrait initiée avec succès',
                data: result
            });

        } catch (error) {
            logger.error('Withdrawal creation error:', error);

            res.status(400).json({
                success: false,
                message: error.message || 'Erreur lors de la demande de retrait'
            });
        }
    }

    /**
     * Get user's bank accounts
     * GET /api/withdrawals/bank-accounts
     */
    static async getBankAccounts(req, res) {
        try {
            const userId = req.userId;

            const accounts = await BankAccount.findAll({
                where: { user_id: userId },
                order: [['is_default', 'DESC'], ['created_at', 'DESC']]
            });

            res.json({
                success: true,
                data: accounts.map(acc => ({
                    id: acc.id,
                    bank_name: acc.bank_name,
                    account_number: BankTransferProcessor.maskAccountNumber(acc.account_number),
                    account_number_full: acc.account_number, // Only for owner
                    account_name: acc.account_name,
                    currency: acc.currency,
                    is_verified: acc.is_verified,
                    is_default: acc.is_default,
                    created_at: acc.created_at
                }))
            });

        } catch (error) {
            logger.error('Get bank accounts error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des comptes bancaires'
            });
        }
    }

    /**
     * Add new bank account
     * POST /api/withdrawals/bank-accounts
     */
    static async addBankAccount(req, res) {
        try {
            const userId = req.userId;
            const {
                bank_name,
                account_number,
                account_name,
                currency,
                iban,
                swift_code,
                is_default
            } = req.body;

            // If setting as default, unset other defaults
            if (is_default) {
                await BankAccount.update(
                    { is_default: false },
                    { where: { user_id: userId } }
                );
            }

            const bankAccount = await BankAccount.create({
                user_id: userId,
                bank_name,
                account_number,
                account_name,
                currency,
                iban,
                swift_code,
                is_default: is_default || false,
                is_verified: false // Requires admin verification
            });

            logger.info(`Bank account added: ${bankAccount.id}`, {
                userId,
                bank_name
            });

            res.status(201).json({
                success: true,
                message: 'Compte bancaire ajouté avec succès',
                data: {
                    id: bankAccount.id,
                    bank_name: bankAccount.bank_name,
                    account_number: BankTransferProcessor.maskAccountNumber(bankAccount.account_number),
                    account_name: bankAccount.account_name,
                    currency: bankAccount.currency,
                    is_verified: bankAccount.is_verified,
                    hint: 'Ce compte doit être vérifié par notre équipe avant utilisation'
                }
            });

        } catch (error) {
            logger.error('Add bank account error:', error);

            res.status(400).json({
                success: false,
                message: error.message || 'Erreur lors de l\'ajout du compte bancaire'
            });
        }
    }

    /**
     * Get withdrawal history
     * GET /api/withdrawals/history
     */
    static async getHistory(req, res) {
        try {
            const userId = req.userId;
            const { status, currency } = req.query;

            // Use WalletManager to get filtered transactions
            const WalletManager = require('../services/wallet/WalletManager');

            const result = await WalletManager.getTransactions(userId, {
                type: 'withdrawal',
                status,
                currency,
                page: req.query.page || 1,
                limit: req.query.limit || 20
            });

            res.json({
                success: true,
                data: result.transactions,
                pagination: result.pagination
            });

        } catch (error) {
            logger.error('Get withdrawal history error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'historique'
            });
        }
    }

    /**
     * Get withdrawal statistics
     * GET /api/withdrawals/statistics
     */
    static async getStatistics(req, res) {
        try {
            const { period, currency } = req.query;

            const stats = await BankTransferProcessor.getStatistics({
                period: period || 'month',
                currency
            });

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            logger.error('Get withdrawal statistics error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques'
            });
        }
    }

    /**
     * ADMIN: Generate batch file for processing
     * POST /api/withdrawals/admin/generate-batch
     */
    static async generateBatch(req, res) {
        try {
            const { currency } = req.body;

            if (!currency) {
                return res.status(400).json({
                    success: false,
                    message: 'Currency requise (CDF ou USD)'
                });
            }

            const result = await BankTransferProcessor.generateBatchFile(currency);

            res.json(result);

        } catch (error) {
            logger.error('Generate batch error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la génération du lot'
            });
        }
    }

    /**
     * ADMIN: Mark withdrawal as completed
     * PUT /api/withdrawals/admin/:transaction_ref/complete
     */
    static async markCompleted(req, res) {
        try {
            const { transaction_ref } = req.params;

            const result = await BankTransferProcessor.markAsCompleted(transaction_ref);

            res.json({
                success: true,
                message: 'Retrait marqué comme complété',
                data: result
            });

        } catch (error) {
            logger.error('Mark withdrawal completed error:', error);

            res.status(400).json({
                success: false,
                message: error.message || 'Erreur lors de la complétion du retrait'
            });
        }
    }

    /**
     * ADMIN: Reject withdrawal and refund
     * PUT /api/withdrawals/admin/:transaction_ref/reject
     */
    static async reject(req, res) {
        try {
            const { transaction_ref } = req.params;
            const { reason } = req.body;

            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Raison du rejet requise'
                });
            }

            const result = await BankTransferProcessor.rejectWithdrawal(transaction_ref, reason);

            res.json({
                success: true,
                message: 'Retrait rejeté et fonds recrédités',
                data: result
            });

        } catch (error) {
            logger.error('Reject withdrawal error:', error);

            res.status(400).json({
                success: false,
                message: error.message || 'Erreur lors du rejet du retrait'
            });
        }
    }

    /**
     * ADMIN: Get pending withdrawals
     * GET /api/withdrawals/admin/pending
     */
    static async getPendingWithdrawals(req, res) {
        try {
            const { currency } = req.query;

            const withdrawals = await BankTransferProcessor.getPendingWithdrawals({ currency });

            res.json({
                success: true,
                count: withdrawals.length,
                data: withdrawals.map(w => ({
                    transaction_ref: w.transaction_ref,
                    amount: w.amount_net,
                    currency: w.currency,
                    merchant: {
                        email: w.user.email,
                        company_name: w.user.company_name
                    },
                    bank_account: {
                        bank_name: w.withdrawal_bank_name,
                        account_number: BankTransferProcessor.maskAccountNumber(w.withdrawal_account_number),
                        account_name: w.withdrawal_account_name
                    },
                    created_at: w.created_at,
                    status: w.status
                }))
            });

        } catch (error) {
            logger.error('Get pending withdrawals error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des retraits en attente'
            });
        }
    }
}

module.exports = WithdrawalController;
