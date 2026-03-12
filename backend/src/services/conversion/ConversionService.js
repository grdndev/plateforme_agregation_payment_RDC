const { Transaction, LedgerEntry } = require('../../models');
const { sequelize } = require('../../config/database');
const WalletManager = require('../wallet/WalletManager');
const ExchangeRateService = require('./ExchangeRateService');
const logger = require('../../utils/logger');

/**
 * Currency Conversion Service
 * Handles conversion between CDF and USD with rate locking
 */
class ConversionService {
    /**
     * Get available rates
     * @returns {Promise<Object>}
     */
    async getAvailableRates() {
        return await ExchangeRateService.getRates();
    }

    /**
     * Lock conversion rate for 60 seconds
     * @param {string} fromCurrency
     * @param {string} toCurrency
     * @param {number} amount
     * @returns {Promise<Object>}
     */
    async lockConversionRate(fromCurrency, toCurrency, amount) {
        // Lock rate
        const lockedRate = await ExchangeRateService.lockRate(fromCurrency, toCurrency);

        // Calculate conversion
        const converted = await ExchangeRateService.convert(amount, fromCurrency, toCurrency);

        return {
            lockId: lockedRate.lockId,
            fromCurrency,
            toCurrency,
            fromAmount: parseFloat(amount),
            toAmount: converted.toAmount,
            rate: lockedRate.rate,
            spread: lockedRate.spread,
            lockedAt: lockedRate.lockedAt,
            expiresAt: lockedRate.expiresAt,
            expiresIn: 60 // seconds
        };
    }

    /**
     * Execute conversion with locked rate
     * @param {string} userId
     * @param {string} lockId
     * @returns {Promise<Object>}
     */
    async executeConversion(userId, lockId) {
        const dbTransaction = await sequelize.transaction();

        try {
            // Get locked rate
            const lockedRate = ExchangeRateService.getLockedRate(lockId);

            if (!lockedRate) {
                throw new Error('Locked rate expired or not found. Please lock rate again.');
            }

            const { fromCurrency, toCurrency, rate } = lockedRate;

            // Get wallet
            const wallet = await WalletManager.getWallet(userId);

            // Calculate amounts from locked rate
            const fromAmount = wallet.getBalance(fromCurrency);

            if (fromAmount <= 0) {
                throw new Error(`No ${fromCurrency} balance to convert`);
            }

            const toAmount = parseFloat((fromAmount * rate).toFixed(2));

            if (toAmount <= 0) {
                throw new Error('Conversion amount too small');
            }

            // Check sufficient balance
            if (!wallet.hasSufficientBalance(fromAmount, fromCurrency)) {
                throw new Error(`Insufficient ${fromCurrency} balance`);
            }

            // Create conversion transaction
            const transaction = await Transaction.create({
                user_id: userId,
                wallet_id: wallet.id,
                type: 'conversion',
                status: 'success',
                currency: fromCurrency,
                amount_gross: fromAmount,
                amount_commission: 0,
                amount_net: fromAmount,
                conversion_from_currency: fromCurrency,
                conversion_to_currency: toCurrency,
                conversion_rate: rate,
                conversion_amount_from: fromAmount,
                conversion_amount_to: toAmount,
                completed_at: new Date(),
                metadata: {
                    lockId,
                    spread: lockedRate.spread
                }
            }, { transaction: dbTransaction });

            // Debit source currency
            await WalletManager.debitWallet(userId, fromAmount, fromCurrency, dbTransaction);

            // Credit destination currency
            await WalletManager.creditWallet(userId, toAmount, toCurrency, dbTransaction);

            // Create ledger entries
            await LedgerEntry.recordDoubleEntry({
                transactionId: transaction.id,
                debitAccount: `merchant_wallet_${fromCurrency.toLowerCase()}`,
                creditAccount: `merchant_wallet_${toCurrency.toLowerCase()}`,
                amount: toAmount,
                currency: toCurrency,
                description: `Currency conversion ${fromCurrency} to ${toCurrency} - ${transaction.transaction_ref}`,
                metadata: {
                    fromAmount,
                    fromCurrency,
                    toAmount,
                    toCurrency,
                    rate,
                    spread: lockedRate.spread
                },
                dbTransaction
            });

            // Record spread as revenue (conversion fee)
            const spreadRevenue = this.calculateSpreadRevenue(fromAmount, toAmount, fromCurrency, toCurrency, rate);

            if (spreadRevenue > 0) {
                await LedgerEntry.recordDoubleEntry({
                    transactionId: transaction.id,
                    debitAccount: `merchant_wallet_${toCurrency.toLowerCase()}`,
                    creditAccount: `revenue_spread_${toCurrency.toLowerCase()}`,
                    amount: spreadRevenue,
                    currency: toCurrency,
                    description: `Conversion spread revenue - ${transaction.transaction_ref}`,
                    metadata: {
                        spread_percentage: lockedRate.spread
                    },
                    dbTransaction
                });
            }

            await dbTransaction.commit();

            logger.info(`Conversion executed: ${transaction.transaction_ref}`, {
                userId,
                fromAmount,
                fromCurrency,
                toAmount,
                toCurrency,
                rate
            });

            return {
                success: true,
                transaction_ref: transaction.transaction_ref,
                fromAmount,
                fromCurrency,
                toAmount,
                toCurrency,
                rate,
                spread: lockedRate.spread,
                completed_at: transaction.completed_at
            };

        } catch (error) {
            await dbTransaction.rollback();
            logger.error('Conversion execution failed:', error);
            throw error;
        }
    }

