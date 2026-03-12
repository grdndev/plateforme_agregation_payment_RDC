const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Wallet extends Model {
    /**
     * Get balance for specific currency
     */
    getBalance(currency) {
        return currency === 'USD' ? this.balance_usd : this.balance_cdf;
    }

    /**
     * Check if sufficient funds for transaction
     */
    hasSufficientBalance(amount, currency) {
        const balance = this.getBalance(currency);
        return parseFloat(balance) >= parseFloat(amount);
    }

    /**
     * Credit wallet (add funds)
     */
    async credit(amount, currency, transaction) {
        const field = currency === 'USD' ? 'balance_usd' : 'balance_cdf';
        this[field] = parseFloat(this[field]) + parseFloat(amount);
        await this.save({ transaction });
        return this;
    }

    /**
     * Debit wallet (remove funds)
     */
    async debit(amount, currency, transaction) {
        const field = currency === 'USD' ? 'balance_usd' : 'balance_cdf';
        const currentBalance = parseFloat(this[field]);
        const debitAmount = parseFloat(amount);

        if (currentBalance < debitAmount) {
            throw new Error(`Insufficient ${currency} balance`);
        }

        this[field] = currentBalance - debitAmount;
        await this.save({ transaction });
        return this;
    }
}

Wallet.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    balance_cdf: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    balance_usd: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    total_received_cdf: {
        type: DataTypes.DECIMAL(20, 2),
        defaultValue: 0.00
    },
    total_received_usd: {
        type: DataTypes.DECIMAL(20, 2),
        defaultValue: 0.00
    },
    total_withdrawn_cdf: {
        type: DataTypes.DECIMAL(20, 2),
        defaultValue: 0.00
    },
    total_withdrawn_usd: {
        type: DataTypes.DECIMAL(20, 2),
        defaultValue: 0.00
    },
    is_frozen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    frozen_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    frozen_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_transaction_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Wallet',
    tableName: 'wallets',
    indexes: [
        { fields: ['user_id'], unique: true },
        { fields: ['is_frozen'] },
        { fields: ['created_at'] }
    ]
});

module.exports = Wallet;
