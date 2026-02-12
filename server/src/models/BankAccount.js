const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const encryption = require('../utils/encryption');

class BankAccount extends Model { }

BankAccount.init({
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
    bank_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    account_number: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const value = this.getDataValue('account_number');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('account_number', encryption.encrypt(value));
            }
        }
    },
    account_name: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const value = this.getDataValue('account_name');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('account_name', encryption.encrypt(value));
            }
        }
    },
    iban: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('iban');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('iban', encryption.encrypt(value));
            }
        }
    },
    swift_code: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('swift_code');
            return value ? encryption.decrypt(value) : null;
        },
        set(value) {
            if (value) {
                this.setDataValue('swift_code', encryption.encrypt(value));
            }
        }
    },
    currency: {
        type: DataTypes.ENUM('CDF', 'USD'),
        allowNull: false
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verified_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'BankAccount',
    tableName: 'bank_accounts',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['is_default'] }
    ]
});

module.exports = BankAccount;
