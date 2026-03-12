const { Op } = require('sequelize');
const { Transaction } = require('../models');
const { sequelize } = require('../config/database');
const PaymentProcessor = require('../services/payment/PaymentProcessor');
const config = require('../config');
const logger = require('../utils/logger');

class PaymentController {
    /**
     * Initiate a new payment (Public API)
     * POST /api/payments
     */
    static async create(req, res) {
        const dbTransaction = await sequelize.transaction();

        try {
            const {
                amount,
                currency,
                customer_phone,
                order_id,
                customer_name,
                success_url,
                failure_url,
                metadata = {}
            } = req.body;

            // Get merchant user (authenticated via API key)
            const merchant = req.user;

            // Check if merchant account is active
            if (merchant.status !== 'active' && merchant.status !== 'sandbox') {
                await dbTransaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Compte marchand non actif',
                    hint: 'Veuillez compléter votre vérification KYC'
                });
            }

            // Check for duplicate order_id in last 24 hours
            const existingTransaction = await Transaction.findOne({
                where: {
                    user_id: merchant.id,
                    order_id,
                    created_at: {
                        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            });

            if (existingTransaction) {
                await dbTransaction.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Transaction en double détectée',
                    hint: 'Un paiement avec ce order_id existe déjà dans les dernières 24h'
                });
            }

            // Calculate commission
            const commissionRate = config.commissions.collection;
            const { gross, commission, net } = Transaction.calculateNetAmount(amount, commissionRate);

            // Create transaction record
            const transaction = await Transaction.create({
                user_id: merchant.id,
                wallet_id: merchant.wallet?.id,
                type: 'payment_collection',
                status: 'pending',
                currency,
                amount_gross: gross,
                amount_commission: commission,
                amount_net: net,
                commission_rate: commissionRate,
                customer_phone,
                customer_name,
                order_id,
                ip_address: req.ip,
                user_agent: req.get('user-agent'),
                metadata: {
                    ...metadata,
                    success_url,
                    failure_url
                }
            }, { transaction: dbTransaction });

            // Initiate payment with Mobile Money operator
            const paymentResult = await PaymentProcessor.initiatePayment({
                amount: gross,
                currency,
                customerPhone: customer_phone,
                transactionRef: transaction.transaction_ref,
                description: `Payment for order ${order_id}`
            });

            if (!paymentResult.success) {
                // Payment initiation failed
                transaction.status = 'failed';
                transaction.error_code = paymentResult.code;
                transaction.error_message = paymentResult.message;
                transaction.failed_at = new Date();
                await transaction.save({ transaction: dbTransaction });

                await dbTransaction.commit();

                return res.status(400).json({
                    success: false,
                    message: paymentResult.message,
                    code: paymentResult.code,
                    data: {
                        transaction_ref: transaction.transaction_ref,
                        status: 'failed'
                    }
                });
            }

            // Update transaction with operator details
            transaction.payment_method = paymentResult.operator;
            transaction.status = 'processing';
            transaction.external_ref = paymentResult.transactionRef;
            transaction.metadata = {
                ...transaction.metadata,
                operator_response: paymentResult
            };
            await transaction.save({ transaction: dbTransaction });

            await dbTransaction.commit();

            logger.info(`Payment initiated: ${transaction.transaction_ref}`, {
                merchantId: merchant.id,
                amount: gross,
                operator: paymentResult.operator
            });

            res.status(201).json({
                success: true,
                message: 'Paiement initié avec succès',
                data: {
                    transaction_ref: transaction.transaction_ref,
                    order_id: transaction.order_id,
                    status: transaction.status,
                    amount: transaction.amount_gross,
                    currency: transaction.currency,
                    payment_method: transaction.payment_method,
                    customer_message: paymentResult.customerMessage || 'Veuillez confirmer le paiement sur votre téléphone'
                }
            });

        } catch (error) {
            await dbTransaction.rollback();
            logger.error('Payment creation error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du paiement'
            });
        }
    }

    /**
     * Get payment status
     * GET /api/payments/:transaction_ref
     */
    static async getStatus(req, res) {
        try {
            const { transaction_ref } = req.params;
            const merchant = req.user;

            // Find transaction
            const transaction = await Transaction.findOne({
                where: {
                    transaction_ref,
                    user_id: merchant.id
                }
            });

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction non trouvée'
                });
            }

            // If transaction is already in final state, return it
            if (transaction.isFinal()) {
                return res.json({
                    success: true,
                    data: {
                        transaction_ref: transaction.transaction_ref,
                        order_id: transaction.order_id,
                        status: transaction.status,
                        amount: transaction.amount_gross,
                        amount_net: transaction.amount_net,
                        currency: transaction.currency,
                        payment_method: transaction.payment_method,
                        created_at: transaction.created_at,
                        completed_at: transaction.completed_at
                    }
                });
            }

            // Check status from operator if still processing
            if (transaction.payment_method && transaction.external_ref) {
                const statusResult = await PaymentProcessor.checkStatus(
                    transaction.payment_method,
                    transaction.external_ref
                );

                if (statusResult.success && statusResult.status !== transaction.status) {
                    // Update transaction status
                    transaction.status = statusResult.status;
                    if (statusResult.status === 'success') {
                        transaction.completed_at = new Date();
                    } else if (statusResult.status === 'failed') {
                        transaction.failed_at = new Date();
                    }
                    await transaction.save();
                }
            }

            res.json({
                success: true,
                data: {
                    transaction_ref: transaction.transaction_ref,
                    order_id: transaction.order_id,
                    status: transaction.status,
                    amount: transaction.amount_gross,
                    amount_net: transaction.amount_net,
                    currency: transaction.currency,
                    payment_method: transaction.payment_method,
                    created_at: transaction.created_at,
                    completed_at: transaction.completed_at
                }
            });

        } catch (error) {
            logger.error('Get payment status error:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du statut'
            });
        }
    }
}

module.exports = PaymentController;