    /**
     * Convert specific amount (one-step: lock + execute)
     * @param {string} userId
     * @param {number} amount
     * @param {string} fromCurrency
     * @param {string} toCurrency
     * @returns {Promise<Object>}
     */
    async convertAmount(userId, amount, fromCurrency, toCurrency) {
        const dbTransaction = await sequelize.transaction();

        try {
            // Check balance
            const hasBalance = await WalletManager.hasSufficientBalance(userId, amount, fromCurrency);

            if (!hasBalance) {
                throw new Error(`Insufficient ${fromCurrency} balance`);
            }

            // Get current rate
            const conversion = await ExchangeRateService.convert(amount, fromCurrency, toCurrency);

            // Create conversion transaction
            const transaction = await Transaction.create({
                user_id: userId,
                type: 'conversion',
                status: 'success',
                currency: fromCurrency,
                amount_gross: amount,
                amount_commission: 0,
                amount_net: amount,
                conversion_from_currency: fromCurrency,
                conversion_to_currency: toCurrency,
                conversion_rate: conversion.rate,
                conversion_amount_from: amount,
                conversion_amount_to: conversion.toAmount,
                completed_at: new Date(),
                metadata: {
                    spread: conversion.spread
                }
            }, { transaction: dbTransaction });

            // Debit source currency
            await WalletManager.debitWallet(userId, amount, fromCurrency, dbTransaction);

            // Credit destination currency
            await WalletManager.creditWallet(userId, conversion.toAmount, toCurrency, dbTransaction);

            // Create ledger entries
            await LedgerEntry.recordDoubleEntry({
                transactionId: transaction.id,
                debitAccount: `merchant_wallet_${fromCurrency.toLowerCase()}`,
                creditAccount: `merchant_wallet_${toCurrency.toLowerCase()}`,
                amount: conversion.toAmount,
                currency: toCurrency,
                description: `Currency conversion - ${transaction.transaction_ref}`,
                metadata: conversion,
                dbTransaction
            });

            await dbTransaction.commit();

            logger.info(`Conversion completed: ${transaction.transaction_ref}`, {
                userId,
                amount,
                fromCurrency,
                toCurrency,
                toAmount: conversion.toAmount
            });

            return {
                success: true,
                transaction_ref: transaction.transaction_ref,
                fromAmount: amount,
                fromCurrency,
                toAmount: conversion.toAmount,
                toCurrency,
                rate: conversion.rate,
                spread: conversion.spread,
                completed_at: transaction.completed_at
            };

        } catch (error) {
            await dbTransaction.rollback();
            logger.error('Conversion failed:', error);
            throw error;
        }
    }

    /**
     * Calculate spread revenue
     * @private
     */
    calculateSpreadRevenue(fromAmount, toAmount, fromCurrency, toCurrency, rate) {
        // Simplified calculation - in production, compare with official rate
        const spreadPercentage = ExchangeRateService.spread / 100;

        if (fromCurrency === 'USD') {
            return toAmount * spreadPercentage;
        } else {
            return toAmount * spreadPercentage;
        }
    }
}

// Singleton instance
module.exports = new ConversionService();
