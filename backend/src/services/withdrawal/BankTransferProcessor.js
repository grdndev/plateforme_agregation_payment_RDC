const { Transaction, BankAccount, Wallet, LedgerEntry, User } = require('../../models');
const { sequelize } = require('../../config/database');
const WalletManager = require('../wallet/WalletManager');
const config = require('../../config');
const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Bank Transfer Processor Service
 * Handles withdrawal requests and bank transfer generation
 */
class BankTransferProcessor {
    constructor() {
        this.minWithdrawalUSD = config.limits.minWithdrawal.USD;
        this.minWithdrawalCDF = config.limits.minWithdrawal.CDF;
        this.dailyCutoffHour = config.limits.dailyWithdrawalCutoffHour; // 16h
    }

    /**
     * Initiate withdrawal request
     * @param {string} userId
     * @param {Object} withdrawalData
     * @returns {Promise<Object>}
     */
    async initiateWithdrawal(userId, withdrawalData) {
        const dbTransaction = await sequelize.transaction();

        try {
            const { amount, currency, bank_account_id, description } = withdrawalData;

            // Validate minimum amount
            const minAmount = currency === 'USD' ? this.minWithdrawalUSD : this.minWithdrawalCDF;

            if (parseFloat(amount) < minAmount) {
                throw new Error(`Montant minimum de retrait: ${minAmount} ${currency}`);
            }

            // Check wallet balance
            const hasBalance = await WalletManager.hasSufficientBalance(userId, amount, currency);

            if (!hasBalance) {
                throw new Error(`Solde insuffisant en ${currency}`);
            }

            // Verify bank account belongs to user
            const bankAccount = await BankAccount.findOne({
                where: {
                    id: bank_account_id,
                    user_id: userId
                }
            });

            if (!bankAccount) {
                throw new Error('Compte bancaire non trouvé ou non autorisé');
            }

            if (!bankAccount.is_verified) {
                throw new Error('Compte bancaire non vérifié. Veuillez contacter le support.');
            }

            // Check account currency matches
            if (bankAccount.currency !== currency) {
                throw new Error(`Ce compte bancaire accepte uniquement ${bankAccount.currency}`);
            }

            // Get wallet
            const wallet = await Wallet.findOne({ where: { user_id: userId } });

            if (wallet.is_frozen) {
                throw new Error('Wallet gelé. Impossible d\'effectuer des retraits.');
            }

            // Create withdrawal transaction
            const transaction = await Transaction.create({
                user_id: userId,
                wallet_id: wallet.id,
                type: 'withdrawal',
                status: 'pending',
                currency,
                amount_gross: amount,
                amount_commission: 0,
                amount_net: amount,
                withdrawal_bank_name: bankAccount.bank_name,
                withdrawal_account_number: bankAccount.account_number,
                withdrawal_account_name: bankAccount.account_name,
                metadata: {
                    description,
                    bank_account_id,
                    iban: bankAccount.iban,
                    swift_code: bankAccount.swift_code
                }
            }, { transaction: dbTransaction });

            // Debit wallet immediately (funds are reserved)
            await WalletManager.debitWallet(userId, amount, currency, dbTransaction);

            // Create ledger entries (move to liability/pending withdrawal)
            await LedgerEntry.recordDoubleEntry({
                transactionId: transaction.id,
                debitAccount: `merchant_wallet_${currency.toLowerCase()}`,
                creditAccount: 'liability_pending_withdrawal',
                amount,
                currency,
                description: `Withdrawal request - ${transaction.transaction_ref}`,
                metadata: {
                    bank_account: bankAccount.account_number,
                    bank_name: bankAccount.bank_name
                },
                dbTransaction
            });

            await dbTransaction.commit();

            logger.info(`Withdrawal initiated: ${transaction.transaction_ref}`, {
                userId,
                amount,
                currency,
                bankAccount: bankAccount.account_number
            });

            return {
                success: true,
                transaction_ref: transaction.transaction_ref,
                amount,
                currency,
                bank_account: {
                    bank_name: bankAccount.bank_name,
                    account_number: this.maskAccountNumber(bankAccount.account_number)
                },
                status: 'pending',
                estimated_processing: 'Traité dans les prochains lots (16h quotidien)',
                created_at: transaction.created_at
            };

        } catch (error) {
            await dbTransaction.rollback();
            logger.error('Withdrawal initiation failed:', error);
            throw error;
        }
    }

