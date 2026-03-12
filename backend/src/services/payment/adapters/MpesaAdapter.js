const crypto = require('crypto');
const BasePaymentAdapter = require('./BasePaymentAdapter');
const logger = require('../../../utils/logger');

/**
 * M-Pesa (Vodacom) Payment Adapter
 * Implements M-Pesa API for payment collection in RDC
 */
class MpesaAdapter extends BasePaymentAdapter {
    constructor(config) {
        super(config, 'M-Pesa');
        this.accessToken = null;
        this.tokenExpiresAt = null;
    }

    /**
     * Get OAuth access token from M-Pesa
     */
    async getAccessToken() {
        // Check if token is still valid
        if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64');

            const response = await this.httpClient.post('/oauth/token', {
                grant_type: 'client_credentials'
            }, {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });

            this.accessToken = response.data.access_token;
            // Token expires in 1 hour, we refresh 5 minutes before
            this.tokenExpiresAt = Date.now() + (55 * 60 * 1000);

            logger.info('[M-Pesa] Access token obtained');
            return this.accessToken;
        } catch (error) {
            logger.error('[M-Pesa] Failed to get access token:', error);
            throw error;
        }
    }

    /**
     * Generate security credential for M-Pesa
     */
    generateSecurityCredential() {
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(
            this.config.shortcode + this.config.passkey + timestamp
        ).toString('base64');

        return { password, timestamp };
    }

    /**
     * Initiate STK Push (Customer to Business)
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

            // Get access token
            const token = await this.getAccessToken();

            // Format phone number
            const formattedPhone = this.formatPhoneNumber(customerPhone);

            // Generate security credentials
            const { password, timestamp } = this.generateSecurityCredential();

            // Prepare request
            const requestBody = {
                BusinessShortCode: this.config.shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: Math.round(parseFloat(amount)),
                PartyA: formattedPhone,
                PartyB: this.config.shortcode,
                PhoneNumber: formattedPhone,
                CallBackURL: this.config.callbackUrl,
                AccountReference: transactionRef,
                TransactionDesc: description || 'Payment'
            };

            // Send STK Push request
            const response = await this.httpClient.post('/mpesa/stkpush/v1/processrequest', requestBody, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Check response
            if (response.data.ResponseCode === '0') {
                return {
                    success: true,
                    transactionRef: response.data.CheckoutRequestID,
                    merchantRequestID: response.data.MerchantRequestID,
                    responseCode: response.data.ResponseCode,
                    responseDescription: response.data.ResponseDescription,
                    customerMessage: response.data.CustomerMessage
                };
            }

            return {
                success: false,
                code: response.data.ResponseCode,
                message: response.data.ResponseDescription || response.data.CustomerMessage
            };

        } catch (error) {
            logger.error('[M-Pesa] Payment initiation failed:', error);
            return this.standardizeError(error);
        }
    }

    /**
     * Check STK Push status
     * @param {string} checkoutRequestID
     * @returns {Promise<Object>}
     */
    async checkStatus(checkoutRequestID) {
        try {
            const token = await this.getAccessToken();
            const { password, timestamp } = this.generateSecurityCredential();

            const response = await this.httpClient.post('/mpesa/stkpushquery/v1/query', {
                BusinessShortCode: this.config.shortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestID
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return {
                success: true,
                status: response.data.ResultCode === '0' ? 'success' : 'failed',
                resultCode: response.data.ResultCode,
                resultDesc: response.data.ResultDesc,
                data: response.data
            };

        } catch (error) {
            logger.error('[M-Pesa] Status check failed:', error);
            return this.standardizeError(error);
        }
    }

    /**
     * Handle M-Pesa callback
     * @param {Object} callbackData
     * @returns {Promise<Object>}
     */
    async handleCallback(callbackData) {
        try {
            const { Body } = callbackData;

            if (!Body || !Body.stkCallback) {
                throw new Error('Invalid M-Pesa callback structure');
            }

            const callback = Body.stkCallback;
            const resultCode = callback.ResultCode;

            // Success
            if (resultCode === 0) {
                const metadata = {};

                if (callback.CallbackMetadata && callback.CallbackMetadata.Item) {
                    callback.CallbackMetadata.Item.forEach(item => {
                        metadata[item.Name] = item.Value;
                    });
                }

                return {
                    success: true,
                    status: 'success',
                    transactionRef: callback.CheckoutRequestID,
                    merchantRequestID: callback.MerchantRequestID,
                    amount: metadata.Amount,
                    mpesaReceiptNumber: metadata.MpesaReceiptNumber,
                    transactionDate: metadata.TransactionDate,
                    phoneNumber: metadata.PhoneNumber
                };
            }

            // Failed or cancelled
            return {
                success: false,
                status: 'failed',
                transactionRef: callback.CheckoutRequestID,
                merchantRequestID: callback.MerchantRequestID,
                resultCode: resultCode,
                resultDesc: callback.ResultDesc
            };

        } catch (error) {
            logger.error('[M-Pesa] Callback handling failed:', error);
            throw error;
        }
    }

    /**
     * Validate M-Pesa callback signature
     * @param {Object} callbackData
     * @param {string} signature
     * @returns {boolean}
     */
    validateCallbackSignature(callbackData, signature) {
        // M-Pesa doesn't use signature validation in standard STK Push
        // Validation is done via IP whitelisting at infrastructure level
        // For additional security, you can verify the callback URL contains your domain
        return true;
    }
}

module.exports = MpesaAdapter;
