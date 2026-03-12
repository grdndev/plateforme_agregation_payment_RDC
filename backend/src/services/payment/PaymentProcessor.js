const config = require('../../config');
const MpesaAdapter = require('./adapters/MpesaAdapter');
const OrangeMoneyAdapter = require('./adapters/OrangeMoneyAdapter');
const AirtelMoneyAdapter = require('./adapters/AirtelMoneyAdapter');
const BasePaymentAdapter = require('./adapters/BasePaymentAdapter');
const logger = require('../../utils/logger');

/**
 * Payment Processor Service
 * Central service to process payments across all Mobile Money operators
 */
class PaymentProcessor {
    constructor() {
        // Initialize adapters
        this.adapters = {
            mpesa: new MpesaAdapter(config.mobileMoney.mpesa),
            orange_money: new OrangeMoneyAdapter(config.mobileMoney.orange),
            airtel_money: new AirtelMoneyAdapter(config.mobileMoney.airtel)
        };

        this.operatorPrefixes = config.operatorPrefixes;
    }

    /**
     * Detect which mobile money operator to use based on phone number
     * @param {string} phoneNumber
     * @returns {string|null}
     */
    detectOperator(phoneNumber) {
        return BasePaymentAdapter.detectOperator(phoneNumber, this.operatorPrefixes);
    }

    /**
     * Get adapter for specific operator
     * @param {string} operator
     * @returns {BasePaymentAdapter}
     */
    getAdapter(operator) {
        const adapter = this.adapters[operator];

        if (!adapter) {
            throw new Error(`Opérateur non supporté: ${operator}`);
        }

        return adapter;
    }

    /**
     * Initiate payment with automatic operator detection
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    async initiatePayment(paymentData) {
        try {
            const { customerPhone } = paymentData;

            // Detect operator
            const operator = this.detectOperator(customerPhone);

            if (!operator) {
                return {
                    success: false,
                    code: 'OPERATOR_NOT_DETECTED',
                    message: 'Impossible de détecter l\'opérateur mobile money. Vérifiez le numéro de téléphone.'
                };
            }

            logger.info(`Payment initiated with ${operator}`, {
                transactionRef: paymentData.transactionRef,
                amount: paymentData.amount
            });

            // Get appropriate adapter
            const adapter = this.getAdapter(operator);

            // Initiate payment
            const result = await adapter.initiatePayment({
                ...paymentData,
                operator
            });

            return {
                ...result,
                operator
            };

        } catch (error) {
            logger.error('Payment initiation error:', error);
            return {
                success: false,
                code: 'PAYMENT_INITIATION_ERROR',
                message: error.message || 'Erreur lors de l\'initiation du paiement'
            };
        }
    }

    /**
     * Check payment status
     * @param {string} operator
     * @param {string} transactionRef
     * @returns {Promise<Object>}
     */
    async checkStatus(operator, transactionRef) {
        try {
            const adapter = this.getAdapter(operator);
            return await adapter.checkStatus(transactionRef);
        } catch (error) {
            logger.error(`Status check error for ${operator}:`, error);
            return {
                success: false,
                code: 'STATUS_CHECK_ERROR',
                message: error.message || 'Erreur lors de la vérification du statut'
            };
        }
    }

    /**
     * Handle callback from mobile money operator
     * @param {string} operator
     * @param {Object} callbackData
     * @param {string} signature
     * @returns {Promise<Object>}
     */
    async handleCallback(operator, callbackData, signature = null) {
        try {
            const adapter = this.getAdapter(operator);

            // Validate signature if provided
            if (signature) {
                const isValid = adapter.validateCallbackSignature(callbackData, signature);

                if (!isValid) {
                    logger.warn(`Invalid callback signature from ${operator}`);
                    return {
                        success: false,
                        code: 'INVALID_SIGNATURE',
                        message: 'Signature invalide'
                    };
                }
            }

            // Handle callback
            const result = await adapter.handleCallback(callbackData);

            logger.info(`Callback processed from ${operator}`, {
                success: result.success,
                transactionRef: result.transactionRef
            });

            return result;

        } catch (error) {
            logger.error(`Callback handling error for ${operator}:`, error);
            return {
                success: false,
                code: 'CALLBACK_PROCESSING_ERROR',
                message: error.message || 'Erreur lors du traitement du callback'
            };
        }
    }

    /**
     * Check if operator is available
     * @param {string} operator
     * @returns {boolean}
     */
    isOperatorAvailable(operator) {
        return operator in this.adapters;
    }

    /**
     * Get list of available operators
     * @returns {Array<string>}
     */
    getAvailableOperators() {
        return Object.keys(this.adapters);
    }
}

// Singleton instance
module.exports = new PaymentProcessor();
