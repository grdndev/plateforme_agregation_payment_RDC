const { Transaction, Wallet, LedgerEntry } = require('../models');
const { sequelize } = require('../config/database');
const PaymentProcessor = require('../services/payment/PaymentProcessor');
const logger = require('../utils/logger');

class WebhookController {
    /**
     * Handle M-Pesa callback
     * POST /api/webhooks/mpesa
     */
    static async mpesa(req, res) {
        try {
            const callbackData = req.body;

            logger.info('[Webhook] M-Pesa callback received:', callbackData);

            // Process callback
            const result = await PaymentProcessor.handleCallback('mpesa', callbackData);

            if (!result.success) {
                logger.warn('[Webhook] M-Pesa callback processing failed:', result);
                // Still return 200 to prevent retries
                return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
            }

            // Find transaction
            const transaction = await Transaction.findOne({
                where: { external_ref: result.transactionRef }
            });

            if (!transaction) {
                logger.error('[Webhook] Transaction not found:', result.transactionRef);
                return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
            }

            // Processthe payment completion
            await WebhookController.processPaymentCompletion(transaction, result);

            // M-Pesa expects this response format
            res.json({
                ResultCode: 0,
                ResultDesc: 'Accepted'
            });

        } catch (error) {
            logger.error('[Webhook] M-Pesa error:', error);
            // Return success to prevent retries
            res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
        }
    }

    /**
     * Handle Orange Money callback
     * POST /api/webhooks/orange
     */
    static async orange(req, res) {
        try {
            const callbackData = req.body;
            const signature = req.headers['x-orange-signature'];

            logger.info('[Webhook] Orange Money callback received:', callbackData);

            // Process callback with signature validation
            const result = await PaymentProcessor.handleCallback('orange_money', callbackData, signature);

            if (!result.success) {
                logger.warn('[Webhook] Orange Money callback processing failed:', result);
                return res.status(200).send('OK');
            }

            // Find transaction
            const transaction = await Transaction.findOne({
                where: { order_id: result.orderId }
            });

            if (!transaction) {
                logger.error('[Webhook] Transaction not found:', result.orderId);
                return res.status(200).send('OK');
            }

            // Process payment completion
            await WebhookController.processPaymentCompletion(transaction, result);

            res.status(200).send('OK');

        } catch (error) {
            logger.error('[Webhook] Orange Money error:', error);
            res.status(200).send('OK');
        }
    }

    /**
     * Handle Airtel Money callback
     * POST /api/webhooks/airtel
     */
    static async airtel(req, res) {
        try {
            const callbackData = req.body;
            const signature = req.headers['x-airtel-signature'];

            logger.info('[Webhook] Airtel Money callback received:', callbackData);

            // Process callback with signature validation
            const result = await PaymentProcessor.handleCallback('airtel_money', callbackData, signature);

            if (!result.success) {
                logger.warn('[Webhook] Airtel Money callback processing failed:', result);
                return res.status(200).send('OK');
            }

            // Find transaction
            const transaction = await Transaction.findOne({
                where: { transaction_ref: result.transactionRef }
            });

            if (!transaction) {
                logger.error('[Webhook] Transaction not found:', result.transactionRef);
                return res.status(200).send('OK');
            }

            // Process payment completion
            await WebhookController.processPaymentCompletion(transaction, result);

            res.status(200).send('OK');

        } catch (error) {
            logger.error('[Webhook] Airtel Money error:', error);
            res.status(200).send('OK');
        }
    }

    /**
     * Process payment completion (credit wallet, create ledger entries)
     * @param {Transaction} transaction
     * @param {Object} callbackResult
     */
    static async processPaymentCompletion(transaction, callbackResult) {
        const dbTransaction = await sequelize.transaction();

        try {
            if (callbackResult.status === 'success') {
                // Update transaction
                transaction.status = 'success';
                transaction.completed_at = new Date();
                transaction.metadata = {
                    ...transaction.metadata,
                    callback_data: callbackResult
                };
                transaction.webhook_sent = true;
                transaction.webhook_sent_at = new Date();
                await transaction.save({ transaction: dbTransaction });

                // Credit merchant wallet
                const wallet = await Wallet.findByPk(transaction.wallet_id);
                await wallet.credit(transaction.amount_net, transaction.currency, dbTransaction);
                wallet.last_transaction_at = new Date();
                await wallet.save({ transaction: dbTransaction });

                // Create ledger entries (double entry bookkeeping)
                const escrowAccount = `escrow_${transaction.payment_method}_${transaction.currency.toLowerCase()}`;
                const walletAccount = `merchant_wallet_${transaction.currency.toLowerCase()}`;

                await LedgerEntry.recordDoubleEntry({
                    transactionId: transaction.id,
                    debitAccount: escrowAccount,
                    creditAccount: walletAccount,
                    amount: transaction.amount_net,
                    currency: transaction.currency,
                    description: `Payment collection - ${transaction.transaction_ref}`,
                    metadata: {
                        payment_method: transaction.payment_method,
                        order_id: transaction.order_id
                    },
                    dbTransaction
                });

                // Record commission as revenue
                if (transaction.amount_commission > 0) {
                    await LedgerEntry.recordDoubleEntry({
                        transactionId: transaction.id,
                        debitAccount: escrowAccount,
                        creditAccount: `revenue_commission_${transaction.currency.toLowerCase()}`,
                        amount: transaction.amount_commission,
                        currency: transaction.currency,
                        description: `Commission - ${transaction.transaction_ref}`,
                        metadata: {
                            commission_rate: transaction.commission_rate
                        },
                        dbTransaction
                    });
                }

                await dbTransaction.commit();

                logger.info(`Payment completed successfully: ${transaction.transaction_ref}`, {
                    amount: transaction.amount_net,
                    currency: transaction.currency
                });

                // TODO: Send webhook to merchant
                // TODO: Send email/SMS notification

            } else {
                // Payment failed
                transaction.status = 'failed';
                transaction.failed_at = new Date();
                transaction.error_message = callbackResult.message;
                transaction.metadata = {
                    ...transaction.metadata,
                    callback_data: callbackResult
                };
                await transaction.save({ transaction: dbTransaction });

                await dbTransaction.commit();

                logger.info(`Payment failed: ${transaction.transaction_ref}`, {
                    reason: callbackResult.message
                });

                // TODO: Send webhook to merchant
            }

        } catch (error) {
            await dbTransaction.rollback();
            logger.error('Payment completion processing error:', error);
            throw error;
        }
    }
}

module.exports = WebhookController;
