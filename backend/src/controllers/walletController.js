const WalletManager = require('../services/wallet/WalletManager');
const ConversionService = require('../services/conversion/ConversionService');
const ExchangeRateService = require('../services/conversion/ExchangeRateService');
const logger = require('../utils/logger');

class WalletController {
    /**
     * Get wallet balance
     * GET /api/wallet/balance
     */
    static async getBalance(req, res) {
        try {
            const userId = req.userId;

            const balance = await WalletManager.getBalance(userId);

            res.json({
                success: true,
                data: balance
            });

        } catch (error) {
            logger.error('Get balance error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du solde'
            });
        }
    }

    /**
     * Get wallet transactions
     * GET /api/wallet/transactions
     */
    static async getTransactions(req, res) {
        try {
            const userId = req.userId;
            const {
                page = 1,
                limit = 20,
                type,
                status,
                currency,
                start_date,
                end_date
            } = req.query;

            const result = await WalletManager.getTransactions(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                type,
                status,
                currency,
                startDate: start_date,
                endDate: end_date
            });

            res.json({
                success: true,
                data: result.transactions,
                pagination: result.pagination
            });

        } catch (error) {
            logger.error('Get transactions error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des transactions'
            });
        }
    }

    /**
     * Get wallet statistics
     * GET /api/wallet/statistics
     */
    static async getStatistics(req, res) {
        try {
            const userId = req.userId;
            const { period = 'month' } = req.query;

            const stats = await WalletManager.getStatistics(userId, period);

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            logger.error('Get statistics error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques'
            });
        }
    }

    /**
     * Get current exchange rates
     * GET /api/wallet/rates
     */
    static async getExchangeRates(req, res) {
        try {
            const rates = await ExchangeRateService.getRates();

            res.json({
                success: true,
                data: {
                    rates: {
                        USD_to_CDF: rates.USD_CDF,
                        CDF_to_USD: rates.CDF_USD
                    },
                    spread_percentage: rates.spread,
                    last_update: rates.lastUpdate,
                    hint: 'Les taux incluent un spread de ' + rates.spread + '%'
                }
            });

        } catch (error) {
            logger.error('Get exchange rates error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des taux de change'
            });
        }
    }

    /**
     * Lock conversion rate
     * POST /api/wallet/convert/lock
     */
    static async lockConversionRate(req, res) {
        try {
            const { from_currency, to_currency, amount } = req.body;

            const locked = await ConversionService.lockConversionRate(
                from_currency,
                to_currency,
                amount
            );

            res.json({
                success: true,
                message: 'Taux verrouillé pour 60 secondes',
                data: locked
            });

        } catch (error) {
            logger.error('Lock conversion rate error:', error);

            res.status(500).json({
                success: false,
                message: error.message || 'Erreur lors du verrouillage du taux'
            });
        }
    }

    /**
     * Execute conversion with locked rate
     * POST /api/wallet/convert/execute
     */
    static async executeConversion(req, res) {
        try {
            const userId = req.userId;
            const { lock_id } = req.body;

            if (!lock_id) {
                return res.status(400).json({
                    success: false,
                    message: 'lock_id requis'
                });
            }

            const result = await ConversionService.executeConversion(userId, lock_id);

            res.json({
                success: true,
                message: 'Conversion effectuée avec succès',
                data: result
            });

        } catch (error) {
            logger.error('Execute conversion error:', error);

            res.status(400).json({
                success: false,
                message: error.message || 'Erreur lors de la conversion'
            });
        }
    }

    /**
     * Convert currency (one-step)
     * POST /api/wallet/convert
     */
    static async convertCurrency(req, res) {
        try {
            const userId = req.userId;
            const { amount, from_currency, to_currency } = req.body;

            const result = await ConversionService.convertAmount(
                userId,
                amount,
                from_currency,
                to_currency
            );

            res.json({
                success: true,
                message: 'Conversion effectuée avec succès',
                data: result
            });

        } catch (error) {
            logger.error('Convert currency error:', error);

            res.status(400).json({
                success: false,
                message: error.message || 'Erreur lors de la conversion'
            });
        }
    }
}

module.exports = WalletController;
