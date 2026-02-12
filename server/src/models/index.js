const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const LedgerEntry = require('./LedgerEntry');
const KYCDocument = require('./KYCDocument');
const BankAccount = require('./BankAccount');

// Define relationships
const defineAssociations = () => {
    // User <-> Wallet (1:1)
    User.hasOne(Wallet, {
        foreignKey: 'user_id',
        as: 'wallet',
        onDelete: 'CASCADE'
    });
    Wallet.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // User <-> Transactions (1:N)
    User.hasMany(Transaction, {
        foreignKey: 'user_id',
        as: 'transactions'
    });
    Transaction.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // Wallet <-> Transactions (1:N)
    Wallet.hasMany(Transaction, {
        foreignKey: 'wallet_id',
        as: 'transactions'
    });
    Transaction.belongsTo(Wallet, {
        foreignKey: 'wallet_id',
        as: 'wallet'
    });

    // Transaction <-> LedgerEntries (1:N)
    Transaction.hasMany(LedgerEntry, {
        foreignKey: 'transaction_id',
        as: 'ledgerEntries'
    });
    LedgerEntry.belongsTo(Transaction, {
        foreignKey: 'transaction_id',
        as: 'transaction'
    });

    // User <-> KYCDocuments (1:N)
    User.hasMany(KYCDocument, {
        foreignKey: 'user_id',
        as: 'kycDocuments'
    });
    KYCDocument.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // KYCDocument reviewer (User)
    KYCDocument.belongsTo(User, {
        foreignKey: 'reviewed_by',
        as: 'reviewer'
    });

    // User <-> BankAccounts (1:N)
    User.hasMany(BankAccount, {
        foreignKey: 'user_id',
        as: 'bankAccounts'
    });
    BankAccount.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // LedgerEntry self-reference for reversals
    LedgerEntry.belongsTo(LedgerEntry, {
        foreignKey: 'reversed_by_entry_id',
        as: 'reversalEntry'
    });
};

// Initialize associations
defineAssociations();

// Export all models
module.exports = {
    sequelize,
    User,
    Wallet,
    Transaction,
    LedgerEntry,
    KYCDocument,
    BankAccount
};
