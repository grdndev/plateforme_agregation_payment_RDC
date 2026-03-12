const { LedgerEntry, Transaction, User } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

class LedgerController {
    /**
     * Get ledger entries with filters
     * GET /api/admin/ledger
     */
    static async getEntries(req, res) {
        try {
            const {
                page = 1,
                limit = 50,
                account_type,
                entry_type,
                currency,
                transaction_id,
                startDate,
                endDate
            } = req.query;

            const offset = (page - 1) * limit;

            const where = {};
            if (account_type) where.account_type = account_type;
            if (entry_type) where.entry_type = entry_type;
            if (currency) where.currency = currency;
            if (transaction_id) where.transaction_id = transaction_id;

            if (startDate || endDate) {
                where.created_at = {};
                if (startDate) where.created_at[sequelize.Op.gte] = new Date(startDate);
                if (endDate) where.created_at[sequelize.Op.lte] = new Date(endDate);
            }

            const { count, rows } = await LedgerEntry.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: Transaction,
                        as: 'transaction',
                        attributes: ['transaction_ref', 'type', 'user_id'],
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['email', 'company_name']
                            }
                        ]
                    }
                ]
            });

            res.json({
                success: true,
                data: {
                    entries: rows,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            logger.error('Get ledger entries error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du Grand Livre'
            });
        }
    }

    /**
     * Get ledger account balances
     * GET /api/admin/ledger/balances
     */
    static async getBalances(req, res) {
        try {
            const balances = await LedgerEntry.findAll({
                attributes: [
                    'account_type',
                    'currency',
                    [
                        sequelize.literal("SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END)"),
                        'balance'
                    ]
                ],
                group: ['account_type', 'currency'],
                raw: true
            });

            res.json({
                success: true,
                data: balances
            });
        } catch (error) {
            logger.error('Get ledger balances error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des balances comptables'
            });
        }
    }
}

module.exports = LedgerController;
