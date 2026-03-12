const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const encryption = require('../utils/encryption');

class Transaction extends Model {
    /**
     * Calculate net amount after commission
     */
    static calculateNetAmount(amount, commissionRate) {
        const gross = parseFloat(amount);
        const commission = gross * (parseFloat(commissionRate) / 100);
        const net = gross - commission;
        return { gross, commission, net };
    }

    /**
     * Check if transaction is in final state
     */
    isFinal() {
        return ['success', 'failed', 'expired'].includes(this.status);
    }

    /**
     * Check if transaction can be retried
     */
    canRetry() {
        return this.status === 'failed' && this.retry_count < 3;
    }
}

Transaction.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Relations
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    wallet_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'wallets',
            key: 'id'
        }
    },
    conversionRate_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'conversion_rates',
            key: 'id'
        }
    },

    // Transaction Identification
    transaction_ref: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    external_ref: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Reference from external system (M-Pesa, bank, etc.)'
    },
    order_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Merchant order ID'
    },

    // Transaction Type & Status
    type: {
        type: DataTypes.ENUM(
            'payment_collection',    // Client pays merchant
            'withdrawal',            // Merchant withdraws to bank
            'conversion',            // Currency conversion
            'commission',            // Commission deduction
            'refund',                // Refund to client
            'adjustment'             // Manual adjustment by admin
        ),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'success', 'failed', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },

    // Financial Details
    currency: {
        type: DataTypes.ENUM('CDF', 'USD'),
        allowNull: false
    },
    amount_gross: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    amount_commission: {
        type: DataTypes.DECIMAL(20, 2),
        defaultValue: 0.00
    },
    amount_net: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false
    },
    commission_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Commission rate in percentage'
    },

    // Payment Method Details
    payment_method: {
        type: DataTypes.ENUM('mpesa', 'orange_money', 'airtel_money', 'bank_transfer', 'manual'),
        allowNull: true
    },
    customer_phone: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('customer_phone');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('customer_phone', encryption.encrypt(value));
            }
        }
    },
    customer_name: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('customer_name');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('customer_name', encryption.encrypt(value));
            }
        }
    },

    // Conversion Specific
    // TODO: REMOVE ?
    conversion_from_currency: {
        type: DataTypes.STRING,
        allowNull: true
    },
    conversion_to_currency: {
        type: DataTypes.STRING,
        allowNull: true
    },
    conversion_rate: {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: true
    },
    conversion_amount_from: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true
    },
    conversion_amount_to: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true
    },

    // Withdrawal Specific
    withdrawal_bank_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    withdrawal_account_number: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('withdrawal_account_number');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('withdrawal_account_number', encryption.encrypt(value));
            }
        }
    },
    withdrawal_account_name: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('withdrawal_account_name');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('withdrawal_account_name', encryption.encrypt(value));
            }
        }
    },
    withdrawal_batch_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'For grouped bank transfers'
    },

    // Processing Details
    retry_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    error_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // Webhook & Callback
    webhook_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    webhook_sent_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    webhook_response: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // Metadata
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Additional flexible data'
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // Timestamps
    initiated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    failed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    indexes: [
        { fields: ['transaction_ref'], unique: true },
        { fields: ['user_id'] },
        { fields: ['wallet_id'] },
        { fields: ['type'] },
        { fields: ['status'] },
        { fields: ['payment_method'] },
        { fields: ['order_id'] },
        { fields: ['external_ref'] },
        { fields: ['created_at'] },
        { fields: ['completed_at'] }
    ],
    hooks: {
        beforeCreate: (transaction) => {
            // Generate unique transaction reference
            if (!transaction.transaction_ref) {
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 8).toUpperCase();
                transaction.transaction_ref = `TXN-${timestamp}-${random}`;
            }

            // Set expiration time (5 minutes for payments)
            if (transaction.type === 'payment_collection' && !transaction.expires_at) {
                transaction.expires_at = new Date(Date.now() + 5 * 60 * 1000);
            }
        }
    }
});

module.exports = Transaction;
