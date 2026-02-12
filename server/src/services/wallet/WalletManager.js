const { Wallet, Transaction, User, LedgerEntry } = require('../../models');
const { sequelize } = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Wallet Manager Service
 * Handles all wallet operations: balance, transactions, credits, debits
 */
class WalletManager {
    /**
     * Get wallet with balances for user
     * @param {string} userId
     * @returns {Promise<Wallet>}
     */
    async getWallet(userId) {
        const wallet = await Wallet.findOne({
            where: { user_id: userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'company_name']
            }]
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        return wallet;
    }

    /**
     * Get wallet balance
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    async getBalance(userId) {
        const wallet = await this.getWallet(userId);

        return {
            cdf: {
                available: parseFloat(wallet.balance_cdf),
                total_received: parseFloat(wallet.total_received_cdf),
                total_withdrawn: parseFloat(wallet.total_withdrawn_cdf)
            },
            usd: {
                available: parseFloat(wallet.balance_usd),
                total_received: parseFloat(wallet.total_received_usd),
                total_withdrawn: parseFloat(wallet.total_withdrawn_usd)
            },
            is_frozen: wallet.is_frozen,
            last_transaction_at: wallet.last_transaction_at
        };
    }

    /**
     * Get wallet transactions with pagination and filters
     * @param {string} userId
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async getTransactions(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            type = null,
            status = null,
            currency = null,
            startDate = null,
            endDate = null
        } = options;

        const offset = (page - 1) * limit;

        // Build where clause
        const where = { user_id: userId };

        if (type) {
            where.type = type;
        }

        if (status) {
            where.status = status;
        }

        if (currency) {
            where.currency = currency;
        }

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) {
                where.created_at[sequelize.Op.gte] = new Date(startDate);
            }
            if (endDate) {
                where.created_at[sequelize.Op.lte] = new Date(endDate);
            }
        }

        // Fetch transactions
        const { count, rows } = await Transaction.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            attributes: [
                'id',
                'transaction_ref',
                'type',
                'status',
                'currency',
                'amount_gross',
                'amount_commission',
                'amount_net',
                'payment_method',
                'customer_phone',
                'order_id',
                'created_at',
                'completed_at'
            ]
        });

        return {
            transactions: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Credit wallet (internal use)
     * @param {string} userId
     * @param {number} amount
     * @param {string} currency
     * @param {Transaction} dbTransaction
     * @returns {Promise<Wallet>}
     */
    async creditWallet(userId, amount, currency, dbTransaction = null) {
        const wallet = await Wallet.findOne({
            where: { user_id: userId }
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        if (wallet.is_frozen) {
            throw new Error('Wallet is frozen');
        }

        await wallet.credit(amount, currency, dbTransaction);

        // Update totals
        const field = currency === 'USD' ? 'total_received_usd' : 'total_received_cdf';
        wallet[field] = parseFloat(wallet[field]) + parseFloat(amount);
        wallet.last_transaction_at = new Date();
        await wallet.save({ transaction: dbTransaction });

        logger.info(`Wallet credited: ${wallet.id}`, {
            userId,
            amount,
            currency
        });

        return wallet;
    }

    /**
     * Debit wallet (internal use)
     * @param {string} userId
     * @param {number} amount
     * @param {string} currency
     * @param {Transaction} dbTransaction
     * @returns {Promise<Wallet>}
     */
    async debitWallet(userId, amount, currency, dbTransaction = null) {
        const wallet = await Wallet.findOne({
            where: { user_id: userId }
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        if (wallet.is_frozen) {
            throw new Error('Wallet is frozen');
        }

        if (!wallet.hasSufficientBalance(amount, currency)) {
            throw new Error(`Insufficient ${currency} balance`);
        }

        await wallet.debit(amount, currency, dbTransaction);

        // Update totals
        const field = currency === 'USD' ? 'total_withdrawn_usd' : 'total_withdrawn_cdf';
        wallet[field] = parseFloat(wallet[field]) + parseFloat(amount);
        wallet.last_transaction_at = new Date();
        await wallet.save({ transaction: dbTransaction });

        logger.info(`Wallet debited: ${wallet.id}`, {
            userId,
            amount,
            currency
        });

        return wallet;
    }

    /**
     * Check if wallet has sufficient balance
     * @param {string} userId
     * @param {number} amount
     * @param {string} currency
     * @returns {Promise<boolean>}
     */
    async hasSufficientBalance(userId, amount, currency) {
        const wallet = await this.getWallet(userId);
        return wallet.hasSufficientBalance(amount, currency);
    }

    /**
     * Freeze wallet
     * @param {string} userId
     * @param {string} reason
     * @returns {Promise<Wallet>}
     */
    async freezeWallet(userId, reason) {
        const wallet = await this.getWallet(userId);

        wallet.is_frozen = true;
        wallet.frozen_reason = reason;
        wallet.frozen_at = new Date();
        await wallet.save();

        logger.warn(`Wallet frozen: ${wallet.id}`, {
            userId,
            reason
        });

        return wallet;
    }

    /**
     * Unfreeze wallet
     * @param {string} userId
     * @returns {Promise<Wallet>}
     */
    async unfreezeWallet(userId) {
        const wallet = await this.getWallet(userId);

        wallet.is_frozen = false;
        wallet.frozen_reason = null;
        wallet.frozen_at = null;
        await wallet.save();

        logger.info(`Wallet unfrozen: ${wallet.id}`, { userId });

        return wallet;
    }

    /**
     * Get wallet statistics
     * @param {string} userId
     * @param {string} period - 'week', 'month', 'year'
     * @returns {Promise<Object>}
     */
    async getStatistics(userId, period = 'month') {
        const periodMap = {
            week: 7,
            month: 30,
            year: 365
        };

        const days = periodMap[period] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get transactions in period
        const transactions = await Transaction.findAll({
            where: {
                user_id: userId,
                created_at: {
                    [sequelize.Op.gte]: startDate
                },
                status: 'success'
            },
            attributes: [
                'currency',
                'type',
                [sequelize.fn('SUM', sequelize.col('amount_gross')), 'total_gross'],
                [sequelize.fn('SUM', sequelize.col('amount_net')), 'total_net'],
                [sequelize.fn('SUM', sequelize.col('amount_commission')), 'total_commission'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['currency', 'type'],
            raw: true
        });

        return {
            period,
            days,
            transactions
        };
    }
}

// Singleton instance
module.exports = new WalletManager();
