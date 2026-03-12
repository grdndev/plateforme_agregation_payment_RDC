const BasePaymentAdapter = require('./BasePaymentAdapter');
const logger = require('../../../utils/logger');
const crypto = require('crypto');

/**
 * Airtel Money Payment Adapter
 * Implements Airtel Money API for payment collection in RDC
 */
class AirtelMoneyAdapter extends BasePaymentAdapter {
    constructor(config) {
        super(config, 'Airtel Money');
        this.accessToken = null;
        this.tokenExpiresAt = null;
    }

    /**
     * Get OAuth access token from Airtel Money API
     */
    async getAccessToken() {
        // Check if token is still valid
        if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        try {
            const response = await this.httpClient.post('/auth/oauth2/token', {
                client_id: this.config.apiKey,
                client_secret: this.config.apiSecret,
                grant_type: 'client_credentials'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                }
            });

            this.accessToken = response.data.access_token;
            // Token expires in 1 hour (3600 seconds)
            this.tokenExpiresAt = Date.now() + ((response.data.expires_in || 3600) - 300) * 1000;

            logger.info('[Airtel Money] Access token obtained');
            return this.accessToken;
        } catch (error) {
            logger.error('[Airtel Money] Failed to get access token:', error);
            throw error;
        }
    }

    /**
     * Generate encryption key for Airtel API
     */
    generateEncryptionKey() {
        // Airtel uses a specific encryption format
        const timestamp = Date.now().toString();
        return Buffer.from(this.config.apiSecret + timestamp).toString('base64');
    }

    /**
     * Initiate collection request (Customer to Merchant)
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    async initiatePayment(paymentData) {
        try {
            const {
                amount,
                currency,
                customerPhone,
                transactionRef,
                description
            } = paymentData;

            const token = await this.getAccessToken();
            const formattedPhone = this.formatPhoneNumber(customerPhone);

            // Remove country code for Airtel (they expect without 243)
            const airtelPhone = formattedPhone.replace(/^243/, '0');

            // Airtel Collection Request payload
            const requestBody = {
                reference: transactionRef,
                subscriber: {
                    country: 'CD',
                    currency: currency || 'USD',
                    msisdn: airtelPhone
                },
                transaction: {
                    amount: parseFloat(amount).toFixed(2),
                    country: 'CD',
                    currency: currency || 'USD',
                    id: transactionRef
                }
            };

            const response = await this.httpClient.post('/merchant/v1/payments/', requestBody, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Country': 'CD',
                    'X-Currency': currency || 'USD'
                }
            });

            // Airtel returns different status codes
            const statusCode = response.data.status?.code;

            if (statusCode === '200' || statusCode === 'TS') {
                return {
                    success: true,
                    transactionRef: response.data.data?.transaction?.id || transactionRef,
                    airtelTransactionId: response.data.data?.transaction?.airtel_money_id,
                    status: response.data.status?.result_code,
                    message: response.data.status?.message || 'Payment initiated'
                };
            }

            return {
                success: false,
                code: statusCode || 'AIRTEL_ERROR',
                message: response.data.status?.message || 'Failed to initiate payment'
            };

        } catch (error) {
            logger.error('[Airtel Money] Payment initiation failed:', error);
            return this.standardizeError(error);
        }
    }

    /**
     * Check transaction status
     * @param {string} transactionRef
     * @returns {Promise<Object>}
     */
    async checkStatus(transactionRef) {
        try {
            const token = await this.getAccessToken();

            const response = await this.httpClient.get(`/standard/v1/payments/${transactionRef}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Country': 'CD',
                    'X-Currency': 'USD'
                }
            });

            const status = response.data.status;
            let normalizedStatus = 'pending';

            // Airtel status codes: TS = Success, TF = Failed, TA = Pending
            if (status?.result_code === 'TS' || status?.code === '200') {
                normalizedStatus = 'success';
            } else if (status?.result_code === 'TF') {
                normalizedStatus = 'failed';
            }

            return {
                success: true,
                status: normalizedStatus,
                transactionRef: response.data.data?.transaction?.id,
                airtelTransactionId: response.data.data?.transaction?.airtel_money_id,
                amount: response.data.data?.transaction?.amount,
                currency: response.data.data?.transaction?.currency,
                data: response.data
            };

        } catch (error) {
            logger.error('[Airtel Money] Status check failed:', error);
            return this.standardizeError(error);
        }
    }

    /**
     * Handle Airtel Money callback/notification
     * @param {Object} callbackData
     * @returns {Promise<Object>}
     */
    async handleCallback(callbackData) {
        try {
            const {
                transaction,
                status
            } = callbackData;

            // Success (TS status code)
            if (status?.result_code === 'TS' || status?.code === '200') {
                return {
                    success: true,
                    status: 'success',
                    transactionRef: transaction?.id,
                    airtelTransactionId: transaction?.airtel_money_id,
                    amount: parseFloat(transaction?.amount),
                    currency: transaction?.currency,
                    message: status?.message
                };
            }

            // Failed (TF status code)
            return {
                success: false,
                status: 'failed',
                transactionRef: transaction?.id,
                code: status?.result_code || status?.code,
                message: status?.message || 'Transaction failed'
            };

        } catch (error) {
            logger.error('[Airtel Money] Callback handling failed:', error);
            throw error;
        }
    }

    /**
     * Validate Airtel Money callback signature
     * @param {Object} callbackData
     * @param {string} signature
     * @returns {boolean}
     */
    validateCallbackSignature(callbackData, signature) {
        try {
            // Airtel uses SHA-256 HMAC for signature validation
            const secret = this.config.apiSecret;

            // Create payload string (Airtel specific format)
            const payload = JSON.stringify(callbackData);

            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(payload)
                .digest('hex');

            return signature === expectedSignature;
        } catch (error) {
            logger.error('[Airtel Money] Signature validation failed:', error);
            return false;
        }
    }

    /**
     * Request refund for a transaction
     * @param {string} transactionRef
     * @param {Object} refundData
     * @returns {Promise<Object>}
     */
    async requestRefund(transactionRef, refundData) {
        try {
            const token = await this.getAccessToken();

            const requestBody = {
                transaction: {
                    airtel_money_id: refundData.airtelTransactionId,
                    id: transactionRef
                },
                reference: refundData.reference || `REFUND-${transactionRef}`
            };

            const response = await this.httpClient.post('/standard/v1/payments/refund', requestBody, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Country': 'CD',
                    'X-Currency': refundData.currency || 'USD'
                }
            });

            if (response.data.status?.code === '200') {
                return {
                    success: true,
                    refundId: response.data.data?.transaction?.id,
                    status: response.data.status?.result_code,
                    message: response.data.status?.message
                };
            }

            return {
                success: false,
                code: response.data.status?.code,
                message: response.data.status?.message || 'Refund failed'
            };

        } catch (error) {
            logger.error('[Airtel Money] Refund failed:', error);
            return this.standardizeError(error);
        }
    }

    /**
     * Get user KYC information (optional)
     * @param {string} phoneNumber
     * @returns {Promise<Object>}
     */
    async getUserKYC(phoneNumber) {
        try {
            const token = await this.getAccessToken();
            const formattedPhone = this.formatPhoneNumber(phoneNumber).replace(/^243/, '0');

            const response = await this.httpClient.get(`/standard/v1/users/${formattedPhone}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Country': 'CD'
                }
            });

            return {
                success: true,
                data: response.data.data
            };

        } catch (error) {
            logger.error('[Airtel Money] KYC lookup failed:', error);
            return this.standardizeError(error);
        }
    }
}

module.exports = AirtelMoneyAdapter;