    /**
     * Get pending withdrawal requests for batch processing
     * @param {Object} options
     * @returns {Promise<Array>}
     */
    async getPendingWithdrawals(options = {}) {
        const { currency = null, limit = 100 } = options;

        const where = {
            type: 'withdrawal',
            status: 'pending'
        };

        if (currency) {
            where.currency = currency;
        }

        const withdrawals = await Transaction.findAll({
            where,
            limit,
            order: [['created_at', 'ASC']],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'company_name', 'phone']
                }
            ]
        });

        return withdrawals;
    }

    /**
     * Generate batch file for bank transfers
     * @param {string} currency
     * @returns {Promise<Object>}
     */
    async generateBatchFile(currency) {
        try {
            const withdrawals = await this.getPendingWithdrawals({ currency });

            if (withdrawals.length === 0) {
                return {
                    success: false,
                    message: 'Aucun retrait en attente',
                    count: 0
                };
            }

            // Generate batch ID
            const batchId = this.generateBatchId(currency);

            // Update transactions with batch ID
            const transactionIds = withdrawals.map(w => w.id);
            await Transaction.update(
                {
                    withdrawal_batch_id: batchId,
                    status: 'processing'
                },
                { where: { id: transactionIds } }
            );

            // Generate file content
            const fileContent = this.generateCSVContent(withdrawals, batchId);

            // Save file
            const fileName = `batch_${batchId}_${currency}.csv`;
            const filePath = path.join(__dirname, '../../../uploads/withdrawals', fileName);

            // Ensure directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, fileContent, 'utf-8');

            // Calculate totals
            const totalAmount = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount_net), 0);

            logger.info(`Batch file generated: ${batchId}`, {
                currency,
                count: withdrawals.length,
                totalAmount,
                fileName
            });

            return {
                success: true,
                batch_id: batchId,
                currency,
                count: withdrawals.length,
                total_amount: parseFloat(totalAmount.toFixed(2)),
                file_name: fileName,
                file_path: filePath,
                transactions: withdrawals.map(w => ({
                    transaction_ref: w.transaction_ref,
                    amount: w.amount_net,
                    account: this.maskAccountNumber(w.withdrawal_account_number)
                }))
            };

        } catch (error) {
            logger.error('Batch file generation failed:', error);
            throw error;
        }
    }

    /**
     * Mark withdrawal as completed
     * @param {string} transactionRef
     * @returns {Promise<Object>}
     */
    async markAsCompleted(transactionRef) {
        const dbTransaction = await sequelize.transaction();

        try {
            const transaction = await Transaction.findOne({
                where: {
                    transaction_ref: transactionRef,
                    type: 'withdrawal'
                }
            });

            if (!transaction) {
                throw new Error('Transaction non trouvée');
            }

            if (transaction.status === 'success') {
                return {
                    success: true,
                    message: 'Retrait déjà marqué comme complété'
                };
            }

            // Update transaction status
            transaction.status = 'success';
            transaction.completed_at = new Date();
            await transaction.save({ transaction: dbTransaction });

            // Update ledger (finalize withdrawal)
            await LedgerEntry.recordDoubleEntry({
                transactionId: transaction.id,
                debitAccount: 'liability_pending_withdrawal',
                creditAccount: `escrow_bank_${transaction.currency.toLowerCase()}`,
                amount: transaction.amount_net,
                currency: transaction.currency,
                description: `Withdrawal completed - ${transaction.transaction_ref}`,
                metadata: {
                    batch_id: transaction.withdrawal_batch_id
                },
                dbTransaction
            });

            await dbTransaction.commit();

            logger.info(`Withdrawal completed: ${transactionRef}`);

            return {
                success: true,
                transaction_ref: transactionRef,
                amount: transaction.amount_net,
                currency: transaction.currency,
                completed_at: transaction.completed_at
            };

        } catch (error) {
            await dbTransaction.rollback();
            logger.error('Mark withdrawal as completed failed:', error);
            throw error;
        }
    }

    /**
     * Handle withdrawal rejection (re-credit wallet)
     * @param {string} transactionRef
     * @param {string} reason
     * @returns {Promise<Object>}
     */
    async rejectWithdrawal(transactionRef, reason) {
        const dbTransaction = await sequelize.transaction();

        try {
            const transaction = await Transaction.findOne({
                where: {
                    transaction_ref: transactionRef,
                    type: 'withdrawal'
                }
            });

            if (!transaction) {
                throw new Error('Transaction non trouvée');
            }

            if (transaction.status === 'failed') {
                return {
                    success: true,
                    message: 'Retrait déjà rejeté'
                };
            }

            // Update transaction status
            transaction.status = 'failed';
            transaction.failed_at = new Date();
            transaction.error_message = reason;
            await transaction.save({ transaction: dbTransaction });

            // Re-credit wallet
            await WalletManager.creditWallet(
                transaction.user_id,
                transaction.amount_net,
                transaction.currency,
                dbTransaction
            );

            // Update ledger (reverse pending withdrawal)
            await LedgerEntry.recordDoubleEntry({
                transactionId: transaction.id,
                debitAccount: 'liability_pending_withdrawal',
                creditAccount: `merchant_wallet_${transaction.currency.toLowerCase()}`,
                amount: transaction.amount_net,
                currency: transaction.currency,
                description: `Withdrawal rejected (refund) - ${transaction.transaction_ref}`,
                metadata: {
                    rejection_reason: reason,
                    batch_id: transaction.withdrawal_batch_id
                },
                dbTransaction
            });

            await dbTransaction.commit();

            logger.warn(`Withdrawal rejected: ${transactionRef}`, { reason });

            // TODO: Send notification to merchant

            return {
                success: true,
                transaction_ref: transactionRef,
                amount_refunded: transaction.amount_net,
                currency: transaction.currency,
                reason,
                failed_at: transaction.failed_at
            };

        } catch (error) {
            await dbTransaction.rollback();
            logger.error('Reject withdrawal failed:', error);
            throw error;
        }
    }

    /**
     * Generate batch ID
     * @param {string} currency
     * @returns {string}
     */
    generateBatchId(currency) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
        return `BATCH-${currency}-${dateStr}-${timeStr}`;
    }

    /**
     * Generate CSV content for batch file
     * @param {Array} withdrawals
     * @param {string} batchId
     * @returns {string}
     */
    generateCSVContent(withdrawals, batchId) {
        let csv = 'BATCH_ID,TRANSACTION_REF,BENEFICIARY_NAME,BANK_NAME,ACCOUNT_NUMBER,IBAN,SWIFT,AMOUNT,CURRENCY,CREATED_AT,MERCHANT_EMAIL\n';

        withdrawals.forEach(w => {
            csv += [
                batchId,
                w.transaction_ref,
                `"${w.withdrawal_account_name}"`,
                `"${w.withdrawal_bank_name}"`,
                w.withdrawal_account_number,
                w.metadata?.iban || '',
                w.metadata?.swift_code || '',
                w.amount_net,
                w.currency,
                w.created_at.toISOString(),
                w.user.email
            ].join(',') + '\n';
        });

        return csv;
    }

    /**
     * Mask account number for security
     * @param {string} accountNumber
     * @returns {string}
     */
    maskAccountNumber(accountNumber) {
        if (!accountNumber || accountNumber.length < 4) {
            return '****';
        }
        const visibleChars = 4;
        const masked = '*'.repeat(accountNumber.length - visibleChars);
        return masked + accountNumber.slice(-visibleChars);
    }

    /**
     * Get withdrawal statistics
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async getStatistics(options = {}) {
        const { period = 'month', currency = null } = options;

        const periodMap = {
            week: 7,
            month: 30,
            year: 365
        };

        const days = periodMap[period] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const where = {
            type: 'withdrawal',
            created_at: {
                [sequelize.Op.gte]: startDate
            }
        };

        if (currency) {
            where.currency = currency;
        }

        const stats = await Transaction.findAll({
            where,
            attributes: [
                'currency',
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('amount_net')), 'total_amount']
            ],
            group: ['currency', 'status'],
            raw: true
        });

        return {
            period,
            days,
            statistics: stats
        };
    }
}

// Singleton instance
module.exports = new BankTransferProcessor();
