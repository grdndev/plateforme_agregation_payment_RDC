const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');

/**
 * Exchange Rate Service
 * Fetches and caches exchange rates from external API
 */
class ExchangeRateService {
    constructor() {
        this.rates = {
            CDF_USD: null,
            USD_CDF: null,
            lastUpdate: null
        };

        this.spread = config.exchangeRate.spread; // 2.5% by default
        this.updateInterval = config.exchangeRate.updateInterval; // 1 hour
        this.apiUrl = config.exchangeRate.apiUrl;
    }

    /**
     * Get current exchange rates
     * @returns {Promise<Object>}
     */
    async getRates() {
        // Check if rates need update
        if (this.shouldUpdateRates()) {
            await this.updateRates();
        }

        if (!this.rates.CDF_USD || !this.rates.USD_CDF) {
            throw new Error('Exchange rates not available');
        }

        return {
            CDF_USD: this.rates.CDF_USD,
            USD_CDF: this.rates.USD_CDF,
            spread: this.spread,
            lastUpdate: this.rates.lastUpdate
        };
    }

    /**
     * Check if rates should be updated
     * @returns {boolean}
     */
    shouldUpdateRates() {
        if (!this.rates.lastUpdate) {
            return true;
        }

        const timeSinceUpdate = Date.now() - this.rates.lastUpdate.getTime();
        return timeSinceUpdate >= this.updateInterval;
    }

    /**
     * Update exchange rates from external API
     * @returns {Promise<void>}
     */
    async updateRates() {
        try {
            logger.info('Updating exchange rates...');

            // Option 1: Real API (exchangerate-api.com, fixer.io, etc.)
            if (config.exchangeRate.apiKey && this.apiUrl) {
                await this.fetchFromExternalApi();
            } else {
                // Option 2: Fallback to mock rates for development
                await this.useMockRates();
            }

            this.rates.lastUpdate = new Date();
            logger.info('Exchange rates updated:', this.rates);

        } catch (error) {
            logger.error('Failed to update exchange rates:', error);

            // Use last known rates if available
            if (!this.rates.CDF_USD) {
                // Absolute fallback
                await this.useMockRates();
                this.rates.lastUpdate = new Date();
            }
        }
    }

    /**
     * Fetch rates from external API
     * @returns {Promise<void>}
     */
    async fetchFromExternalApi() {
        try {
            // Example with exchangerate-api.com
            const response = await axios.get(`${this.apiUrl}/USD`, {
                params: {
                    app_id: config.exchangeRate.apiKey
                },
                timeout: 10000
            });

            const rates = response.data.rates;

            if (rates && rates.CDF) {
                // Base rate from API
                const baseRate = parseFloat(rates.CDF);

                // Apply spread (we buy cheaper, sell more expensive)
                const spreadFactor = this.spread / 100;

                // USD to CDF (selling USD): add spread
                this.rates.USD_CDF = baseRate * (1 + spreadFactor);

                // CDF to USD (buying USD): remove spread  
                this.rates.CDF_USD = (1 / baseRate) * (1 - spreadFactor);
            } else {
                throw new Error('Invalid API response');
            }

        } catch (error) {
            logger.error('External API fetch failed:', error.message);
            throw error;
        }
    }

    /**
     * Use mock rates (for development/testing)
     * @returns {Promise<void>}
     */
    async useMockRates() {
        // Current approximate rates (as of 2026)
        // 1 USD ≈ 2850 CDF (official rate)
        const officialRate = 2850;
        const spreadFactor = this.spread / 100;

        // Apply spread
        this.rates.USD_CDF = officialRate * (1 + spreadFactor); // ~2921 CDF per USD
        this.rates.CDF_USD = (1 / officialRate) * (1 - spreadFactor); // ~0.000342 USD per CDF

        logger.warn('Using mock exchange rates (development mode)');
    }

    /**
     * Convert amount from one currency to another
     * @param {number} amount
     * @param {string} fromCurrency - 'CDF' or 'USD'
     * @param {string} toCurrency - 'CDF' or 'USD'
     * @returns {Promise<Object>}
     */
    async convert(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return {
                fromAmount: parseFloat(amount),
                fromCurrency,
                toAmount: parseFloat(amount),
                toCurrency,
                rate: 1.0,
                spread: 0,
                timestamp: new Date()
            };
        }

        const rates = await this.getRates();

        let rate;
        let toAmount;

        if (fromCurrency === 'USD' && toCurrency === 'CDF') {
            rate = rates.USD_CDF;
            toAmount = parseFloat(amount) * rate;
        } else if (fromCurrency === 'CDF' && toCurrency === 'USD') {
            rate = rates.CDF_USD;
            toAmount = parseFloat(amount) * rate;
        } else {
            throw new Error(`Unsupported conversion: ${fromCurrency} to ${toCurrency}`);
        }

        return {
            fromAmount: parseFloat(amount),
            fromCurrency,
            toAmount: parseFloat(toAmount.toFixed(2)),
            toCurrency,
            rate: parseFloat(rate.toFixed(6)),
            spread: this.spread,
            timestamp: new Date()
        };
    }

    /**
     * Get rate for specific conversion
     * @param {string} fromCurrency
     * @param {string} toCurrency
     * @returns {Promise<number>}
     */
    async getRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return 1.0;
        }

        const rates = await this.getRates();

        if (fromCurrency === 'USD' && toCurrency === 'CDF') {
            return rates.USD_CDF;
        } else if (fromCurrency === 'CDF' && toCurrency === 'USD') {
            return rates.CDF_USD;
        }

        throw new Error(`Unsupported conversion: ${fromCurrency} to ${toCurrency}`);
    }

    /**
     * Lock rate for a specific conversion (60 seconds)
     * @param {string} fromCurrency
     * @param {string} toCurrency
     * @returns {Promise<Object>}
     */
    async lockRate(fromCurrency, toCurrency) {
        const rate = await this.getRate(fromCurrency, toCurrency);
        const lockId = this.generateLockId();
        const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

        const lockedRate = {
            lockId,
            fromCurrency,
            toCurrency,
            rate,
            spread: this.spread,
            lockedAt: new Date(),
            expiresAt
        };

        // Store in memory (in production, use Redis)
        if (!this.rateLocks) {
            this.rateLocks = new Map();
        }

        this.rateLocks.set(lockId, lockedRate);

        // Auto-cleanup after expiration
        setTimeout(() => {
            this.rateLocks.delete(lockId);
        }, 61000);

        logger.info('Rate locked:', lockedRate);

        return lockedRate;
    }

    /**
     * Get locked rate
     * @param {string} lockId
     * @returns {Object|null}
     */
    getLockedRate(lockId) {
        if (!this.rateLocks) {
            return null;
        }

        const lockedRate = this.rateLocks.get(lockId);

        if (!lockedRate) {
            return null;
        }

        // Check if expired
        if (new Date() > lockedRate.expiresAt) {
            this.rateLocks.delete(lockId);
            return null;
        }

        return lockedRate;
    }

    /**
     * Generate unique lock ID
     * @returns {string}
     */
    generateLockId() {
        return `LOCK-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    }
}

// Singleton instance
const exchangeRateService = new ExchangeRateService();

// Initialize rates on startup
exchangeRateService.updateRates().catch(err => {
    logger.error('Initial rate update failed:', err);
});

module.exports = exchangeRateService;
