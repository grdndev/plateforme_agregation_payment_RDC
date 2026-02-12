const BasePaymentAdapter = require('./BasePaymentAdapter');
const logger = require('../../../utils/logger');
const crypto = require('crypto');

/**
 * Orange Money Payment Adapter
 * Implements Orange Money API for payment collection in RDC
 */
class OrangeMoneyAdapter extends BasePaymentAdapter {
    constructor(config) {
        super(config, 'Orange Money');
        this.accessToken = null;
        this.tokenExpiresAt = null;
    }

    /**
     * Get OAuth access token from Orange Money API
     */
    async getAccessToken() {
        // Check if token is still valid
        if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        try {
            const response = await this.httpClient.post('/oauth/v2/token', {
                grant_type: 'client_credentials'
            }, {
                auth: {
                    username: this.config.apiKey,
                    password: this.config.apiSecret
                }
            });

            this.accessToken = response.data.access_token;
            // Token typically expires in 1 hour
            this.tokenExpiresAt = Date.now() + ((response.data.expires_in || 3600) - 300) * 1000;

            logger.info('[Orange Money] Access token obtained');
            return this.accessToken;
        } catch (error) {
            logger.error('[Orange Money] Failed to get access token:', error);
            throw error;
        }
    }

    /**
     * Initiate payment collection (Webpay)
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

            // Orange Money Webpay payload
            const requestBody = {
                merchant_key: this.config.merchantCode,
                currency: currency || 'USD',
                order_id: transactionRef,
                amount: Math.round(parseFloat(amount)),
                return_url: this.config.callbackUrl,
                cancel_url: this.config.callbackUrl,
                notif_url: this.config.callbackUrl,
                lang: 'fr',
                reference: transactionRef,
                customer_phone: formattedPhone,
                customer_name: description || 'Client'
            };

            const response = await this.httpClient.post('/webpay/v1/init', requestBody, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'SUCCESS' || response.data.status === 'PENDING') {
                return {
                    success: true,
                    transactionRef: response.data.order_id || transactionRef,
                    paymentUrl: response.data.payment_url,
                    paymentToken: response.data.pay_token,
                    status: response.data.status,
                    message: 'Payment initiated successfully'
                };
            }

            return {
                success: false,
                code: response.data.error_code || 'ORANGE_ERROR',
                message: response.data.error_message || 'Failed to initiate payment'
            };

        } catch (error) {
            logger.error('[Orange Money] Payment initiation failed:', error);
            return this.standardizeError(error);
        }
    }

    /**
     * Check payment status
     * @param {string} transactionRef
     * @returns {Promise<Object>}
     */
    async checkStatus(transactionRef) {
        try {
            const token = await this.getAccessToken();

            const response = await this.httpClient.get(`/webpay/v1/status/${transactionRef}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const status = response.data.status;
            let normalizedStatus = 'pending';

            if (status === 'SUCCESS' || status === 'COMPLETED') {
                normalizedStatus = 'success';
            } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') {
                normalizedStatus = 'failed';
            }

            return {
                success: true,
                status: normalizedStatus,
                transactionRef: response.data.order_id,
                amount: response.data.amount,
                currency: response.data.currency,
                paymentDate: response.data.payment_date,
                data: response.data
            };

        } catch (error) {
            logger.error('[Orange Money] Status check failed:', error);
            return this.standardizeError(error);
        }
    }

    /**
     * Handle Orange Money callback/notification
     * @param {Object} callbackData
     * @returns {Promise<Object>}
     */
    async handleCallback(callbackData) {
        try {
            const {
                status,
                order_id,
                amount,
                currency,
                pay_token,
                txnid,
                payment_date
            } = callbackData;

            // Success
            if (status === 'SUCCESS' || status === 'COMPLETED') {
                return {
                    success: true,
                    status: 'success',
                    transactionRef: order_id,
                    amount: parseFloat(amount),
                    currency: currency,
                    operatorTransactionId: txnid,
                    paymentDate: payment_date,
                    paymentToken: pay_token
                };
            }

            // Failed or cancelled
            return {
                success: false,
                status: 'failed',
                transactionRef: order_id,
                reason: callbackData.error_message || 'Payment failed or cancelled'
            };

        } catch (error) {
            logger.error('[Orange Money] Callback handling failed:', error);
            throw error;
        }
    }

    /**
     * Validate Orange Money callback signature
     * @param {Object} callbackData
     * @param {string} signature
     * @returns {boolean}
     */
    validateCallbackSignature(callbackData, signature) {
        try {
            // Orange Money uses HMAC signature validation
            const secret = this.config.apiSecret;

            // Create signature string from callback data
            const signatureString = [
                callbackData.order_id,
                callbackData.amount,
                callbackData.currency,
                callbackData.status
            ].join('|');

            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(signatureString)
                .digest('hex');

            return signature === expectedSignature;
        } catch (error) {
            logger.error('[Orange Money] Signature validation failed:', error);
            return false;
        }
    }

    /**
     * Request payment via USSD push (alternative method)
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    async initiateUSSDPush(paymentData) {
        try {
            const {
                amount,
                customerPhone,
                transactionRef
            } = paymentData;

            const token = await this.getAccessToken();
            const formattedPhone = this.formatPhoneNumber(customerPhone);

            const requestBody = {
                subscriber_msisdn: formattedPhone,
                amount: Math.round(parseFloat(amount)),
                partner_reference: transactionRef,
                merchant_code: this.config.merchantCode,
                callback_url: this.config.callbackUrl
            };

            const response = await this.httpClient.post('/api/v1/sendpayment', requestBody, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.status === 'SUCCESS') {
                return {
                    success: true,
                    transactionRef: response.data.transaction_id || transactionRef,
                    message: 'USSD push sent to customer'
                };
            }

            return {
                success: false,
                code: response.data.error_code,
                message: response.data.error_message
            };

        } catch (error) {
            logger.error('[Orange Money] USSD push failed:', error);
            return this.standardizeError(error);
        }
    }
}

module.exports = OrangeMoneyAdapter;
