const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * LedgerEntry - Double Entry Bookkeeping System
 * Implements accounting principles for complete audit trail
 */
class LedgerEntry extends Model {
    /**
     * Create matched debit and credit entries (double-entry)
     */
    static async recordDoubleEntry({
        transactionId,
        debitAccount,
        creditAccount,
        amount,
        currency,
        description,
        metadata = {},
        dbTransaction
    }) {
        const entries = await Promise.all([
            // Debit entry
            this.create({
                transaction_id: transactionId,
                entry_type: 'debit',
                account_type: debitAccount,
                amount,
                currency,
                description,
                metadata
            }, { transaction: dbTransaction }),

            // Credit entry
            this.create({
                transaction_id: transactionId,
                entry_type: 'credit',
                account_type: creditAccount,
                amount,
                currency,
                description,
                metadata
            }, { transaction: dbTransaction })
        ]);

        return entries;
    }
}

LedgerEntry.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    transaction_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'transactions',
            key: 'id'
        }
    },
    entry_type: {
        type: DataTypes.ENUM('debit', 'credit'),
        allowNull: false
    },
    account_type: {
        type: DataTypes.ENUM(
            'merchant_wallet_cdf',
            'merchant_wallet_usd',
            'escrow_mpesa_cdf',
            'escrow_orange_cdf',
            'escrow_airtel_cdf',
            'escrow_bank_usd',
            'revenue_commission_cdf',
            'revenue_commission_usd',
            'revenue_spread_cdf',
            'revenue_spread_usd',
            'liability_pending_withdrawal',
            'expense_bank_fees',
            'adjustment'
        ),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    currency: {
        type: DataTypes.ENUM('CDF', 'USD'),
        allowNull: false
    },
    balance_after: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        comment: 'Running balance after this entry'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    reconciled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    reconciled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_reversed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    reversed_by_entry_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'ledger_entries',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'LedgerEntry',
    tableName: 'ledger_entries',
    indexes: [
        { fields: ['transaction_id'] },
        { fields: ['entry_type'] },
        { fields: ['account_type'] },
        { fields: ['currency'] },
        { fields: ['reconciled'] },
        { fields: ['created_at'] }
    ],
    // Immutable after creation (no updates allowed)
    hooks: {
        beforeUpdate: () => {
            throw new Error('Ledger entries are immutable and cannot be updated');
        }
    }
});

module.exports = LedgerEntry;
