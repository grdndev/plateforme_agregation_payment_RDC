const axios = require('axios');
const logger = require('../../../utils/logger');

/**
 * Base class for all Mobile Money payment adapters
 * Provides common functionality for M-Pesa, Orange Money, Airtel Money
 */
class BasePaymentAdapter {
    constructor(config, operatorName) {
        this.config = config;
        this.operatorName = operatorName;
        this.httpClient = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // Add request/response interceptors for logging
        this.setupInterceptors();
    }

    setupInterceptors() {
        // Request interceptor
        this.httpClient.interceptors.request.use(
            (config) => {
                logger.info(`[${this.operatorName}] Request:`, {
                    method: config.method,
                    url: config.url,
                    data: config.data
                });
                return config;
            },
            (error) => {
                logger.error(`[${this.operatorName}] Request error:`, error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.httpClient.interceptors.response.use(
            (response) => {
                logger.info(`[${this.operatorName}] Response:`, {
                    status: response.status,
                    data: response.data
                });
                return response;
            },
            (error) => {
                logger.error(`[${this.operatorName}] Response error:`, {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Initiate payment request (to be implemented by each adapter)
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    async initiatePayment(paymentData) {
        throw new Error('initiatePayment() must be implemented by adapter');
    }

    /**
     * Check transaction status (to be implemented by each adapter)
     * @param {string} transactionRef
     * @returns {Promise<Object>}
     */
    async checkStatus(transactionRef) {
        throw new Error('checkStatus() must be implemented by adapter');
    }

    /**
     * Handle callback/webhook from operator (to be implemented by each adapter)
     * @param {Object} callbackData
     * @returns {Promise<Object>}
     */
    async handleCallback(callbackData) {
        throw new Error('handleCallback() must be implemented by adapter');
    }

    /**
     * Validate callback signature (to be implemented by each adapter)
     * @param {Object} callbackData
     * @param {string} signature
     * @returns {boolean}
     */
    validateCallbackSignature(callbackData, signature) {
        throw new Error('validateCallbackSignature() must be implemented by adapter');
    }

    /**
     * Detect operator from phone number prefix
     * @param {string} phoneNumber
     * @returns {string|null} Operator name or null
     */
    static detectOperator(phoneNumber, operatorPrefixes) {
        // Remove country code and spaces
        const cleanPhone = phoneNumber.replace(/[\s+]/g, '');
        const prefix = cleanPhone.substring(0, 3);

        for (const [operator, prefixes] of Object.entries(operatorPrefixes)) {
            if (prefixes.includes(prefix)) {
                return operator;
            }
        }

        return null;
    }

    /**
     * Format phone number to required format
     * @param {string} phoneNumber
     * @returns {string}
     */
    formatPhoneNumber(phoneNumber) {
        // Remove all non-numeric characters
        let cleaned = phoneNumber.replace(/\D/g, '');

        // If starts with 243, keep it
        if (cleaned.startsWith('243')) {
            return cleaned;
        }

        // If starts with 0, replace with 243
        if (cleaned.startsWith('0')) {
            return '243' + cleaned.substring(1);
        }

        // Otherwise, assume it needs 243 prefix
        return '243' + cleaned;
    }

    /**
     * Standardize error response
     * @param {Error} error
     * @returns {Object}
     */
    standardizeError(error) {
        if (error.response) {
            // HTTP error from operator API
            return {
                success: false,
                code: error.response.data?.code || 'OPERATOR_ERROR',
                message: error.response.data?.message || 'Erreur opérateur mobile money',
                operatorResponse: error.response.data,
                httpStatus: error.response.status
            };
        }

        if (error.request) {
            // No response received (timeout, network error)
            return {
                success: false,
                code: 'NETWORK_ERROR',
                message: 'Impossible de contacter l\'opérateur',
                details: error.message
            };
        }

        // Other errors
        return {
            success: false,
            code: 'UNKNOWN_ERROR',
            message: error.message || 'Erreur inconnue'
        };
    }

    /**
     * Retry mechanism with exponential backoff
     * @param {Function} operation
     * @param {number} maxRetries
     * @returns {Promise<any>}
     */
    async retryOperation(operation, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    logger.warn(`[${this.operatorName}] Retry ${attempt}/${maxRetries} after ${delay}ms`);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    }

    /**
     * Sleep utility
     * @param {number} ms
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = BasePaymentAdapter;
